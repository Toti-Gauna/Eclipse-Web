'use client';

import { useTranslations } from 'next-intl';
import { BrowserFrame, Kpi } from '../../kit';
import { SITE_URL } from '../data';
import { useShop } from '../context';
import { ViewHead } from '../ui';
import { Storefront } from '../front/Storefront';
import { useSales } from './Today';

/** The owner previews the live store (the visitor can shop in it). */
export function LaptopSite() {
  const t = useTranslations('demoShop.site');
  const { view } = useShop();
  const s = useSales();
  const carts = (view.ines.status === 'checkout' || view.ines.status === 'browsing' ? 1 : 0) + 3;
  return (
    <div className="shop-siteview">
      <ViewHead
        title={t('title')}
        sub={t('sub', { url: SITE_URL })}
        aside={
          <div className="shop-kpis" data-compact="">
            <Kpi label={t('visits')} value={view.visits} />
            <Kpi label={t('orders')} value={s.orders} />
            <Kpi label={t('carts')} value={carts} />
          </div>
        }
      />
      <BrowserFrame url={SITE_URL} className="shop-browser">
        <Storefront variant="desktop" />
      </BrowserFrame>
    </div>
  );
}
