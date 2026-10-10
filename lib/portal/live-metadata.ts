import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { portalMetadata } from './metadata';

/** generateMetadata for a live portal page: `portalLive.meta.<key>Title|Description`, noindex. */
export function liveMetadata(key: string, path: string) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) return {};
    const t = await getTranslations({ locale, namespace: 'portalLive.meta' });
    return portalMetadata({ locale, title: t(`${key}Title`), description: t(`${key}Description`), path });
  };
}
