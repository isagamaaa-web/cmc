/**
 * Global decorative backdrop rendered on every page (except admin).
 * Pure CSS/SVG — no network cost. Subtler than the hero backdrop so
 * content stays readable on long pages.
 */
export function PageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Soft light base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 78% 6%, #FFFFFF 0%, #F4FDFE 35%, #E7FAFB 65%, #DCF6F8 100%)",
        }}
      />

      {/* Compass rings */}
      <svg
        className="absolute right-[-10%] top-[-12%] h-[820px] w-[820px] opacity-[0.09]"
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
        </g>
      </svg>

      <DotGrid className="absolute bottom-[10%] left-[2%] opacity-[0.10]" cols={5} rows={8} />
      <DotGrid className="absolute right-[4%] top-[18%] opacity-[0.08]" cols={5} rows={7} />

      {/* Watermark typography */}
      <span
        className="absolute left-[1%] top-[8%] select-none whitespace-nowrap text-[110px] leading-none md:text-[160px]"
        style={{
          fontFamily: '"Dancing Script", cursive',
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(20,184,166,0.09)",
          transform: "rotate(-12deg)",
        }}
      >
        Health
      </span>
      <span
        className="absolute bottom-[5%] right-[2%] select-none whitespace-nowrap text-[110px] font-black leading-none tracking-tight md:text-[190px]"
        style={{ color: "transparent", WebkitTextStroke: "2px rgba(20,184,166,0.10)" }}
      >
        CARE
      </span>

      {/* Drifting glow orbs */}
      <div
        className="absolute left-[-8%] top-[35%] h-[420px] w-[420px] rounded-full opacity-70 bg-drift-slow"
        style={{
          background:
            "radial-gradient(circle, rgba(14,213,192,0.22) 0%, rgba(14,213,192,0) 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[10%] h-[460px] w-[460px] rounded-full opacity-70 bg-drift-slow"
        style={{
          background: "radial-gradient(circle, rgba(9,125,134,0.18) 0%, rgba(9,125,134,0) 70%)",
          filter: "blur(36px)",
        }}
      />

      {/* Floating medical marks */}
      <Cross className="absolute bottom-[14%] left-[6%]" size={104} rotate={-15} blur={5} />
      <Cross className="absolute right-[6%] top-[8%]" size={64} rotate={12} blur={3} />
      <Capsule className="absolute left-[40%] top-[3%]" rotate={18} blur={5} scale={0.85} />
      <Capsule className="absolute right-[3%] top-[58%]" rotate={-35} blur={4} scale={0.75} />
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
      style={{ transform: `rotate(${rotate}deg) scale(${scale})`, filter: `blur(${blur}px)`, opacity: 0.45 }}
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
      style={{ transform: `rotate(${rotate}deg)`, filter: `blur(${blur}px)`, opacity: 0.5 }}
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
