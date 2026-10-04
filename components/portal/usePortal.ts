import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { itemById, l, maintenanceById } from '@/lib/content';
import { formatDate } from '@/lib/portal/format';
import { isViewer, personById } from '@/lib/portal/project';
import type { IsoDate, PortalProject, StageId } from '@/lib/portal/types';

/**
 * Words for the portal screens, resolved on the server (no `'use client'`): every portal
 * page renders its copy server-side and hands plain strings to the few client components,
 * so the `portal` namespace never has to ride along in the landing's client messages.
 */
export function usePortal() {
  const t = useTranslations('portal');
  const locale = useLocale() as Locale;

  /** "02 oct 2026" — calendar dates, formatted on the server only (no hydration drift). */
  const date = (iso: IsoDate) => formatDate(iso, locale);

  /** "Vos", "Tomás Luna · Eclipse" or "Martín Ferro · tu equipo". */
  const person = (id: string) => {
    const p = personById(id);
    if (!p) return id;
    if (isViewer(id)) return t('people.you');
    return t(p.side === 'eclipse' ? 'people.eclipse' : 'people.team', { name: p.name });
  };

  /** "Abril Sur · Líder de proyecto". */
  const byline = (id: string) => {
    const p = personById(id);
    return p ? `${p.name} · ${t(`roles.${p.role}`)}` : id;
  };

  const name = (id: string) => personById(id)?.name ?? id;

  /** Fixture copy: portal.demo.projects.<id>.<key>. */
  const text = (project: PortalProject, key: string) => t(`demo.projects.${project.id}.${key}`);

  const stage = (id: StageId) => t(`stages.${id}.name`);

  /** Service names from /content (items), e.g. "Web multipágina". */
  const service = (project: PortalProject) =>
    project.items
      .map((id) => itemById(id))
      .filter((item) => item !== undefined)
      .map((item) => l(item.name, locale))
      .join(' · ');

  const maintenance = (project: PortalProject) => {
    const plan = maintenanceById(project.maintenance);
    return plan ? { name: l(plan.name, locale), includes: l(plan.includes, locale) } : null;
  };

  return { t, locale, date, person, byline, name, text, stage, service, maintenance };
}

export type PortalText = ReturnType<typeof usePortal>;
