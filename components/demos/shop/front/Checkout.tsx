'use client';

import { useId, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Coffee, Lock, MessageCircle, Minus, Plus, Ticket, Truck, Store, X } from 'lucide-react';
import { COUPON, PAYS, productById, unitUsd } from '../data';
import { useShop } from '../context';
import { Bag, useShopMoney, useShopText } from '../ui';
import { useFront } from './context';
import { RoastRuler, useMyGranos } from './Club';

/** Free-shipping progress: a ruler that fills (the store's small game). */
function FreeShipping({ subtotal, freeFrom }: { subtotal: number; freeFrom: number }) {
  const t = useTranslations('demoShop.front.cart');
  const money = useShopMoney();
  const ratio = Math.min(1, subtotal / (freeFrom || 1));
  const done = ratio >= 1;
  return (
    <div className="sf-free" data-done={done ? '' : undefined}>
      <p className="sf-free-label">
        <Truck aria-hidden strokeWidth={1.8} />
        {done ? t('freeDone') : t('freeLeft', { amount: money.fmt(freeFrom - subtotal) })}
      </p>
      <span className="sf-free-track" aria-hidden>
        <span className="sf-free-fill" style={{ transform: `scaleX(${ratio})` }} />
      </span>
    </div>
  );
}

/** Bottom sheet (phone) / side drawer (desktop): lines, steppers, free shipping, go to checkout. */
export function CartSheet() {
  const f = useFront();
  const t = useTranslations('demoShop.front.cart');
  const { product, variant, items } = useShopText();
  const money = useShopMoney();
  const titleId = useId();
  const tot = money.totals(f.lines, f.coupon);
  return (
    <div className="sf-sheet" role="dialog" aria-labelledby={titleId}>
      <button type="button" className="sf-sheet-scrim" aria-label={t('close')} tabIndex={-1} onClick={() => f.act(() => ({ sheet: null }), 'close')} />
      <div className="sf-sheet-panel">
        <div className="sf-sheet-head">
          <h3 id={titleId} className="demo-display">
            {t('title')} <span className="sf-sheet-count demo-mono">{items(f.lines)}</span>
          </h3>
          <button type="button" className="sf-iconbtn" aria-label={t('close')} onClick={() => f.act(() => ({ sheet: null }), 'close')}>
            <X aria-hidden strokeWidth={2} />
          </button>
        </div>
        {f.lines.length ? (
          <ul className="sf-lines">
            {f.lines.map((l, i) => {
              const p = productById(l.product);
              return (
                <li key={`${l.product}-${l.size}-${l.grind}`} className="sf-line">
                  <span className="sf-line-art" style={{ background: p.tint }}>
                    <Bag product={l.product} size={l.size} text={false} />
                  </span>
                  <span className="min-w-0 flex-1 leading-[1.25]">
                    <span className="block truncate font-semibold">{product(l.product)}</span>
                    <span className="block truncate text-[0.82em] text-[var(--demo-muted)]">{variant(l)}</span>
                    <span className="sf-stepper" role="group" aria-label={t('qty', { name: product(l.product) })}>
                      <button type="button" aria-label={t('less')} onClick={() => f.setQty(i, l.qty - 1)}>
                        <Minus aria-hidden strokeWidth={2.2} />
                      </button>
                      <span className="demo-mono" aria-live="polite">
                        {l.qty}
                      </span>
                      <button type="button" aria-label={t('more')} onClick={() => f.setQty(i, l.qty + 1)}>
                        <Plus aria-hidden strokeWidth={2.2} />
                      </button>
                    </span>
                  </span>
                  <span className="sf-line-price demo-mono">{money.fmt(money.local(unitUsd(l)) * l.qty)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sf-empty">{t('empty')}</p>
        )}
        {f.lines.length ? <FreeShipping subtotal={tot.subtotal} freeFrom={tot.freeFrom} /> : null}
        <div className="sf-sum">
          <span>{t('subtotal')}</span>
          <span aria-hidden className="sf-leader" />
          <b className="demo-mono" aria-live="polite">
            {money.fmt(tot.subtotal)}
          </b>
        </div>
        <button
          type="button"
          className={`sf-cta sf-cta-wide ${f.tap === 'checkout' ? 'sf-tap' : ''}`}
          disabled={!f.lines.length}
          onClick={() => f.act(() => ({ screen: 'checkout', sheet: null }))}
        >
          {t('checkout')}
        </button>
      </div>
    </div>
  );
}

/** One-page checkout: delivery, payment, coupon, totals, pay. */
export function Checkout() {
  const f = useFront();
  const t = useTranslations('demoShop.front.checkout');
  const { product, variant } = useShopText();
  const money = useShopMoney();
  const tot = money.totals(f.lines, f.coupon);
  const deliveryId = useId();
  const payId = useId();
  return (
    <div className="sf-checkout">
      <div className="sf-checkout-top">
        <button type="button" className="sf-back" onClick={() => f.act(() => ({ screen: 'catalog', sheet: 'cart' }), 'close')}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          {t('backToCart')}
        </button>
        <span className="sf-progress" aria-hidden>
          <span data-on="" />
          <span data-on="" />
          <span />
        </span>
      </div>
      <h3 className="sf-checkout-title demo-display">{t('title')}</h3>
      <div className="sf-checkout-cols">
        <div className="sf-checkout-main">
          <section className="sf-box" aria-labelledby={deliveryId}>
            <h4 id={deliveryId} className="sf-box-title">
              {t('delivery')}
            </h4>
            <p className="sf-address">{f.story ? t('addressInes') : t('addressYou')}</p>
            <div className="sf-radios" role="radiogroup" aria-labelledby={deliveryId}>
              {(['home', 'pickup'] as const).map((d) => (
                <button key={d} type="button" role="radio" aria-checked={f.ui.delivery === d} className="sf-radio" onClick={() => f.act(() => ({ delivery: d }))}>
                  {d === 'home' ? <Truck aria-hidden strokeWidth={1.7} /> : <Store aria-hidden strokeWidth={1.7} />}
                  <span className="min-w-0 flex-1 text-left leading-[1.25]">
                    <span className="block font-semibold">{t(`deliveries.${d}`)}</span>
                    <span className="block text-[0.85em] text-[var(--demo-muted)]">{t(`deliveries.${d}When`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="sf-box" aria-labelledby={payId}>
            <h4 id={payId} className="sf-box-title">
              {t('payment')}
            </h4>
            <div className="sf-paygrid" role="radiogroup" aria-labelledby={payId}>
              {PAYS.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={f.ui.pay === p} className="sf-pill" onClick={() => f.act(() => ({ pay: p }))}>
                  {t(`pays.${p}`)}
                </button>
              ))}
            </div>
          </section>
        </div>
        <section className="sf-box sf-summary" aria-label={t('summary')}>
          <ul className="sf-summary-lines">
            {f.lines.map((l) => (
              <li key={`${l.product}-${l.size}-${l.grind}`}>
                <span className="sf-summary-art" style={{ background: productById(l.product).tint }}>
                  <Bag product={l.product} size={l.size} text={false} />
                </span>
                <span className="min-w-0 flex-1 leading-[1.2]">
                  <span className="block truncate font-semibold">
                    {l.qty > 1 ? `${l.qty} × ` : ''}
                    {product(l.product)}
                  </span>
                  <span className="block truncate text-[0.82em] text-[var(--demo-muted)]">{variant(l)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="sf-coupon" data-on={f.coupon ? '' : undefined}>
            <Ticket aria-hidden strokeWidth={1.8} />
            {f.coupon ? (
              <span>
                <b className="demo-mono">{COUPON.code}</b> · {t('couponOn', { pct: Math.round(COUPON.pct * 100) })}
              </span>
            ) : (
              <span>{t('couponOff')}</span>
            )}
          </div>
          <dl className="sf-totals" aria-live="polite">
            <div>
              <dt>{t('subtotal')}</dt>
              <dd className="demo-mono">{money.fmt(tot.subtotal)}</dd>
            </div>
            {tot.discount ? (
              <div data-tone="accent">
                <dt>{t('discount')}</dt>
                <dd className="demo-mono">−{money.fmt(tot.discount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t('shipping')}</dt>
              <dd className="demo-mono">{f.ui.delivery === 'pickup' || tot.free ? t('free') : money.fmt(tot.shipping)}</dd>
            </div>
            <div className="sf-total">
              <dt>{t('total')}</dt>
              <dd className="demo-mono">{money.fmt(f.ui.delivery === 'pickup' ? tot.total - tot.shipping : tot.total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className={`sf-cta sf-cta-wide sf-pay ${f.tap === 'pay' ? 'sf-tap' : ''}`}
            data-pressing={f.pressing ? '' : undefined}
            disabled={!f.lines.length}
            onClick={f.pay}
          >
            <Lock aria-hidden strokeWidth={2} />
            {t('pay', { total: money.fmt(f.ui.delivery === 'pickup' ? tot.total - tot.shipping : tot.total) })}
          </button>
          <p className="sf-secure">{t('secure')}</p>
        </section>
      </div>
    </div>
  );
}

/** After paying: the order, its roast/delivery days, the club granos. */
export function OrderDone() {
  const f = useFront();
  const t = useTranslations('demoShop.front.done');
  const { view } = useShop();
  const { person, fmt } = useShopText();
  const tl = useTranslations('demoShop.levels');
  const club = useMyGranos(f.story);
  const order = view.orders.find((o) => o.key === f.orderKey) ?? view.orders.find((o) => o.customer === 'you');
  if (!order) {
    return (
      <div className="sf-done" data-empty="">
        <span className="sf-done-icon" aria-hidden>
          <Coffee strokeWidth={1.6} />
        </span>
        <h3 className="sf-done-title demo-display">{t('emptyTitle')}</h3>
        <p className="sf-done-body">{t('emptyBody')}</p>
        <button type="button" className="sf-cta" onClick={() => f.act(() => ({ screen: 'catalog' }))}>
          {t('more')}
        </button>
      </div>
    );
  }
  const granos = Math.round(order.lines.reduce((s, l) => s + unitUsd(l) * l.qty, 0));
  const stages = [
    { id: 'received', when: fmt.time(order.clock), done: true },
    { id: 'roasted', when: t('monday'), done: false },
    { id: 'shipped', when: t('wednesday'), done: false },
    { id: 'delivered', when: t('wednesday'), done: false },
  ];
  return (
    <div className="sf-done" key={order.key}>
      <span className="sf-done-icon" data-glint="" aria-hidden>
        <Check strokeWidth={2.4} />
      </span>
      <h3 className="sf-done-title demo-display">{order.customer === 'you' ? t('title') : t('titleName', { name: person(order.customer) })}</h3>
      <p className="sf-done-body">{t('body', { id: order.id })}</p>
      <ol className="sf-track">
        {stages.map((s, i) => (
          <li key={s.id} data-done={s.done ? '' : undefined} style={{ '--i': i } as CSSProperties}>
            <span className="sf-track-dot" aria-hidden />
            <span className="min-w-0 flex-1 font-semibold">{t(`stages.${s.id}`)}</span>
            <span className="sf-track-when demo-mono">{s.when}</span>
            <span className="sr-only">{s.done ? t('doneSr') : t('pendingSr')}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="sf-done-club" onClick={() => f.act(() => ({ screen: 'club' }))}>
        <span className="sf-done-club-top">
          <span className="sf-granos">
            <Coffee aria-hidden strokeWidth={1.8} />
            {t('granos', { count: granos })}
          </span>
          <span className="sf-done-club-level">{tl(club.level)}</span>
        </span>
        <RoastRuler granos={club.granos} />
        <span className="sf-done-club-next">
          {club.next ? t('clubNext', { total: club.granos, count: club.next.from - club.granos, level: tl(club.next.id) }) : t('clubTop', { total: club.granos })}
        </span>
      </button>
      <p className="sf-done-wa">
        <MessageCircle aria-hidden strokeWidth={1.8} />
        {t('whatsapp')}
      </p>
      <button type="button" className="sf-ghost" onClick={() => f.act(() => ({ screen: 'catalog' }))}>
        {t('more')}
      </button>
    </div>
  );
}
