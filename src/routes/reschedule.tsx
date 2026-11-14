import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CalendarClock, CalendarX, RefreshCw, Save, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ALL_SERVICES, CLINIC } from "@/lib/clinic-data";
import { findMyBooking, setBookingDone, updateBooking, type StoredBooking } from "@/lib/bookings";
import { getAppointmentStatus, rescheduleAppointment } from "@/lib/appointments.functions";

const MAX_DAYS_AHEAD = 60;
const todayISO = () => new Date().toISOString().split("T")[0];
const maxDateISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return d.toISOString().split("T")[0];
};

const schema = z.object({
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
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/reschedule")({
  head: () => ({
    meta: [
      { title: "Reschedule Your Appointment — Central Medium Clinic" },
      {
        name: "description",
        content:
          "Change the date, phone number or service of your existing appointment at Central Medium Clinic.",
      },
      { property: "og:title", content: "Reschedule Your Appointment — Central Medium Clinic" },
      {
        property: "og:description",
        content: "Update your booked appointment at Central Medium Clinic in seconds.",
      },
    ],
  }),
  component: Reschedule,
});

type BlockReason = "no_booking" | "done" | "not_found" | "check_failed" | "offline";

function Reschedule() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState<BlockReason | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const blockAndGoToBooking = (reason: "no_booking" | "done") => {
      setBlocked(reason);
      setChecking(false);
      setBooking(null);
      try {
        sessionStorage.setItem(
          reason === "done" ? "cmc_appointment_done" : "cmc_no_appointment",
          "1",
        );
      } catch {
        /* ignore */
      }
      if (reason === "done") {
        toast.error("This appointment is already completed", {
          description: "Please book a new appointment.",
        });
      } else {
        toast.error("You don't have an appointment", {
          description: "Please book an appointment before rescheduling.",
        });
      }
      navigate({ to: "/booking", replace: true });
    };

    const verify = async () => {
      setChecking(true);
      setBlocked(null);

      const found = findMyBooking();
      if (!found) {
        blockAndGoToBooking("no_booking");
        return;
      }
      if (found.done) {
        blockAndGoToBooking("done");
        return;
      }

      // We need the server to confirm that the appointment still exists and is
      // not already completed. Offline rescheduling is intentionally blocked:
      // without this check a completed appointment could be changed locally.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setBlocked("offline");
        setChecking(false);
        return;
      }

      try {
        const result = await getAppointmentStatus({ data: { id: found.id } });
        if (cancelled) return;
        if (!result.ok) {
          setBlocked("check_failed");
          setChecking(false);
          return;
        }
        if (!result.found) {
          setBlocked("not_found");
          setChecking(false);
          return;
        }
        if (result.status === "done") {
          setBookingDone(found.id, true);
          blockAndGoToBooking("done");
          return;
        }
        setBooking(found);
        setChecking(false);
      } catch {
        if (!cancelled) {
          setBlocked("check_failed");
          setChecking(false);
        }
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [navigate, retryKey]);

  if (checking) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Checking this device for an appointment...</p>
      </section>
    );
  }

  if (blocked) {
    return <BlockedReschedule reason={blocked} onRetry={() => setRetryKey((key) => key + 1)} />;
  }

  if (!booking) return null;

  return <RescheduleForm booking={booking} onDone={setBooking} />;
}

function BlockedReschedule({ reason, onRetry }: { reason: BlockReason; onRetry: () => void }) {
  const copy: Record<BlockReason, { title: string; body: string }> = {
    no_booking: {
      title: "No appointment to reschedule",
      body: "You need to book an appointment before you can reschedule. We're taking you to the booking page.",
    },
    done: {
      title: "This appointment is completed",
      body: "Staff marked this appointment as done. You can't reschedule a completed appointment — please book a new one.",
    },
    not_found: {
      title: "Appointment not found",
      body: "We couldn't find this appointment on the clinic system. If you just booked, wait a moment and try again. Otherwise, please book a new appointment.",
    },
    check_failed: {
      title: "Could not verify your appointment",
      body: "We couldn't confirm the appointment status. Please try again, or book a new appointment.",
    },
    offline: {
      title: "Connect to reschedule",
      body: "You're offline. We need to check your appointment status before rescheduling. Reconnect and try again, or book a new appointment.",
    },
  };
  const { title, body } = copy[reason];
  const canRetry = reason === "not_found" || reason === "check_failed" || reason === "offline";

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-2xl">
        <GlassCard className="p-8 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl text-primary sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="btn-royal inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold opacity-50"
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Reschedule unavailable
            </button>
            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-white px-5 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            )}
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-white px-5 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Go to booking page
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

