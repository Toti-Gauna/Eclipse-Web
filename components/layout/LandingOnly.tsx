'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { chromeRoute } from './navLinks';

/**
 * Renders its children on every route but the client portal, where `fallback` (if any)
 * shows instead: the portal's chrome carries no sales blocks (see chromeRoute). Client-side
 * so the footer, which the root layout renders once for every route, follows navigations.
 */
export function LandingOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const pathname = usePathname();
  return chromeRoute(pathname).mode === 'portal' ? fallback : children;
}
