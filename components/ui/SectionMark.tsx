import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { DrawLine } from '@/components/motion/DrawLine';
import { PhaseGlyph } from './PhaseGlyph';
import { sectionIndexLabel, sectionPhase, type SectionKey } from './sectionIndex';
import './section-mark.css';

/**
 * The section's place in the page index (v2 "Efemérides"):
 *
 *   04 ──── ◑ DEMOS
 *
 * mono index · a hairline that draws in · the eclipse phase of the section
 * (totality at 01 → full sun at 08) · a short, plain label (`sections.labels.<key>`).
 * Works in server and client components. Use it where the eyebrow used to be:
 *
 *   <SectionMark section="pricing" />
 *   <SectionMark section="hero" label={t('eyebrow')} />   // custom label
 *
 * The number is decorative (aria-hidden); assistive tech reads the label.
 */
export function SectionMark({
  section,
  label,
  className = '',
  as: Tag = 'p',
}: {
  section: SectionKey;
  /** Overrides `sections.labels.<section>`. */
  label?: ReactNode;
  className?: string;
  as?: 'p' | 'div' | 'span';
}) {
  const t = useTranslations('sections.labels');
  return (
    <Tag data-section-mark={section} className={`section-mark ${className}`}>
      <span aria-hidden className="section-mark-index">
        {sectionIndexLabel(section)}
      </span>
      <DrawLine className="section-mark-rule" />
      <PhaseGlyph phase={sectionPhase(section)} size={15} className="section-mark-glyph" />
      <span className="section-mark-label">{label ?? t(section)}</span>
    </Tag>
  );
}
