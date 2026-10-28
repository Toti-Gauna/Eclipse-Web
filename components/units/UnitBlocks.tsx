import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { DrawLine } from '@/components/motion/DrawLine';
import { Reveal } from '@/components/motion/Reveal';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { NAV_LINKS, type UnitId } from '@/components/layout/navLinks';
import { UnitEmblem } from './UnitEmblem';
import '@/components/sections/products/products.css';
import './units.css';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The top of a unit's page (Media, Academy, Intelligence, Agency): the name as the page's one big
 * serif moment («Eclipse» set small above it, so the H1 reads the full name), the unit's line, a
 * lead, its CTA (the page's solid amber, [data-page-cta]) and its plate on the other side.
 * The header flips with `data-header-theme` on light pages.
 */
export function UnitHero({
  id,
  name,
  statement,
  lead,
  cta,
  light = false,
}: {
  id: UnitId;
  /** «Media», «Academy»… (the H1 adds «Eclipse» before it). */
  name: string;
  statement: ReactNode;
  lead: string;
  cta: ReactNode;
  light?: boolean;
}) {
  return (
    <section
      aria-labelledby="unit-title"
      data-header-theme={light ? 'light' : undefined}
      className={`u-hero ${light ? 'theme-light bg-dawn' : 'theme-dark grain bg-void'} relative isolate overflow-clip`}
      data-unit={id}
    >
      <div aria-hidden className="u-hero-light" />
      <div className="container-x u-hero-grid">
        <div className="u-hero-copy">
          <h1 id="unit-title" className="u-h1">
            <span className="u-h1-pre">Eclipse</span> <span className="display u-h1-name">{name}</span>
          </h1>
          <p className="display u-statement">{statement}</p>
          <p className="u-lead">{lead}</p>
          <div data-page-cta className="u-cta">
            {cta}
          </div>
        </div>
        <UnitEmblem id={id} />
      </div>
    </section>
  );
}

/** A numbered list of what the unit does: index · name · one line (optionally with a small plate). */
export function UnitLedger({
  id,
  title,
  rows,
  light = false,
}: {
  /** Unique on the page (the heading's id). */
  id: string;
  title: string;
  rows: { key: string; name: string; text: string; art?: ReactNode; tag?: string }[];
  light?: boolean;
}) {
  return (
    <section
      aria-labelledby={`u-${id}-title`}
      data-header-theme={light ? 'light' : undefined}
      className={`u-band ${light ? 'theme-light bg-dawn' : 'theme-dark bg-night'}`}
    >
      <div className="container-x">
        <Reveal className="u-band-grid">
          <h2 id={`u-${id}-title`} data-reveal className="display u-band-title">
            {title}
          </h2>
          <ol className="u-ledger">
            {rows.map((row, i) => (
              <li key={row.key} data-reveal className="u-row" data-has-art={row.art ? '' : undefined}>
                <DrawLine className="u-row-rule" />
                <span aria-hidden className="u-row-n readout">
                  {pad(i + 1)}
                </span>
                {row.art ? <div className="u-row-art ticks">{row.art}</div> : null}
                <div className="u-row-body">
                  <h3 className="u-row-name">
                    {row.name}
                    {row.tag ? <span className="u-row-tag">{row.tag}</span> : null}
                  </h3>
                  <p className="u-row-text">{row.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/** Steps laid out as phases of the eclipse, new → full sun (Media's way of working). */
export function UnitPhases({ title, steps, light = false }: { title: string; steps: { key: string; name: string; text: string }[]; light?: boolean }) {
  return (
    <section
      aria-labelledby="u-phases-title"
      data-header-theme={light ? 'light' : undefined}
      className={`u-band ${light ? 'theme-light bg-dawn' : 'theme-dark bg-night'}`}
    >
      <div className="container-x">
        <Reveal>
          <h2 id="u-phases-title" data-reveal className="display u-band-title">
            {title}
          </h2>
          <ol className="u-phases">
            {steps.map((s, i) => (
              <li key={s.key} data-reveal className="u-phase">
                <div className="u-phase-head">
                  <span aria-hidden className="readout u-phase-n">
                    {pad(i + 1)}
                  </span>
                  <PhaseGlyph phase={1 - i / Math.max(1, steps.length - 1)} size={22} className="u-phase-glyph" />
                </div>
                <h3 className="u-phase-name">{s.name}</h3>
                <p className="u-phase-text">{s.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/** A plain statement band: a title and one or two short paragraphs (status, how it works, a principle). */
export function UnitNote({ title, children, light = false }: { title: string; children: ReactNode; light?: boolean }) {
  return (
    <section data-header-theme={light ? 'light' : undefined} className={`u-band u-note ${light ? 'theme-light bg-dawn' : 'theme-dark bg-night'}`}>
      <div className="container-x u-note-grid">
        <h2 className="display u-note-title">{title}</h2>
        <div className="u-note-body">{children}</div>
      </div>
    </section>
  );
}

/** The other units (and the products), so every page leads to the rest of Eclipse. */
export function UnitOthers({ current, light = false }: { current: UnitId; light?: boolean }) {
  const t = useTranslations('units');
  return (
    <nav
      aria-labelledby="u-others-title"
      data-header-theme={light ? 'light' : undefined}
      className={`u-band u-others ${light ? 'theme-light bg-dawn' : 'theme-dark bg-night'}`}
    >
      <div className="container-x">
        <h2 id="u-others-title" className="label u-others-title">
          {t('others')}
        </h2>
        <ul className="u-others-list">
          {NAV_LINKS.filter((link) => link.id !== current).map((link) => (
            <li key={link.id}>
              <Link href={link.href} className="u-other">
                <span className="display u-other-name">{t(`${link.id}.name`)}</span>
                <span className="u-other-short">{t(`${link.id}.short`)}</span>
                <ArrowUpRight aria-hidden className="u-other-arrow" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
