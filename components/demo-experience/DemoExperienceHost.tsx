'use client';

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Compass, MessageCircle } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useSound } from '@/components/sound/SoundContext';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useTourSeen } from '@/components/ui/tour/useTourSeen';
import { DEMO_TOURS } from '@/components/demos/tours';
import { l, verticalById, type DemoId } from '@/lib/content';
import { lockScroll } from '@/lib/scroll-lock';
import { localeTags, type Locale } from '@/i18n/routing';
import { buildTourSteps, GUIDE_CHOICE_KEY, type ViewTag } from './guide';
import { playClosing, playOpening, limbPoint } from './motion';
import { projectSummary } from './project';
import { clearDemoRequest, layerBodyLoader, useDemoRequest, type DemoRequest } from './store';
import './demo-experience.css';

const DemoLayerBody = lazy(() => layerBodyLoader().then((m) => ({ default: m.DemoLayerBody })));

/** History entry the layer pushes on open (same URL): Back closes it. */
interface LayerHistoryState {
  eclipseDemo?: string;
}
const historyToken = () => (window.history.state as LayerHistoryState | null)?.eclipseDemo;

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab / Shift+Tab cycling inside the layer (a modal <dialog> lets focus reach the
 * browser UI after its last control). The guide's card handles its own Tab first.
 */
