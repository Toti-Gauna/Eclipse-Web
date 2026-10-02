/**
 * Deterministic star field (seeded PRNG → identical SSR and client markup).
 * Three depth layers; [data-star-layer] lets the hero move them for parallax.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAYERS = [
  { count: 70, r: [0.35, 0.7], o: [0.25, 0.55], depth: 0.2, seed: 11 },
  { count: 38, r: [0.6, 1.05], o: [0.35, 0.75], depth: 0.5, seed: 23 },
  { count: 14, r: [0.9, 1.5], o: [0.55, 0.95], depth: 1, seed: 37 },
] as const;

const round = (n: number) => Math.round(n * 100) / 100;

const STARS = LAYERS.map((layer) => {
  const rand = mulberry32(layer.seed);
  return Array.from({ length: layer.count }, (_, i) => ({
    x: round(rand() * 100),
    y: round(rand() * 100),
    r: round(layer.r[0] + rand() * (layer.r[1] - layer.r[0])),
    o: round(layer.o[0] + rand() * (layer.o[1] - layer.o[0])),
    twinkle: i % 5 === 0,
    delay: round(rand() * 4),
  }));
});

export function Starfield({ className = '' }: { className?: string }) {
  return (
    <div className={`starfield ${className}`} aria-hidden>
      {STARS.map((stars, li) => (
        <svg key={li} data-star-layer={LAYERS[li].depth} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r / 10}
              fill={li === 2 && i % 3 === 0 ? '#FFE8B0' : '#F4EFE6'}
              opacity={s.o}
              className={s.twinkle ? 'twinkle' : undefined}
              style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
