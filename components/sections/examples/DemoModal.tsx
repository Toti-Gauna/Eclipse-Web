'use client';

import { lazy, Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { l, type Vertical } from '@/lib/content';
import type { Locale } from '@/i18n/routing';

// The showcase (and the demo inside it) is only downloaded when a demo is opened.
const DemoShowcase = lazy(() => import('@/components/demos/DemoShowcase').then((m) => ({ default: m.DemoShowcase })));

/**
 * "Abrir demo": the navigable demo in a fullscreen <Sheet>, with the business
 * name + visible "Demo" badge, a close button and "Quiero esto para mi negocio".
 * The demo mounts on first open and stays mounted (inactive) afterwards, so
 * reopening is instant and the closing fade never shows an empty panel.
 */
export function DemoModal({
  open,
  mounted,
  onClose,
  vertical,
}: {
  open: boolean;
  /** Render the demo (true after the first open). */
  mounted: boolean;
  onClose: () => void;
  vertical: Vertical;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const wide = useMediaQuery('(min-width: 768px)');
  const business = vertical.business ?? '';
  const titleId = `example-${vertical.id}-modal-title`;
  const verticalName = l(vertical.name, locale);

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

  return (
    <Sheet open={open} onClose={onClose} variant="fullscreen" labelledBy={titleId} panelClassName="ex-modal theme-dark grain">
      <div className="ex-modal-inner">
        <header className="ex-modal-bar container-x">
          {/* First in the DOM so the dialog focuses it on open; shown on the right. */}
          <button type="button" onClick={onClose} className="ex-modal-close" aria-label={t('examples.modal.close')}>
            <X aria-hidden className="size-5" strokeWidth={1.6} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <span className="badge-demo shrink-0">{t('common.demo')}</span>
              <h2 id={titleId} className="display truncate text-[1.7rem] leading-tight md:text-[2.2rem]">
                {business}
                <span className="hidden text-fg-muted sm:inline"> — {t('common.demo')}</span>
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
          <div className="ex-modal-glow" aria-hidden />
          <div className="ex-modal-showcase">
            {mounted ? (
              <Suspense fallback={<ShowcaseSkeleton wide={wide} label={t('examples.modal.loading', { business })} />}>
                <DemoShowcase demo={vertical.demo} business={business} active={open} fit />
              </Suspense>
            ) : null}
          </div>
        </div>

        <div className="ex-modal-cta md:hidden">{wantThis('btn btn-primary w-full')}</div>
      </div>
    </Sheet>
  );
}

/** Same footprint as the devices, so nothing jumps when the showcase chunk lands. */
function ShowcaseSkeleton({ wide, label }: { wide: boolean; label: string }) {
  return (
    <div role="status" className={`relative w-full ${wide ? 'aspect-[1/0.651]' : 'aspect-[9/19.5]'}`}>
      <span className="sr-only">{label}</span>
      <div
        aria-hidden
        className={`absolute animate-pulse bg-dawn/10 ${wide ? 'bottom-[10%] left-0 right-[12%] top-0 rounded-[2.2%/3.4%]' : 'inset-0 rounded-[13%/6%]'}`}
      />
    </div>
  );
}
