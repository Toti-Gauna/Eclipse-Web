'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LifeBuoy } from 'lucide-react';
import { Tour } from '@/components/ui/tour/Tour';
import type { TourStep } from '@/components/ui/tour/types';
import { useTourCopy } from '@/components/ui/tour/useTourCopy';
import { useTourSeen } from '@/components/ui/tour/useTourSeen';
import { PORTAL_TOUR_EVENT } from '@/lib/portal/tour';
import '../guide.css';

/**
 * The portal's onboarding: opens by itself on the first visit to a screen (once the browser
 * says the guide hasn't been seen) and again from the "Ayuda" button. Finishing, skipping or
 * closing it marks it as seen through the engine's `useTourSeen` — only in this browser
 * (localStorage `eclipse:tour:<key>`), as the mockup has no accounts; a real backend would
 * keep it per account.
 *
 * Steps and the tour's name come from the server as plain strings (the `portal` namespace
 * isn't in the client messages); the generic controls (next, back, skip, "Ayuda"…) come from
 * the shared `tour` namespace, like the demo guide.
 */
export function PortalGuide({ tourKey, label, steps }: { tourKey: string; label: string; steps: TourStep[] }) {
  const t = useTranslations('tour');
  const copy = useTourCopy(label);
  const { seen, markSeen } = useTourSeen(tourKey);
  const [open, setOpen] = useState(false);

  const start = () => {
    window.dispatchEvent(new Event(PORTAL_TOUR_EVENT));
    setOpen(true);
  };

  // First visit: let the page settle (fonts, layout) before lighting the first target.
  useEffect(() => {
    if (seen !== false) return;
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event(PORTAL_TOUR_EVENT));
      setOpen(true);
    }, 500);
    return () => window.clearTimeout(id);
  }, [seen]);

  return (
    <>
      <button type="button" className="pt-help-btn" data-tour="pt-help" data-portal-help onClick={start}>
        <LifeBuoy aria-hidden strokeWidth={1.5} />
        <span className="pt-help-label">{t('help')}</span>
        <span className="sr-only">: {t('replay')}</span>
      </button>
      <Tour
        open={open}
        steps={steps}
        root={() => document.querySelector<HTMLElement>('[data-portal]')}
        copy={copy}
        onClose={() => {
          setOpen(false);
          markSeen();
        }}
      />
    </>
  );
}
