import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { IS_LIVE } from '@/lib/env';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { portalMetadata } from '@/lib/portal/metadata';
import { projectById } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { DemoOff } from '@/components/portal/live/DemoOff';
import { ProjectView } from '@/components/portal/detail/ProjectView';

type Params = Promise<{ locale: string; id: string }>;

// Static export: one page per locale × fixture; any other id is a 404.
export const dynamicParams = false;

// Live mode never exports the fictional fixtures (real projects live at /portal/proyecto/?id=…).
// Static export needs at least one path: live mode gets a single inert one that explains itself.
const LIVE_PLACEHOLDER = 'demo-off';
export function generateStaticParams() {
  return IS_LIVE ? [{ id: LIVE_PLACEHOLDER }] : PORTAL_PROJECTS.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const project = IS_LIVE ? undefined : projectById(id);
  if (!hasLocale(routing.locales, locale) || !project) return {};
  const t = await getTranslations({ locale, namespace: 'portal' });
  return portalMetadata({
    locale,
    title: t('meta.projectTitle', { name: t(`demo.projects.${project.id}.name`) }),
    description: t('meta.projectDescription'),
    path: portalPaths.project(project.id),
  });
}

/** /[locale]/portal/proyectos/[id]/ — one fictional project in detail. */
export default async function PortalProjectPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (IS_LIVE) return <DemoOff locale={locale} />;
  const project = projectById(id);
  if (!project) notFound();
  return <ProjectView project={project} />;
}
