import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicy";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CLINIC } from "@/lib/clinic-data";
import { PRIVACY_LAST_UPDATED, usePrivacyPolicy } from "@/lib/privacy-policy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Central Medium Clinic" },
      {
        name: "description",
        content:
          "How Central Medium Clinic collects, uses, stores, and protects your personal information, including cookies and booking data.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { openPrivacyPolicy } = usePrivacyPolicy();

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[32px] border border-[#097d86]/15 bg-white/75 p-7 shadow-[0_28px_90px_-30px_rgba(9,125,134,0.45)] backdrop-blur-xl md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#0ED5C0]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-[#097D86]/15 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#097d86]/15 bg-[#097d86]/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#097D86]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Legal & privacy
              </span>
              <h1 className="mt-4 text-4xl text-primary sm:text-5xl">Privacy Policy</h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                How {CLINIC.name} collects, uses, stores, and protects your personal information
                when you book an appointment or use this website.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openPrivacyPolicy}
                  className="btn-royal inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Open as popup
                </button>
                <Link
                  to="/"
                  className="btn-rect inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground/75"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back home
                </Link>
                <span className="text-xs text-muted-foreground">
                  Last updated: {PRIVACY_LAST_UPDATED}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <GlassCard className="mt-8 p-6 md:p-10">
            <PrivacyPolicyContent />
          </GlassCard>
        </ScrollReveal>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          This policy covers this website and the appointment booking service. For urgent medical
          questions, please call the clinic directly.
        </p>
      </div>
    </section>
  );
}
