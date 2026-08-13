import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, MapPin, Clock, WifiOff, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CLINIC, telHref } from "@/lib/clinic-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Central Medium Clinic" },
      {
        name: "description",
        content:
          "Contact Central Medium Clinic. Call 0912-22-49-71 or 0911-48-72-49 — open 24/7.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const mapQuery = encodeURIComponent(
    "Ashawa Meda, Gabriel Church, Kusaye road, Salaam Mosque, Addis Ababa",
  );
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <h1 className="text-4xl text-primary sm:text-5xl">Contact Us</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            We're here around the clock. Reach {CLINIC.name} by phone or visit us in person.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <ScrollReveal delay={60}>
            <GlassCard className="h-full p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-primary">Call Us</h2>
              <ul className="mt-3 space-y-2 text-base">
                {CLINIC.phones.map((p) => (
                  <li key={p}>
                    <a
                      href={telHref(p)}
                      className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary"
                      aria-label={`Call ${p}`}
                    >
                      <Phone className="h-4 w-4 text-primary" /> {p}
                    </a>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <GlassCard className="h-full p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-primary">Operating Hours</h2>
              <p className="mt-3 text-2xl font-semibold text-foreground">{CLINIC.hours}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Emergency, consultations & labs — always open.
              </p>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <GlassCard className="h-full p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-primary">Find Us</h2>
              <p className="mt-3 text-sm text-foreground/80">{CLINIC.address}</p>
            </GlassCard>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={80}>
          <GlassCard className="mt-8 overflow-hidden p-0">
            <div className="aspect-[16/9] w-full">
              {online ? (
                <iframe
                  title="Central Medium Clinic location map"
                  src={mapSrc}
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              ) : (
                <OfflineMap link={mapLink} />
              )}
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}

/** Lightweight vector fallback map — renders with zero network access. */
function OfflineMap({ link }: { link: string }) {
  return (
    <div className="relative h-full w-full bg-[#E6F7F8]">
      <svg viewBox="0 0 800 450" className="h-full w-full" aria-hidden>
        <rect width="800" height="450" fill="#E6F7F8" />
        <g stroke="#B7E4E6" strokeWidth="2">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 45} x2="800" y2={i * 45} />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 45} y1="0" x2={i * 45} y2="450" />
          ))}
        </g>
        <path d="M0 300 C 200 280, 420 240, 800 200" stroke="#8FD8DA" strokeWidth="16" fill="none" />
        <path d="M330 450 L360 0" stroke="#8FD8DA" strokeWidth="12" fill="none" />
        <circle cx="360" cy="255" r="16" fill="#097D86" />
        <circle cx="360" cy="255" r="30" fill="#097D86" opacity="0.18" />
        <text x="392" y="250" fill="#0F252C" fontSize="20" fontWeight="700">
          Central Medium Clinic
        </text>
        <text x="392" y="276" fill="#0F252C" fontSize="16" opacity="0.7">
          Ashawa Meda · next to Salaam Mosque
        </text>
        <circle cx="180" cy="150" r="8" fill="#0ED5C0" />
        <text x="196" y="156" fill="#0F252C" fontSize="14" opacity="0.7">Gabriel Church</text>
        <circle cx="640" cy="360" r="8" fill="#0ED5C0" />
        <text x="656" y="366" fill="#0F252C" fontSize="14" opacity="0.7">Road to Kusaye</text>
      </svg>
      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow">
        <WifiOff className="h-3.5 w-3.5" /> Offline map
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary shadow"
      >
        Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
