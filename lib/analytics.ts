/**
 * Analytics stub. Today it only logs with console.debug; it already forwards to
 * Plausible (`window.plausible`) or GA4 (`window.gtag`) if either script is added.
 */
export type AnalyticsEvent =
  | 'vertical_selected'
  | 'demo_opened'
  | 'trailer_played'
  | 'calculator_used'
  | 'plan_cta_clicked'
  | 'builder_opened'
  | 'builder_item_toggled'
  | 'builder_sent'
  | 'founder_cta_clicked'
  | 'whatsapp_opened'
  | 'locale_changed'
  | 'currency_changed';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type Plausible = (event: string, options?: { props?: AnalyticsProps }) => void;
type Gtag = (command: 'event', event: string, params?: AnalyticsProps) => void;

declare global {
  interface Window {
    plausible?: Plausible;
    gtag?: Gtag;
  }
}

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;
  try {
    if (process.env.NODE_ENV !== 'production' || window.location.search.includes('debug-analytics')) {
      console.debug('[analytics]', event, props);
    }
    window.plausible?.(event, { props });
    window.gtag?.('event', event, props);
    window.dispatchEvent(new CustomEvent('eclipse:analytics', { detail: { event, props } }));
  } catch {
    // Analytics must never break the page.
  }
}
