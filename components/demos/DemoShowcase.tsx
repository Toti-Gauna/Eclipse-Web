'use client';

import {
  lazy,
  Suspense,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, MoveHorizontal, Smartphone } from 'lucide-react';
import type { DemoId } from '@/lib/content';
import { useSound } from '@/components/sound/SoundContext';
import { DeviceFrame, ScreenPlaceholder } from './DeviceFrame';
import { DemoMessages } from './DemoMessages';
import { demoLoaders } from './registry';
import type { DemoProps, DemoScreen } from './types';

const lazyDemos = {} as Record<DemoId, ComponentType<DemoProps>>;
for (const id of Object.keys(demoLoaders) as DemoId[]) lazyDemos[id] = lazy(demoLoaders[id]);

/** Preloads a demo's code (call on hover/focus of the control that reveals it). */
export function preloadDemo(id: DemoId) {
  void demoLoaders[id]();
}

/**
 * Showcase width (px) from which both views sit side by side and stay legible
 * (phone view ≥ ~190px wide). Mirrored by the poster's container query in showcase.css.
 */
export const SPLIT_MIN = 880;

export type ShowcaseLayout = 'split' | 'tabs';

/** The layout for the showcase's own width (measured before paint, then on resize). */
function useLayoutFor(ref: RefObject<HTMLDivElement | null>, forced: ShowcaseLayout | undefined): ShowcaseLayout | null {
  const [measured, setMeasured] = useState<ShowcaseLayout | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (forced || !el) return;
    const measure = () => setMeasured(el.clientWidth >= SPLIT_MIN ? 'split' : 'tabs');
    // Measured before the first paint so the views never mount in the wrong layout.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, forced]);
  return forced ?? measured;
}

/**
 * A demo as two frameless, labelled views (v3) — no laptop or phone shells, no overlap:
 * - split (wide): "Escritorio" on the left, "Celular" on the right, side by side and
 *   independent; the phone is the customer's / member's side of the same story (paired).
 * - tabs (narrow, e.g. phones): "Celular" (default) | "Escritorio". Only the chosen view is
 *   mounted, so the phone alone is the complete mobile experience; the desktop view keeps a
 *   readable size in a horizontal scroller (never a thumbnail).
 * Used by the hero reveal, the "Sala de demos" stage and its modal. The parent sizes the
 * width; the height follows (geometry in showcase.css). Each view is a labelled region.
 */
export function DemoShowcase({
  demo,
  business,
  active,
  forceLayout,
  fit = false,
  className = '',
}: {
  demo: DemoId;
  business: string;
  active: boolean;
  /** Override the width-based choice. v2 values are accepted: 'both' = split, 'phone' = tabs. */
  forceLayout?: ShowcaseLayout | 'both' | 'phone';
  /** Fill the parent's width (the parent sizes it) instead of the default cap. */
  fit?: boolean;
  className?: string;
}) {
  const t = useTranslations('demoShowcase');
  const root = useRef<HTMLDivElement>(null);
  const forced = forceLayout === 'both' ? 'split' : forceLayout === 'phone' ? 'tabs' : forceLayout;
  const layout = useLayoutFor(root, forced);
  const Demo = useMemo(() => lazyDemos[demo], [demo]);
  const phoneLabel = t('phoneLabel', { business });
  const laptopLabel = t('laptopLabel', { business });

  const screen = (kind: DemoScreen) => (
    <Suspense
      fallback={
        <>
          <ScreenPlaceholder demo={demo} kind={kind} />
          {kind === 'phone' ? (
            <span role="status" className="sr-only">
              {t('loading', { business })}
            </span>
          ) : null}
        </>
      }
    >
      <DemoMessages>
        <Demo screen={kind} active={active} />
      </DemoMessages>
    </Suspense>
  );
  const caption = (kind: DemoScreen) => (
    <>
      {kind === 'laptop' ? <Monitor aria-hidden strokeWidth={1.5} /> : <Smartphone aria-hidden strokeWidth={1.5} />}
      {t(kind === 'laptop' ? 'desktop' : 'mobile')}
    </>
  );

  return (
    <div ref={root} data-layout={layout ?? undefined} className={`sc ${fit ? '' : 'mx-auto max-w-[1240px]'} ${className}`}>
      {layout === 'split' ? (
        <div className="sc-split">
          <DeviceFrame kind="laptop" label={laptopLabel} caption={caption('laptop')}>
            {screen('laptop')}
          </DeviceFrame>
          <DeviceFrame kind="phone" label={phoneLabel} caption={caption('phone')}>
            {screen('phone')}
          </DeviceFrame>
        </div>
      ) : layout === 'tabs' ? (
        <ShowcaseTabs
          label={t('viewsLabel', { business })}
          tabs={{ phone: caption('phone'), laptop: caption('laptop') }}
          panHint={t('panHint')}
          phone={
            <DeviceFrame kind="phone" label={phoneLabel}>
              {screen('phone')}
            </DeviceFrame>
          }
          laptop={
            <DeviceFrame kind="laptop" label={laptopLabel}>
              {screen('laptop')}
            </DeviceFrame>
          }
        />
      ) : null}
    </div>
  );
}

