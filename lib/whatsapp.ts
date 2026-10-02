import { WHATSAPP_NUMBER } from '@/lib/env';
import { track } from '@/lib/analytics';

/** Where a WhatsApp click came from (analytics `origin`). */
export type WhatsAppOrigin =
  | 'header'
  | 'hero'
  | 'hero_demo'
  | 'calculator'
  | 'examples'
  | 'examples_not_listed'
  | 'demo_modal'
  | 'plan_card'
  | 'builder'
  | 'founders'
  | 'agent'
  | 'final_cta'
  | 'footer';

/** wa.me link with a prefilled, URL-encoded message. */
export function whatsappUrl(text?: string, number: string = WHATSAPP_NUMBER): string {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Tracks and opens WhatsApp in a new tab. Prefer <WhatsAppLink> (a real <a>) when possible. */
export function openWhatsApp(text: string, origin: WhatsAppOrigin, extra: Record<string, string | number> = {}): void {
  track('whatsapp_opened', { origin, ...extra });
  if (typeof window !== 'undefined') window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
}
