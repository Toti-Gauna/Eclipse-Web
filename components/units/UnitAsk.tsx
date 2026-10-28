'use client';

import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useSound } from '@/components/sound/SoundContext';
import type { WhatsAppOrigin } from '@/lib/whatsapp';

/** A unit's or product's WhatsApp CTA: a real wa.me link with its prefilled message (and the glint). */
export function UnitAsk({
  message,
  origin = 'unit',
  className = 'btn btn-primary',
  unit,
  children,
}: {
  message: string;
  origin?: WhatsAppOrigin;
  className?: string;
  unit: string;
  children: ReactNode;
}) {
  const { play } = useSound();
  return (
    <WhatsAppLink origin={origin} message={message} extra={{ unit }} className={className} onClick={() => play('glint')}>
      <MessageCircle aria-hidden className="size-4" strokeWidth={1.8} />
      {children}
    </WhatsAppLink>
  );
}
