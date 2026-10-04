import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { PortalFrame } from '@/components/portal/PortalFrame';

/**
 * Client portal mockup (v3): same app, header and footer as the site; frontend only, with
 * fictional fixtures. Every page carries the demo notice (rendered by <PortalFrame>).
 */
export default async function PortalLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortalFrame>{children}</PortalFrame>;
}
