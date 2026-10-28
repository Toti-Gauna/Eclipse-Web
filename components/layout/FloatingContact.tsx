'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { getTourState, subscribeTour } from '@/components/tour/autoTour';
import './floating-contact.css';

/**
 * «Contactanos», bottom left (decision of Ignacio, 28/10/2026): a quiet WhatsApp pill that pairs with the
 * floating «Potenciar» on the right — never a second solid amber. Rendered by <Header> in landing mode.
 * It steps aside while the auto tour's «Seguir con el tour» pill holds the bottom of the screen.
 */
export function FloatingContact() {
  const t = useTranslations('contactFloat');
  const tour = useSyncExternalStore(subscribeTour, getTourState, () => 'idle' as const);
  const off = tour === 'paused';
  return (
    <div className="fcontact" data-off={off || undefined}>
      <WhatsAppLink
        origin="floating_contact"
        message={t('message')}
        aria-label={t('aria')}
        tabIndex={off ? -1 : undefined}
        aria-hidden={off || undefined}
        className="fcontact-btn"
      >
        <MessageCircle aria-hidden className="size-[1.15rem]" strokeWidth={1.5} />
        <span>{t('label')}</span>
      </WhatsAppLink>
    </div>
  );
}
