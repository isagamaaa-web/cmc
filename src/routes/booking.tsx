import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Send, ShieldCheck, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { PrivacyPolicyLink } from "@/components/PrivacyPolicy";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ALL_SERVICES } from "@/lib/clinic-data";
import { getDeviceId, addBooking, type StoredBooking } from "@/lib/bookings";
import { queueBooking } from "@/lib/offline-queue";
import { createAppointment } from "@/lib/appointments.functions";

import {
  attemptsLeft,
  blockedUntilLabel,
  isAdminEmail,
  isBlocked,
  registerFailedAttempt,
  resetAttempts,
  verifyPin,
} from "@/lib/admin-credentials";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book an Appointment — Central Medium Clinic" },
      {
        name: "description",
        content: "Book an appointment with Dr. Gebeyehu at Central Medium Clinic.",
      },
    ],
  }),
  component: Booking,
});

const MAX_DAYS_AHEAD = 60;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function maxDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters)")
    .max(80, "Name is too long (max 80 characters)")
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Name can only contain letters, spaces, . ' -"),
  email: z
    .string()
    .trim()
    .max(120, "Email is too long")
    .email("Enter a valid email address (e.g. name@example.com)")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+251[0-9]{9}$/,
      "Phone must start with +251 followed by 9 digits (e.g. +251912224971)",
    ),
  date: z
    .string()
    .min(1, "Please choose a preferred date")
    .refine((v) => v >= todayISO(), { message: "Date cannot be in the past" })
    .refine((v) => v <= maxDateISO(), {
      message: `Date must be within the next ${MAX_DAYS_AHEAD} days`,
    }),
  service: z
    .string()
    .min(1, "Please select a service")
    .refine((v) => ALL_SERVICES.includes(v), { message: "Please select a valid service" }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long (max 500 characters)")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function Booking() {
  const navigate = useNavigate();
  // Connectivity is a browser signal — never inferred from a third-party API.
  // Start as online so server and client render the same markup, then sync after mount.
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSaved, setOfflineSaved] = useState(false);

  const today = todayISO();
  const maxDate = maxDateISO();

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: { name: "", email: "", phone: "", date: "", service: "", notes: "" },
  });

  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (values: FormValues) => {
    const booking: StoredBooking = {
      deviceId: getDeviceId(),
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: values.name,
      phone: values.phone,
      date: values.date,
      service: values.service,
      email: values.email || undefined,
      notes: values.notes || undefined,
      submittedAt: new Date().toISOString(),
      done: false,
    };

    // Save on this device first, so a network hiccup can never lose the request.
    try {
      addBooking(booking);
    } catch (err) {
      console.warn("Could not save booking on this device:", err);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueBooking(booking);
      setOfflineSaved(true);
      toast.info("You're offline — saved on this device and will sync when you reconnect.");
      return;
    }

    try {
      // Go through our own server, which talks to the database. This avoids
      // browser-to-Supabase connectivity problems being reported as "offline".
      const result = await createAppointment({
        data: {
          id: booking.id,
          name: booking.name,
          phone: booking.phone,
          email: booking.email ?? "",
          date: booking.date,
          service: booking.service,
          notes: booking.notes ?? "",
        },
      });

      if (result.ok) {
        toast.success("Appointment booked successfully!");
      } else {
        console.error("Appointment save failed:", result.error);
        queueBooking(booking);
        toast.warning("Saved on this device — we'll keep trying to reach the clinic.");
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      queueBooking(booking);
      toast.warning("Saved on this device — we'll keep trying to reach the clinic.");
    }

    navigate({ to: "/booking-success" });
  };

  const [pinOpen, setPinOpen] = useState(false);
  const [noAppt, setNoAppt] = useState(false);
  const [completedAppt, setCompletedAppt] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cmc_no_appointment") === "1") {
        setNoAppt(true);
        sessionStorage.removeItem("cmc_no_appointment");
      }
      if (sessionStorage.getItem("cmc_appointment_done") === "1") {
        setCompletedAppt(true);
        sessionStorage.removeItem("cmc_appointment_done");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectedService = watch("service");

  /**
   * Admin access opens only when the form is submitted (Confirm button or Enter
   * in a field) — never while the email address is still being typed.
   */
  const submitBookingForm = (event: React.FormEvent<HTMLFormElement>) => {
    // Always stop the browser's native submit, even if JS is still warming up.
    event.preventDefault();
    const email = (getValues("email") ?? "").trim();
    if (email && isAdminEmail(email)) {
      setPinOpen(true);
      return;
    }
    void handleSubmit(onSubmit)(event);
  };

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <h1 className="text-4xl text-primary sm:text-5xl">Book an Appointment</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Reserve your visit with <strong className="text-foreground">Dr. Gebeyehu</strong>. We'll
            confirm your booking by phone.
          </p>
        </ScrollReveal>

        {noAppt && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-accent/50 bg-accent/15 p-4 text-sm font-semibold text-primary"
          >
            You don't have an appointment yet — please book one before rescheduling.
          </div>
        )}

        {completedAppt && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary"
          >
            This appointment is already completed, so it can't be rescheduled. Please book a new
            appointment below.
          </div>
        )}

        {offlineSaved ? (
          <GlassCard className="mt-10 p-8 text-center md:p-10">
            <ShieldCheck className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-primary">Request saved on this device</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You're offline right now. Your booking will be sent to the clinic automatically as
              soon as your connection returns.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="btn-royal mt-6 rounded-full px-6 py-3 font-semibold"
            >
              Back home
            </button>
          </GlassCard>
        ) : (
          <ScrollReveal delay={80}>
            <GlassCard className="mt-10 p-6 md:p-8">
              {!isOnline && (
                <div
                  className="mb-5 flex items-center gap-2 rounded-xl bg-amber/15 border border-amber/40 p-3 text-sm text-amber-800"
                  role="status"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  You're currently offline. Changes will be saved locally and synced when you're
                  back online.
                </div>
              )}
              {hasErrors && (
                <div
                  className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
                  role="alert"
                >
                  <p className="font-semibold">Please fix the following before submitting:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {Object.entries(errors).map(([field, err]) => (
                      <li key={field}>
                        <strong className="capitalize">{field}:</strong> {err?.message as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <form onSubmit={submitBookingForm} className="grid gap-5" noValidate>
                <Field label="Full Name" htmlFor="name" error={errors.name?.message}>
                  <input
                    id="name"
                    autoComplete="name"
                    placeholder="Your full name"
                    {...register("name")}
                    className="input"
                    aria-invalid={!!errors.name}
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Phone (+251...)" htmlFor="phone" error={errors.phone?.message}>
                    <input
                      id="phone"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+251912224971"
                      {...register("phone")}
                      className="input"
                      aria-invalid={!!errors.phone}
                    />
                  </Field>
                  <Field label="Email (optional)" htmlFor="email" error={errors.email?.message}>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      {...register("email")}
                      className="input"
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Preferred Date"
                    htmlFor="date"
                    error={errors.date?.message}
                    hint={`Choose a date between today and ${maxDate}`}
                  >
                    <input
                      id="date"
                      type="date"
                      min={today}
                      max={maxDate}
                      {...register("date")}
                      className="input"
                      aria-invalid={!!errors.date}
                    />
                  </Field>
                  <Field label="Service" htmlFor="service" error={errors.service?.message}>
                    <select
                      id="service"
                      {...register("service")}
                      className="input"
                      aria-invalid={!!errors.service}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a service…
                      </option>
                      {ALL_SERVICES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Notes (optional)" htmlFor="notes" error={errors.notes?.message}>
                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={500}
                    {...register("notes")}
                    className="input resize-none"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-royal mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>Submitting…</>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4" /> Confirm Booking{" "}
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="-mt-2 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    By continuing, you agree to our{" "}
                    <PrivacyPolicyLink className="text-primary">Privacy Policy</PrivacyPolicyLink>.
                  </span>
                </p>
              </form>
            </GlassCard>
          </ScrollReveal>
        )}

        <style>{`
          .input {
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid var(--color-border);
            background: white;
            padding: 0.65rem 0.9rem;
            font-size: 0.925rem;
            color: var(--color-foreground);
          }
          .input:focus {
            outline: none;
            border-color: var(--color-ring);
            box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
          }
        `}</style>

        <PinModal
          open={pinOpen}
          onClose={() => setPinOpen(false)}
          onSuccess={(pin) => {
            setPinOpen(false);
            sessionStorage.setItem("cmc_admin", "1");
            sessionStorage.setItem("cmc_admin_pin", pin);
            navigate({ to: "/doctors" });
          }}
        />
      </div>
    </section>
  );
}

function PinModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setTimeout(() => refs.current[0]?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (value: string) => {
    if (verifyPin(value)) {
      resetAttempts();
      onSuccess(value);
    } else {
      const left = registerFailedAttempt();
      setError(
        left > 0
          ? `Incorrect PIN. ${left} attempt${left === 1 ? "" : "s"} left this month.`
          : `Access locked on this device until ${blockedUntilLabel()}.`,
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setDigits(["", "", "", "", "", ""]);
      if (left <= 0) {
        setTimeout(onClose, 1200);
        return;
      }
      setTimeout(() => refs.current[0]?.focus(), 50);
    }
  };

  const setDigitAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError(null);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) submit(next.join(""));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (text.length === 6) submit(text);
    else refs.current[text.length]?.focus();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-title"
    >
      <div className="absolute inset-0 bg-[#0F252C]/70 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-[0_40px_120px_-20px_rgba(9,125,134,0.6)] ${
          shake ? "animate-[shake_0.4s_ease-in-out]" : ""
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,213,192,0.45), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(9,125,134,0.35), transparent 70%)" }}
        />

        <div className="relative text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ED5C0] to-[#097D86] shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 id="pin-title" className="mt-5 text-3xl font-bold uppercase text-[#0B4A55]">
            Admin Access
          </h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Enter the 6-digit security PIN
          </p>

          <div className="mt-8 flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                className={`h-14 w-11 rounded-xl border-2 bg-white text-center text-2xl font-bold text-[#0B4A55] outline-none transition-all sm:h-16 sm:w-12 ${
                  error
                    ? "border-destructive"
                    : d
                      ? "border-[#0ED5C0] shadow-[0_0_0_3px_rgba(14,213,192,0.2)]"
                      : "border-border focus:border-[#097D86] focus:shadow-[0_0_0_3px_rgba(9,125,134,0.18)"
                }
                }`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error ? (
            <p role="alert" className="mt-5 text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">
              Unauthorized access is prohibited and logged. {attemptsLeft()} attempt
              {attemptsLeft() === 1 ? "" : "s"} remaining this month.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
