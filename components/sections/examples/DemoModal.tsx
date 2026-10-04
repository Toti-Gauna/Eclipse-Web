'use client';

import { Suspense, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Monitor, Smartphone, X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { ShowcasePoster } from '@/components/demos/DeviceFrame';
import { l, type Vertical } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { LazyShowcase } from './lazyShowcase';

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab cycling inside the dialog (the native one lets focus reach the browser UI). */
function cycleFocus(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== 'Tab') return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => !el.closest('[inert], [hidden]') && el.getClientRects().length > 0 && (el.checkVisibility?.({ visibilityProperty: true }) ?? true),
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * "Abrir demo": the navigable demo in a fullscreen <Sheet> (native dialog: Escape closes,
 * the page behind is inert and its scroll locked), with the business name + visible "Demo"
 * badge, a visible close button (first in the DOM, so it gets the focus on open) and
 * "Quiero esto para mi negocio". Inside, the same frameless views as everywhere: desktop
 * left / mobile right when there is room, "Celular | Escritorio" tabs on phones.
 * The demo mounts on open and unmounts after the closing fade (DemoTheater), with a static
 * poster of the same geometry meanwhile. Focus cycles inside and returns to the opener.
 */
export function DemoModal({
  open,
  mounted,
  onClose,
  vertical,
  returnFocus,
}: {
  open: boolean;
  /** Render the live demo (while open and during the closing fade). */
  mounted: boolean;
  onClose: () => void;
  vertical: Vertical;
  /** Gets the focus back when the dialog closes ("Abrir demo"). */
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const business = vertical.business ?? '';
  const titleId = `example-${vertical.id}-modal-title`;
  const verticalName = l(vertical.name, locale);

  // Focus: the close button on open (the dialog could pick its scrolling panel instead);
  // back to the opener on close (the native dialog does it too; this covers engines that don't).
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      // Runs after <Sheet> (a child) called showModal().
      closeButton.current?.focus({ preventScroll: true });
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const id = window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body) returnFocus?.current?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(id);
  }, [open, returnFocus]);

  if (!vertical.demo) return null;

  const wantThis = (className: string) => (
    <WhatsAppLink
      origin="demo_modal"
      message={t('whatsapp.wantThis', { business, vertical: verticalName })}
      extra={{ vertical: vertical.id }}
      className={className}
    >
      <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
      {t('examples.modal.wantThis')}
    </WhatsAppLink>
  );
  const poster = (
    <ShowcasePoster
      demo={vertical.demo}
      captions={{
        laptop: (
          <>
            <Monitor aria-hidden strokeWidth={1.5} />
            {t('demoShowcase.desktop')}
          </>
        ),
        phone: (
          <>
            <Smartphone aria-hidden strokeWidth={1.5} />
            {t('demoShowcase.mobile')}
          </>
        ),
      }}
    />
  );

  return (
    <Sheet open={open} onClose={onClose} variant="fullscreen" labelledBy={titleId} panelClassName="ex-modal theme-dark grain">
      <div className="ex-modal-inner" onKeyDown={cycleFocus}>
        <header className="ex-modal-bar">
          {/* First in the DOM (and focused on open); shown on the right. */}
          <button ref={closeButton} type="button" onClick={onClose} className="ex-modal-close" aria-label={t('examples.modal.close')}>
            <X aria-hidden className="size-5" strokeWidth={1.6} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <span className="badge-demo shrink-0">{t('common.demo')}</span>
              <h2 id={titleId} className="display truncate text-[1.7rem] leading-tight md:text-[2.2rem]">
                {business}
                <span className="hidden text-fg-muted lg:inline"> — {t('common.demo')}</span>
              </h2>
            </div>
            <p className="mt-1 text-[0.8rem] leading-snug text-fg-muted sm:text-sm">
              <span className="hidden sm:inline">{verticalName} · </span>
              {t('examples.modal.hint')}
            </p>
          </div>
          <div className="hidden md:block">{wantThis('btn btn-primary btn-sm')}</div>
        </header>

        <div className="ex-modal-stage">
          <div className="ex-modal-showcase">
            {mounted ? (
              <Suspense
                fallback={
                  <>
                    {poster}
                    <span role="status" className="sr-only">
                      {t('examples.modal.loading', { business })}
                    </span>
                  </>
                }
              >
                <LazyShowcase demo={vertical.demo} business={business} active={open} fit />
              </Suspense>
            ) : null}
          </div>
        </div>

        <div className="ex-modal-cta md:hidden">{wantThis('btn btn-primary w-full')}</div>
      </div>
    </Sheet>
  );
}
