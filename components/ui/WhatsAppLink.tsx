'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { whatsappUrl, type WhatsAppOrigin } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

/** A real link to wa.me (works without JS) that tracks `whatsapp_opened`. */
export function WhatsAppLink({
  message,
  origin,
  extra,
  children,
  onClick,
  ...rest
}: {
  message?: string;
  origin: WhatsAppOrigin;
  extra?: Record<string, string | number>;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        track('whatsapp_opened', { origin, ...extra });
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
