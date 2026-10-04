import type { ReactNode } from 'react';
import { DemoNotice } from './DemoNotice';
import './portal.css';

/**
 * The portal's <main>: a light (dawn) workspace lit from the top right, with the demo
 * notice under the shared header. `data-header-theme="light"` flips the header to ink.
 */
export function PortalFrame({ children }: { children: ReactNode }) {
  return (
    <main id="main" data-portal data-header-theme="light" className="pt-main theme-light bg-dawn">
      <div aria-hidden className="pt-light" />
      <DemoNotice />
      {children}
    </main>
  );
}
