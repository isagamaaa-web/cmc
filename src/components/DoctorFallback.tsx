/**
 * Lightweight, dependency-free illustration shown when the doctor photo
 * cannot load (offline, blocked cache, or slow/failed network).
 * Pure inline SVG: renders instantly with zero extra requests.
 */
export function DoctorFallback() {
  return (
    <svg
      viewBox="0 0 400 520"
      role="img"
      aria-label="Illustration of Dr. Gebeyehu, Internal Medicine Specialist"
      className="relative max-h-[560px] w-auto drop-shadow-2xl"
      style={{ height: "min(560px, 60vh)" }}
    >
      <defs>
        <linearGradient id="cmc-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dff3f8" />
        </linearGradient>
        <linearGradient id="cmc-halo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0e7490" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="250" rx="165" ry="205" fill="url(#cmc-halo)" />
      {/* head */}
      <circle cx="200" cy="140" r="62" fill="#8d5524" />
      <path d="M138 132c6-42 40-62 62-62s56 20 62 62c-18-18-40-26-62-26s-44 8-62 26z" fill="#3b2314" />
      {/* body / coat */}
      <path
        d="M108 470c0-96 34-152 92-166 58 14 92 70 92 166z"
        fill="url(#cmc-coat)"
        stroke="#c7e7ef"
        strokeWidth="3"
      />
      <path d="M200 304l30 26-30 140-30-140z" fill="#e2f4f9" />
      {/* scrubs collar */}
      <path d="M170 306l30 26 30-26-30-18z" fill="#0e7490" />
      {/* stethoscope */}
      <path
        d="M172 312c-6 54 12 84 28 84s34-30 28-84"
        fill="none"
        stroke="#0f172a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="228" cy="400" r="12" fill="#0f172a" />
      {/* waving arm */}
      <path
        d="M292 330c26-34 38-70 34-96"
        fill="none"
        stroke="url(#cmc-coat)"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <circle cx="324" cy="222" r="24" fill="#8d5524" />
    </svg>
  );
}
