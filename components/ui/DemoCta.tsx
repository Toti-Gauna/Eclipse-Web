'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import type { WhatsAppOrigin } from '@/lib/whatsapp';

/**
 * "Pedí tu demo": opens WhatsApp with a prefilled message that includes the
 * vertical chosen in the hero (if any).
 */
export function DemoCta({
  origin,
  className = 'btn btn-primary',
  children,
  icon = true,
}: {
  origin: WhatsAppOrigin;
  className?: string;
  children?: ReactNode;
  icon?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { vertical } = useExperience();
  const v = verticalById(vertical);
  const message = v && v.id !== 'otro' ? t('whatsapp.demo', { vertical: l(v.name, locale) }) : t('whatsapp.demoNoVertical');
  return (
    <WhatsAppLink message={message} origin={origin} extra={{ vertical: vertical ?? 'none' }} className={className}>
      {icon ? <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} /> : null}
      {children ?? t('hero.ctaDemo')}
    </WhatsAppLink>
  );
}
