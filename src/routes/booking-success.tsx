import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Phone, Home, CalendarCheck } from "lucide-react";
import { CLINIC, telHref } from "@/lib/clinic-data";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["booking", "reschedule"]).optional().catch("booking"),
});

export const Route = createFileRoute("/booking-success")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Appointment Confirmed — Central Medium Clinic" },
      {
        name: "description",
        content:
          "Your appointment request with Central Medium Clinic has been received. Our team will call you shortly to confirm.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingSuccess,
});

function BookingSuccess() {
  const { mode } = Route.useSearch();
  const isReschedule = mode === "reschedule";

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4 py-12 md:px-8">
      <div className="w-full max-w-2xl rounded-[2rem] border border-primary/15 bg-white p-8 text-center shadow-[0_30px_80px_-30px_rgba(9,125,134,0.45)] sm:p-12">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60" />
          <span className="absolute inset-2 rounded-full bg-emerald-100" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            {isReschedule ? (
              <CalendarCheck className="h-11 w-11" strokeWidth={3} />
            ) : (
              <Check className="h-12 w-12" strokeWidth={3.5} />
            )}
          </span>
        </div>

        <h1 className="mt-8 text-5xl uppercase leading-none text-[#0F252C] sm:text-6xl md:text-7xl">
          {isReschedule ? "Your appointment is rescheduled!" : "We've got your request!"}
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          {isReschedule
            ? `Your new date, phone number and service have been saved. ${CLINIC.name} will call you shortly to reconfirm your updated appointment — no need to book again.`
            : `Thank you for scheduling with ${CLINIC.name}. Our team will call you shortly to confirm your appointment details.`}
        </p>


        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={telHref(CLINIC.phones[0])}
            className="btn-royal inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition-transform hover:scale-[1.03] active:scale-[0.99]"
          >
            <Phone className="h-5 w-5" /> Call the clinic
          </a>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-white px-8 py-4 text-base font-semibold text-[#0F252C] transition-colors hover:bg-secondary active:bg-secondary/80"
          >
            <Home className="h-5 w-5" /> Back home
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Open {CLINIC.hours} · {CLINIC.phones[0]} · {CLINIC.phones[1]}
        </p>
      </div>
    </section>
  );
}
