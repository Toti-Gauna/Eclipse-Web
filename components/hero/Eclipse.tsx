import type { CSSProperties, ReactNode } from 'react';
import './hero.css';

/**
 * The eclipse, built from CSS layers (works everywhere, no JS).
 * Children render inside the square (e.g. the WebGL corona canvas, diamond ring).
 * The moon is wrapped twice so scroll and interaction can move it independently:
 *   [data-eclipse-moon-scroll] → scroll-driven offset
 *   [data-eclipse-moon]        → interaction offset (vertical selected)
 */
export function Eclipse({
  size,
  className = '',
  children,
  phase = 'total',
}: {
  size?: string;
  className?: string;
  children?: ReactNode;
  /** 'total' = moon covers the sun; 'sun' = moon gone (resolved eclipse, final CTA). */
  phase?: 'total' | 'sun';
}) {
  return (
    <div className={`eclipse ${className}`} style={size ? ({ '--eclipse-size': size } as CSSProperties) : undefined} data-eclipse>
      <div className="eclipse-layer eclipse-glow" data-eclipse-glow />
      <div className="eclipse-layer eclipse-corona" data-eclipse-corona />
      <div className="eclipse-layer eclipse-inner" data-eclipse-inner />
      <div className="eclipse-layer eclipse-sun" data-eclipse-sun />
      {children}
      {phase === 'total' ? (
        <div className="eclipse-layer" data-eclipse-moon-scroll style={{ inset: 0 }}>
          <div className="eclipse-layer eclipse-moon" data-eclipse-moon />
        </div>
      ) : null}
    </div>
  );
}
