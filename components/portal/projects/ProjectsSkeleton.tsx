import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { usePortal } from '../usePortal';

const LEDGER = [
  ['40%', '82%', '58%'],
  ['34%', '70%', '88%'],
  ['30%', '46%', '76%'],
];
const ROWS = [
  ['42%', '66%'],
  ['36%', '72%'],
  ['48%', '60%'],
  ['40%', '68%'],
];

/**
 * Preview of the loading state, shaped like the real screen (overview ledger + project
 * rows). Static bars, no shimmer loop; only shown from the demo switch, never claimed
 * as a request to a server.
 */
export function ProjectsSkeleton() {
  const { t } = usePortal();
  return (
    <div className="pt-skel" aria-busy="true">
      <p className="pt-skel-note pt-fine">
        <PhaseGlyph phase={0.5} size={16} />
        {t('projects.loading')}
      </p>
      <div aria-hidden className="pt-overview pt-skel-ledger">
        {LEDGER.map((widths, i) => (
          <div key={i}>
            {widths.map((width, j) => (
              <span key={j} className="pt-skel-bar" style={{ width }} />
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden className="pt-skel-rows">
        {ROWS.map((widths, i) => (
          <div key={i} className="pt-skel-row">
            <span className="pt-skel-dot" />
            {widths.map((width, j) => (
              <span key={j} className="pt-skel-bar" style={{ width }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
