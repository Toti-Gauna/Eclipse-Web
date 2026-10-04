'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSound } from '@/components/sound/SoundContext';
import { useFlip } from '../../kit';
import { STAGES, type Stage } from '../data';
import type { OrderView } from '../story';
import { useShop } from '../context';
import { ArrowRight } from 'lucide-react';
import { act, nextStage } from '../story';
import { BagStack, PersonAvatar, useShopMoney, useShopText, ViewHead } from '../ui';
import { PayPill, ViaPill } from './Today';

type Filter = 'all' | 'club' | 'recovered';
const match = (o: OrderView, f: Filter) => f === 'all' || o.via === f;

function OrderCard({ order }: { order: OrderView }) {
  const t = useTranslations('demoShop.orders');
  const { store, active, recent } = useShop();
  const { play } = useSound();
  const { person, fmt, items } = useShopText();
  const money = useShopMoney();
  const fresh = !order.byYou && order.customer !== 'you' && recent(order.changedAt, 2400);
  const next = nextStage(order.stage);
  return (
    <li data-flip={order.key} className={`shop-ocard ${fresh ? 'demo-fresh' : ''}`}>
      <span className="shop-ocard-top">
        <span className="demo-mono">#{order.id}</span>
        <span className="demo-mono shop-ocard-time">{fmt.time(order.clock)}</span>
      </span>
      <span className="shop-ocard-who">
        <PersonAvatar id={order.customer} />
        <span className="min-w-0 flex-1 truncate font-semibold">{person(order.customer)}</span>
      </span>
      <span className="shop-ocard-bags">
        <BagStack lines={order.lines} max={3} />
        <span className="shop-ocard-items">{t('items', { count: items(order.lines) })}</span>
      </span>
      <span className="shop-ocard-foot">
        <b className="demo-mono">{money.fmt(money.totals(order.lines, order.coupon).total)}</b>
        <PayPill pay={order.pay} />
      </span>
      {order.via ? (
        <span className="shop-ocard-via">
          <ViaPill order={order} />
        </span>
      ) : null}
      {next ? (
        <button
          type="button"
          className="shop-ocard-next"
          aria-label={t('advanceLabel', { id: order.id, stage: t(`stages.${next}`) })}
          onClick={(e) => {
            const board = e.currentTarget.closest('.shop-board');
            store.update(act.advance(order.key, next));
            if (active) play('select');
            // Focus follows the order to its new column.
            requestAnimationFrame(() => board?.querySelector<HTMLElement>(`[data-flip="${order.key}"] .shop-ocard-next`)?.focus({ preventScroll: true }));
          }}
        >
          {t(`advance.${next}`)}
          <ArrowRight aria-hidden strokeWidth={2} />
        </button>
      ) : null}
    </li>
  );
}

/** Fulfillment board: new → roasting → on the way → delivered (cards slide as they move). */
function Board({ filter, layout }: { filter: Filter; layout: 'columns' | 'stack' }) {
  const t = useTranslations('demoShop.orders');
  const { view } = useShop();
  const root = useRef<HTMLDivElement>(null);
  const list = view.orders.filter((o) => match(o, filter));
  useFlip(root, list.map((o) => `${o.key}:${o.stage}`).join('|'));
  return (
    <div ref={root} className="shop-board" data-layout={layout} role="group" aria-label={t('board')}>
      {STAGES.map((stage: Stage) => {
        const cards = list.filter((o) => o.stage === stage);
        return (
          <section key={stage} className="shop-board-col" data-stage={stage} aria-label={`${t(`stages.${stage}`)} (${cards.length})`}>
            <header className="shop-board-head">
              <span aria-hidden className="shop-board-dot" />
              <span className="min-w-0 flex-1 truncate">{t(`stages.${stage}`)}</span>
              <span className="shop-board-count demo-mono" aria-hidden>
                {cards.length}
              </span>
            </header>
            <ul className="shop-board-list">
              {cards.map((o) => (
                <OrderCard key={o.key} order={o} />
              ))}
              {!cards.length ? <li className="shop-board-empty">{t('empty')}</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Filters({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const t = useTranslations('demoShop.orders');
  const { active } = useShop();
  const { play } = useSound();
  return (
    <div className="shop-filters" role="group" aria-label={t('filter')}>
      {(['all', 'club', 'recovered'] as const).map((f) => (
        <button
          key={f}
          type="button"
          className="shop-chip"
          aria-pressed={value === f}
          onClick={() => {
            onChange(f);
            if (active) play('select');
          }}
        >
          {t(`filters.${f}`)}
        </button>
      ))}
    </div>
  );
}

export function LaptopOrders() {
  const t = useTranslations('demoShop.orders');
  const { view } = useShop();
  const [filter, setFilter] = useState<Filter>('all');
  const todo = view.orders.filter((o) => o.stage === 'new' || o.stage === 'roasting').length;
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={t('sub', { count: todo })} aside={<Filters value={filter} onChange={setFilter} />} />
      <Board filter={filter} layout="columns" />
      <p className="shop-hint">{t('hint')}</p>
    </div>
  );
}

export function PhoneOrders() {
  const t = useTranslations('demoShop.orders');
  const { view } = useShop();
  const [filter, setFilter] = useState<Filter>('all');
  const todo = view.orders.filter((o) => o.stage === 'new' || o.stage === 'roasting').length;
  return (
    <div className="flex flex-col gap-[0.8em]">
      <ViewHead title={t('title')} sub={t('sub', { count: todo })} />
      <Filters value={filter} onChange={setFilter} />
      <p className="shop-hint">{t('hint')}</p>
      <Board filter={filter} layout="stack" />
    </div>
  );
}
