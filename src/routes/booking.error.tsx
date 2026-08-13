import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Phone } from "lucide-react";
import { CLINIC, telHref } from "@/lib/clinic-data";

export const Route = createFileRoute("/booking/error")({
  head: () => ({
    meta: [
      { title: "Something went wrong — Central Medium Clinic" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingError,
});

function BookingError() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16 md:px-8">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_-20px_rgba(9,125,134,0.35)] md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-red-500 shadow-lg">
          <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 text-4xl uppercase tracking-wide text-[#0F252C] sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          We couldn't save your appointment request. Please try again, or call the clinic directly
          and we'll book you right away.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={telHref(CLINIC.phones[0])}
            className="btn-royal inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <Phone className="h-4 w-4" /> Call the clinic
          </a>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white px-6 py-3 text-sm font-semibold text-[#0F252C] hover:bg-secondary"
          >
            Try again
          </Link>
        </div>
      </div>
    </section>
  );
}
