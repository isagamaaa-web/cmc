import { createFileRoute, Link } from "@tanstack/react-router";
import { Microscope, HeartPulse, ArrowRight, Stethoscope, Tag } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  LAB_PANEL_ITEMS,
  CLINICAL_SERVICE_ITEMS,
  CLINIC,
} from "@/lib/clinic-data";
import { usePrices } from "@/lib/use-prices";


const FAQS = [
  {
    q: "Do I need to book an appointment or can I walk in?",
    a: "Both work. Central Medium Clinic is open 24/7, so walk-ins are welcome, but booking guarantees a slot with Dr. Gebeyehu.",
  },
  {
    q: "Which lab tests are available on-site?",
    a: "CBC, RFT, LFT, Uric Acid, Lipid Panel, Malaria (BF & RDT), Urine & Stool analysis, H.Pylori Ag, FBS & HGA1C, Tuberculosis screening, and full hormone panels including thyroid.",
  },
  {
    q: "Do you provide imaging services?",
    a: "Yes — ultrasound / sonography (abdominal, pelvic and general) and 12-lead ECG are performed in-house.",
  },
  {
    q: "How much do services cost?",
    a: "Consultations are 800–3,000 ETB, ECG 500–2,000 ETB, ultrasound 525–17,100 ETB, and lab panels start from 150 ETB. Every service price is listed on this page.",
  },
  {
    q: "Is the clinic really open 24/7?",
    a: "Yes. Consultations, labs and emergency care are available around the clock, every day of the week.",
  },
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Central Medium Clinic" },
      {
        name: "description",
        content:
          "Comprehensive laboratory panels, imaging, cardiac care, and internal medicine consultations at Central Medium Clinic.",
      },
      { property: "og:title", content: "Services — Central Medium Clinic" },
      {
        property: "og:description",
        content:
          "Laboratory testing and specialist clinical care — processed in-house at Central Medium Clinic.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: CLINIC.name,
          medicalSpecialty: "InternalMedicine",
          availableService: [
            ...CLINICAL_SERVICE_ITEMS.map((i) => ({
              "@type": "MedicalProcedure",
              name: i.title,
              description: `${i.description} Price: ${i.price}.`,
            })),
            ...LAB_PANEL_ITEMS.map((i) => ({
              "@type": "MedicalTest",
              name: i.title,
              description: `${i.description} Price: ${i.price}.`,
            })),
          ],
        }),
      },
    ],
  }),
  component: Services,
});

function Services() {
  const { priceOf } = usePrices();
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
            Our services
          </p>
          <h1 className="mt-2 text-4xl text-primary sm:text-5xl">
            Come visit us we care about your health.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Comprehensive laboratory testing and specialist clinical care — processed
            in-house, delivered without the runaround. Every price below is transparent
            and quoted in Ethiopian Birr (ETB).
          </p>
        </ScrollReveal>

        {/* Clinical & Imaging */}
        <ScrollReveal delay={60}>
          <div className="mt-14">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/25 text-primary">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h2 className="text-2xl text-primary sm:text-3xl">
                Clinical & Imaging Services
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CLINICAL_SERVICE_ITEMS.map((item, i) => (
                <ScrollReveal key={item.title} delay={80 + i * 40}>
                  <GlassCard className="h-full p-6">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 text-sm font-bold text-primary">
                      <Tag className="h-3.5 w-3.5" /> {priceOf(item.title) ?? item.price}
                    </p>
                  </GlassCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Laboratory Panels */}
        <ScrollReveal delay={60}>
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Microscope className="h-5 w-5" />
              </div>
              <h2 className="text-2xl text-primary sm:text-3xl">Laboratory Panels</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {LAB_PANEL_ITEMS.map((item, i) => (
                <ScrollReveal key={item.title} delay={80 + i * 30}>
                  <GlassCard className="h-full p-6">
                    {item.code && (
                      <span className="inline-block rounded-full bg-accent/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.code}
                      </span>
                    )}
                    <h3 className="mt-3 text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 text-sm font-bold text-primary">
                      <Tag className="h-3.5 w-3.5" /> {priceOf(item.title) ?? item.price}
                    </p>
                  </GlassCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={80}>
          <GlassCard className="mt-16 flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl text-primary">Not sure which test you need?</h3>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Book a consultation and Dr. Gebeyehu will recommend the right panel for
                your situation.
              </p>
            </div>
            <Link
              to="/booking"
              className="btn-royal inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
            >
              Book Consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
