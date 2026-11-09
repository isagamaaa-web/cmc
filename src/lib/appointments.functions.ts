import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Appointment persistence.
 *
 * Everything runs through server functions so the browser never needs a direct
 * connection to Supabase. The server holds the service-role credentials, which
 * means bookings keep working even when the patient's device cannot reach the
 * Supabase host directly (a common cause of the "you are offline" false alarm).
 */

export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

const ID = z.string().uuid();
const PHONE = z
  .string()
  .trim()
  .regex(/^\+251[0-9]{9}$/, "Phone must be +251 followed by 9 digits");
const EMAIL = z.string().trim().email().max(120);
const DATE = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const bookingInput = z.object({
  id: ID.optional(),
  name: z.string().trim().min(2).max(80),
  phone: PHONE,
  email: EMAIL.optional().or(z.literal("")),
  date: DATE,
  service: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const rescheduleInput = z.object({
  id: ID,
  phone: PHONE,
  date: DATE,
  service: z.string().trim().min(1).max(120),
});

const pinInput = z.object({
  pin: z.string().regex(/^[0-9]{6}$/),
});

/** Small in-memory throttle for privileged operations. */
const attempts = new Map<string, { count: number; at: number }>();
function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.at > 60_000) {
    attempts.set(key, { count: 1, at: now });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The Supabase host can be flaky on some networks. Retry transient failures a
 * few times before giving up, so a single dropped connection doesn't surface as
 * "offline" or lose a booking.
 */
async function retryRequest<T>(
  run: () => Promise<T>,
  shouldRetry: (value: T) => boolean,
  attempts = 4,
): Promise<T> {
  let value = await run();
  for (let i = 1; i < attempts && shouldRetry(value); i++) {
    await new Promise((resolve) => setTimeout(resolve, 400 * i));
    value = await run();
  }
  return value;
}

const hasError = (result: { error: unknown }) => !!result.error;

const PIN_SALT = "cmc::staff::v1::";
const PIN_SETTING_KEY = "staff_pin_hash";
const DEFAULT_STAFF_PIN = "999950";

async function saveStaffPinHash(pin: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("app_settings").upsert(
    {
      key: PIN_SETTING_KEY,
      value: await sha256Hex(PIN_SALT + pin),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

/**
 * Verifies the staff PIN against the hash stored in the private `app_settings`
 * table (service-role only). On a fresh database the default PIN is seeded.
 */
async function verifyStaffPin(pin: string): Promise<boolean> {
  const envPin = process.env["ADMIN_STAFF_PIN"];
  if (envPin && pin === envPin) return true;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", PIN_SETTING_KEY)
    .maybeSingle();

  const given = await sha256Hex(PIN_SALT + pin);
  if (error) {
    // Table unavailable: fall back to the default PIN rather than locking staff out.
    return pin === DEFAULT_STAFF_PIN;
  }

  const stored = (data as { value?: string } | null)?.value;
  if (stored) return given === stored;

  // First use — seed the default PIN, then let the caller proceed.
  if (pin !== DEFAULT_STAFF_PIN) return false;
  await saveStaffPinHash(pin);
  return true;
}

export const setStaffPin = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        currentPin: z.string().regex(/^[0-9]{6}$/),
        newPin: z.string().regex(/^[0-9]{6}$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (tooManyAttempts("set-pin"))
      return { ok: false as const, error: "Too many attempts. Try again shortly." };
    if (!(await verifyStaffPin(data.currentPin)))
      return { ok: false as const, error: "Current PIN is incorrect." };
    await saveStaffPinHash(data.newPin);
    return { ok: true as const };
  });

/** Folds the optional email into the free-text notes column (the table has no email column). */
function composeNotes(email?: string, notes?: string): string | null {
  const parts: string[] = [];
  if (email?.trim()) parts.push(`Email: ${email.trim()}`);
  if (notes?.trim()) parts.push(notes.trim());
  return parts.length ? parts.join("\n") : null;
}

export const createAppointment = createServerFn({ method: "POST" })
  .validator((data: unknown) => bookingInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.id ?? crypto.randomUUID();
    const { error } = await retryRequest(
      async () =>
        await supabaseAdmin.from("appointments").insert({
          id,
          patient_name: data.name,
          phone: data.phone,
          appointment_date: data.date,
          service: data.service,
          status: "pending",
          notes: composeNotes(data.email, data.notes),
        }),
      hasError,
    );

    if (error) {
      // A retry of an already-saved booking (same id) counts as success.
      if ((error as { code?: string }).code === "23505") return { ok: true as const, id };
      console.error("[appointments] insert failed:", error.message);
      return { ok: false as const, error: "Could not save the appointment. Please try again." };
    }
    return { ok: true as const, id };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .validator((data: unknown) => rescheduleInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await retryRequest(
      async () =>
        await supabaseAdmin
          .from("appointments")
          .update({
            phone: data.phone,
            appointment_date: data.date,
            service: data.service,
          })
          .eq("id", data.id)
          .select("id"),
      hasError,
    );

    if (error) {
      console.error("[appointments] reschedule failed:", error.message);
      return { ok: false as const, error: "Could not update the appointment. Please try again." };
    }
    return { ok: true as const, synced: (rows?.length ?? 0) > 0 };
  });

export const listAppointments = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await retryRequest(
    async () =>
      await supabaseAdmin
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false }),
    hasError,
  );

  if (error) {
    console.error("[appointments] list failed:", error.message);
    return {
      ok: false as const,
      error: "Could not load appointments from the server.",
      rows: [] as AppointmentRow[],
    };
  }
  return { ok: true as const, rows: (data ?? []) as AppointmentRow[] };
});

export const setAppointmentDone = createServerFn({ method: "POST" })
  .validator((data: unknown) => pinInput.extend({ id: ID, done: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    if (tooManyAttempts(`status:${data.id}`))
      return { ok: false as const, error: "Too many attempts. Try again shortly." };
    if (!(await verifyStaffPin(data.pin)))
      return { ok: false as const, error: "Incorrect staff PIN." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await retryRequest(
      async () =>
        await supabaseAdmin
          .from("appointments")
          .update({ status: data.done ? "done" : "pending" })
          .eq("id", data.id)
          .select("id"),
      hasError,
    );

    if (error) {
      console.error("[appointments] status update failed:", error.message);
      return { ok: false as const, error: "Could not update the appointment status." };
    }
    if (!rows?.length) return { ok: false as const, error: "Appointment not found." };
    return { ok: true as const };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .validator((data: unknown) => pinInput.extend({ id: ID }).parse(data))
  .handler(async ({ data }) => {
    if (tooManyAttempts(`delete:${data.id}`))
      return { ok: false as const, error: "Too many attempts. Try again shortly." };
    if (!(await verifyStaffPin(data.pin)))
      return { ok: false as const, error: "Incorrect staff PIN." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await retryRequest(
      async () => await supabaseAdmin.from("appointments").delete().eq("id", data.id).select("id"),
      hasError,
    );

    if (error) {
      console.error("[appointments] delete failed:", error.message);
      return { ok: false as const, error: "Could not delete the appointment." };
    }
    if (!rows?.length) return { ok: false as const, error: "Appointment not found." };
    return { ok: true as const };
  });
