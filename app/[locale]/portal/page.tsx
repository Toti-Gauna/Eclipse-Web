import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { portalMetadata } from '@/lib/portal/metadata';
import { portalPaths } from '@/lib/portal/routes';
import { LoginView } from '@/components/portal/LoginView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'portal.meta' });
  return portalMetadata({ locale, title: t('loginTitle'), description: t('loginDescription'), path: portalPaths.login });
}

/** /[locale]/portal/ — demo access to the client portal (no auth: nothing is checked or stored). */
export default async function PortalLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginView />;
}
