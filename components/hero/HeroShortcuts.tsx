import { useTranslations } from 'next-intl';
import { ArrowDown, Plus } from 'lucide-react';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { sectionIndexLabel, type SectionKey } from '@/components/ui/sectionIndex';

/** The sections a first visit looks for, in page order. */
const TARGETS = ['examples', 'services', 'pricing'] as const satisfies readonly SectionKey[];

/**
 * The row that closes the hero (v3, replaces the "scroll" hint): Demos · Soluciones ·
 * Precios as real in-page links (they work without JS; <SmoothAnchors> smooths them and
 * moves focus) and "Armar plan", which opens the builder. Each target keeps its index
 * number from the page (`sectionIndexLabel`) and its own section label
 * (`sections.labels.*`), so the row always matches the marks it leads to.
 * Server component; only the builder button hydrates.
 */
export function HeroShortcuts() {
  const t = useTranslations('shortcuts');
  const labels = useTranslations('sections.labels');

  return (
    <nav aria-label={t('label')} className="hero-shortcuts">
      <ul className="hero-shortcuts-list">
        {TARGETS.map((key) => (
          <li key={key} data-hero-enter>
            <a href={`#${SECTION_IDS[key]}`} className="hero-shortcut">
              <span aria-hidden className="hero-shortcut-index">
                {sectionIndexLabel(key)}
              </span>
              <span className="hero-shortcut-name">{labels(key)}</span>
              <ArrowDown aria-hidden className="hero-shortcut-icon" strokeWidth={1.5} />
            </a>
          </li>
        ))}
        <li data-hero-enter>
          <BuildPlanButton source="hero_shortcut" className="hero-shortcut">
            <Plus aria-hidden className="hero-shortcut-icon hero-shortcut-icon--plan" strokeWidth={1.5} />
            <span className="hero-shortcut-name">{t('plan')}</span>
          </BuildPlanButton>
        </li>
      </ul>
    </nav>
  );
}
