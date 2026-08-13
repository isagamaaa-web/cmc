import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope, Clock, Award, HeartHandshake } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CLINIC } from "@/lib/clinic-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Central Medium Clinic & Dr. Gebeyehu" },
      {
        name: "description",
        content:
          "Meet Dr. Gebeyehu, Internal Medicine Specialist leading Central Medium Clinic — 24 hours a day, 7 days a week.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <h1 className="text-4xl text-primary sm:text-5xl">About {CLINIC.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A modern, community-rooted clinic delivering complete internal medicine care —
            available every hour of every day.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <ScrollReveal delay={60} className="lg:col-span-2">
            <GlassCard className="p-8">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl text-primary">{CLINIC.doctor}</h2>
                  <p className="text-sm text-muted-foreground">{CLINIC.role}</p>
                </div>
              </div>
              <p className="mt-5 text-foreground/80">
                Dr. Gebeyehu leads Central Medium Clinic with a patient-first approach to internal
                medicine — combining evidence-based diagnostics, cardiac care, and personalised
                treatment plans. From routine screenings to complex chronic conditions, patients
                receive thorough, compassionate attention at every visit.
              </p>
              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <li className="flex items-start gap-2"><Award className="mt-0.5 h-4 w-4 text-accent" /> Internal Medicine Specialist</li>
                <li className="flex items-start gap-2"><HeartHandshake className="mt-0.5 h-4 w-4 text-accent" /> Patient-first, evidence-based care</li>
                <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-accent" /> Round-the-clock availability</li>
                <li className="flex items-start gap-2"><Stethoscope className="mt-0.5 h-4 w-4 text-accent" /> Full lab & imaging on-site</li>
              </ul>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <GlassCard className="h-full p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl text-primary">24 Hours / 7 Days</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Whether it's an emergency at midnight or a check-up on a Sunday morning, our team
                is ready. Care doesn't wait — and neither do we.
              </p>
              <div className="mt-6 rounded-xl bg-primary/5 p-4">
                <div className="text-3xl font-semibold text-primary">168</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Hours of care every week
                </div>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
