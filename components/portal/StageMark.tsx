import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { TOTAL_STAGES, stagePhase, stagePosition } from '@/lib/portal/project';
import type { PortalProject } from '@/lib/portal/types';
import { usePortal } from './usePortal';

/**
 * A project's stage, always in words — "2 de 5 · Construcción", "2 de 5 · En pausa",
 * "Soporte" — next to its eclipse phase (the glyph is decorative; the text carries it).
 * `stack` shows the position as a small mono line over the name (tables, cards); the
 * text stays the same for assistive tech.
 */
export function StageMark({
  project,
  size = 18,
  layout = 'inline',
  meaning = false,
  className = '',
}: {
  project: PortalProject;
  size?: number;
  layout?: 'inline' | 'stack';
  /** Adds what the stage means ("Ejecución del alcance") as a muted line. */
  meaning?: boolean;
  className?: string;
}) {
  const { t, stage } = usePortal();
  const position = stagePosition(project);
  const label =
    position && (project.stage !== 'support' && project.stage !== 'closed')
      ? t('stage.position', { n: position, total: TOTAL_STAGES })
      : layout === 'stack' && project.stage === 'support'
        ? t('stage.afterDelivery')
        : null;
  return (
    <span className={`pt-stage ${className}`} data-stage={project.stage} data-layout={layout}>
      <PhaseGlyph phase={stagePhase(project)} size={size} className="pt-stage-glyph" />
      <span className="pt-stage-text">
        {label ? (
          <>
            <span className="pt-stage-pos">{label}</span>
            <span className="pt-stage-sep"> · </span>
          </>
        ) : null}
        <span className="pt-stage-name">{stage(project.stage)}</span>
        {meaning ? (
          <>
            <span className="pt-stage-sep"> · </span>
            <span className="pt-stage-meaning">{t(`stages.${project.stage}.short`)}</span>
          </>
        ) : null}
      </span>
    </span>
  );
}
