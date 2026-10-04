import { DrawLine } from '@/components/motion/DrawLine';
import './sky-transition.css';

/**
 * Background blend between two sections (a static gradient: scrolling through it
 * reads as the sky changing, never a hard cut). v3 page: void → night after the
 * hero; night → dawn (the sunrise) between Soluciones and Precios. The sunrise
 * crosses a ruled horizon — the instrument's scale, drawn once as it comes into
 * view — with the first light behind it.
 */
export function SkyTransition({ from, to, className = '' }: { from: 'void' | 'night'; to: 'night' | 'dawn'; className?: string }) {
  if (to === 'dawn') {
    return (
      <div aria-hidden className={`sky-sunrise ${className}`}>
        {/* Already bright: the page index (EphemerisRail) switches to its light theme here. */}
        <div data-rail-theme="light" className="sky-sunrise-bright" />
        <div className="sky-sunrise-light" />
        <div className="sky-sunrise-horizon">
          <DrawLine origin="center" duration={1.4} className="sky-sunrise-line" />
          <span className="sky-sunrise-ruler" />
        </div>
      </div>
    );
  }
  return <div aria-hidden className={`sky-fade ${from === 'void' ? 'sky-fade--void' : ''} ${className}`} />;
}
