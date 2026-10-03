'use client';

import type { CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Flame, RotateCcw } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { Card, Kpi, Pill, Readout, Sparkline, ToastStack } from '../../kit';
import { LAST_WEEK_TICKETS, LOW_STOCK, ORDERS_BEFORE, PRODUCTS, RESTOCK_BAGS } from '../data';
import { act, type OrderView } from '../story';
import { useShop } from '../context';
import { Bag, BagStack, PersonAvatar, useShopMoney, useShopText, useToastItems, ViewHead } from '../ui';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                        */
/* ------------------------------------------------------------------ */
/** Today's money: revenue, orders, conversion, average ticket (all live). */
export function useSales() {
  const { view, ticketUsd } = useShop();
  const money = useShopMoney();
  const base = money.local(ticketUsd) * ORDERS_BEFORE;
  const added = view.newOrders.reduce((s, o) => s + money.totals(o.lines, o.coupon).total, 0);
  const orders = ORDERS_BEFORE + view.newOrders.length;
  const revenue = base + added;
  const lastWeek = money.local(ticketUsd) * LAST_WEEK_TICKETS;
  // The average is shown rounded like a price (ARS to the hundred).
  const step = money.currency === 'ARS' ? 100 : 1;
  return { revenue, orders, conversion: orders / view.visits, ticket: Math.round(revenue / orders / step) * step, lastWeek };
}

export function ShopToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const items = useToastItems();
  return <ToastStack items={items} placement={placement} />;
}

/** The pay method as a pill. */
export function PayPill({ pay }: { pay: OrderView['pay'] }) {
  const t = useTranslations('demoShop.pays');
  return <span className="shop-paypill">{t(pay)}</span>;
}

export function ViaPill({ order }: { order: OrderView }) {
  const t = useTranslations('demoShop.via');
  if (order.via === 'recovered') return <Pill tone="accent" icon={RotateCcw} solid>{t('recovered')}</Pill>;
  if (order.via === 'club') return <Pill tone="accent2">{t('club')}</Pill>;
  if (order.via === 'you') return <Pill tone="ink" solid>{t('you')}</Pill>;
  return null;
}

/** One order as a receipt row: who, the bags, how they paid, how much. */
export function OrderRow({ order, compact = false }: { order: OrderView; compact?: boolean }) {
  const { view } = useShop();
  const { person, fmt } = useShopText();
  const money = useShopMoney();
  const fresh = order.at >= 0 && view.t - order.at < 2600;
  return (
    <li className={`shop-order ${fresh ? 'demo-fresh' : ''}`} data-compact={compact ? '' : undefined} data-fresh={fresh ? '' : undefined}>
      <PersonAvatar id={order.customer} />
      <span className="min-w-0 flex-1 leading-[1.2]">
        <span className="flex min-w-0 items-center gap-[0.4em]">
          <span className="truncate font-semibold">{person(order.customer)}</span>
          <ViaPill order={order} />
        </span>
        <span className="shop-order-meta demo-mono">
          #{order.id} · {fmt.time(order.clock)}
        </span>
      </span>
      <BagStack lines={order.lines} max={compact ? 2 : 3} />
      <span className="shop-order-right">
        <b className="demo-mono">{money.fmt(money.totals(order.lines, order.coupon).total)}</b>
        <PayPill pay={order.pay} />
      </span>
    </li>
  );
}

