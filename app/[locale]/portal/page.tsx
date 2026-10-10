import type { Metadata } from 'next';
import { Suspense } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { IS_LIVE } from '@/lib/env';
import { portalMetadata } from '@/lib/portal/metadata';
import { portalPaths } from '@/lib/portal/routes';
import { LoginView } from '@/components/portal/LoginView';
import { LiveLogin } from '@/components/portal/live/LiveLogin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: IS_LIVE ? 'portalLive.meta' : 'portal.meta' });
  return portalMetadata({
    locale,
    title: IS_LIVE ? t('loginLiveTitle') : t('loginTitle'),
    description: IS_LIVE ? t('loginLiveDescription') : t('loginDescription'),
    path: portalPaths.login,
  });
}

/**
 * /[locale]/portal/ — demo: access to the example portal (no auth: nothing is checked or
 * stored). Live: the real sign-in against the backend.
 */
export default async function PortalLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!IS_LIVE) return <LoginView />;
  return (
    <Suspense fallback={null}>
      <LiveLogin />
    </Suspense>
  );
}
