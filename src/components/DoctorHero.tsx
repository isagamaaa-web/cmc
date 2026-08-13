import { useEffect, useRef, useState } from "react";
import doctorImg from "@/assets/doctor-waving.png";
import { DoctorFallback } from "@/components/DoctorFallback";

export function DoctorHero() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nearCursor, setNearCursor] = useState(false);
  const [srcAttempt, setSrcAttempt] = useState(0);
  const [failed, setFailed] = useState(false);


  useEffect(() => {
    let raf = 0;
    let tx = 0, ty = 0, rx = 0, ry = 0;
    let ttx = 0, tty = 0, trx = 0, tryv = 0;
    const PROXIMITY = 320; // px

    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const inRange = dist < PROXIMITY;
      setNearCursor(inRange);
      if (inRange) {
        const nx = dx / PROXIMITY;
        const ny = dy / PROXIMITY;
        ttx = nx * 18;
        tty = ny * 14;
        trx = -ny * 10;
        tryv = nx * 14;
      } else {
        ttx = 0; tty = 0; trx = 0; tryv = 0;
      }
    };

    const tick = () => {
      tx += (ttx - tx) * 0.1;
      ty += (tty - ty) * 0.1;
      rx += (trx - rx) * 0.1;
      ry += (tryv - ry) * 0.1;
      if (imgRef.current) {
        imgRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
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

      <div
        className="relative doctor-float"
        style={{
          transformStyle: "preserve-3d",
          animation: nearCursor ? "wave-hand 1.2s ease-in-out infinite" : undefined,
        }}
      >
        {failed ? (
          <DoctorFallback />
        ) : (
          <img
            ref={imgRef}
            key={srcAttempt}
            src={srcAttempt === 0 ? doctorImg : `${doctorImg}?retry=1`}
            alt="Dr. Gebeyehu waving hello — Internal Medicine Specialist at Central Medium Clinic"
            width={1024}
            height={1024}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => {
              // Retry once with a cache-busting query (handles stale/blocked caches),
              // then fall back to a lightweight inline illustration.
              setSrcAttempt((n) => (n === 0 ? 1 : n));
              if (srcAttempt !== 0) setFailed(true);
            }}
            className="doctor-depth relative max-h-[560px] w-auto"
            style={{ transition: "transform 0.05s linear", transformStyle: "preserve-3d" }}
          />
        )}

      </div>

      <span
        className="pointer-events-none absolute -top-4 left-6 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-lg backdrop-blur"
      >
        👋 Welcome!
      </span>
    </div>
  );
}
