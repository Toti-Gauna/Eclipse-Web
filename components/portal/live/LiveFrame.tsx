'use client';

import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '../Breadcrumbs';
import { AccountBar } from './AccountBar';
import '../guide.css';
import './live.css';

/** The top of every live portal screen: breadcrumbs + (when signed in) the account bar. */
export function LiveFrame({ crumbs, children, account = true }: { crumbs: Crumb[]; children: ReactNode; account?: boolean }) {
  return (
    <div className="container-x pt-page">
      <div className="pt-pagebar">
        <Breadcrumbs items={crumbs} />
      </div>
      {account ? <AccountBar /> : null}
      {children}
    </div>
  );
}