function RescheduleForm({
  booking,
  onDone,
}: {
  booking: StoredBooking;
  onDone: (b: StoredBooking) => void;
}) {
  const navigate = useNavigate();
  // Start as online so server and client render the same markup, then sync after mount.
  const [isOnline, setIsOnline] = useState(true);

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      phone: booking.phone,
      date: booking.date,
      service: booking.service,
    },
  });

  const selectedService = watch("service");
  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (values: FormValues) => {
    if (!isOnline) {
      toast.error("Reconnect before rescheduling so we can verify your appointment.");
      return;
    }

    const patch = {
      phone: values.phone,
      date: values.date,
      service: values.service,
    };

    try {
      // The server verifies that the appointment still exists and is not done
      // before changing anything. Update the server first so a rejected
      // reschedule never leaves a misleading local copy.
      const result = await rescheduleAppointment({
        data: { id: booking.id, ...patch },
      });

      if (!result.ok) {
        const code = "code" in result ? result.code : "error";
        if (code === "done") {
          setBookingDone(booking.id, true);
          toast.error(result.error);
          try {
            sessionStorage.setItem("cmc_appointment_done", "1");
          } catch {
            /* ignore */
          }
          navigate({ to: "/booking", replace: true });
          return;
        }
        if (code === "not_found") {
          toast.error(result.error);
          try {
            sessionStorage.setItem("cmc_no_appointment", "1");
          } catch {
            /* ignore */
          }
          navigate({ to: "/booking", replace: true });
          return;
        }
        console.error("Reschedule save failed:", result.error);
        toast.error(result.error);
        return;
      }

      let updated: StoredBooking | undefined;
      try {
        updated = updateBooking(booking.id, patch);
      } catch {
        updated = undefined;
      }

      toast.success("Appointment rescheduled successfully!");
      if (updated) onDone(updated);
      navigate({ to: "/booking-success", search: { mode: "reschedule" } });
    } catch (err) {
      console.error("Reschedule submission error:", err);
      toast.error("Could not reschedule right now. Please try again.");
    }
  };

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <h1 className="text-4xl text-primary sm:text-5xl">Reschedule Your Appointment</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            We recognised this device — hello,{" "}
            <strong className="text-foreground">{booking.name}</strong>. Update your preferred date,
            phone number or service below.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <GlassCard className="mt-8 p-6 md:p-8">
            {!isOnline && (
              <div
                className="mb-5 flex items-center gap-2 rounded-xl bg-amber/15 border border-amber/40 p-3 text-sm text-amber-800"
                role="status"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                You're currently offline. Reconnect before rescheduling so we can verify your
                appointment.
              </div>
            )}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Current booking:</span>
              <strong className="text-foreground">{booking.service}</strong>
              <span className="text-muted-foreground">on</span>
              <strong className="text-foreground">{booking.date}</strong>
            </div>

            {hasErrors && (
              <div
                className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                <p className="font-semibold">Please fix the following before saving:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {Object.entries(errors).map(([field, err]) => (
                    <li key={field}>
                      <strong className="capitalize">{field}:</strong> {err?.message as string}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(onSubmit, () =>
                  toast.error("Please fix the highlighted fields."),
                )(event);
              }}
              className="grid gap-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="r-phone"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Phone (+251…)
                </label>
                <input
                  id="r-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+251912224971"
                  {...register("phone")}
                  className="rs-input"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="r-date"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    New preferred date
                  </label>
                  <input
                    id="r-date"
                    type="date"
                    min={todayISO()}
                    max={maxDateISO()}
                    {...register("date")}
                    className="rs-input"
                    aria-invalid={!!errors.date}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-destructive" role="alert">
                      {errors.date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="r-service"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Service
                  </label>
                  <select
                    id="r-service"
                    {...register("service")}
                    className="rs-input"
                    aria-invalid={!!errors.service}
                  >
                    {ALL_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOnline}
                className="btn-royal mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CalendarClock className="h-4 w-4" /> Save new details <Save className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-5 text-xs text-muted-foreground">
              Need help? Call {CLINIC.phones[0]} — we're open {CLINIC.hours}.
            </p>
          </GlassCard>
        </ScrollReveal>
      </div>

      <style>{`
        .rs-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background: white;
          padding: 0.65rem 0.9rem;
          font-size: 0.925rem;
          color: var(--color-foreground);
        }
        .rs-input:focus {
          outline: none;
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
        }
      `}</style>
    </section>
  );
}
