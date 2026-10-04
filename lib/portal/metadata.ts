import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { baseMetadata } from '@/lib/seo';

/**
 * Metadata for a portal page: the site's canonical/hreflang/OG plus `noindex` — the demo
 * portal is fictional data and shouldn't show up in search results.
 */
export async function portalMetadata(opts: { locale: Locale; title: string; description: string; path: string }): Promise<Metadata> {
  const tMeta = await getTranslations({ locale: opts.locale, namespace: 'meta' });
  return {
    ...baseMetadata({ ...opts, ogAlt: tMeta('ogAlt') }),
    robots: { index: false, follow: true },
  };
}
