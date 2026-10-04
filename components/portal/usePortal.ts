import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { itemById, l, maintenanceById } from '@/lib/content';
import { formatDate } from '@/lib/portal/format';
import { isViewer, personById } from '@/lib/portal/project';
import type { IsoDate, PortalProject, RoleId, StageId } from '@/lib/portal/types';
import type { InfoTipCopy } from './InfoTip';

/** Terms with a "Más información" card (`portal.info.<topic>`). */
export type InfoTopic = 'stages' | 'estimate' | 'action' | 'clientReview' | 'support' | 'changes';

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

  /** Eclipse's side by role only: "Eclipse · Desarrollo". */
  const eclipse = (role: RoleId) => t('people.eclipse', { role: t(`roles.${role}`) });

  /** "Vos", "Eclipse · Desarrollo" or "Martín Ferro · tu equipo". */
  const person = (id: string) => {
    const p = personById(id);
    if (!p) return id;
    if (isViewer(id)) return t('people.you');
    return p.side === 'eclipse' ? eclipse(p.role) : t('people.team', { name: p.name });
  };

  /** "Eclipse · Líder de proyecto" or "Lucía Ferro · Administradora". */
  const byline = (id: string) => {
    const p = personById(id);
    if (!p) return id;
    return p.side === 'eclipse' ? eclipse(p.role) : `${p.name} · ${t(`roles.${p.role}`)}`;
  };

  /** Just the role ("Líder de proyecto"), where the label already says who. */
  const role = (id: string) => {
    const p = personById(id);
    return p ? t(`roles.${p.role}`) : id;
  };

  const name = (id: string) => {
    const p = personById(id);
    if (!p) return id;
    return p.side === 'eclipse' ? eclipse(p.role) : p.name;
  };

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

  /** Copy of a "Más información" card; `chip` adds its visible text (legend). */
  const info = (topic: InfoTopic, chip = false): InfoTipCopy => {
    const title = t(`info.${topic}.title`);
    return {
      label: t('info.more', { topic: title }),
      title,
      body: t(`info.${topic}.body`),
      close: t('info.close'),
      text: chip ? t(`info.${topic}.chip`) : undefined,
    };
  };

  return { t, locale, date, person, byline, role, name, text, stage, service, maintenance, info };
}

export type PortalText = ReturnType<typeof usePortal>;
