'use client';

import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type LazyExoticComponent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Maximize2 } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { Occult } from '@/components/motion/Occult';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { trailerLoaders } from '@/components/trailers/registry';
import { TrailerPoster } from '@/components/trailers/TrailerPoster';
import type { TrailerComponentProps } from '@/components/trailers/VerticalTrailer';
import { l, verticalById, type DemoId, type Vertical, type VerticalId } from '@/lib/content';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { DemoModal } from './DemoModal';
import { DEMO_PALETTES } from './palettes';
import '@/components/trailers/trailer.css';

const trailers = Object.fromEntries(
  Object.entries(trailerLoaders).map(([id, load]) => [id, lazy(load)]),
) as Record<DemoId, LazyExoticComponent<ComponentType<TrailerComponentProps>>>;

const pad = (n: number) => String(n).padStart(2, '0');

/** Warms the showcase + demo chunks (hover / focus on "Abrir demo"). */
function preloadDemo(demo: DemoId) {
  void import('@/components/demos/DemoShowcase').then((m) => m.preloadDemo(demo));
}

/** True once the element is within `margin` of the viewport (never goes back). */
function useNearViewport(ref: RefObject<HTMLElement | null>, margin = '600px 0px'): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}

type ShowcaseVertical = Vertical & { demo: DemoId; business: string; keyNumber: NonNullable<Vertical['keyNumber']> };

/**
 * "Sala de demos": a selector (one tab per demo business: number, name, rubro and
 * its palette) + a stage where only the selected trailer is mounted and plays
 * while visible + the facts (the pain, the demo's key number, "Abrir demo").
 * Desktop: a vertical index on the left. Phones: snap tabs over the stage.
 * Tabs follow the WAI-ARIA pattern (roving tabindex, arrows / Home / End,
 * selection follows focus). `more` (the "¿No ves tu rubro?" card) sits under
 * the index on desktop and after the stage on phones (grid placement).
 */
export function DemoTheater({ ids, more }: { ids: VerticalId[]; more?: ReactNode }) {
  const t = useTranslations('examples');
  const tc = useTranslations('common');
  const tt = useTranslations('trailers');
  const locale = useLocale() as Locale;
  const { selectVertical } = useExperience();
  const { play } = useSound();
  const wide = useMediaQuery('(min-width: 1024px)');
  const uid = useId();

  const items = ids.map((id) => verticalById(id)).filter((v): v is ShowcaseVertical => !!v?.demo && !!v.business && !!v.keyNumber);
  const [selected, setSelected] = useState(0);
  const [changed, setChanged] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState<VerticalId | null>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const stage = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stage);

  const v = items[Math.min(selected, items.length - 1)];
  if (!v) return null;
  const Trailer = trailers[v.demo];
  const panelId = `${uid}-panel`;
  const tabId = (item: Vertical) => `${uid}-tab-${item.id}`;

  const select = (i: number, focus = false) => {
    const next = (i + items.length) % items.length;
    if (focus) tabs.current[next]?.focus({ preventScroll: true });
    // Keep the chosen tab in view inside the phone scroller (never scrolls the page).
    const tab = tabs.current[next];
    const list = tab?.parentElement;
    if (tab && list && list.scrollWidth > list.clientWidth) {
      const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
      list.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    if (next === selected) return;
    setSelected(next);
    setChanged(true);
    play('select');
    selectVertical(items[next].id, 'examples');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (e.key in step) next = selected + step[e.key];
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  };

  const openDemo = () => {
    setMounted(v.id);
    setOpen(true);
    play('open');
    track('demo_opened', { vertical: v.id, source: 'examples' });
  };
  const closeDemo = () => {
    setOpen(false);
    play('close');
  };

  const hasPosterCopy = tt.has(`${v.demo}.problem1`) && tt.has(`${v.demo}.problem2`);
  const poster = hasPosterCopy ? (
    <TrailerPoster vertical={v} copyKey={v.demo} />
  ) : (
    <div className="trl">
      <div aria-hidden className="trl-stage grain ex-poster-fallback">
        <span className="display">{v.business}</span>
      </div>
    </div>
  );

  return (
    <div className="ex-theater">
      <div className="ex-index">
        <p aria-hidden className="ex-index-head label">
          <span>{t('tabsLabel')}</span>
          <span className="ex-index-count">
            {pad(selected + 1)} / {pad(items.length)}
          </span>
        </p>
        <div
          role="tablist"
          aria-label={t('tabsLabel')}
          aria-orientation={wide ? 'vertical' : 'horizontal'}
          onKeyDown={onKeyDown}
          className="ex-tabs no-scrollbar"
        >
          {items.map((item, i) => {
            const active = i === selected;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={tabId(item)}
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                onClick={() => select(i)}
                onPointerEnter={() => void trailerLoaders[item.demo]()}
                onFocus={() => void trailerLoaders[item.demo]()}
                className="ex-tab"
              >
                <span aria-hidden className="ex-tab-index">
                  {pad(i + 1)}
                </span>
                <span className="ex-tab-body">
                  <span className="ex-tab-name">{item.business}</span>
                  <span className="ex-tab-meta">
                    <span className="ex-tab-rubro">{l(item.name, locale)}</span>
                    <Swatch colors={DEMO_PALETTES[item.demo]} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(v)} className="ex-panel">
        <div ref={stage} className="ex-stage">
          <span aria-hidden className="ex-stage-ticks ticks" />
          <Occult key={v.id} on={changed ? 'mount' : 'enter'} from="left" round="20px" duration={0.75} className="ex-stage-occult">
            {near ? (
              <Suspense fallback={poster}>
                <Trailer trigger="viewport" paused={open} />
              </Suspense>
            ) : (
              poster
            )}
          </Occult>
        </div>

        <div className="ex-facts">
          <div className="ex-fact-head">
            <h3 className="ex-business display">{v.business}</h3>
            <span className="badge-demo">{tc('demo')}</span>
            <span className="ex-fact-rubro label">{l(v.name, locale)}</span>
          </div>
          <dl className="ex-fact-list">
            <div className="ex-fact">
              <dt className="label">{t('pain')}</dt>
              <dd className="ex-pain">{l(v.pain, locale)}</dd>
            </div>
            <div className="ex-fact">
              <dt className="label">{t('result')}</dt>
              <dd className="ex-result">
                <CountUp
                  key={v.id}
                  value={v.keyNumber.value}
                  prefix={v.keyNumber.prefix}
                  suffix={v.keyNumber.suffix}
                  locale={locale}
                  duration={1.1}
                  on={changed ? 'mount' : 'enter'}
                  className="ex-number"
                />
                <span className="ex-number-label">{l(v.keyNumber.label, locale)}</span>
              </dd>
            </div>
          </dl>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t('openDemoLabel', { business: v.business })}
            className="btn btn-primary ex-open"
            onClick={openDemo}
            onPointerEnter={() => preloadDemo(v.demo)}
            onFocus={() => preloadDemo(v.demo)}
          >
            <Maximize2 aria-hidden className="size-4" strokeWidth={1.8} />
            {t('openDemo')}
          </button>
        </div>
      </div>

      {more ? <div className="ex-more">{more}</div> : null}

      <DemoModal key={v.id} open={open} mounted={mounted === v.id} onClose={closeDemo} vertical={v} />
    </div>
  );
}

function Swatch({ colors }: { colors?: readonly string[] }) {
  if (!colors?.length) return null;
  return (
    <span aria-hidden className="ex-swatch">
      {colors.map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </span>
  );
}
