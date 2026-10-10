import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { PortalFrame } from '@/components/portal/PortalFrame';
import { IS_LIVE } from '@/lib/env';

type Tree = Record<string, unknown>;

/**
 * The parts of the demo portal's copy the live screens reuse (stage names and definitions,
 * the detail labels, the list columns, the "Más información" cards). Everything that talks
 * about fictional data or a missing backend (`demo`, `notice`, `login`, `guide`, the
 * "requires backend" and placeholder-document strings…) stays out of the live payload.
 */
function liveSubset(portal: Record<string, Tree> | undefined): Tree {
  if (!portal) return {};
  const pick = (source: Tree | undefined, keys: string[]) => Object.fromEntries(keys.filter((k) => source && k in source).map((k) => [k, source![k]]));
  const omit = (source: Tree | undefined, keys: string[]) => Object.fromEntries(Object.entries(source ?? {}).filter(([k]) => !keys.includes(k)));
  return {
    nav: portal.nav,
    stage: portal.stage,
    stages: portal.stages,
    info: portal.info,
    projects: pick(portal.projects, ['label', 'hello', 'summaryTitle', 'overall', 'buckets', 'lastUpdate', 'yourTurn', 'listTitle', 'columns', 'view']),
    detail: omit(portal.detail, ['needsBackend', 'needsBackendNote', 'actions', 'docs', 'docCategory']),
  };
}

/**
 * Client portal: same app, header and footer as the site.
 * - demo (no backend): fictional fixtures; every page carries the demo notice (<PortalFrame>).
 * - live (NEXT_PUBLIC_PORTAL_MODE=live): the screens are client components that talk to the
 *   API, so they get the portal copy through their own provider. The demo fixtures' copy
 *   (`portal.demo`) is left out: live mode never shows it.
 */
export default async function PortalLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!IS_LIVE) return <PortalFrame>{children}</PortalFrame>;
  const messages = await getMessages();
  const portal = liveSubset(messages.portal as Record<string, Record<string, unknown>> | undefined);
  return (
    <NextIntlClientProvider messages={{ portal, portalLive: messages.portalLive }}>
      <PortalFrame>{children}</PortalFrame>
    </NextIntlClientProvider>
  );
}
