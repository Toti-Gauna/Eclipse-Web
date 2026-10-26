'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowUpRight, ChevronDown } from 'lucide-react';
import { itemById, l, lines, verticals, type Line } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { useSound } from '@/components/sound/SoundContext';
import { Occult } from '@/components/motion/Occult';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { requestPiecesTab } from '@/components/pricing/tabRequest';
import { openDemoExperience, openerKey, preloadDemoExperience } from '@/components/demo-experience/store';
import { ServicePreview } from './ServicePreview';
import type { FamilyId } from './services';
import './lines.css';

/**
 * Which family sketch (ServicePreview, existing and decorative) stands for a line. Academy and
 * Equipamiento have no product to sketch: their stage is typographic, never an invented image.
 */
const SKETCH: Partial<Record<Line['id'], FamilyId>> = { saas: 'ops', agency: 'ai', studio: 'web' };

/**
 * «Qué ofrecemos» (#servicios): the five lines as an index. One line is open at a time and
 * ALWAYS one (the first by default, also in the server HTML, so nothing grows on hydration):
 * phones get an accordion, desktop gets the same list plus a sticky stage with a static sketch.
 * No numbering (the lines are not a sequence). No prices here: pieces are priced in Precios.
 * A line either has pieces in the catalog (`availability: 'catalog'`) or is quoted ('quote');
 * the panel says which, and never invents a demo or an image the line does not have.
 */
export function LinesIndex() {
  const t = useTranslations('offerings');
  const locale = useLocale() as Locale;
  const { play } = useSound();
  const uid = useId();
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const total = lines.length;
  const current = lines[active];

  const select = (index: number) => {
    if (index === active) return;
    setActive(index);
    setTouched(true);
    play('select');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = total - 1;
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    buttons.current[Math.min(last, Math.max(0, to))]?.focus();
  };

  return (
    <div className="off-index" data-touched={touched || undefined}>
      <ol className="off-list" aria-label={t('listLabel')}>
        {lines.map((line, index) => {
          const open = index === active;
          const name = t(`lines.${line.id}.name`);
          const headId = `${uid}-${line.id}-head`;
          const panelId = `${uid}-${line.id}-panel`;
          return (
            <li key={line.id} className="off-row" data-open={open || undefined}>
              <h3 className="off-head">
                <button
                  ref={(el) => {
                    buttons.current[index] = el;
                  }}
                  id={headId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => select(index)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className="off-head-btn"
                >
                  <PhaseGlyph phase={open ? 1 : 0.14} size={22} className="off-glyph" />
                  <span className="off-name">{name}</span>
                  <span className="off-line">{t(`lines.${line.id}.line`)}</span>
                  <ChevronDown aria-hidden strokeWidth={1.5} className="off-chevron" />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={headId} hidden={!open} className="off-panel">
                <p className="off-detail">{t(`lines.${line.id}.detail`)}</p>
                <p className="off-avail" data-availability={line.availability}>
                  {t(`availability.${line.availability}`)}
                </p>
                {line.examples.length ? (
                  <div className="off-examples">
                    <p className="off-examples-title">{t('examples')}</p>
                    <ul>
                      {line.examples.map((id) => (
                        <li key={id}>{l(itemById(id)?.name, locale)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <LineActions line={line} name={name} />
              </div>
            </li>
          );
        })}
      </ol>

      <div aria-hidden className="svc-stage off-stage">
        <div className="svc-stage-frame ticks">
          <div className="svc-stage-inner">
            <p className="svc-stage-top">
              <span className="svc-stage-count">
                {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              <span className="svc-stage-name">{t(`lines.${current.id}.name`)}</span>
              <span className="svc-stage-tag">{t('stageTag')}</span>
            </p>
            <Occult key={current.id} on="mount" shape="circle" at="88% 12%" duration={0.7} className="svc-stage-screen off-stage-screen">
              {SKETCH[current.id] ? (
                <ServicePreview family={SKETCH[current.id]!} />
              ) : (
                <div className="off-stage-type">
                  <PhaseGlyph phase={1} size={88} className="off-stage-glyph" />
                  <p className="off-stage-name display">{t(`lines.${current.id}.name`)}</p>
                  <p className="off-stage-avail">{t(`availability.${current.availability}`)}</p>
                </div>
              )}
            </Occult>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The panel's actions: a demo if the line has one, its pieces and prices, or a question by WhatsApp. */
function LineActions({ line, name }: { line: Line; name: string }) {
  const t = useTranslations('offerings');
  const locale = useLocale() as Locale;
  const { play } = useSound();
  const demoVertical = line.demo ? verticals.find((v) => v.demo === line.demo) : undefined;

  return (
    <div className="off-actions">
      {line.demo && demoVertical?.demo ? (
        <button
          type="button"
          aria-haspopup="dialog"
          data-demo-opener={openerKey('offerings', demoVertical.demo)}
          onPointerEnter={() => demoVertical.demo && preloadDemoExperience(demoVertical.demo, locale)}
          onFocus={() => demoVertical.demo && preloadDemoExperience(demoVertical.demo, locale)}
          onClick={(e) => {
            if (!demoVertical.demo) return;
            play('open');
            openDemoExperience({ vertical: demoVertical.id, demo: demoVertical.demo, origin: 'offerings' }, e.currentTarget);
          }}
          className="off-action"
        >
          {t('demoLink', { rubro: l(demoVertical.name, locale) })}
          <ArrowUpRight aria-hidden strokeWidth={1.5} />
        </button>
      ) : null}
      {line.availability === 'catalog' ? (
        <a href="#pr-tab-pieces" onClick={requestPiecesTab} className="off-action">
          {t('priceLink')}
          <ArrowDown aria-hidden strokeWidth={1.5} />
        </a>
      ) : null}
      <WhatsAppLink origin="offerings" message={t('ask', { line: name })} extra={{ line: line.id }} className="off-action">
        {t('askLink')}
        <ArrowUpRight aria-hidden strokeWidth={1.5} />
      </WhatsAppLink>
    </div>
  );
}

