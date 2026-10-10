'use client';

import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import type { ApiProjectSummary } from '@/lib/api/types';
import { TOTAL_STAGES, displayStage, phase, position } from '@/lib/portal/live-model';
import { useLive } from './hooks';

/** The stage in words ("2 de 5 · Construcción", "Soporte", "En pausa") next to its eclipse phase. */
export function LiveStageMark({
  project,
  size = 18,
  layout = 'inline',
  meaning = false,
}: {
  project: Pick<ApiProjectSummary, 'stage' | 'status'>;
  size?: number;
  layout?: 'inline' | 'stack';
  meaning?: boolean;
}) {
  const { tp } = useLive();
  const shown = displayStage(project);
  const n = position(project);
  const main = shown !== 'support' && shown !== 'closed';
  const label = main ? tp('stage.position', { n, total: TOTAL_STAGES }) : layout === 'stack' && shown === 'support' ? tp('stage.afterDelivery') : null;
  return (
    <span className="pt-stage" data-stage={shown} data-layout={layout}>
      <PhaseGlyph phase={phase(project)} size={size} className="pt-stage-glyph" />
      <span className="pt-stage-text">
        {label ? (
          <>
            <span className="pt-stage-pos">{label}</span>
            <span className="pt-stage-sep"> · </span>
          </>
        ) : null}
        <span className="pt-stage-name">{tp(`stages.${shown}.name`)}</span>
        {meaning ? (
          <>
            <span className="pt-stage-sep"> · </span>
            <span className="pt-stage-meaning">{tp(`stages.${shown}.short`)}</span>
          </>
        ) : null}
      </span>
    </span>
  );
}
