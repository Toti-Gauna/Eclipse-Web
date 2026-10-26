'use client';

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Compass, MessageCircle } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useSound } from '@/components/sound/SoundContext';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { DEMO_TOURS } from '@/components/demos/tours';
import { l, verticalById, type DemoId } from '@/lib/content';
import { isPortalPath, parseShowroomParams } from '@/lib/showroom';
import { lockScroll } from '@/lib/scroll-lock';
import { localeTags, type Locale } from '@/i18n/routing';
import { buildTourSteps, type ViewTag } from './guide';
import { Eclipse } from '@/components/hero/Eclipse';
import { LIMB_POINT } from '@/components/hero/geometry';
import { heroEclipseSize, holdHeroEclipse, OPEN_CUES, playClosing, playOpening, type LayerParts } from './motion';
import { projectSummary } from './project';
import { cycleFocus } from './cycleFocus';
import { LayerBoundary } from './LayerBoundary';
import {
  clearDemoRequest,
  getDemoRequest,
  getSelectorRequest,
  layerBodyLoader,
  openDemoExperience,
  openSelector,
  useDemoRequest,
  useSelectorRequest,
  type DemoRequest,
} from './store';
import { cleanShowroomUrl, currentMarker, focusHomeHeading, rubroOfVertical, writeView } from './showroomHistory';
import './demo-experience.css';

const SelectorLayer = lazy(() => import('./SelectorLayer').then((m) => ({ default: m.SelectorLayer })));
const loadBody = () => lazy(() => layerBodyLoader().then((m) => ({ default: m.DemoLayerBody })));

/**
 * The page's one "Ver demo" layer (v3b). Mounted once (the hero renders it); opened from any
 * control with `openDemoExperience()` (store.ts): the hero's rubro keys and the demos
 * section's "Ver demo". Closed (and unmounted) between uses.
 */
export function DemoExperienceHost() {
  const request = useDemoRequest();
  const selector = useSelectorRequest();
  useShowroomUrl();
  return (
    <>
      {selector ? (
        <Suspense fallback={null}>
          <SelectorLayer key={selector.id} request={selector} />
        </Suspense>
      ) : null}
      {request ? <DemoLayer key={request.id} request={request} /> : null}
    </>
  );
}

/**
 * The URL side of the showroom (lib/showroom.ts contract, history owner: showroomHistory.ts).
 * On load: `?rubro=inmobiliarias` opens the Lumen demo with no opening film; `?rubro=ecommerce`
 * opens the selector (that rubro has no demo yet); any value off the allow-list is cleaned and
 * focus goes to the home's H1. Afterwards, the browser's Forward onto an entry we own brings the
 * layer back (Back is closed by the layers themselves). Never in the portal.
 */
