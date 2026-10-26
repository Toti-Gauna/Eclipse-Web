'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { track } from '@/lib/analytics';
import { l, verticalById } from '@/lib/content';
import { lockScroll } from '@/lib/scroll-lock';
import type { Locale } from '@/i18n/routing';
import { cycleFocus } from './cycleFocus';
import { OPEN } from './motion';
import { clearSelectorRequest, openDemoExperience, type SelectorRequest } from './store';
import { cleanShowroomUrl, currentMarker, focusHomeHeading, markSelector, pushSelector } from './showroomHistory';
import './selector.css';

const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

type CloseReason = 'button' | 'escape' | 'history' | 'native';

/**
 * The rubro selector (lote 1.3): the showroom's first state. A native modal <dialog> in the
 * night theme ("todavía no hay luz": the light is born when a demo opens). It asks one thing —
 * «¿Qué negocio querés potenciar?» — and offers exactly two rows: Inmobiliarias (opens the
 * Lumen demo) and Ecommerce (visible, honest, «Próximamente», `aria-disabled`).
 *
 * Choosing Inmobiliarias hands off to the existing demo layer (`openDemoExperience`, entry
 * `handoff`): that layer plays THE eclipse opening; this one only stays up until the demo's
 * void covers it, so the page behind is never seen between the two and there are never two
 * eclipses. History: the selector owns one entry (showroomHistory.ts); Back, Escape and
 * «Volver» close it and hand focus back to the control that opened it (`data-demo-opener`).
 * Motion: 180 ms fade of the night + 260 ms rise of the surface (reduced / direct: a fade).
 */
