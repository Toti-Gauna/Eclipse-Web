'use client';

import { useId, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock3, MessageCircle, Ticket } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { Card, ChatWidget, Pill, Readout, Switch, type Tone } from '../../kit';
import { COUPON, OTHER_CARTS, type CustomerId, type Line } from '../data';
import { act, inesWaRun, mineCartStatus, type CartStatus } from '../story';
import { useShop } from '../context';
import { useShopScripts } from '../scripts';
import { BagStack, BrumaMark, PersonAvatar, useShopMoney, useShopText, ViewHead } from '../ui';

const STATUS_TONE: Record<CartStatus, Tone> = {
  browsing: 'neutral',
  checkout: 'info',
  abandoned: 'bad',
  sent: 'ok',
  unsent: 'bad',
  read: 'info',
  back: 'accent',
  recovered: 'accent',
  lost: 'neutral',
};

/** The automation's on/off switch (the visitor can watch a cart get lost without it). */
export function RecoverySwitch({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.carts');
  const { view, store, active } = useShop();
  const { play } = useSound();
  const labelId = useId();
  const descId = useId();
  const on = view.recoveryOn;
  return (
    <div className="shop-switch" data-off={on ? undefined : ''} data-compact={compact ? '' : undefined} data-tour="recovery">
      <span className="shop-switch-icon" aria-hidden>
        <MessageCircle strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span id={labelId} className="block font-semibold">
          {t('switch')}
        </span>
        <span id={descId} className="block text-[0.82em] text-[var(--demo-muted)]">
          {on ? t('switchOn') : t('switchOff')}
        </span>
      </span>
      <Switch
        checked={on}
        labelledBy={labelId}
        describedBy={descId}
        onChange={() => {
          store.update(act.toggleRecovery());
          if (active) play('toggle');
        }}
      />
    </div>
  );
}

/** This week: abandoned → message → read → came back → paid. */
export function Funnel({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.carts.funnel');
  const locale = useLocale() as Locale;
  const { view } = useShop();
  const w = view.week;
  const key = verticalById('tiendas')?.keyNumber;
  const steps = [
    ['abandoned', w.abandoned],
    ['sent', w.sent],
    ['read', w.read],
    ['back', w.back],
    ['paid', w.paid],
  ] as const;
  return (
    <figure className="shop-funnel" data-compact={compact ? '' : undefined}>
      <ol className="shop-funnel-steps">
        {steps.map(([id, n], i) => (
          <li key={id} data-last={i === steps.length - 1 ? '' : undefined} style={{ '--i': i } as CSSProperties}>
            <span className="shop-funnel-label">{t(id)}</span>
            <span className="shop-funnel-track" aria-hidden>
              <span className="shop-funnel-bar" style={{ transform: `scaleX(${Math.max(0.02, n / (w.abandoned || 1))})` }} />
            </span>
            <b className="shop-funnel-n demo-mono">
              <Readout value={n} />
            </b>
          </li>
        ))}
      </ol>
      <figcaption className="shop-funnel-caption">
        <b className="demo-display">{t('caption', { paid: w.paid, total: w.abandoned })}</b>
        <span>{view.recoveryOn ? (key ? l(key.headline, locale) : '') : t('offNote')}</span>
      </figcaption>
    </figure>
  );
}

interface CartRow {
  id: string;
  customer: CustomerId | 'you';
  lines: Line[];
  status: CartStatus;
  time: string;
  live: boolean;
  fresh: boolean;
}

function useCartRows(): CartRow[] {
  const { view, state, recent } = useShop();
  const { fmt, t } = useShopText();
  const rows: CartRow[] = [];
  const ines = view.ines;
  if (ines.status !== 'browsing') {
    rows.push({
      id: 'ines',
      customer: 'ines',
      lines: ines.lines,
      status: ines.status,
      time: fmt.time(view.clock),
      live: ines.status !== 'recovered' && ines.status !== 'lost',
      fresh: recent(ines.statusAt, 2400),
    });
  }
  const mine = mineCartStatus(state.mine);
  if (mine && state.mine.abandoned) rows.push({ id: 'you', customer: 'you', lines: state.mine.lines, status: mine, time: fmt.time(view.clock), live: true, fresh: false });
  for (const c of OTHER_CARTS) {
    rows.push({ id: c.id, customer: c.customer, lines: c.lines, status: c.status, time: c.when === 'today' ? fmt.time(c.clock) : t('carts.yesterday'), live: false, fresh: false });
  }
  return rows;
}

export function CartList({ limit = 5 }: { limit?: number }) {
  const t = useTranslations('demoShop.carts');
  const { person } = useShopText();
  const money = useShopMoney();
  const rows = useCartRows().slice(0, limit);
  return (
    <Card className="shop-carts">
      <h3 className="shop-card-title">{t('list')}</h3>
      <ul className="shop-cartrows">
        {rows.map((r) => (
          <li key={r.id} className={`shop-cartrow ${r.fresh ? 'demo-fresh' : ''}`}>
            <PersonAvatar id={r.customer} />
            <span className="min-w-0 flex-1 leading-[1.2]">
              <span className="block truncate font-semibold">{person(r.customer)}</span>
              <span className="block truncate text-[0.8em] text-[var(--demo-muted)] demo-mono">
                {money.fmt(money.totals(r.lines, false).subtotal)} · {r.time}
              </span>
            </span>
            <BagStack lines={r.lines} max={2} />
            <Pill tone={STATUS_TONE[r.status]} solid={r.status === 'recovered'}>
              {t(`status.${r.status}`)}
            </Pill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The rule of the automation, as a ledger. */
export function RuleCard() {
  const t = useTranslations('demoShop.carts.rule');
  const rows = [
    { icon: Clock3, k: t('when'), v: t('whenValue') },
    { icon: Ticket, k: t('coupon'), v: t('couponValue', { code: COUPON.code, pct: Math.round(COUPON.pct * 100) }) },
    { icon: MessageCircle, k: t('channel'), v: t('channelValue') },
  ];
  return (
    <dl className="shop-rule">
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.k}>
            <dt>
              <Icon aria-hidden strokeWidth={1.7} />
              {r.k}
            </dt>
            <span aria-hidden className="sf-leader" />
            <dd>{r.v}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Inés's recovery thread as the owner sees it (read-only), or the template before it goes out. */
export function MessagePanel() {
  const t = useTranslations('demoShop.carts');
  const { view, state, business } = useShop();
  const { person } = useShopText();
  const scripts = useShopScripts();
  const ines = view.ines;
  const sent = !!ines.sent && ines.pushAt !== null && view.t >= ines.pushAt;
  if (sent && ines.pushAt !== null) {
    const script = scripts.wa(person('ines'), ines.lines, true);
    const run = inesWaRun(script, view.t - ines.pushAt, state.wa);
    return (
      <div className="shop-msg">
        <p className="shop-msg-cap">
          {t('thread', { name: person('ines') })}
          {ines.status === 'recovered' ? <Pill tone="accent" solid>{t('status.recovered')}</Pill> : null}
        </p>
        <ChatWidget
          variant="whatsapp"
          run={{ ...run, awaiting: null }}
          title={person('ines')}
          subtitle={t('customer')}
          avatar={<PersonAvatar id="ines" />}
          label={t('threadLabel', { name: person('ines'), business })}
          announce={false}
          composer={false}
          className="shop-msg-chat"
        />
      </div>
    );
  }
  const off = !view.recoveryOn || ines.sent === false;
  return (
    <div className="shop-msg" data-off={off ? '' : undefined}>
      <p className="shop-msg-cap">{off ? t('templateOff') : t('template')}</p>
      <div className="shop-msg-preview">
        <span className="shop-msg-avatar" aria-hidden>
          <BrumaMark />
        </span>
        <p className="shop-msg-bubble">{t('templateText', { code: COUPON.code, pct: Math.round(COUPON.pct * 100) })}</p>
      </div>
      <RuleCard />
    </div>
  );
}

export function LaptopCarts() {
  const t = useTranslations('demoShop.carts');
  return (
    <div className="shop-cartsview">
      <ViewHead title={t('title')} sub={t('sub')} aside={<RecoverySwitch />} />
      <Funnel />
      <div className="shop-cartsview-row">
        <CartList limit={5} />
        <MessagePanel />
      </div>
    </div>
  );
}

export function PhoneCarts() {
  const t = useTranslations('demoShop.carts');
  return (
    <div className="shop-cartsview" data-screen="phone">
      <ViewHead title={t('title')} sub={t('sub')} />
      <RecoverySwitch compact />
      <Funnel compact />
      <CartList limit={4} />
      <MessagePanel />
    </div>
  );
}
