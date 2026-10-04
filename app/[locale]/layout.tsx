import '../globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { fontMono, fontSans, fontSerif } from '../fonts';
import { baseMetadata } from '@/lib/seo';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { DEMO_NAMESPACES } from '@/components/demos/namespaces';
import { PORTAL_NAMESPACES } from '@/lib/portal/namespaces';
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
  const tLoader = await getTranslations('loader');
  // Demo copy is loaded with the demo code (<DemoMessages>). In development it stays in the
  // payload so drafts (messages/drafts, overlaid server-side only) reach the demos too.
  // The portal translates on the server (its client components get plain strings), so its
  // namespace stays out of every page's payload as well.
  const serverOnly: readonly string[] = [...DEMO_NAMESPACES, ...PORTAL_NAMESPACES];
  const clientMessages =
    process.env.NODE_ENV === 'development'
      ? messages
      : Object.fromEntries(Object.entries(messages).filter(([ns]) => !serverOnly.includes(ns)));

  return (
    <html lang={localeTags[locale as Locale]} suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADER_HEAD_SCRIPT }} />
      </head>
      <body className="theme-dark bg-void">
        <Loader endLine={tLoader('endLine')} />
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
