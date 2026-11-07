import { useEffect, useRef } from "react";
import doctorImg from "@/assets/doctor-waving.png";
import { useLanguage } from "@/context/LanguageContext";

export function DoctorHero() {
  const { t } = useLanguage();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      {/* soft gradient mesh blob for realistic lighting depth */}
      <div
        className="absolute inset-6 rounded-[45%] bg-gradient-to-br from-primary/30 via-accent/40 to-cyan-200/50 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-white/60 blur-3xl"
        aria-hidden
      />

      {/* floating background accent shapes (behind the doctor layer) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span
          className="absolute left-2 top-10 grid h-12 w-12 place-items-center rounded-2xl bg-white/50 text-2xl font-bold text-primary/70 shadow-lg backdrop-blur-sm"
          style={{ animation: "accent-float 6s ease-in-out infinite" }}
        >
          +
        </span>
        <span
          className="absolute right-4 top-1/3 h-8 w-20 rounded-full bg-primary/15 shadow-lg backdrop-blur-sm"
          style={{ animation: "accent-float 7.5s ease-in-out 0.8s infinite" }}
        />
        <span
          className="absolute bottom-16 left-6 h-6 w-16 rounded-full bg-accent/30 shadow-lg backdrop-blur-sm"
          style={{ animation: "accent-float 8.5s ease-in-out 1.6s infinite" }}
        />
        <span
          className="absolute bottom-8 right-10 grid h-10 w-10 place-items-center rounded-xl bg-white/50 text-xl font-bold text-primary/60 shadow-lg backdrop-blur-sm"
          style={{ animation: "accent-float 6.8s ease-in-out 2.2s infinite" }}
        >
          +
        </span>
      </div>

      <div className="relative doctor-float">
        <img
          ref={imgRef}
          key={1}
          src={doctorImg}
          alt="Dr. Gebeyehu waving hello — Internal Medicine Specialist at Central Medium Clinic"
          width={1024}
          height={1024}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="doctor-depth relative max-h-[560px] w-auto"
          style={{ transition: "transform 0.05s linear", transformStyle: "preserve-3d" }}
        />
      </div>

      <span className="pointer-events-none absolute -top-4 left-6 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-lg backdrop-blur">
        👋 {t("welcomeBanner")}
      </span>
    </div>
  );
}
