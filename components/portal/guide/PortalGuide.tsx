'use client';

import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { Tour } from '@/components/ui/tour/Tour';
import type { TourCopy, TourStep } from '@/components/ui/tour/types';
import { PORTAL_TOUR_EVENT } from '@/lib/portal/tour';
import { useTourSeen } from '@/components/ui/tour/useTourSeen';
import '../guide.css';

export interface PortalGuideCopy extends Omit<TourCopy, 'progress'> {
  /** "Paso {current} de {total}" (a template: functions can't cross the server boundary). */
  progress: string;
  /** Visible label of the restart button ("Ayuda"). */
  help: string;
  /** Read after the label by assistive tech ("ver de nuevo la guía de esta pantalla"). */
  helpHint: string;
}

/**
 * The portal's onboarding: opens by itself on the first visit to a screen (once the browser
 * says the guide hasn't been seen), and again from the "Ayuda" button. Finishing, skipping or
 * closing it marks it as seen — only in this browser, as the mockup has no accounts.
 * Steps and copy come from the server as plain data (the `portal` namespace isn't in the
 * client messages).
 */
export function PortalGuide({ tourKey, steps, copy }: { tourKey: string; steps: TourStep[]; copy: PortalGuideCopy }) {
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

  const tourCopy = useMemo<TourCopy>(
    () => ({
      label: copy.label,
      next: copy.next,
      prev: copy.prev,
      done: copy.done,
      skip: copy.skip,
      close: copy.close,
      progress: (current, total) =>
        copy.progress.replace('{current}', String(current)).replace('{total}', String(total)),
    }),
    [copy],
  );

  return (
    <>
      <button
        type="button"
        className="pt-help-btn"
        data-tour="pt-help"
        data-portal-help
        onClick={start}
      >
        <LifeBuoy aria-hidden strokeWidth={1.5} />
        <span className="pt-help-label">{copy.help}</span>
        <span className="sr-only">: {copy.helpHint}</span>
      </button>
      <Tour
        open={open}
        steps={steps}
        root={() => document.querySelector<HTMLElement>('[data-portal]')}
        copy={tourCopy}
        onClose={() => {
          setOpen(false);
          markSeen();
        }}
      />
    </>
  );
}
