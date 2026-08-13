/**
 * Server-only integration settings store.
 *
 * Values (chatbot API key, alternate database credentials) are encrypted with
 * AES-256-GCM using APP_SETTINGS_ENC_KEY before being written to the
 * `app_settings` table, which itself is unreachable from the Data API
 * (service-role grants only, RLS on with no policies).
 *
 * Nothing in this module may ever be imported from client-reachable code.
 */

const CHATBOT_KEY = "chatbot";
const DATABASE_KEY = "database";

export type ChatbotSettings = {
  apiKey: string;
  baseUrl: string;
  model: string;
  fallback: boolean;
};

export type DatabaseSettings = {
  url: string;
  projectId: string;
  publishableKey: string;
  secretKey: string;
};

const DEFAULT_CHAT_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash";

/* ------------------------------------------------------------------ crypto */

async function encKey(): Promise<CryptoKey> {
  const secret = process.env["APP_SETTINGS_ENC_KEY"];
  if (!secret) throw new Error("Missing APP_SETTINGS_ENC_KEY");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function encrypt(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encKey(),
    new TextEncoder().encode(plain),
  );
  return `v1.${toB64(iv)}.${toB64(new Uint8Array(buf))}`;
}

async function decrypt(payload: string): Promise<string | null> {
  const parts = payload.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  try {
    const buf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(parts[1]!) },
      await encKey(),
      fromB64(parts[2]!),
    );
    return new TextDecoder().decode(buf);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ store */