/** "1 in 5": this week's abandoned carts as fifteen little bags, the recovered ones lit. */
export function RecoveredCard({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const t = useTranslations('demoShop.today');
  const locale = useLocale() as Locale;
  const { view } = useShop();
  const key = verticalById('tiendas')?.keyNumber;
  const { abandoned, paid } = view.week;
  const lit = view.ines.status === 'recovered' && view.t - view.ines.statusAt < 2600;
  const body = (
    <>
      <span className="shop-rec-label">{t('recovered')}</span>
      <span className="shop-rec-value demo-display">
        <Readout value={paid} />
        <span className="shop-rec-of">
          {t('of')} <Readout value={abandoned} />
        </span>
      </span>
      <ol className="shop-rec-bags" aria-hidden style={{ '--n': abandoned } as CSSProperties}>
        {Array.from({ length: abandoned }, (_, i) => (
          <li key={i} data-on={i < paid ? '' : undefined} data-new={lit && i === paid - 1 ? '' : undefined} style={{ '--i': i } as CSSProperties} />
        ))}
      </ol>
      <span className="shop-rec-key">{key ? l(key.headline, locale) : ''}</span>
      {onOpen ? (
        <span className="shop-rec-open" aria-hidden>
          <ArrowUpRight strokeWidth={2} />
        </span>
      ) : null}
    </>
  );
  return onOpen ? (
    <button type="button" className="shop-rec" data-compact={compact ? '' : undefined} onClick={onOpen} aria-label={`${t('recovered')}: ${paid} / ${abandoned}. ${t('open')}`}>
      {body}
    </button>
  ) : (
    <div className="shop-rec" data-compact={compact ? '' : undefined}>
      {body}
    </div>
  );
}

/** The shelf: every product standing in line, sold today and what's left. Low stock → schedule a roast. */
export function Shelf({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.today');
  const { view, store, active } = useShop();
  const { product } = useShopText();
  const { play } = useSound();
  const low = view.lowStock;
  return (
    <section className="shop-shelf" data-compact={compact ? '' : undefined} aria-label={t('shelf')}>
      <div className="shop-shelf-head">
        <h3 className="shop-card-title">{t('shelf')}</h3>
        {low ? (
          <Pill tone="bad" className="shop-shelf-alert">
            {t('lowPill', { name: product(low), count: view.stock[low] })}
          </Pill>
        ) : view.restockAt !== null ? (
          <Pill tone="ok" icon={Flame}>
            {t('restocked', { count: RESTOCK_BAGS })}
          </Pill>
        ) : null}
      </div>
      <ul className="shop-shelf-row">
        {PRODUCTS.map((p) => {
          const left = view.stock[p.id];
          const isLow = p.kind === 'coffee' && left <= LOW_STOCK;
          return (
            <li key={p.id} className="shop-shelf-item" data-low={isLow ? '' : undefined}>
              <span className={`shop-shelf-art ${isLow ? 'demo-loop' : ''}`}>
                <Bag product={p.id} text={!compact} />
              </span>
              <span className="shop-shelf-name">{product(p.id)}</span>
              <span className="shop-shelf-sold demo-mono">
                ×<Readout value={view.sold[p.id]} />
              </span>
              <span className="shop-shelf-stock demo-mono" aria-label={t('stockSr', { count: left })}>
                {t('stock', { count: left })}
              </span>
            </li>
          );
        })}
      </ul>
      <span aria-hidden className="shop-shelf-plank" />
      {low ? (
        <button
          type="button"
          className="shop-shelf-restock"
          onClick={() => {
            store.update(act.restock());
            store.engage();
            if (active) play('success', { volume: 0.6 });
          }}
        >
          <Flame aria-hidden strokeWidth={1.8} />
          {t('restock', { name: product(low), count: RESTOCK_BAGS })}
        </button>
      ) : null}
    </section>
  );
}

/** Live orders (newest first). */
export function LiveOrders({ limit = 4, compact = false }: { limit?: number; compact?: boolean }) {
  const t = useTranslations('demoShop.today');
  const { view } = useShop();
  return (
    <Card className="shop-live">
      <div className="shop-live-head">
        <h3 className="shop-card-title">{t('live')}</h3>
        <span className="shop-live-dot demo-loop" aria-hidden />
      </div>
      <ul className="shop-orders">
        {view.orders.slice(0, limit).map((o) => (
          <OrderRow key={o.key} order={o} compact={compact} />
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Views                                                                */
/* ------------------------------------------------------------------ */
function Revenue({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.today');
  const { fmt } = useShopText();
  const money = useShopMoney();
  const s = useSales();
  const delta = s.revenue / s.lastWeek - 1;
  // Cumulative revenue hour by hour (9 → 18 h), the last point is now.
  const curve = [0.02, 0.05, 0.13, 0.24, 0.27, 0.36, 0.48, 0.53, 0.66, 0.74, 0.86].map((r) => r * s.revenue);
  return (
    <div className="shop-revenue" data-compact={compact ? '' : undefined}>
      <p className="shop-revenue-label">{t('revenue')}</p>
      <p className="shop-revenue-value demo-display" aria-live="polite">
        <Readout value={s.revenue} format={money.fmt} />
      </p>
      <p className="shop-revenue-delta">
        <span className="demo-mono">{fmt.signedPct(delta)}</span> {t('vsLastWeek')}
      </p>
      <Sparkline values={[...curve, s.revenue]} label={t('curve')} tone="accent" className="shop-revenue-spark" />
    </div>
  );
}

function Kpis({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.today');
  const { fmt } = useShopText();
  const { view } = useShop();
  const money = useShopMoney();
  const s = useSales();
  const pct = new Intl.NumberFormat(fmt.tag, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="shop-kpis" data-compact={compact ? '' : undefined}>
      <Kpi label={t('orders')} value={s.orders} />
      <Kpi label={t('conversion')} value={Math.round(s.conversion * 1000)} format={(n) => pct.format(n / 1000)} hint={t('visits', { count: view.visits })} />
      <Kpi label={t('ticket')} value={s.ticket} format={money.fmt} />
    </div>
  );
}

export function LaptopToday() {
  const t = useTranslations('demoShop.today');
  const { go } = useShop();
  return (
    <div className="shop-today">
      <div className="shop-today-top">
        <Revenue />
        <Kpis />
      </div>
      <Shelf />
      <div className="shop-today-bottom">
        <div className="shop-today-side">
          <RecoveredCard onOpen={() => go('carts')} />
          <button type="button" className="shop-botline" onClick={() => go('chat')}>
            <span className="min-w-0 flex-1 text-left">{t('botLine')}</span>
            <ArrowUpRight aria-hidden strokeWidth={2} />
          </button>
        </div>
        <LiveOrders limit={4} />
      </div>
    </div>
  );
}

export function PhoneToday() {
  const { go } = useShop();
  return (
    <div className="shop-today" data-screen="phone">
      <Revenue compact />
      <Kpis compact />
      <RecoveredCard compact onOpen={() => go('carts')} />
      <LiveOrders limit={3} compact />
      <Shelf compact />
    </div>
  );
}

export function TodayHead() {
  const t = useTranslations('demoShop.today');
  return <ViewHead title={t('title')} sub={t('sub')} />;
}