function useShowroomUrl() {
  useEffect(() => {
    if (isPortalPath(window.location.pathname)) return;
    const parsed = parseShowroomParams(window.location.search);
    if (parsed === null) return;
    if (parsed === 'invalid') {
      cleanShowroomUrl();
      focusHomeHeading();
      return;
    }
    if (parsed.rubro === 'inmobiliarias') {
      const v = verticalById('inmobiliarias');
      if (v?.demo) openDemoExperience({ vertical: v.id, demo: v.demo, origin: 'url', entry: 'direct' }, null);
      else cleanShowroomUrl();
    } else {
      // Ecommerce: no demo to open. The selector shows it as «Próximamente»; the URL is cleaned.
      cleanShowroomUrl();
      openSelector({ origin: 'url', entry: 'direct' }, null);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (isPortalPath(window.location.pathname) || getDemoRequest() || getSelectorRequest()) return;
      const marker = currentMarker();
      if (!marker) return;
      if (marker.level === 'selector') {
        openSelector({ origin: 'url', entry: 'restore' }, null);
        return;
      }
      const parsed = parseShowroomParams(window.location.search);
      const v = parsed && parsed !== 'invalid' && parsed.rubro === 'inmobiliarias' ? verticalById('inmobiliarias') : undefined;
      if (v?.demo) openDemoExperience({ vertical: v.id, demo: v.demo, origin: 'url', entry: 'restore' }, null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
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
  const voidEl = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>('opening');
  const life = useRef({
    closing: false,
    anims: [] as Animation[],
    ignorePop: false,
    saved: { x: 0, y: 0 },
    release: null as null | (() => void),
    sounded: false,
    cues: [] as number[],
  });
  const direct = request.entry === 'direct';
  // A new lazy per attempt (set from the retry button): a failed chunk is fetched again, not replayed from React's cache.
  const [Body, setBody] = useState(loadBody);
  const getDialog = useCallback(() => dialog.current, []);
  const getScroller = useCallback(() => scroller.current, []);
  const layerParts = useCallback(
    (): LayerParts | null =>
      panel.current
        ? {
            panel: panel.current,
            void: voidEl.current,
            stage: stage.current,
            halo: halo.current,
            items: Array.from(scroller.current?.children ?? []) as HTMLElement[],
          }
        : null,
    [],
  );

  // ---- Guide or explore -------------------------------------------------------------
  // Every open of every demo (and every page load) asks "¿Cómo querés verla?" again: nothing is
  // remembered. The layer is keyed by request, so this state starts fresh each time.
  const [choice, setChoice] = useState<'pending' | 'done'>('pending');
  const [guide, setGuide] = useState<{ open: boolean; run: number }>({
    open: false,
    run: 0,
  });
  const guideOpen = useRef(false);
  useEffect(() => {
    guideOpen.current = guide.open;
  }, [guide.open]);
  const tagFor = useCallback((view: ViewTag) => tt(view === 'laptop' ? 'tagDesktop' : view === 'phone' ? 'tagMobile' : 'tagBoth'), [tt]);
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
    setGuide((g) => ({ open: true, run: g.run + 1 }));
    play('open');
  }, [hasGuide, play]);
  const explore = useCallback(() => {
    setChoice('done');
    play('select');
  }, [play]);
  // Done, skipped or closed: the guide ends (it can be reopened from "Ver con guía").
  const endGuide = useCallback(() => {
    setGuide((g) => ({ ...g, open: false }));
  }, []);

  // ---- One amber per viewport: the header CTA quiets while the block's CTA is visible.
  const [blockCtaInView, setBlockCtaInView] = useState(false);

  // ---- Open / close -----------------------------------------------------------------
  const findOpener = useCallback((): HTMLElement | null => {
    const node = request.opener;
    if (node?.isConnected && (node.checkVisibility?.() ?? true)) return node;
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
    l.cues.forEach((id) => window.clearTimeout(id));
    l.cues = [];
    holdHeroEclipse(false);
    restorePage();
    const opener = findOpener();
    if (opener) opener.focus({ preventScroll: true });
    else focusHomeHeading();
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
      if (reason !== 'history') {
        if (request.ownsEntry && currentMarker()?.level === 'view') {
          // Our entry is the top one: step back onto the home it was opened from.
          l.ignorePop = true;
          window.history.back();
        } else if (!request.ownsEntry) cleanShowroomUrl();
      }
      const parts = layerParts();
      if (reason === 'native' || !parts) {
        finish();
        return;
      }
      // The light collapses back into the eclipse; the void lifts off the page (never moved).
      l.cues.forEach((id) => window.clearTimeout(id));
      l.cues = [];
      l.anims.forEach((a) => a.cancel());
      l.anims = playClosing(parts, {
        reduced: prefersReducedMotion() || direct,
        toHero: request.origin === 'hero',
      });
      Promise.allSettled(l.anims.map((a) => a.finished)).then(finish);
    },
    [finish, layerParts, play, request.origin, request.ownsEntry, direct],
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
    // History (showroomHistory.ts owns every push/replace): a new entry with the contract's query,
    // the selector's entry reused on hand-off, none when the browser's Forward brought us here,
    // and only our marker when the page loaded with the query already in the URL.
    const rubro = rubroOfVertical(request.vertical);
    if (request.entry === 'push') {
      if (currentMarker()?.level !== 'view') writeView('push', rubro); // (dev StrictMode replays this effect)
    } else if (request.entry === 'handoff') writeView('replace', rubro);
    else if (request.entry === 'direct') writeView('mark', rubro);
    // Direct entries and reduced motion play no film: a short fade, and never a sound on page load.
    const reduced = prefersReducedMotion() || direct;
    // The centered eclipse is exactly the hero's size (CSS has the same rule as a fallback).
    const size = heroEclipseSize();
    if (size) stage.current?.style.setProperty('--dx-ecl-size', `${size}px`);
    const parts = layerParts();
    l.anims = parts ? playOpening(parts, { reduced, fromHero: request.origin === 'hero' }) : [];
    if (!l.sounded) {
      l.sounded = true;
      if (direct) {
        // no cue: the page just loaded
      } else if (reduced) play('open');
      else l.cues = [window.setTimeout(() => play('glint'), OPEN_CUES.glint), window.setTimeout(() => play('whoosh'), OPEN_CUES.whoosh)];
    }
    let live = true;
    Promise.allSettled(l.anims.map((a) => a.finished)).then(() => {
      if (live && !l.closing) setPhase('open');
    });
    // A click or a key while it opens: straight to the end.
    const skip = () => {
      if (l.closing || !l.anims.some((a) => a.playState === 'running')) return;
      l.cues.forEach((id) => window.clearTimeout(id));
      l.cues = [];
      l.anims.forEach((a) => a.finish());
    };
    d.addEventListener('pointerdown', skip);
    d.addEventListener('keydown', skip);

    const onPop = () => {
      if (l.ignorePop) {
        l.ignorePop = false;
        return;
      }
      if (currentMarker()?.level !== 'view') closeRef.current('history');
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
      d.removeEventListener('pointerdown', skip);
      d.removeEventListener('keydown', skip);
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onNativeClose);
      // Unmounted without closing (dev StrictMode replay, navigation away): undo, no animation.
      if (!l.closing) {
        l.cues.forEach((id) => window.clearTimeout(id));
        l.cues = [];
        l.anims.forEach((a) => a.cancel());
        holdHeroEclipse(false);
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
        ? t('whatsapp.planExtras', {
            business,
            vertical: verticalName,
            plan: l(summary.plan.name, locale),
            pieces: names(summary.pieces),
          })
        : t('whatsapp.plan', {
            business,
            vertical: verticalName,
            plan: l(summary.plan.name, locale),
          })
      : t('whatsapp.pieces', {
          business,
          vertical: verticalName,
          pieces: names(summary.pieces),
        });

  const wantThis = (className: string, extra?: Record<string, string>) => (
    <WhatsAppLink
      origin="demo_layer"
      message={message}
      extra={{
        vertical: vertical.id,
        from: request.origin,
        plan: summary?.plan?.id ?? 'none',
      }}
      className={className}
      onClick={() => play('glint')}
      {...extra}
    >
      <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
      {t('wantThis')}
    </WhatsAppLink>
  );

  return (
    <dialog ref={dialog} aria-labelledby={titleId} data-demo-layer={demo} data-phase={phase} className="dx-layer" onKeyDown={cycleFocus}>
      {/* The opening's stage: the void and THE eclipse, centered, the hero's size (motion.ts). */}
      <div ref={voidEl} aria-hidden className="dx-void" />
      <div ref={stage} aria-hidden className="dx-ecl">
        <Eclipse size="var(--dx-ecl-size)" />
        <span
          className="dx-diamond"
          style={{
            left: `${LIMB_POINT.x * 100}%`,
            top: `${LIMB_POINT.y * 100}%`,
          }}
        >
          <span data-dx-flare className="dx-diamond-flare" />
          <span data-dx-core className="dx-diamond-core" />
        </span>
      </div>
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

          <LayerBoundary
            fallback={(retry) => (
              <div role="alert" className="dx-fail" data-dx-fail>
                <h3 className="display dx-fail-title">{t('loadFail.title')}</h3>
                <p>{t('loadFail.body')}</p>
                <div className="dx-fail-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setBody(loadBody);
                      retry();
                    }}
                  >
                    {t('loadFail.retry')}
                  </button>
                  {wantThis('btn btn-primary')}
                </div>
              </div>
            )}
          >
            <Suspense fallback={<BodyFallback demo={demo} label={t('loading', { business })} />}>
              <Body
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
          </LayerBoundary>
        </div>
      </div>
      <div ref={halo} aria-hidden className="dx-halo" />
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
