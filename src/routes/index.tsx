import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, ArrowRight, Microscope, HeartPulse, Clock, ShieldCheck, Check, Star, MapPin } from "lucide-react";
import { DoctorHero } from "@/components/DoctorHero";
import { HeroBackground } from "@/components/HeroBackground";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CLINIC, LAB_PANELS, CLINICAL_SERVICES, telHref } from "@/lib/clinic-data";
import doctorImg from "@/assets/doctor-waving.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Central Medium Clinic — 24/7 Clinic & Lab in Ashawa Meda" },
      {
        name: "description",
        content:
          "Central Medium Clinic: 24/7 internal medicine, ECG, ultrasound and full lab testing with Dr. Gebeyehu in Ashawa Meda. Transparent ETB prices, online booking.",
      },
      {
        name: "keywords",
        content:
          "clinic Ashawa Meda, Dr Gebeyehu, internal medicine specialist Ethiopia, 24/7 clinic, laboratory test prices ETB, ECG, ultrasound, book doctor appointment online",
      },
      { property: "og:title", content: "Central Medium Clinic — 24/7 Care by Dr. Gebeyehu" },
      {
        property: "og:description",
        content:
          "Internal medicine, cardiac diagnostics, ultrasound and lab panels — open 24/7. Book your appointment online in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preload", as: "image", href: doctorImg, fetchPriority: "high" },
    ],
  }),

  component: Home,
});

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-24 pt-10 md:px-8 md:pt-16">
        <HeroBackground />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">

          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Trusted Internal Medicine
            </span>
            <h1 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
              24/7 Complete <span className="text-accent">Medical Care</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {CLINIC.name} — led by <strong className="text-foreground">{CLINIC.doctor}</strong>,{" "}
              {CLINIC.role}. Round-the-clock diagnostics, imaging, and specialist care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={telHref(CLINIC.phones[0])}
                className="btn-royal inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                aria-label={`Emergency call ${CLINIC.phones[0]}`}
              >
                <Phone className="h-4 w-4" /> Emergency: {CLINIC.phones[0]}
              </a>
              <a
                href={telHref(CLINIC.phones[1])}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-6 py-3 text-sm font-semibold text-primary hover:bg-white"
                aria-label={`Call ${CLINIC.phones[1]}`}
              >
                <Phone className="h-4 w-4" /> {CLINIC.phones[1]}
              </a>
              <Link
                to="/booking"
                className="btn-lime inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Book Appointment <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 24 Hours / 7 Days</div>
              <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-accent" /> Emergency ready</div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <DoctorHero />
          </ScrollReveal>
        </div>
      </section>

      {/* Services overview */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <h2 className="text-3xl text-primary sm:text-4xl">Our Care, Organized</h2>
              <p className="mt-3 text-muted-foreground">
                Two pillars of service — from precise lab diagnostics to advanced specialist care.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2">
            <ScrollReveal delay={80}>
              <GlassCard>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Microscope className="h-6 w-6" />
                </div>
                <h3 className="text-2xl text-primary">Diagnostic & Lab Testing</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Full-spectrum laboratory panels for early detection and confident treatment.
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                  {LAB_PANELS.slice(0, 8).map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                      {s}
                    </li>
                  ))}
                </ul>
                <Link to="/services" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View all labs <ArrowRight className="h-4 w-4" />
                </Link>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <GlassCard>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-primary">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <h3 className="text-2xl text-primary">Advanced Care & Specialist Services</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Specialist consultations, imaging, and cardiac care led by Dr. Gebeyehu.
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-1.5 text-sm">
                  {CLINICAL_SERVICES.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                      {s}
                    </li>
                  ))}
                </ul>
                <Link to="/services" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Explore services <ArrowRight className="h-4 w-4" />
                </Link>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <GlassCard className="flex flex-col items-center justify-between gap-6 p-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl text-primary">Need care right now?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our team is on call 24/7 — reach us instantly.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {CLINIC.phones.map((p) => (
                  <a
                    key={p}
                    href={telHref(p)}
                    className="btn-royal inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    <Phone className="h-4 w-4" /> {p}
                  </a>
                ))}
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Why CMC + Testimonial + CTA banner */}
      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Why CMC */}
            <ScrollReveal>
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Why CMC
                </span>
                <h2 className="mt-4 text-4xl leading-[1.05] text-[#0F252C] sm:text-5xl">
                  COMPREHENSIVE MEDICAL CARE, CENTERED ON YOU.
                </h2>
                <ul className="mt-8 space-y-6">
                  {[
                    {
                      title: "Modern equipment",
                      desc: "Advanced diagnostic tools, including imaging and modern labs you can trust.",
                    },
                    {
                      title: "Caring specialists",
                      desc: "Our multidisciplinary team of experienced doctors and staff.",
                    },
                    {
                      title: "Transparent pricing",
                      desc: "Clear quotes upfront. No surprises after treatment.",
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 border-primary text-primary">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="text-lg font-bold text-[#0F252C]">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Testimonial */}
            <ScrollReveal delay={120}>
              <div className="relative rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(9,125,134,0.35)] md:p-10">
                <p className="text-2xl italic leading-snug text-[#0F252C] sm:text-3xl" style={{ fontFamily: '"Bebas Neue", serif', letterSpacing: "0.01em" }}>
                  "THE TEAM AT CMC MADE MY WHOLE FAMILY COMFORTABLE. TRULY A SUPERIOR MEDICAL CARE EXPERIENCE."
                </p>
                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                      M
                    </span>
                    <div>
                      <p className="font-bold text-[#0F252C]">Meron T.</p>
                      <p className="text-xs text-muted-foreground">Patient · 2024</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* CTA banner */}
          <ScrollReveal delay={80}>
            <div
              className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[2rem] p-8 shadow-xl md:flex-row md:items-center md:p-12"
              style={{ background: "linear-gradient(90deg, #097D86 0%, #0ED5C0 100%)" }}
            >
              <div className="max-w-xl text-white">
                <h2 className="text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
                  READY TO SCHEDULE YOUR APPOINTMENT?
                </h2>
                <p className="mt-3 text-sm text-white/85 sm:text-base">
                  Book online in under a minute. Our team will confirm your slot shortly after.
                </p>
                <MapPin className="mt-4 h-5 w-5 text-white/80" strokeWidth={1.5} aria-hidden />
              </div>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105"
              >
                Book your visit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
