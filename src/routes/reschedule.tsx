import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, Save, Tag, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ALL_SERVICES, CLINIC } from "@/lib/clinic-data";
import { usePrices } from "@/lib/use-prices";
import { findMyBooking, updateBooking, type StoredBooking } from "@/lib/bookings";
import { queueReschedule } from "@/lib/offline-queue";


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
    .regex(/^\+251[0-9]{9}$/, "Phone must start with +251 followed by 9 digits (e.g. +251912224971)"),
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

function Reschedule() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<StoredBooking | null | undefined>(undefined);

  useEffect(() => {
    const found = findMyBooking();
    if (!found) {
      try {
        sessionStorage.setItem("cmc_no_appointment", "1");
      } catch {
        /* ignore */
      }
      toast.error("You don't have an appointment", {
        description: "Please book an appointment before rescheduling.",
      });
      navigate({ to: "/booking" });
      setBooking(null);
      return;
    }
    setBooking(found);
  }, [navigate]);

  if (!booking) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Checking this device for an appointment…</p>
      </section>
    );
  }

  return <RescheduleForm booking={booking} onDone={setBooking} />;
}

function RescheduleForm({
  booking,
  onDone,
}: {
  booking: StoredBooking;
  onDone: (b: StoredBooking) => void;
}) {
  const navigate = useNavigate();
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
  const { priceOf } = usePrices();

  const selectedService = watch("service");
  const selectedPrice = selectedService ? priceOf(selectedService) : undefined;
  const hasErrors = Object.keys(errors).length > 0;




  const onSubmit = (values: FormValues) => {
    const patch = {
      phone: values.phone,
      date: values.date,
      service: values.service,
      price: priceOf(values.service),
    };
    let updated: StoredBooking | undefined;
    try {
      updated = updateBooking(booking.id, patch);
    } catch {
      updated = undefined;
    }
    if (!updated) {
      // Park the change and replay it automatically once storage/network recovers.
      queueReschedule(booking.id, patch);
      onDone({ ...booking, ...patch, updatedAt: new Date().toISOString() });
      navigate({ to: "/booking-success", search: { mode: "reschedule" } });
      return;
    }
    onDone(updated);
    navigate({ to: "/booking-success", search: { mode: "reschedule" } });
  };


  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <h1 className="text-4xl text-primary sm:text-5xl">Reschedule Your Appointment</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            We recognised this device — hello, <strong className="text-foreground">{booking.name}</strong>.
            Update your preferred date, phone number or service below.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <GlassCard className="mt-8 p-6 md:p-8">
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
              onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))}
              className="grid gap-5"
              noValidate
            >
              <div>
                <label htmlFor="r-phone" className="mb-1.5 block text-sm font-medium text-foreground">
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
                  <label htmlFor="r-date" className="mb-1.5 block text-sm font-medium text-foreground">
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
                  <label htmlFor="r-service" className="mb-1.5 block text-sm font-medium text-foreground">
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
                        {s} — {priceOf(s)}
                      </option>
                    ))}
                  </select>
                  {selectedPrice && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 text-sm font-semibold text-primary">
                      <Tag className="h-3.5 w-3.5" /> Estimated price: {selectedPrice}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-royal mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold disabled:opacity-60"
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