function cycleFocus(e: KeyboardEvent<HTMLDialogElement>) {
  if (e.key !== 'Tab' || e.defaultPrevented) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0 && (el.checkVisibility?.({ visibilityProperty: true }) ?? true),
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !e.currentTarget.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * The page's one "Ver demo" layer (v3b). Mounted once (the hero renders it); opened from any
 * control with `openDemoExperience()` (store.ts): the hero's rubro keys and the demos
 * section's "Ver demo". Closed (and unmounted) between uses.
 */
export function DemoExperienceHost() {
  const request = useDemoRequest();
  return request ? <DemoLayer key={request.id} request={request} /> : null;
}

type Phase = 'opening' | 'open' | 'closing';
type CloseReason = 'button' | 'escape' | 'history' | 'native';

/**
 * A native modal <dialog> (top layer, focus containment, Escape, the page behind inert) that
 * fills the viewport, warm and lit (theme-light, dawn with the corona's glow). Inside, ONE
 * scroll container (`overscroll-behavior: contain`) holds the header, the two views and the
 * complete project with its price; the page behind never scrolls (lockScroll) and keeps its
 * exact position.
 *
 * Lifecycle: open → remember scrollX/Y, lock the page, showModal, push a same-URL history
 * entry ({ eclipseDemo }), play the eclipse opening from the click (motion.ts).
 * Close (Volver, Escape, browser Back): the light collapses into the opener, the dialog
 * closes, the page unlocks, the scroll position is put back if anything moved it, and focus
 * returns to the opener (found again by `data-demo-opener` if its section re-created its
 * DOM). Closing by button/Escape steps back in history only if the top entry is ours.
 */
function DemoLayer({ request }: { request: DemoRequest }) {
  const t = useTranslations('demoExperience');
  const tt = useTranslations('tour');
  const tc = useTranslations('common');
  const tAll = useTranslations();
  const locale = useLocale() as Locale;
  const { play } = useSound();
  const vertical = verticalById(request.vertical);
  const business = vertical?.business ?? '';
  const verticalName = vertical ? l(vertical.name, locale) : '';
  const demo = request.demo;
  const titleId = `dx-title-${request.id}`;

  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ecl = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>('opening');
  const life = useRef({
    closing: false,
    anims: [] as Animation[],
    ignorePop: false,
    saved: { x: 0, y: 0 },
    release: null as null | (() => void),
    sounded: false,
  });
  const token = `eclipse-demo-${request.id}`;
  const getDialog = useCallback(() => dialog.current, []);
  const getScroller = useCallback(() => scroller.current, []);

  // ---- Guide or explore -------------------------------------------------------------
  const { seen: choiceMade, markSeen: rememberChoice } = useTourSeen(GUIDE_CHOICE_KEY);
  // The choice shows on open unless it was already answered once (any demo).
  const [choice, setChoice] = useState<'pending' | 'done'>(() => (choiceMade ? 'done' : 'pending'));
  const [guide, setGuide] = useState<{ open: boolean; run: number }>({ open: false, run: 0 });
  const guideOpen = useRef(false);
  useEffect(() => {
    guideOpen.current = guide.open;
  }, [guide.open]);
  const tagFor = useCallback(
    (view: ViewTag) => tt(view === 'laptop' ? 'tagDesktop' : view === 'phone' ? 'tagMobile' : 'tagBoth'),
    [tt],
  );
  const steps = useMemo(
    () =>
      buildTourSteps(demo, DEMO_TOURS[demo] ?? [], {
        has: (key) => tAll.has(`demoTours.${key}` as never),
        get: (key) => tAll(`demoTours.${key}` as never),
        tag: tagFor,
      }),
    [demo, tAll, tagFor],
  );
  const hasGuide = steps.length > 0;
  const startGuide = useCallback(() => {
    if (!hasGuide) return;
    setChoice('done');
    rememberChoice();
    setGuide((g) => ({ open: true, run: g.run + 1 }));
    play('open');
  }, [hasGuide, rememberChoice, play]);
  const explore = useCallback(() => {
    setChoice('done');
    rememberChoice();
    play('select');
  }, [rememberChoice, play]);
  // Done, skipped or closed: either way the choice is answered (not offered again by itself).
  const endGuide = useCallback(() => {
    setGuide((g) => ({ ...g, open: false }));
    rememberChoice();
  }, [rememberChoice]);

  // ---- One amber per viewport: the header CTA quiets while the block's CTA is visible.
  const [blockCtaInView, setBlockCtaInView] = useState(false);

  // ---- Open / close -----------------------------------------------------------------
  const findOpener = useCallback((): HTMLElement | null => {
    const node = request.opener;
    if (node?.isConnected) return node;
    return document.querySelector<HTMLElement>(`[data-demo-opener="${CSS.escape(request.openerKey)}"]`);
  }, [request]);

  const restorePage = useCallback(() => {
    const l = life.current;
    l.release?.();
    l.release = null;
    if (Math.abs(window.scrollY - l.saved.y) > 0.5 || Math.abs(window.scrollX - l.saved.x) > 0.5)
      window.scrollTo({ left: l.saved.x, top: l.saved.y, behavior: 'instant' });
  }, []);

  const finish = useCallback(() => {
    const l = life.current;
    const d = dialog.current;
    if (d?.open) d.close();
    l.anims.forEach((a) => a.cancel());
    l.anims = [];
    restorePage();
    findOpener()?.focus({ preventScroll: true });
    // The browser's own focus return / history traversal may still move it: once more next frame.
    requestAnimationFrame(() => {
      const { x, y } = life.current.saved;
      if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo({ left: x, top: y, behavior: 'instant' });
    });
    clearDemoRequest(request.id);
  }, [findOpener, restorePage, request.id]);

  const requestClose = useCallback(
    (reason: CloseReason) => {
      const l = life.current;
      if (l.closing) return;
      l.closing = true;
      setPhase('closing');
      if (reason !== 'native') play('close');
      if (reason !== 'history' && historyToken() === token) {
        l.ignorePop = true;
        window.history.back();
      }
      if (reason === 'native' || !panel.current) {
        finish();
        return;
      }
      // The light collapses into the opener (back in place: the page never scrolled).
      let point = request.point;
      const opener = findOpener();
      if (opener) {
        const r = opener.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < window.innerHeight) point = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      l.anims.forEach((a) => a.cancel());
      l.anims = playClosing({ panel: panel.current, ecl: ecl.current, glow: glow.current }, point, prefersReducedMotion());
      Promise.allSettled(l.anims.map((a) => a.finished)).then(finish);
    },
    [finish, findOpener, play, request.point, token],
  );
  const closeRef = useRef(requestClose);
  useLayoutEffect(() => {
    closeRef.current = requestClose;
  });

  useLayoutEffect(() => {
    const d = dialog.current;
    const p = panel.current;
    if (!d || !p) return;
    const l = life.current;
    l.saved = { x: window.scrollX, y: window.scrollY };
    // lockScroll keeps the scrollbar gutter, so nothing behind shifts sideways.
    l.release = lockScroll();
    if (!d.open) d.showModal();
    heading.current?.focus({ preventScroll: true });
    if (historyToken() !== token) window.history.pushState({ eclipseDemo: token } satisfies LayerHistoryState, '');
    if (!l.sounded) {
      l.sounded = true;
      play('open');
    }
    const origin = limbPoint(request.point);
    p.style.setProperty('--dx-x', `${origin.x}px`);
    p.style.setProperty('--dx-y', `${origin.y}px`);
    l.anims = playOpening({ panel: p, ecl: ecl.current, glow: glow.current }, request.point, prefersReducedMotion());
    let live = true;
    Promise.allSettled(l.anims.map((a) => a.finished)).then(() => {
      if (live && !l.closing) setPhase('open');
    });

    const onPop = () => {
      if (l.ignorePop) {
        l.ignorePop = false;
        return;
      }
      if (historyToken() !== token) closeRef.current('history');
    };
    // Escape: the tour (when open) prevents this itself; otherwise it is ours to animate.
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (guideOpen.current) return;
      closeRef.current('escape');
    };
    // Closed by the browser without a cancelable `cancel` (e.g. repeated Escape). The event is
    // queued: ignore a stale one if the dialog is open again (dev StrictMode replays this effect).
    const onNativeClose = () => {
      if (!l.closing && !d.open) closeRef.current('native');
    };
    window.addEventListener('popstate', onPop);
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onNativeClose);
    return () => {
      live = false;
      window.removeEventListener('popstate', onPop);
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onNativeClose);
      // Unmounted without closing (dev StrictMode replay, navigation away): undo, no animation.
      if (!l.closing) {
        l.anims.forEach((a) => a.cancel());
        if (d.open) d.close();
        restorePage();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per request (the component is keyed by it)
  }, []);

  if (!vertical || !vertical.demo) return null;

  const summary = vertical ? projectSummary(vertical) : null;
  const list = new Intl.ListFormat(localeTags[locale], { type: 'conjunction' });
  const names = (items: { name: Record<Locale, string> }[]) => list.format(items.map((i) => l(i.name, locale)));
  const message = !summary
    ? tAll('whatsapp.wantThis', { business, vertical: verticalName })
    : summary.plan
      ? summary.pieces.length
        ? t('whatsapp.planExtras', { business, vertical: verticalName, plan: l(summary.plan.name, locale), pieces: names(summary.pieces) })
        : t('whatsapp.plan', { business, vertical: verticalName, plan: l(summary.plan.name, locale) })
      : t('whatsapp.pieces', { business, vertical: verticalName, pieces: names(summary.pieces) });

  const wantThis = (className: string, extra?: Record<string, string>) => (
    <WhatsAppLink
      origin="demo_layer"
      message={message}
      extra={{ vertical: vertical.id, from: request.origin, plan: summary?.plan?.id ?? 'none' }}
      className={className}
      onClick={() => play('glint')}
      {...extra}
    >
      <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
      {t('wantThis')}
    </WhatsAppLink>
  );

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      data-demo-layer={demo}
      data-phase={phase}
      className="dx-layer"
      onKeyDown={cycleFocus}
    >
      <div ref={panel} className="dx-panel theme-light">
        <div aria-hidden className="dx-light" />
        <div ref={scroller} className="dx-scroll" data-dx-scroll>
          <header className="dx-bar">
            <div className="dx-bar-inner">
              <button type="button" onClick={() => requestClose('button')} className="btn btn-ghost btn-sm dx-back" data-dx-back>
                <ArrowLeft aria-hidden className="size-4" strokeWidth={1.6} />
                <span>{tc('back')}</span>
              </button>
              <div className="dx-title">
                <span className="badge-demo" aria-hidden>
                  {tc('demo')}
                </span>
                <h2 ref={heading} id={titleId} tabIndex={-1} className="display dx-heading">
                  {business}
                  <span className="dx-heading-suffix"> — {tc('demo')}</span>
                </h2>
                <p className="dx-hint">
                  <span className="dx-hint-rubro">{verticalName} · </span>
                  {t('hint')}
                </p>
              </div>
              <button
                type="button"
                onClick={startGuide}
                disabled={!hasGuide}
                title={hasGuide ? undefined : t('guideSoon')}
                aria-describedby={hasGuide ? undefined : `${titleId}-guide-soon`}
                className="btn btn-ghost btn-sm dx-guide"
                data-dx-guide
              >
                <Compass aria-hidden className="size-4" strokeWidth={1.6} />
                <span className="dx-guide-long">{tt('withGuide')}</span>
                <span className="dx-guide-short">{tt('help')}</span>
              </button>
              {hasGuide ? null : (
                <span id={`${titleId}-guide-soon`} className="sr-only">
                  {t('guideSoon')}
                </span>
              )}
              <div className="dx-bar-cta">{wantThis(`btn btn-sm ${blockCtaInView ? 'btn-ghost' : 'btn-primary'}`)}</div>
            </div>
          </header>

          <Suspense fallback={<BodyFallback demo={demo} label={t('loading', { business })} />}>
            <DemoLayerBody
              demo={demo}
              vertical={vertical}
              origin={request.origin}
              active={phase !== 'closing'}
              ready={phase !== 'opening'}
              choice={choice}
              hasGuide={hasGuide}
              guideOpen={guide.open}
              guideRun={guide.run}
              steps={steps}
              onGuide={startGuide}
              onExplore={explore}
              onGuideClose={endGuide}
              dialog={getDialog}
              scroller={getScroller}
              wantThis={wantThis}
              blockCtaInView={blockCtaInView}
              onBlockCta={setBlockCtaInView}
            />
          </Suspense>
        </div>
      </div>
      <div ref={glow} aria-hidden className="dx-glow" />
      <div ref={ecl} aria-hidden className="dx-ecl">
        <span className="dx-ecl-corona" />
        <span className="dx-ecl-sun" />
        <span data-dx-moon className="dx-ecl-moon" />
        <span data-dx-flare className="dx-ecl-flare" />
        <span data-dx-diamond className="dx-ecl-diamond" />
      </div>
    </dialog>
  );
}

/** While the body chunk downloads: the views' footprint, so nothing jumps when it lands. */
function BodyFallback({ demo, label }: { demo: DemoId; label: string }) {
  return (
    <div className="dx-stage" data-demo={demo}>
      <div className="dx-views">
        <div role="status" className="dx-skeleton">
          <span className="sr-only">{label}</span>
        </div>
      </div>
    </div>
  );
}
