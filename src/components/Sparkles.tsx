import { useMemo } from "react";

/** Deterministic PRNG so SSR and client markup match exactly (no hydration mismatch). */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function Sparkles({ count = 24 }: { count?: number }) {
  const dots = useMemo(() => {
    const rand = seeded(20260718);
    return Array.from({ length: count }).map((_, i) => {
      const size = 4 + rand() * 10;
      return {
        key: i,
        left: `${(rand() * 100).toFixed(3)}%`,
        top: `${(rand() * 100).toFixed(3)}%`,
        size: Number(size.toFixed(3)),
        delay: `${(rand() * 6).toFixed(3)}s`,
        duration: `${(5 + rand() * 6).toFixed(3)}s`,
      };
    });
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.key}
          className="sparkle"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
            animationDuration: d.duration,
          }}
        />
      ))}
    </div>
  );
}
