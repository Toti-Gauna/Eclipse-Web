import type { Metadata } from 'next';
import { Suspense } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { portalMetadata } from '@/lib/portal/metadata';
import { portalPaths } from '@/lib/portal/routes';
import { ProjectsView } from '@/components/portal/projects/ProjectsView';
import { LiveProjects } from '@/components/portal/live/LiveProjects';
import { IS_LIVE } from '@/lib/env';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: IS_LIVE ? 'portalLive.meta' : 'portal.meta' });
  return portalMetadata({
    locale,
    title: IS_LIVE ? t('projectsLiveTitle') : t('projectsTitle'),
    description: IS_LIVE ? t('projectsLiveDescription') : t('projectsDescription'),
    path: portalPaths.projects,
  });
}

/** /[locale]/portal/proyectos/ — "Mis proyectos": fictional fixtures (demo) or the API's list (live). */
export default async function PortalProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!IS_LIVE) return <ProjectsView />;
  return (
    <Suspense fallback={null}>
      <LiveProjects />
    </Suspense>
  );
}