/** Short-lived cache so hot paths (chat) don't hit the database every call. */
const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 30_000;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readSetting<T>(key: string): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T | null;
  try {
    const db = await admin();
    const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
    const raw = (data as { value?: string } | null)?.value;
    let parsed: T | null = null;
    if (raw) {
      const plain = await decrypt(raw);
      if (plain) parsed = JSON.parse(plain) as T;
    }
    cache.set(key, { at: Date.now(), value: parsed });
    return parsed;
  } catch {
    return null;
  }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  const db = await admin();
  const { error } = await db.from("app_settings").upsert(
    { key, value: await encrypt(JSON.stringify(value)), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  cache.delete(key);
}

async function clearSetting(key: string): Promise<void> {
  const db = await admin();
  await db.from("app_settings").delete().eq("key", key);
  cache.delete(key);
}

/* ------------------------------------------------------------------ chatbot */

/**
 * A valid Lovable AI Gateway key starts with `sk_` or `sk-`.
 * Legacy `AQ.` keys, placeholder values, and empty strings are treated as
 * invalid so the server can fall back to an offline response without a 401.
 */
export function hasValidChatbotKey(apiKey: string | undefined): boolean {
  return typeof apiKey === "string" && (apiKey.startsWith("sk_") || apiKey.startsWith("sk-"));
}

function isFallbackApiKey(apiKey: string | undefined): boolean {
  return !hasValidChatbotKey(apiKey);
}

/**
 * Friendly, structured offline response returned when the gateway key is
 * missing or invalid. Reuses clinic data already present in the repo so the
 * tone and facts stay consistent across the assistant.
 */
export function getChatbotFallbackReply(): string {
  return [
    "Hi! I'm Central Clinic's AI assistant. I can help with:",
    "",
    "• Hours & Location: Open 24/7 — 7 days a week, including emergencies. We're at Ashawa Meda, near Gabriel Church, on the road that leads to Kusaye, right next to the Salaam Mosque.",
    "",
    "• Services: Internal Medicine consultations with Dr. Gebeyehu, Heart Diagnostics & ECG, Vitamin D services & treatment, Ultrasound / Sonography imaging, Infertility work-ups, and full lab panels (CBC, Kidney & Liver Function Tests, Uric Acid, Lipid Panel, Malaria Testing, Stool & Urine Analysis, H.Pylori, Diabetes Screening, TB Screening, Thyroid & other Hormone Panels).",
    "",
    "• Talk to us: Call 0912-22-49-71 or 0911-48-72-49 anytime for bookings or questions.",
    "",
    "I can answer most questions directly right now. What would you like to know?",
  ].join("\n");
}

export async function getChatbotConfig(): Promise<ChatbotSettings & { custom: boolean }> {
  const stored = await readSetting<Partial<ChatbotSettings>>(CHATBOT_KEY);
  if (stored?.apiKey) {
    const fallback = isFallbackApiKey(stored.apiKey);
    if (fallback) {
      console.warn(
        "[Chatbot] Stored custom API key is not a valid gateway key (must start with sk_ or sk-). " +
          "Running in offline-fallback mode until a valid key is configured.",
      );
    }
    return {
      apiKey: stored.apiKey,
      baseUrl: stored.baseUrl || DEFAULT_CHAT_BASE_URL,
      model: stored.model || DEFAULT_CHAT_MODEL,
      custom: true,
      fallback,
    };
  }
  const envKey = process.env["CHATBOT_API_KEY"];
  const fallback = isFallbackApiKey(envKey);
  if (fallback) {
    console.warn(
      "[Chatbot] Running in offline-fallback mode: CHATBOT_API_KEY is missing or not a valid gateway key (must start with sk_ or sk-).",
    );
  }
  return {
    apiKey: envKey ?? "",
    baseUrl: DEFAULT_CHAT_BASE_URL,
    model: DEFAULT_CHAT_MODEL,
    custom: false,
    fallback,
  };
}

export async function saveChatbotConfig(cfg: ChatbotSettings): Promise<void> {
  await writeSetting(CHATBOT_KEY, cfg);
}

export async function resetChatbotConfig(): Promise<void> {
  await clearSetting(CHATBOT_KEY);
}

/** Live check that the key actually works before it is stored. */
export async function testChatbotConfig(cfg: ChatbotSettings): Promise<string | null> {
  try {
    if (isFallbackApiKey(cfg.apiKey)) {
    return "This API key is not valid. A Lovable AI Gateway key must start with sk_ or sk-.";
  }
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    if (res.ok) return null;
    if (res.status === 401 || res.status === 403) return "The provider rejected this API key.";
    if (res.status === 404) return "Model or endpoint not found for this provider.";
    if (res.status === 429) return "Provider rate limit reached — try again in a moment.";
    if (res.status === 402) return "This API key has no remaining credits.";
    return `Provider responded with error ${res.status}.`;
  } catch {
    return "Could not reach the provider endpoint.";
  }
}

/* ----------------------------------------------------------------- database */

export async function getDatabaseConfig(): Promise<DatabaseSettings & { custom: boolean }> {
  const stored = await readSetting<Partial<DatabaseSettings>>(DATABASE_KEY);
  if (stored?.url && stored.secretKey) {
    return {
      url: stored.url,
      projectId: stored.projectId ?? "",
      publishableKey: stored.publishableKey ?? "",
      secretKey: stored.secretKey,
      custom: true,
    };
  }
  return {
    url: process.env["SUPABASE_URL"] ?? "",
    projectId: process.env["SUPABASE_PROJECT_ID"] ?? "",
    publishableKey: process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
    secretKey: process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "",
    custom: false,
  };
}

export async function saveDatabaseConfig(cfg: DatabaseSettings): Promise<void> {
  await writeSetting(DATABASE_KEY, cfg);
}

export async function resetDatabaseConfig(): Promise<void> {
  await clearSetting(DATABASE_KEY);
}

/** Verifies credentials against the target project before storing them. */
export async function testDatabaseConfig(cfg: DatabaseSettings): Promise<string | null> {
  const base = cfg.url.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/rest/v1/service_prices?select=title&limit=1`, {
      headers: { apikey: cfg.secretKey, Authorization: `Bearer ${cfg.secretKey}` },
    });
    if (res.ok) return null;
    if (res.status === 401 || res.status === 403) return "The project rejected the secret key.";
    if (res.status === 404)
      return "Connected, but this project has no `service_prices` table yet.";
    return `Database responded with error ${res.status}.`;
  } catch {
    return "Could not reach that project URL.";
  }
}

/**
 * Data client used by clinic features (prices). Points at the alternate project
 * when one has been configured in the staff API panel, otherwise the built-in one.
 */
export async function getDataClient() {
  const cfg = await getDatabaseConfig();
  const { createClient } = await import("@supabase/supabase-js");
  const key = cfg.secretKey;
  return createClient(cfg.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Never expose raw credentials to the browser. */
export function mask(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
