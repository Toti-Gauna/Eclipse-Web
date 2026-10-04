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
import { Maximize2, Monitor, Smartphone } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { Occult } from '@/components/motion/Occult';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { ShowcasePoster } from '@/components/demos/DeviceFrame';
import { trailerLoaders } from '@/components/trailers/registry';
import { TrailerPoster } from '@/components/trailers/TrailerPoster';
import { TRAILER_DURATION } from '@/components/trailers/constants';
import type { TrailerComponentProps } from '@/components/trailers/VerticalTrailer';
import { l, verticalById, type DemoId, type Vertical, type VerticalId } from '@/lib/content';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { DemoModal } from './DemoModal';
import { LazyShowcase, preloadShowcase } from './lazyShowcase';
import { DEMO_PALETTES } from './palettes';
import '@/components/trailers/trailer.css';

const trailers = Object.fromEntries(
  Object.entries(trailerLoaders).map(([id, load]) => [id, lazy(load)]),
) as Record<DemoId, LazyExoticComponent<ComponentType<TrailerComponentProps>>>;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Where the stage shows the live demo (frameless split): wide screens with a mouse.
 * Touch and narrow screens get the trailer on the stage and the live demo in the modal,
 * so the page never traps a finger inside a scrolling demo. Mirrored in examples.css.
 */
const LIVE_STAGE = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';

