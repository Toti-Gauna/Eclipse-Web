'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollTrigger } from '@/components/motion/gsap';
import { HYDRATED_EVENT } from '@/components/motion/LazyHydrate';
import { foundersState } from '@/lib/founders';
import { SECTION_KEYS, phaseAt, sectionDomId, type SectionKey } from './sectionIndex';
import './ephemeris-rail.css';

const pad = (n: number) => String(n).padStart(2, '0');
/** Where on the screen a section becomes "current" (fraction of the viewport height). */
const READING_LINE = 0.5;

/**
 * The rail itself (lazy chunk of <EphemerisRail>).
 *
 * - Ticks: `<a href="#id">` inside `<nav aria-label="Índice">`; the current one
 *   has aria-current. In-page smoothing and focus are <SmoothAnchors>' job.
 * - Readings (straight on the DOM, no React render per frame): the playhead
 *   rides the scale between ticks and the eclipse at the top goes from
 *   totality (01) to full sun (08) as the page scrolls.
 * - Section offsets are measured again on resize, ScrollTrigger refresh (pin
 *   spacers), body size changes and HYDRATED_EVENT (lazy sections re-create
 *   their DOM).
 * - Theme: light while the reading line is over a [data-header-theme="light"]
 *   zone (the same zones that flip the header) or a [data-rail-theme="light"] one
 *   (bright areas the header doesn't care about, e.g. the end of the sunrise).
 */
export default function EphemerisRailView() {
  const t = useTranslations('sections');
  const [current, setCurrent] = useState(0);
  const [light, setLight] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const moon = useRef<SVGCircleElement>(null);
  const corona = useRef<SVGGElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const maskId = `eph${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-moon`;
  const clients = foundersState().allFilled;

  const label = (key: SectionKey) => (key === 'founders' && clients ? t('clients') : t(`labels.${key}`));

  useEffect(() => {
    let tops: number[] = [];
    let step = 0;
    let raf = 0;
    let index = -1;
    let isLight: boolean | null = null;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const line = window.scrollY + vh * READING_LINE;
      const end = document.documentElement.scrollHeight - vh + vh * READING_LINE;

      let i = 0;
      for (let k = 0; k < tops.length; k++) if (tops[k] <= line) i = k;
      const last = SECTION_KEYS.length - 1;
      const from = tops[i] ?? 0;
      const to = i < last && Number.isFinite(tops[i + 1]) ? tops[i + 1] : end;
      const within = to > from ? Math.min(1, Math.max(0, (line - from) / (to - from))) : 1;
      const position = i < last ? i + within : last;

      if (head.current) head.current.style.transform = `translate3d(0, ${(position * step).toFixed(1)}px, 0)`;
      const phase = phaseAt(position);
      moon.current?.setAttribute('cx', (12 + (1 - phase) * 16.8).toFixed(2));
      corona.current?.setAttribute('opacity', Math.min(1, Math.max(0, (phase - 0.9) / 0.08)).toFixed(2));

      // Over a light zone (pricing, founders, final CTA, footer, the hero's demo light)?
      const mid = vh * READING_LINE;
      let over = false;
      for (const zone of document.querySelectorAll('[data-header-theme="light"], [data-rail-theme="light"]')) {
        const r = zone.getBoundingClientRect();
        if (r.height > 0 && r.top <= mid && r.bottom >= mid) {
          over = true;
          break;
        }
      }
      if (i !== index) {
        index = i;
        setCurrent(i);
      }
      if (over !== isLight) {
        isLight = over;
        setLight(over);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const measure = () => {
      tops = SECTION_KEYS.map((key, k) => {
        if (k === 0) return 0;
        const el = document.getElementById(sectionDomId(key));
        return el ? el.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY;
      });
      const ticks = root.current?.querySelectorAll<HTMLElement>('[data-eph-tick]');
      step = ticks && ticks.length > 1 ? ticks[1].offsetTop - ticks[0].offsetTop : 0;
      schedule();
    };

    let measureRaf = 0;
    const remeasure = () => {
      cancelAnimationFrame(measureRaf);
      measureRaf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener(HYDRATED_EVENT, remeasure);
    ScrollTrigger.addEventListener('refresh', remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measureRaf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener(HYDRATED_EVENT, remeasure);
      ScrollTrigger.removeEventListener('refresh', remeasure);
      ro.disconnect();
    };
  }, []);

  const shown = hover ?? current;

  return (
    <nav
      ref={root}
      aria-label={t('index')}
      data-eph-rail
      className={`eph-rail ${light ? 'theme-light' : 'theme-dark'}`}
    >
      <div className="eph-scale">
        <span aria-hidden className="eph-spine" />
        {/* The playhead is the eclipse itself: it rides the scale and its moon scrubs off. */}
        <span ref={head} aria-hidden className="eph-head">
          <svg viewBox="0 0 24 24" width={18} height={18} className="eph-glyph" focusable="false">
            <defs>
              <mask id={maskId}>
                <rect width="24" height="24" fill="#fff" />
                <circle ref={moon} cx="12" cy="12" r="8.4" fill="#000" />
              </mask>
            </defs>
            <circle cx="12" cy="12" r="11" className="eph-glyph-plate" />
            <circle cx="12" cy="12" r="8" className="eph-glyph-orbit" />
            <circle cx="12" cy="12" r="8" className="eph-glyph-sun" mask={`url(#${maskId})`} />
            <g ref={corona} className="eph-glyph-corona">
              <circle cx="12" cy="12" r="10" />
              <circle cx="18.36" cy="5.64" r="1.5" className="eph-glyph-diamond" />
            </g>
          </svg>
        </span>
        <ol className="eph-ticks">
          {SECTION_KEYS.map((key, i) => (
            <li key={key}>
              <a
                href={`#${sectionDomId(key)}`}
                data-eph-tick
                aria-current={i === current ? 'true' : undefined}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="eph-tick"
              >
                <span aria-hidden className="eph-tick-mark" />
                <span aria-hidden className="eph-tick-index">
                  {pad(i + 1)}
                </span>
                <span className="sr-only">{label(key)}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <p aria-hidden className="eph-label" data-hover={hover !== null ? '' : undefined}>
        <span className="eph-label-index">{pad(shown + 1)}</span>
        <span className="eph-label-rule" />
        <span>{label(SECTION_KEYS[shown])}</span>
      </p>
    </nav>
  );
}
