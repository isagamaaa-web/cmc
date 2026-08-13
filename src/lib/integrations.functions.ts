import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Staff API panel — PIN-protected integration settings.
 * Every handler re-verifies the staff PIN server-side; secrets are never
 * returned to the browser (only masked previews).
 */

const PIN = z.string().regex(/^[0-9]{6}$/);

const ChatbotInput = z
  .object({
    pin: PIN,
    apiKey: z.string().trim().min(10).max(300),
    baseUrl: z.string().trim().url().max(200).optional(),
    model: z
      .string()
      .trim()
      .max(120)
      .regex(/^[A-Za-z0-9._\-/:]*$/, "Invalid model id")
      .optional(),
  })
  .strict();

const DatabaseInput = z
  .object({
    pin: PIN,
    url: z.string().trim().url().max(200),
    projectId: z
      .string()
      .trim()
      .max(80)
      .regex(/^[A-Za-z0-9-]*$/, "Invalid project id")
      .optional(),
    publishableKey: z.string().trim().min(10).max(400),
    secretKey: z.string().trim().min(10).max(400),
  })
  .strict();

const ResetInput = z.object({ pin: PIN, target: z.enum(["chatbot", "database"]) }).strict();

/* --------------------------------------------------------------- guardrails */

const hits = new Map<string, { n: number; t: number }>();
function throttled(ip: string, max = 10) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  if (hits.size > 5000) hits.clear();
  return cur.n > max;
}

async function guard(pin: string): Promise<string | null> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const req = getRequest();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (throttled(ip)) return "Too many attempts. Try again in a minute.";

  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(req.url).host) return "Blocked cross-site request.";
    } catch {
      return "Blocked cross-site request.";
    }
  }

  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`cmc-price-admin:${pin}`),
  );
  const given = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_config")
    .select("pin_hash")
    .eq("id", 1)
    .maybeSingle();
  const expected = (data as { pin_hash?: string } | null)?.pin_hash ?? "";
  if (!expected || expected !== given) return "Incorrect staff PIN.";
  return null;
}

/* ------------------------------------------------------------------ status */

export type IntegrationStatus = {
  chatbot: { custom: boolean; keyPreview: string; model: string; baseUrl: string };
  database: { custom: boolean; url: string; projectId: string; secretPreview: string };
};

export const getIntegrationStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ pin: PIN }).strict().parse(data))
  .handler(async ({ data }) => {
    const bad = await guard(data.pin);
    if (bad) return { ok: false as const, error: bad };
    const s = await import("@/lib/integrations.server");
    const chat = await s.getChatbotConfig();
    const db = await s.getDatabaseConfig();
    return {
      ok: true as const,
      status: {
        chatbot: {
          custom: chat.custom,
          keyPreview: chat.custom ? s.mask(chat.apiKey) : "Managed by the clinic",
          model: chat.model,
          baseUrl: chat.baseUrl,
        },
        database: {
          custom: db.custom,
          url: db.url,
          projectId: db.projectId,
          secretPreview: db.custom ? s.mask(db.secretKey) : "Managed by the clinic",
        },
      } satisfies IntegrationStatus,
    };
  });

/* ----------------------------------------------------------------- chatbot */

export const saveChatbotKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => ChatbotInput.parse(data))
  .handler(async ({ data }) => {
    const bad = await guard(data.pin);
    if (bad) return { ok: false as const, error: bad };
    const s = await import("@/lib/integrations.server");
    const cfg: { apiKey: string; baseUrl: string; model: string; fallback: boolean } = {
      apiKey: data.apiKey,
      baseUrl: data.baseUrl?.replace(/\/+$/, "") || "https://ai.gateway.lovable.dev/v1",
      model: data.model || "google/gemini-2.5-flash",
      fallback: false,
    };
    const failure = await s.testChatbotConfig(cfg);
    if (failure) return { ok: false as const, error: failure };
    await s.saveChatbotConfig(cfg);
    return { ok: true as const };
  });

/* ---------------------------------------------------------------- database */

export const saveDatabaseCredentials = createServerFn({ method: "POST" })
  .validator((data: unknown) => DatabaseInput.parse(data))
  .handler(async ({ data }) => {
    const bad = await guard(data.pin);
    if (bad) return { ok: false as const, error: bad };
    const s = await import("@/lib/integrations.server");
    const cfg = {
      url: data.url.replace(/\/+$/, ""),
      projectId: data.projectId ?? "",
      publishableKey: data.publishableKey,
      secretKey: data.secretKey,
    };
    const failure = await s.testDatabaseConfig(cfg);
    if (failure) return { ok: false as const, error: failure };
    await s.saveDatabaseConfig(cfg);
    return { ok: true as const };
  });

/* ------------------------------------------------------------------- reset */

export const resetIntegration = createServerFn({ method: "POST" })
  .validator((data: unknown) => ResetInput.parse(data))
  .handler(async ({ data }) => {
    const bad = await guard(data.pin);
    if (bad) return { ok: false as const, error: bad };
    const s = await import("@/lib/integrations.server");
    if (data.target === "chatbot") await s.resetChatbotConfig();
    else await s.resetDatabaseConfig();
    return { ok: true as const };
  });