/** True once the element is within `margin` of the viewport (never goes back). */
function useNearViewport(ref: RefObject<HTMLElement | null>, margin = '250px 0px'): boolean {
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

/** True while any part of the element is on screen (the live demo pauses off-screen). */
function useOnScreen(ref: RefObject<HTMLElement | null>): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOn(entries[entries.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

type ShowcaseVertical = Vertical & { demo: DemoId; business: string; keyNumber: NonNullable<Vertical['keyNumber']> };
type StageView = 'demo' | 'trailer';

/**
 * "Sala de demos": a selector (one tab per demo business: number, name, rubro and its
 * palette), a stage and the facts (the pain, the demo's key number, "Abrir demo").
 * - Stage on wide screens with a mouse: the business's frameless previews, desktop on the
 *   left and mobile on the right, live and navigable — or its 15 s trailer (a switch under
 *   the stage). Elsewhere: the trailer, and "Abrir demo" for the live views.
 * - Lazy: a static poster with the same geometry until the stage is near the viewport;
 *   only the selected business mounts, and never more than one live experience at a time
 *   (the stage unmounts while the modal is open, the modal's demo after it closes).
 * Tabs follow the WAI-ARIA pattern with manual activation (arrows / Home / End move the
 * focus, Enter or Space shows the business), since a stage change mounts a demo.
 * `more` ("¿No ves tu rubro?") closes the section.
 */
export function DemoTheater({ ids, more }: { ids: VerticalId[]; more?: ReactNode }) {
  const t = useTranslations('examples');
  const tc = useTranslations('common');
  const tt = useTranslations('trailers');
  const ts = useTranslations('demoShowcase');
  const locale = useLocale() as Locale;
  const { selectVertical } = useExperience();
  const { play } = useSound();
  const live = useMediaQuery(LIVE_STAGE);
  const uid = useId();

  const items = ids.map((id) => verticalById(id)).filter((v): v is ShowcaseVertical => !!v?.demo && !!v.business && !!v.keyNumber);
  const [selected, setSelected] = useState(0);
  const [changed, setChanged] = useState(false);
  const [view, setView] = useState<StageView>('demo');
  const [open, setOpen] = useState(false);
  const [modalDemo, setModalDemo] = useState<VerticalId | null>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const openButton = useRef<HTMLButtonElement>(null);
  const intent = useRef<number | undefined>(undefined);
  const stage = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stage);
  const onScreen = useOnScreen(stage);

  // The modal's demo unmounts once its closing fade is over.
  useEffect(() => {
    if (open || !modalDemo) return;
    const id = window.setTimeout(() => setModalDemo(null), 450);
    return () => window.clearTimeout(id);
  }, [open, modalDemo]);
  useEffect(() => () => window.clearTimeout(intent.current), []);

  const v = items[Math.min(selected, items.length - 1)];
  if (!v) return null;
  const Trailer = trailers[v.demo];
  const panelId = `${uid}-panel`;
  const tabId = (item: Vertical) => `${uid}-tab-${item.id}`;
  const liveStage = live && view === 'demo';

  // Keeps a tab in view inside the phone scroller (never scrolls the page).
  const reveal = (i: number) => {
    const tab = tabs.current[i];
    const list = tab?.parentElement;
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
    const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const select = (i: number) => {
    reveal(i);
    if (i === selected) return;
    setSelected(i);
    setChanged(true);
    play('select');
    selectVertical(items[i].id, 'examples');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.current.findIndex((tab) => tab === document.activeElement);
    const from = current < 0 ? selected : current;
    const step: Record<string, number> = { ArrowRight: from + 1, ArrowLeft: from - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in step)) return;
    e.preventDefault();
    const next = (step[e.key] + items.length) % items.length;
    tabs.current[next]?.focus({ preventScroll: true });
    reveal(next);
  };
  // Code only (no mount), after a short hover so sweeping the row doesn't fetch six demos.
  const warm = (demo: DemoId) => {
    window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => (liveStage ? preloadShowcase(demo) : void trailerLoaders[demo]()), 160);
  };
  const cool = () => window.clearTimeout(intent.current);

  const openDemo = () => {
    setModalDemo(v.id);
    setOpen(true);
    play('open');
    track('demo_opened', { vertical: v.id, source: 'examples' });
  };
  const closeDemo = () => {
    setOpen(false);
    play('close');
  };
  const chooseView = (next: StageView) => {
    if (next === view) return;
    setView(next);
    play('toggle');
  };

  const captions = {
    laptop: (
      <>
        <Monitor aria-hidden strokeWidth={1.5} />
        {ts('desktop')}
      </>
    ),
    phone: (
      <>
        <Smartphone aria-hidden strokeWidth={1.5} />
        {ts('mobile')}
      </>
    ),
  };
  const splitPoster = (
    <ShowcasePoster
      demo={v.demo}
      captions={captions}
      plate={
        <span className="ex-plate">
          <span className="badge-demo">{tc('demo')}</span>
          <span className="ex-plate-name display">{v.business}</span>
        </span>
      }
    />
  );
  const hasPosterCopy = tt.has(`${v.demo}.problem1`) && tt.has(`${v.demo}.problem2`);
  const trailerPoster = hasPosterCopy ? (
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
        <div role="tablist" aria-label={t('tabsLabel')} aria-orientation="horizontal" onKeyDown={onKeyDown} className="ex-tabs no-scrollbar">
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
                onPointerEnter={() => warm(item.demo)}
                onPointerLeave={cool}
                onFocus={() => warm(item.demo)}
                onBlur={cool}
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
        <div ref={stage} className="ex-stage" data-view={view}>
          <span aria-hidden className="ex-stage-ticks ticks" />
          {/* The live demo has dozens of controls: let keyboard users jump past it. */}
          {liveStage ? (
            <button type="button" className="ex-skip sr-only-focusable" onClick={() => openButton.current?.focus()}>
              {t('stage.skip')}
            </button>
          ) : null}
          <Occult key={v.id} on={changed ? 'mount' : 'enter'} from="left" round="14px" duration={0.75} className="ex-stage-occult">
            {/* Wide + mouse: the live frameless split (CSS shows this block, see LIVE_STAGE). */}
            <div className="ex-stage-demo">
              {liveStage && near && !open ? (
                <Suspense fallback={splitPoster}>
                  <LazyShowcase demo={v.demo} business={v.business} active={onScreen} fit />
                </Suspense>
              ) : (
                splitPoster
              )}
            </div>
            <div className="ex-stage-trailer">
              {!liveStage && near && !open ? (
                <Suspense fallback={trailerPoster}>
                  <Trailer trigger="viewport" />
                </Suspense>
              ) : (
                trailerPoster
              )}
            </div>
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
          <div className="ex-actions">
            <button
              ref={openButton}
              type="button"
              aria-haspopup="dialog"
              aria-label={t('openDemoLabel', { business: v.business })}
              className="btn btn-primary ex-open"
              data-page-cta
              onClick={openDemo}
              onPointerEnter={() => preloadShowcase(v.demo)}
              onFocus={() => preloadShowcase(v.demo)}
            >
              <Maximize2 aria-hidden className="size-4" strokeWidth={1.8} />
              {t('openDemo')}
            </button>
            {/* Wide + mouse only (CSS): what the stage shows. */}
            <fieldset className="ex-view">
              <legend className="sr-only">{t('stage.label')}</legend>
              {(['demo', 'trailer'] as const).map((option) => (
                <label key={option} className="ex-view-option">
                  <input
                    type="radio"
                    name={`${uid}-view`}
                    value={option}
                    checked={view === option}
                    onChange={() => chooseView(option)}
                    className="ex-view-input"
                  />
                  <span>{option === 'demo' ? t('stage.demo') : t('stage.trailer', { seconds: TRAILER_DURATION })}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </div>
      </div>

      {more ? <div className="ex-more">{more}</div> : null}

      <DemoModal key={v.id} open={open} mounted={modalDemo === v.id} onClose={closeDemo} vertical={v} returnFocus={openButton} />
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
