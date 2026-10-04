'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollTrigger } from '@/components/motion/gsap';
import { HYDRATED_EVENT } from '@/components/motion/LazyHydrate';
import { LIGHT_ZONES_EVENT } from './EphemerisRail';
import { foundersState } from '@/lib/founders';
import { SECTION_KEYS, phaseAt, sectionDomId, type SectionKey } from './sectionIndex';
import './ephemeris-rail.css';

const pad = (n: number) => String(n).padStart(2, '0');
/** Where on the screen a section becomes "current" (fraction of the viewport height). */
const READING_LINE = 0.5;
/** Zones that turn the rail light (the same ones that flip the header, plus rail-only ones). */
const LIGHT_ZONES = '[data-header-theme="light"], [data-rail-theme="light"]';
/** The glyph's moon moves in 1/120 steps of the whole scale (~0.1 px each: invisible). */
const PHASE_STEPS = 120;

/**
 * The rail itself (lazy chunk of <EphemerisRail>).
 *
 * - Ticks: `<a href="#id">` inside `<nav aria-label="Índice">`; the current one
 *   has aria-current. In-page smoothing and focus are <SmoothAnchors>' job.
 * - Readings (straight on the DOM, no React render per frame): the playhead
 *   rides the scale between ticks and the eclipse at the top goes from
 *   totality (01) to full sun (08) as the page scrolls. The scroll position comes
 *   from a ScrollTrigger (one shared read per frame); everything else is cached.
 * - Section offsets and light zones are measured again on resize, ScrollTrigger
 *   refresh (pin spacers), body size changes, HYDRATED_EVENT (lazy sections
 *   re-create their DOM) and LIGHT_ZONES_EVENT (the hero's demo light).
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
    let zones: Array<[number, number]> = [];
    let step = 0;
    let vh = window.innerHeight;
    let end = 0;
    let scroll = window.scrollY;
    let index = -1;
    let isLight: boolean | null = null;
    let lastHead = '';
    let lastPhase = -1;

    // Per scroll frame: arithmetic on cached measurements only. No layout reads (v2 read
    // scrollY, scrollHeight and every light zone's rect on each frame, forcing a style and
    // layout pass right after GSAP's writes), and the SVG glyph is only touched when its
    // moon actually moves (each attribute change repaints it).
    const update = () => {
      const line = scroll + vh * READING_LINE;
      let i = 0;
      for (let k = 0; k < tops.length; k++) if (tops[k] <= line) i = k;
      const last = SECTION_KEYS.length - 1;
      const from = tops[i] ?? 0;
      const to = i < last && Number.isFinite(tops[i + 1]) ? tops[i + 1] : end;
      const within = to > from ? Math.min(1, Math.max(0, (line - from) / (to - from))) : 1;
      const position = i < last ? i + within : last;

      const y = (position * step).toFixed(1);
      if (head.current && y !== lastHead) {
        lastHead = y;
        head.current.style.transform = `translate3d(0, ${y}px, 0)`;
      }
      const phase = Math.round(phaseAt(position) * PHASE_STEPS) / PHASE_STEPS;
      if (phase !== lastPhase) {
        lastPhase = phase;
        moon.current?.setAttribute('cx', (12 + (1 - phase) * 16.8).toFixed(2));
        corona.current?.setAttribute('opacity', Math.min(1, Math.max(0, (phase - 0.9) / 0.08)).toFixed(2));
      }

      // Over a light zone (pricing, founders, final CTA, footer, the hero's demo light)?
      let over = false;
      for (const [a, b] of zones) {
        if (a <= line && b >= line) {
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

    const measure = () => {
      vh = window.innerHeight;
      scroll = window.scrollY;
      tops = SECTION_KEYS.map((key, k) => {
        if (k === 0) return 0;
        const el = document.getElementById(sectionDomId(key));
        return el ? el.getBoundingClientRect().top + scroll : Number.POSITIVE_INFINITY;
      });
      end = document.documentElement.scrollHeight - vh + vh * READING_LINE;
      zones = [];
      for (const zone of document.querySelectorAll<HTMLElement>(LIGHT_ZONES)) {
        const h = zone.offsetHeight;
        if (!h) continue;
        // The pinned hero may be position: fixed right now: measure from its in-flow spacer.
        const spacer = zone.closest('[data-hero-pin-spacer]');
        const top = spacer ? spacer.getBoundingClientRect().top + scroll + zone.offsetTop : zone.getBoundingClientRect().top + scroll;
        zones.push([top, top + h]);
      }
      const ticks = root.current?.querySelectorAll<HTMLElement>('[data-eph-tick]');
      step = ticks && ticks.length > 1 ? ticks[1].offsetTop - ticks[0].offsetTop : 0;
      update();
    };

    let measureRaf = 0;
    const remeasure = () => {
      cancelAnimationFrame(measureRaf);
      measureRaf = requestAnimationFrame(measure);
    };

    measure();
    // ScrollTrigger reads the scroll position once per frame for every trigger on the page.
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scroll = self.scroll();
        update();
      },
    });
    window.addEventListener('resize', remeasure);
    window.addEventListener(HYDRATED_EVENT, remeasure);
    window.addEventListener(LIGHT_ZONES_EVENT, remeasure);
    ScrollTrigger.addEventListener('refresh', remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(measureRaf);
      st.kill();
      window.removeEventListener('resize', remeasure);
      window.removeEventListener(HYDRATED_EVENT, remeasure);
      window.removeEventListener(LIGHT_ZONES_EVENT, remeasure);
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
