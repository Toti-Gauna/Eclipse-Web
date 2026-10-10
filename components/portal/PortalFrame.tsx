import type { ReactNode } from 'react';
import { IS_LIVE } from '@/lib/env';
import { DemoNotice } from './DemoNotice';
import './portal.css';

/**
 * The portal's <main>: a light (dawn) workspace lit from the top right, with the demo
 * notice under the shared header. `data-header-theme="light"` flips the header to ink.
 * In live mode there is no demo notice: nothing on screen is fictional.
 */
export function PortalFrame({ children }: { children: ReactNode }) {
  return (
    <main id="main" data-portal data-portal-mode={IS_LIVE ? 'live' : 'demo'} data-header-theme="light" className="pt-main theme-light bg-dawn">
      <div aria-hidden className="pt-light" />
      {IS_LIVE ? null : <DemoNotice />}
      {children}
    </main>
  );
}
