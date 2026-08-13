/**
 * Decorative hero backdrop — pure CSS/SVG, zero network cost.
 * Concentric compass rings, dot-grid matrices, watermark typography,
 * blurred depth-of-field 3D-style capsules & crosses, and a halo glow.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Base radial cyan gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 640px at 72% 18%, #E0F9F8 0%, #D7F7F6 38%, #BFF1EE 62%, #A8ECE7 100%)",
        }}
      />

      {/* Central halo behind the doctor */}
      <div
        className="absolute right-[6%] top-[6%] h-[520px] w-[520px] rounded-full opacity-80 md:right-[12%]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 72%)",
          filter: "blur(60px)",
        }}
      />

      {/* Compass rings + axes */}
      <svg
        className="absolute right-[-6%] top-[-8%] h-[900px] w-[900px] opacity-[0.14]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <g stroke="#158079" strokeWidth="1">
          <circle cx="400" cy="380" r="160" />
          <circle cx="400" cy="380" r="250" />
          <circle cx="400" cy="380" r="360" />
          <line x1="0" y1="380" x2="800" y2="380" />
          <line x1="400" y1="0" x2="400" y2="800" />
          <path d="M60 700 C 260 520, 540 240, 760 60" />
          <path d="M40 120 C 260 300, 520 480, 780 660" />
        </g>
      </svg>

      {/* Dot grid — lower left */}
      <DotGrid className="absolute bottom-[12%] left-[3%] opacity-[0.15]" cols={5} rows={8} />
      {/* Dot grid — top right */}
      <DotGrid className="absolute right-[6%] top-[6%] opacity-[0.12]" cols={6} rows={8} />

      {/* "Health" script watermark — top left */}
      <span
        className="absolute left-[2%] top-[6%] select-none whitespace-nowrap text-[110px] leading-none md:text-[170px]"
        style={{
          fontFamily: '"Dancing Script", "Great Vibes", cursive',
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(20,184,166,0.11)",
          transform: "rotate(-12deg)",
        }}
      >
        Health
      </span>

      {/* "Health" faint repeat — bottom left */}
      <span
        className="absolute bottom-[2%] left-[-2%] select-none whitespace-nowrap text-[90px] leading-none md:text-[140px]"
        style={{
          fontFamily: '"Dancing Script", "Great Vibes", cursive',
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(20,184,166,0.06)",
          transform: "rotate(-8deg)",
        }}
      >
        Health
      </span>

      {/* "CARE" outline watermark — bottom right */}
      <span
        className="absolute bottom-[4%] right-[3%] select-none whitespace-nowrap text-[120px] font-black leading-none tracking-tight md:text-[220px]"
        style={{
          color: "transparent",
          WebkitTextStroke: "2px rgba(20,184,166,0.15)",
        }}
      >
        CARE
      </span>
      <Sparkle4 className="absolute bottom-[18%] right-[8%] h-10 w-10 opacity-40" />

      {/* Blurred capsules */}
      <Capsule className="absolute left-[6%] top-[14%]" rotate={-45} blur={4} scale={1} />
      <Capsule className="absolute left-[44%] top-[4%]" rotate={15} blur={5} scale={0.8} />
      <Capsule className="absolute right-[4%] top-[36%]" rotate={30} blur={4} scale={0.9} />

      {/* 3D-ish crosses */}
      <Cross className="absolute bottom-[10%] left-[5%]" size={120} rotate={-15} blur={6} />
      <Cross className="absolute right-[2%] top-[10%]" size={78} rotate={12} blur={3} />
      <Cross className="absolute bottom-[26%] right-[10%]" size={54} rotate={-20} blur={2} />

      {/* Crisp stethoscope + heart pill */}
      <Stethoscope className="absolute right-[16%] top-[14%] h-24 w-24 opacity-90 float-slow" />
      <HeartPill className="absolute right-[24%] top-[52%] h-16 w-16" />

      {/* Wave divider into the next section */}
      <svg
        className="absolute bottom-[-1px] left-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: 90 }}
      >
        <path
          d="M0,64 C240,120 480,20 720,48 C960,76 1200,120 1440,72 L1440,120 L0,120 Z"
          fill="#BDF5FF"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

function DotGrid({ className, cols, rows }: { className?: string; cols: number; rows: number }) {
  const gap = 16;
  return (
    <svg
      className={className}
      width={cols * gap}
      height={rows * gap}
      viewBox={`0 0 ${cols * gap} ${rows * gap}`}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * gap + 4} cy={r * gap + 4} r="2" fill="#0E7490" />
        )),
      )}
    </svg>
  );
}

function Capsule({
  className,
  rotate,
  blur,
  scale = 1,
}: {
  className?: string;
  rotate: number;
  blur: number;
  scale?: number;
}) {
  return (
    <div
      className={className}
      style={{
        transform: `rotate(${rotate}deg) scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity: 0.6,
      }}
    >
      <div className="flex h-9 w-24 overflow-hidden rounded-full shadow-lg">
        <div className="h-full w-1/2" style={{ background: "linear-gradient(135deg,#3FC7BE,#0E9E97)" }} />
        <div className="h-full w-1/2" style={{ background: "linear-gradient(135deg,#FFFFFF,#E4F7F6)" }} />
      </div>
    </div>
  );
}

function Cross({
  className,
  size,
  rotate,
  blur,
}: {
  className?: string;
  size: number;
  rotate: number;
  blur: number;
}) {
  const bar = size * 0.34;
  return (
    <div
      className={className}
      style={{ transform: `rotate(${rotate}deg)`, filter: `blur(${blur}px)`, opacity: 0.75 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute rounded-[14px]"
          style={{
            left: (size - bar) / 2,
            top: 0,
            width: bar,
            height: size,
            background: "linear-gradient(160deg,#5FD8CE,#0E8F8A)",
          }}
        />
        <div
          className="absolute rounded-[14px]"
          style={{
            top: (size - bar) / 2,
            left: 0,
            height: bar,
            width: size,
            background: "linear-gradient(160deg,#4FD1C7,#0C807C)",
          }}
        />
      </div>
    </div>
  );
}

function Stethoscope({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <path
        d="M18 8v14a12 12 0 0 0 24 0V8"
        stroke="#12A79E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M30 34v8a10 10 0 0 0 20 0v-4" stroke="#12A79E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="26" r="6" fill="#2CC3B8" />
      <circle cx="16" cy="8" r="4" fill="#0E8F8A" />
      <circle cx="44" cy="8" r="4" fill="#0E8F8A" />
    </svg>
  );
}

function HeartPill({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      style={{ filter: "blur(1.5px)", transform: "rotate(25deg)" }}
    >
      <path
        d="M24 42S6 30 6 18a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 12-18 24-18 24Z"
        fill="url(#hp)"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="hp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7FE9E0" />
          <stop offset="100%" stopColor="#0FA79E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Sparkle4({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2L12 0Z" fill="#7FE9E0" />
    </svg>
  );
}
