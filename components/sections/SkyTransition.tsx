/**
 * Scroll-driven background blend between two sections. The gradient is tall, so
 * scrolling through it reads as the sky slowly changing (never a hard cut).
 */
export function SkyTransition({ from, to, className = '' }: { from: 'void' | 'night'; to: 'night' | 'dawn'; className?: string }) {
  if (to === 'dawn') {
    return (
      <div aria-hidden className={`sky-sunrise relative h-[55vh] min-h-72 ${className}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--night)_0%,#1d1720_32%,#6b4a2a_58%,#d9b98a_80%,var(--dawn)_100%)]" />
        <div className="absolute inset-x-0 bottom-[18%] mx-auto h-40 w-[min(900px,90vw)] rounded-[50%] bg-[radial-gradient(closest-side,rgb(255_232_176/0.55),transparent)] blur-2xl" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`h-[30vh] min-h-48 ${className} ${
        from === 'void' ? 'bg-[linear-gradient(180deg,var(--void),var(--night))]' : 'bg-night'
      }`}
    />
  );
}
