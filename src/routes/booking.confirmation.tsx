import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Phone, PartyPopper, Home } from "lucide-react";
import { CLINIC, telHref } from "@/lib/clinic-data";

export const Route = createFileRoute("/booking/confirmation")({
  head: () => ({
    meta: [
      { title: "Request Received — Central Medium Clinic" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmation,
});

function Confirmation() {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4 py-16 md:px-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-[0_40px_120px_-30px_rgba(9,125,134,0.55)] md:p-16">
        {/* Decorative gradient rings */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-teal-bright/40 to-transparent blur-3xl" style={{ background: "radial-gradient(circle, rgba(14,213,192,0.45), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(9,125,134,0.4), transparent 70%)" }} />

        <div className="relative">
          {/* Giant animated check */}
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-[#0ED5C0] to-[#097D86] shadow-[0_25px_60px_-15px_rgba(9,125,134,0.6)] animate-pulse">
            <CheckCircle2 className="h-24 w-24 text-white" strokeWidth={2.5} />
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0ED5C0]/15 px-5 py-2 text-sm font-bold uppercase tracking-[0.25em] text-[#097D86]">
            <PartyPopper className="h-4 w-4" /> Success
          </div>

          <h1 className="mt-4 text-6xl uppercase leading-none sm:text-7xl md:text-8xl">
            Booking Confirmed!
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-foreground md:text-xl">
            🎉 Your appointment request has been received successfully.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
            Thank you for choosing <strong className="text-[#097D86]">Central Medium Clinic</strong>.
            Our team will call you shortly to confirm your visit.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={telHref(CLINIC.phones[0])}
              className="btn-royal inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold shadow-lg"
            >
              <Phone className="h-5 w-5" /> Call the clinic
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-white px-8 py-4 text-base font-bold text-[#0F252C] hover:bg-secondary"
            >
              <Home className="h-5 w-5" /> Back home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