const ORDER: DemoScreen[] = ['phone', 'laptop'];

/** WAI-ARIA tabs (roving tabindex, arrows / Home / End). Only the chosen view is rendered. */
function ShowcaseTabs({
  label,
  tabs,
  phone,
  laptop,
  panHint,
}: {
  label: string;
  tabs: Record<DemoScreen, ReactNode>;
  phone: ReactNode;
  laptop: ReactNode;
  panHint: string;
}) {
  const uid = useId();
  const { play } = useSound();
  const [view, setView] = useState<DemoScreen>('phone');
  const refs = useRef<Partial<Record<DemoScreen, HTMLButtonElement | null>>>({});
  const tabId = (k: DemoScreen) => `${uid}-tab-${k}`;
  const panelId = (k: DemoScreen) => `${uid}-panel-${k}`;

  const choose = (k: DemoScreen, focus = false) => {
    if (focus) refs.current[k]?.focus();
    if (k === view) return;
    setView(k);
    play('select');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ORDER.indexOf(view);
    const next: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ORDER.length - 1 };
    if (!(e.key in next)) return;
    e.preventDefault();
    choose(ORDER[(next[e.key] + ORDER.length) % ORDER.length], true);
  };

  return (
    <>
      <div role="tablist" aria-label={label} className="sc-tablist" onKeyDown={onKeyDown}>
        {ORDER.map((k) => (
          <button
            key={k}
            ref={(el) => {
              refs.current[k] = el;
            }}
            type="button"
            role="tab"
            id={tabId(k)}
            aria-selected={view === k}
            aria-controls={panelId(k)}
            tabIndex={view === k ? 0 : -1}
            onClick={() => choose(k)}
            className="sc-tab"
          >
            {tabs[k]}
          </button>
        ))}
      </div>
      <div className="sc-panels">
        <div role="tabpanel" id={panelId('phone')} aria-labelledby={tabId('phone')} data-kind="phone" className="sc-panel" hidden={view !== 'phone'}>
          {view === 'phone' ? phone : null}
        </div>
        <div role="tabpanel" id={panelId('laptop')} aria-labelledby={tabId('laptop')} data-kind="laptop" className="sc-panel" hidden={view !== 'laptop'}>
          {view === 'laptop' ? <Panner hint={panHint}>{laptop}</Panner> : null}
        </div>
      </div>
    </>
  );
}

/**
 * The desktop view at a readable width in a horizontal scroller: soft edges where there
 * is more to see, a hint and a ruler whose lit part is the visible slice (transform only).
 */
function Panner({ children, hint }: { children: ReactNode; hint: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scroller.current;
    const pan = bar.current;
    if (!el || !pan) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > 1;
      if (overflow) pan.dataset.overflow = '';
      else delete pan.dataset.overflow;
      el.dataset.edge = !overflow ? '' : el.scrollLeft <= 1 ? 'start' : el.scrollLeft >= max - 1 ? 'end' : 'mid';
      if (!overflow) return;
      pan.style.setProperty('--sc-thumb', `${(el.clientWidth / el.scrollWidth) * 100}%`);
      pan.style.setProperty('--sc-thumb-x', `${(el.scrollLeft / el.clientWidth) * 100}%`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={scroller} className="sc-scroller">
        {children}
      </div>
      {/* Visual guidance for touch; focus already scrolls what it reaches into view. */}
      <div ref={bar} aria-hidden className="sc-pan">
        <p className="sc-hint">
          <MoveHorizontal aria-hidden strokeWidth={1.5} />
          {hint}
        </p>
        <span aria-hidden className="sc-ruler">
          <span className="sc-ruler-thumb" />
        </span>
      </div>
    </>
  );
}