export function SelectorLayer({ request }: { request: SelectorRequest }) {
  const t = useTranslations('selector');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { play } = useSound();
  const { selectVertical } = useExperience();
  const vertical = verticalById('inmobiliarias');
  const titleId = `sx-title-${request.id}`;
  const ledeId = `sx-lede-${request.id}`;

  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<'opening' | 'open' | 'closing' | 'handoff'>('opening');
  const life = useRef({
    closing: false,
    handedOff: false,
    ignorePop: false,
    saved: { x: 0, y: 0 },
    release: null as null | (() => void),
    anims: [] as Animation[],
    timer: 0,
  });
  const owns = request.entry !== 'direct';

  const findOpener = useCallback((): HTMLElement | null => {
    const node = request.opener;
    if (node?.isConnected && (node.checkVisibility?.() ?? true)) return node;
    return document.querySelector<HTMLElement>(`[data-demo-opener="selector:${CSS.escape(request.origin)}"]`);
  }, [request]);

  const finish = useCallback(() => {
    const s = life.current;
    const d = dialog.current;
    if (d?.open) d.close();
    s.anims.forEach((a) => a.cancel());
    s.anims = [];
    s.release?.();
    s.release = null;
    if (Math.abs(window.scrollY - s.saved.y) > 0.5 || Math.abs(window.scrollX - s.saved.x) > 0.5)
      window.scrollTo({ left: s.saved.x, top: s.saved.y, behavior: 'instant' });
    const opener = findOpener();
    if (opener) opener.focus({ preventScroll: true });
    else focusHomeHeading();
    clearSelectorRequest(request.id);
  }, [findOpener, request.id]);

  const requestClose = useCallback(
    (reason: CloseReason) => {
      const s = life.current;
      if (s.closing || s.handedOff) return;
      s.closing = true;
      setPhase('closing');
      if (reason !== 'native') play('close');
      if (reason !== 'history') {
        if (owns && currentMarker()) {
          s.ignorePop = true;
          window.history.back();
        } else if (!owns) cleanShowroomUrl();
      }
      const d = dialog.current;
      if (reason === 'native' || !d) {
        finish();
        return;
      }
      s.anims.forEach((a) => a.cancel());
      const a = d.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: prefersReducedMotion() ? 120 : 160,
        easing: 'ease-in',
        fill: 'forwards',
      });
      s.anims = [a];
      void a.finished.then(finish, finish);
    },
    [finish, owns, play],
  );
  const closeRef = useRef(requestClose);
  useLayoutEffect(() => {
    closeRef.current = requestClose;
  });

  useLayoutEffect(() => {
    const d = dialog.current;
    const surf = surface.current;
    if (!d || !surf) return;
    const s = life.current;
    s.saved = { x: window.scrollX, y: window.scrollY };
    s.release = lockScroll();
    if (!d.open) d.showModal();
    heading.current?.focus({ preventScroll: true });

    if (request.entry === 'push' && currentMarker()?.level !== 'selector') pushSelector();
    else if (request.entry === 'direct') markSelector();

    const calm = prefersReducedMotion() || request.entry === 'direct';
    s.anims = [
      d.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: calm ? 140 : 180,
        easing: 'ease-out',
        fill: 'backwards',
      }),
    ];
    if (!calm)
      s.anims.push(
        surf.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 260,
            easing: EXPO_OUT,
            fill: 'backwards',
          },
        ),
      );
    if (request.entry !== 'direct') play('open');
    let live = true;
    void Promise.allSettled(s.anims.map((a) => a.finished)).then(() => {
      if (live && !s.closing && !s.handedOff) setPhase('open');
    });

    const onPop = () => {
      if (s.ignorePop) {
        s.ignorePop = false;
        return;
      }
      if (!currentMarker()) closeRef.current('history');
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeRef.current('escape');
    };
    const onNativeClose = () => {
      if (!s.closing && !s.handedOff && !d.open) closeRef.current('native');
    };
    window.addEventListener('popstate', onPop);
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onNativeClose);
    return () => {
      live = false;
      window.removeEventListener('popstate', onPop);
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onNativeClose);
      window.clearTimeout(s.timer);
      s.anims.forEach((a) => a.cancel());
      s.release?.();
      s.release = null;
      // Unmounted without closing (dev StrictMode replay, navigation away): undo, no animation.
      if (!s.closing && !s.handedOff && d.open) d.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per request (the component is keyed by it)
  }, []);

  const choose = (e: React.MouseEvent<HTMLButtonElement>) => {
    const s = life.current;
    if (s.closing || s.handedOff || !vertical?.demo) return;
    s.handedOff = true;
    setPhase('handoff');
    play('select');
    track('selector_chosen', { rubro: vertical.id });
    selectVertical(vertical.id, 'selector');
    openDemoExperience(
      {
        vertical: vertical.id,
        demo: vertical.demo,
        origin: 'selector',
        entry: 'handoff',
        ownsEntry: owns,
        openerKey: `selector:${request.origin}`,
      },
      request.opener ?? e.currentTarget,
    );
    // The demo's void (motion.ts OPEN.void) covers this layer; only then does it go.
    s.timer = window.setTimeout(() => clearSelectorRequest(request.id), prefersReducedMotion() ? 180 : OPEN.void + 80);
  };

  const name = vertical ? l(vertical.name, locale) : '';

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={ledeId}
      data-selector-layer
      data-phase={phase}
      className="sx-layer theme-dark"
      onKeyDown={cycleFocus}
    >
      <div ref={surface} className="sx-surface">
        <header className="sx-bar">
          <div className="container-x sx-bar-inner">
            <button type="button" onClick={() => requestClose('button')} className="btn btn-ghost btn-sm sx-back" data-sx-back>
              <ArrowLeft aria-hidden className="size-4" strokeWidth={1.6} />
              <span>{tc('back')}</span>
            </button>
          </div>
        </header>

        <div className="container-x sx-body">
          <h2 ref={heading} id={titleId} tabIndex={-1} className="sx-title">
            {t('title')}
          </h2>
          <p id={ledeId} className="sx-lede">
            {t('lede')}
          </p>

          <ul className="sx-rows" aria-label={t('groupLabel')}>
            <li>
              <button type="button" className="sx-row" data-sx-row="inmobiliarias" aria-describedby={`${titleId}-inm`} onClick={choose}>
                <span className="sx-row-main">
                  <span className="sx-row-name">{name}</span>
                  <span className="sx-row-product">{t('inmobiliarias.product')}</span>
                </span>
                <span id={`${titleId}-inm`} className="sx-row-text">
                  {t('inmobiliarias.text')}
                  <span className="sr-only">. {t('inmobiliarias.action')}</span>
                </span>
                <RowGlyph />
              </button>
            </li>
            <li>
              <button
                type="button"
                className="sx-row"
                data-sx-row="ecommerce"
                aria-disabled="true"
                aria-describedby={`${titleId}-eco`}
                onClick={(e) => e.preventDefault()}
              >
                <span className="sx-row-main">
                  <span className="sx-row-name">{t('ecommerce.name')}</span>
                  <span className="sx-row-product">
                    {t('ecommerce.product')} · <span className="sx-row-soon">{t('ecommerce.soon')}</span>
                  </span>
                </span>
                <span id={`${titleId}-eco`} className="sx-row-text">
                  {t('ecommerce.text')}
                </span>
                <RowGlyph soon />
              </button>
            </li>
          </ul>

          <p className="sx-contact">
            <span>{t('notListed')}</span>{' '}
            <WhatsAppLink origin="selector" message={t('whatsapp')} className="sx-contact-link" onClick={() => play('glint')}>
              <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.6} />
              {t('notListedAction')}
            </WhatsAppLink>
          </p>
        </div>
      </div>
    </dialog>
  );
}

/** The phase glyph at the end of a row: it fills (opacity only) on hover and keyboard focus. */
function RowGlyph({ soon = false }: { soon?: boolean }) {
  return (
    <span aria-hidden className="sx-row-glyph" data-soon={soon || undefined}>
      <PhaseGlyph phase={0.12} size="100%" strokeWidth={1.1} className="sx-glyph-rest" />
      <PhaseGlyph phase={1} size="100%" strokeWidth={1.1} className="sx-glyph-full" />
    </span>
  );
}
