import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { portalMetadata } from '@/lib/portal/metadata';
import { portalPaths } from '@/lib/portal/routes';
import { ProjectsView } from '@/components/portal/projects/ProjectsView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'portal.meta' });
  return portalMetadata({ locale, title: t('projectsTitle'), description: t('projectsDescription'), path: portalPaths.projects });
}

/** /[locale]/portal/proyectos/ — "Mis proyectos" (fictional fixtures). */
export default async function PortalProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProjectsView />;
}
