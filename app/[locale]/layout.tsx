import '../globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { fontSans, fontSerif } from '../fonts';
import { baseMetadata } from '@/lib/seo';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { DEMO_NAMESPACES } from '@/components/demos/namespaces';
import { Footer } from '@/components/layout/Footer';
import { LazyHydrate } from '@/components/motion/LazyHydrate';
import { Loader, LOADER_HEAD_SCRIPT } from '@/components/loader/Loader';

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
  // The demos' copy (~40% of all messages) ships with the demo code, not with every page.
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([ns]) => !(DEMO_NAMESPACES as readonly string[]).includes(ns)),
  );

  return (
    <html lang={localeTags[locale as Locale]} suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADER_HEAD_SCRIPT }} />
      </head>
      <body className="theme-dark bg-void">
        <Loader />
        <NextIntlClientProvider messages={clientMessages}>
          <AppProviders locale={locale as Locale}>
            <Header />
            {children}
            <LazyHydrate>
              <Footer />
            </LazyHydrate>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
