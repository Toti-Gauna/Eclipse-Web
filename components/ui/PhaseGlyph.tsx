/**
 * The brand's icon system (v2 art direction): an eclipse at a given phase.
 *
 *   phase 0   → the sun alone (the moon is just touching it from the right)
 *   phase 0.5 → half covered
 *   phase 1   → totality: corona ring + diamond-ring glint
 *
 * Pure geometry (no ids, no hooks), so it renders anywhere, server or client, any number
 * of times. Colors follow `currentColor`; the faint orbit shows the covered part.
 * Decorative by default; pass `title` when the phase itself carries meaning.
 */
export function PhaseGlyph({
  phase,
  size = 24,
  className,
  title,
  strokeWidth = 1,
}: {
  phase: number;
  size?: number | string;
  className?: string;
  title?: string;
  strokeWidth?: number;
}) {
  const p = Math.min(1, Math.max(0, Number.isFinite(phase) ? phase : 0));
  const c = 12;
  const r = 8;
  const d = (1 - p) * 2 * r; // distance between the sun and moon centers
  const total = p > 0.985;

  let lit: string | null = null;
  if (d >= 2 * r - 0.01) {
    lit = `M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  } else if (!total) {
    // Visible sun = sun minus moon (same radius): two arcs between the intersection points.
    const x = c + d / 2;
    const h = Math.sqrt(r * r - (d / 2) ** 2);
    const f = (n: number) => n.toFixed(3);
    lit = `M ${f(x)} ${f(c - h)} A ${r} ${r} 0 1 0 ${f(x)} ${f(c + h)} A ${r} ${r} 0 0 1 ${f(x)} ${f(c - h)} Z`;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={strokeWidth} />
      {lit && <path d={lit} fill="currentColor" />}
      {total && (
        <>
          <circle cx={c} cy={c} r={r + 2} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={strokeWidth} />
          <circle cx={c + (r + 1) * 0.7071} cy={c - (r + 1) * 0.7071} r={1.6} fill="currentColor" />
        </>
      )}
    </svg>
  );
}
