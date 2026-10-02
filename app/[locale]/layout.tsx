import '../globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { fontSans, fontSerif } from '../fonts';
import { baseMetadata } from '@/lib/seo';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#05050A',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return baseMetadata({ locale, title: t('title'), description: t('description'), ogAlt: t('ogAlt') });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={localeTags[locale as Locale]} data-scroll-behavior="smooth" className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body className="theme-dark bg-void">
        <NextIntlClientProvider>
          <AppProviders locale={locale as Locale}>
            <Header />
            {children}
            <Footer />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
