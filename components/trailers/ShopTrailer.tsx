'use client';

import type { CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BadgeCheck, MessageCircle } from 'lucide-react';
import { localeTags, type Locale } from '@/i18n/routing';
import { verticalById, type Vertical } from '@/lib/content';
import { pop, swap, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';
import './shop-trailer.css';

const VERTICAL = verticalById('tiendas') as Vertical;

/** Demo scenario: carts abandoned per week (the rubro's default in /content). */
const PAIN: TrailerNumber = { value: VERTICAL.calculator.lostPerWeek, prefix: '', suffix: '' };

/** The coupon of the recovery message (same as the demo). */
const COUPON = 'BRUMA10';
/** Carts abandoned per week and the key number's "1 in N" (/content), so the counter lands on it. */
const WEEK = VERTICAL.calculator.lostPerWeek;
const PER = Number((VERTICAL.keyNumber?.suffix ?? '').replace(/\D/g, '')) || 5;
/** Recovered this week before → after the beat (3 of 15 = 1 in 5). */
const RECOVERED = { from: Math.round(WEEK / PER) - 1, to: Math.round(WEEK / PER) };

type Tone = 'bad' | 'ok' | 'accent';
interface Row {
  name: 'ines' | 'martin' | 'lautaro';
  items: number;
  /** Label colors of the bags in the cart. */
  bags: string[];
  minutes: number;
  after: [Tone, 'sent' | 'recovered'];
}
const ROWS: Row[] = [
  { name: 'ines', items: 2, bags: ['#E4472B', '#2F6B4F'], minutes: 18 * 60 + 12, after: ['accent', 'recovered'] },
  { name: 'martin', items: 1, bags: ['#EBA937'], minutes: 16 * 60 + 50, after: ['ok', 'sent'] },
  { name: 'lautaro', items: 1, bags: ['#7E9BD1'], minutes: 21 * 60 + 40, after: ['ok', 'sent'] },
];

/** Bruma Tostadores' palette (same as the demo: cream · espresso · tomato · oat). */
const SHOP_MOCK = {
  '--mk-accent': '#D63B1F',
  '--mk-accent-soft': '#F8DDD2',
  '--mk-ink': '#2B1B14',
  '--mk-muted': '#6B5548',
  '--mk-muted-bg': '#F3EADB',
  '--mk-line': 'rgb(43 27 20 / 0.12)',
  '--mk-ok': '#2E6B3F',
  '--mk-ok-bg': '#DDEBDD',
  '--mk-bad': '#A3271B',
  '--mk-bad-bg': '#F8DDD2',
  '--mk-card': '#FFFDF9',
  background: '#FBF6EE',
  color: '#2B1B14',
} as CSSProperties;

/** The recovery message goes out, carts flip to "sent", Inés's comes back paid, the counter ticks. */
const animateMock: MockAnimator = (tl, q, at) => {
  const rows = q('[data-trl="row"]');
  tl.fromTo(rows, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07 }, at - 0.75);
  const [toast1] = q('[data-trl="toast-1"]');
  const [toast2] = q('[data-trl="toast-2"]');
  pop(tl, toast1, at, { yPercent: -140, y: 0, scale: 1 });
  swap(tl, rows[1], at + 0.35);
  swap(tl, rows[2], at + 0.55);
  if (toast1) {
    tl.fromTo(toast1, { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -140, duration: 0.4, ease: 'power2.in', immediateRender: false }, at + 1.2);
  }
  swap(tl, rows[0], at + 1.15);
  pop(tl, rows[0]?.querySelector<HTMLElement>('[data-trl="plus"]') ?? undefined, at + 1.45, { scale: 0.5, y: 0 });
  pop(tl, toast2, at + 1.6, { yPercent: -140, y: 0, scale: 1 });
  const [counter] = q('[data-trl="counter"]');
  swap(tl, counter, at + 1.9);
  const lit = q('[data-trl="lit"]');
  if (lit.length) tl.fromTo(lit, { scaleY: 0.2, autoAlpha: 0.3 }, { scaleY: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(2.4)' }, at + 1.95);
};

function ShopScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.shop.screen');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const time = new Intl.DateTimeFormat(localeTags[locale], { hour: 'numeric', minute: '2-digit', hour12: locale === 'en' });
  const at = (minutes: number) => time.format(new Date(2026, 0, 5, Math.floor(minutes / 60), minutes % 60));

  return (
    <div className="mk mk-shop" style={SHOP_MOCK}>
      <div className="mk-bar">
        <span className="mk-logo" />
        <span>{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-bar-end">{t('today')}</span>
      </div>
      <p className="mk-title">{t('title')}</p>
      <ul className="mk-rows">
        {ROWS.map((row) => (
          <li key={row.name} className="mk-row mk-card mk-cart" data-trl="row">
            <span className="mk-bags" aria-hidden>
              {row.bags.map((c) => (
                <span key={c} className="mk-bagicon" style={{ '--label': c } as CSSProperties} />
              ))}
            </span>
            <span className="mk-cart-who">
              <b>{t(`names.${row.name}`)}</b>
              <small>
                {t('items', { count: row.items })} · {at(row.minutes)}
              </small>
            </span>
            {row.after[1] === 'recovered' ? (
              <span className="mk-plus" data-trl="plus">
                +1
              </span>
            ) : (
              <span />
            )}
            <span className="mk-swap">
              <span className="mk-pill mk-pill--bad" data-trl-before>
                {t('abandoned')}
              </span>
              <span className={`mk-pill mk-pill--${row.after[0]}`} data-trl-after>
                {t(row.after[1])}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mk-shop-counter mk-card">
        <span className="mk-label">{t('counter')}</span>
        <span className="mk-swap mk-shop-count" data-trl="counter">
          <b data-trl-before>{t('of', { count: RECOVERED.from, total: WEEK })}</b>
          <b data-trl-after>{t('of', { count: RECOVERED.to, total: WEEK })}</b>
        </span>
        <span className="mk-shop-bags" aria-hidden>
          {Array.from({ length: WEEK }, (_, i) => (
            <span key={i} data-on={i < RECOVERED.to ? '' : undefined} data-trl={i === RECOVERED.to - 1 ? 'lit' : undefined} />
          ))}
        </span>
      </div>
      <p className="mk-toast mk-toast--gone" data-trl="toast-1">
        <MessageCircle aria-hidden strokeWidth={1.8} />
        {t('toastSent', { code: COUPON })}
      </p>
      <p className="mk-toast" data-trl="toast-2">
        <BadgeCheck aria-hidden strokeWidth={1.8} />
        {t('toastPaid')}
      </p>
    </div>
  );
}

/** "Bruma Tostadores — Demo": carts left at checkout → a WhatsApp with a coupon → 1 in 5 comes back. */
export function ShopTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="shop"
      pain={PAIN}
      screen={<ShopScreen business={VERTICAL.business ?? ''} />}
      mock={animateMock}
      {...props}
    />
  );
}

export default ShopTrailer;
