import type { Metadata } from 'next';
import { use } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { baseMetadata } from '@/lib/seo';
import { AcademyUnitPage } from '@/components/units/UnitPages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return baseMetadata({ locale, title: t('pages.academy.title'), description: t('pages.academy.description'), ogAlt: t('ogAlt'), path: '/academy/' });
}

/** /[locale]/academy/ — Eclipse Academy, its own page (header: Media · Academy · Intelligence · Agency). */
export default function AcademyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <AcademyUnitPage />;
}
