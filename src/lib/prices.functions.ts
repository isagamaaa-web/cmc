import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Shared (cross-device) service pricing.
 * Reads are public; writes require the staff PIN, verified server-side against
 * a hash stored in a table that is unreadable by the Data API roles.
 */

export type PriceRow = { title: string; price: string };

const TITLE = z.string().trim().min(2).max(120);
const PRICE = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[0-9A-Za-z ,.\-–—/+()ETBetb]*$/, "Price contains unsupported characters");

export const listPrices = createServerFn({ method: "GET" }).handler(async () => {
  const { getDataClient } = await import("@/lib/integrations.server");
  const { data, error } = await (await getDataClient())
    .from("service_prices")
    .select("title, price")
    .order("title");
  if (error) return [] as PriceRow[];
  return (data ?? []) as PriceRow[];
});

// Very small in-memory throttle for the privileged write path.
const hits = new Map<string, { n: number; t: number }>();
function throttled(ip: string) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  return cur.n > 20;
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const updatePrices = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        pin: z.string().regex(/^[0-9]{6}$/),
        updates: z.array(z.object({ title: TITLE, price: PRICE })).min(1).max(50),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (throttled(ip)) return { ok: false as const, error: "Too many attempts. Try again shortly." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getDataClient } = await import("@/lib/integrations.server");
    const dataDb = await getDataClient();

    const { data: cfg } = await supabaseAdmin
      .from("admin_config")
      .select("pin_hash")
      .eq("id", 1)
      .maybeSingle();
    const expected = (cfg as { pin_hash?: string } | null)?.pin_hash ?? "";
    const given = await sha256Hex(`cmc-price-admin:${data.pin}`);
    if (!expected || given !== expected) {
      return { ok: false as const, error: "Incorrect staff PIN." };
    }

    const rows = data.updates.map((u) => ({
      title: u.title,
      price: u.price,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await dataDb.from("service_prices").upsert(rows, {
      onConflict: "title",
    });
    if (error) return { ok: false as const, error: "Could not save prices. Try again." };
    return { ok: true as const, saved: rows.length };
  });
