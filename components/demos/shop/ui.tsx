'use client';

import { memo, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  BellRing,
  Coffee,
  Flame,
  MessageCircle,
  MessageCircleQuestion,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  TriangleAlert,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { localeTags } from '@/i18n/routing';
import { toCurrency } from '@/lib/pricing';
import { Avatar, useDemoFormat, type FeedItem, type ToastItem, type Tone } from '../kit';
import { COUPON, FREE_SHIPPING_USD, PEOPLE, SHIPPING_USD, productById, unitUsd, type CustomerId, type Line, type ProductId, type SizeId } from './data';
import type { EventKind, ShopEvent } from './story';
import { useShop } from './context';

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */
/** Bruma's mark: a coffee bean whose crease is a wisp of mist. */
export function BrumaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <ellipse cx="12" cy="12.4" rx="6.4" ry="8.4" transform="rotate(-28 12 12.4)" />
      <path d="M9.1 6.2c3.6 2.2.4 5.5 3.1 7.6 1.3 1 2.3 2.1 2.6 4.1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Illustrations: bags and the moka pot (SVG, no photos)                */
/* ------------------------------------------------------------------ */
const PAPER = {
  kraft: { body: '#D9BD94', shade: '#C2A27A', seal: '#CDB088', tie: '#8E6B47', crimp: '#B3956D' },
  white: { body: '#F4EFE7', shade: '#DCD3C6', seal: '#E9E2D7', tie: '#B3A794', crimp: '#CFC6B8' },
  black: { body: '#3A2B24', shade: '#281D18', seal: '#46352D', tie: '#9A7A5F', crimp: '#5A473D' },
} as const;
const PAPER_OF: Partial<Record<ProductId, keyof typeof PAPER>> = { sidamo: 'white', medianoche: 'black' };

function Pattern({ kind, ink }: { kind: string; ink: string }) {
  const common = { stroke: ink, fill: 'none', strokeWidth: 1.5, opacity: 0.28, strokeLinecap: 'round' as const };
  if (kind === 'waves') {
    return (
      <g {...common}>
        {[52, 60, 98, 106].map((y) => (
          <path key={y} d={`M14 ${y} q 6 -3.6 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0`} />
        ))}
      </g>
    );
  }
  if (kind === 'rays') {
    return (
      <g {...common}>
        {Array.from({ length: 11 }, (_, i) => {
          const a = (Math.PI * (i + 0.5)) / 11;
          return <path key={i} d={`M50 110 L${(50 + Math.cos(a) * 70).toFixed(1)} ${(110 - Math.sin(a) * 70).toFixed(1)}`} />;
        })}
      </g>
    );
  }
  if (kind === 'dots') {
    const dots: ReactNode[] = [];
    for (let y = 48; y <= 104; y += 7) for (let x = 24 + ((y / 7) % 2) * 3.5; x <= 78; x += 7) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} />);
    return (
      <g fill={ink} opacity={0.26}>
        {dots}
      </g>
    );
  }
  if (kind === 'hills') {
    return (
      <g fill={ink}>
        <path d="M14 106 Q 32 86 50 98 T 88 92 V112 H14 Z" opacity={0.2} />
        <path d="M14 100 Q 30 92 44 100 T 88 98" fill="none" stroke={ink} strokeWidth={1.4} opacity={0.32} />
      </g>
    );
  }
  if (kind === 'stars') {
    const star = (x: number, y: number, s: number) => `M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`;
    return (
      <g fill={ink} opacity={0.4}>
        {[
          [28, 52, 2.6],
          [70, 56, 1.8],
          [62, 48, 1.2],
          [34, 100, 1.6],
          [72, 98, 2.4],
          [26, 88, 1.1],
        ].map(([x, y, s]) => (
          <path key={`${x}-${y}`} d={star(x, y, s)} />
        ))}
      </g>
    );
  }
  return null;
}

/**
 * A stand-up coffee pouch (kraft / white / black) with the product's label, pattern,
 * name, weight and roast dots. Decorative (the product name is always in the text next to it).
 */
export const Bag = memo(function Bag({
  product,
  size = 's250',
  text = true,
  className = '',
  style,
}: {
  product: ProductId;
  size?: SizeId;
  text?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = useTranslations('demoShop');
  const p = productById(product);
  if (p.kind === 'gear') return <MokaPot className={className} style={style} />;
  const paper = PAPER[PAPER_OF[product] ?? 'kraft'];
  const clip = `shop-bag-${uid}`;
  const name = t(`products.${product}.name`);
  const nameSize = Math.min(12.5, 50 / Math.max(1, name.length * 0.6));
  const label =
    p.shape === 'circle' ? (
      <circle cx="50" cy="75" r="27" />
    ) : p.shape === 'arch' ? (
      <path d="M23 106 V70 A27 27 0 0 1 77 70 V106 Z" />
    ) : (
      <rect x="22" y="44" width="56" height="62" rx="5" />
    );
  return (
    <svg viewBox="0 0 100 130" aria-hidden className={`shop-bag ${className}`} style={style}>
      <defs>
        <clipPath id={clip}>{label}</clipPath>
      </defs>
      <ellipse cx="50" cy="124" rx="34" ry="3.2" fill="#2B1B14" opacity={0.13} />
      {/* body + gusset shade + sheen */}
      <path d="M19 20 H81 L86 113 Q86 121 78 121 H22 Q14 121 14 113 Z" fill={paper.body} />
      <path d="M19 20 L14 113 Q14 121 22 121 H25 L23 20 Z" fill={paper.shade} />
      <path d="M71 22 L74 118 H78 L75 22 Z" fill="#fff" opacity={0.16} />
      {/* top seal with crimp + tin tie */}
      <path d="M19 6 H81 V21 H19 Z" fill={paper.seal} />
      <path d="M20 7 V12 M24 7 V12 M28 7 V12 M32 7 V12 M36 7 V12 M40 7 V12 M44 7 V12 M48 7 V12 M52 7 V12 M56 7 V12 M60 7 V12 M64 7 V12 M68 7 V12 M72 7 V12 M76 7 V12 M80 7 V12" stroke={paper.crimp} strokeWidth={1.1} />
      <rect x="12" y="18" width="76" height="4.6" rx="2.3" fill={paper.tie} />
      {/* degassing valve */}
      <circle cx="50" cy="33" r="3.4" fill={paper.shade} />
      <circle cx="50" cy="33" r="1.5" fill={paper.body} />
      {/* label */}
      <g fill={p.label}>{label}</g>
      <g clipPath={`url(#${clip})`}>
        <Pattern kind={p.pattern} ink={p.labelInk} />
      </g>
      {text ? (
        <g fill={p.labelInk} textAnchor="middle">
          <text x="50" y={p.shape === 'rect' ? 72 : 76} className="shop-bag-name" fontSize={nameSize}>
            {name}
          </text>
          <text x="50" y={p.shape === 'rect' ? 84 : 87} className="shop-bag-weight" fontSize="6">
            {t(`sizes.${size}`)}
          </text>
          <g>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={44 + i * 6} cy={p.shape === 'rect' ? 94 : 96} r={1.7} fill={i < (p.roast ?? 0) ? p.labelInk : 'none'} stroke={p.labelInk} strokeWidth={0.9} />
            ))}
          </g>
        </g>
      ) : null}
    </svg>
  );
});

/** The aluminium moka pot (the store's one piece of gear). */
export const MokaPot = memo(function MokaPot({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 130" aria-hidden className={`shop-bag ${className}`} style={style}>
      <ellipse cx="50" cy="124" rx="30" ry="3" fill="#2B1B14" opacity={0.13} />
      {/* handle */}
      <path d="M70 44 C88 46 88 70 70 74" fill="none" stroke="#2B1B14" strokeWidth={6} strokeLinecap="round" />
      {/* lower chamber */}
      <path d="M33 121 H67 L62 82 H38 Z" fill="#C9C3B9" />
      <path d="M33 121 H44 L42 82 H38 Z" fill="#A9A297" />
      <path d="M56 82 H60 L64 121 H59 Z" fill="#E7E2DA" />
      {/* waist */}
      <rect x="36" y="76" width="28" height="7" rx="1.5" fill="#8F887D" />
      {/* upper chamber */}
      <path d="M38 76 H62 L71 38 H29 Z" fill="#CFC9C0" />
      <path d="M38 76 H45 L39 38 H29 Z" fill="#ADA69B" />
      <path d="M55 76 H59 L65 38 H60 Z" fill="#ECE8E1" />
      {/* spout + lid + knob */}
      <path d="M29 38 L19 31 L31 46 Z" fill="#B7B0A5" />
      <path d="M27 38 H73 L67 29 H33 Z" fill="#BDB6AB" />
      <rect x="45" y="22" width="10" height="7" rx="2.5" fill="#2B1B14" />
    </svg>
  );
});

/** A row of tiny bags for a cart / an order (up to `max`, then "+n"). */
export function BagStack({ lines, max = 3, className = '' }: { lines: Line[]; max?: number; className?: string }) {
  const units = lines.flatMap((l) => Array.from({ length: Math.min(l.qty, 2) }, (_, i) => ({ key: `${l.product}-${l.size}-${l.grind}-${i}`, l })));
  const shown = units.slice(0, max);
  const more = units.length - shown.length;
  return (
    <span className={`shop-stack ${className}`} aria-hidden>
      {shown.map(({ key, l }) => (
        <Bag key={key} product={l.product} size={l.size} text={false} />
      ))}
      {more > 0 ? <span className="shop-stack-more demo-mono">+{more}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Money: demo prices (USD) in the visitor's currency, rounded like it   */
/* ------------------------------------------------------------------ */
export function useShopMoney() {
  const { currency, rates, locale } = useCurrency();
  return useMemo(() => {
    const nf = new Intl.NumberFormat(localeTags[locale] ?? 'es-AR', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const fmt = (amount: number) =>
      nf
        .formatToParts(amount)
        .map((part) => (part.type === 'currency' && currency === 'BRL' ? 'R$' : part.value))
        .join('');
    const local = (usd: number) => toCurrency(usd, currency, rates);
    const line = (l: Line) => local(unitUsd(l)) * l.qty;
    const totals = (lines: Line[], coupon: boolean) => {
      const subtotal = lines.reduce((s, l) => s + line(l), 0);
      const discount = coupon ? Math.round(subtotal * COUPON.pct) : 0;
      const freeFrom = local(FREE_SHIPPING_USD);
      const free = subtotal >= freeFrom;
      const shipping = lines.length && !free ? local(SHIPPING_USD) : 0;
      return { subtotal, discount, shipping, total: subtotal - discount + shipping, free, freeFrom, toFree: Math.max(0, freeFrom - subtotal) };
    };
    return { currency, fmt, local, line, totals };
  }, [currency, rates, locale]);
}
export type ShopMoney = ReturnType<typeof useShopMoney>;

/* ------------------------------------------------------------------ */
/* Text                                                                 */
/* ------------------------------------------------------------------ */
export function useShopText() {
  const t = useTranslations('demoShop');
  const fmt = useDemoFormat();
  return useMemo(() => {
    const product = (id: ProductId) => t(`products.${id}.name`);
    const person = (id: CustomerId | 'you') => t(`people.${id}`);
    const size = (id: SizeId) => t(`sizes.${id}`);
    const grind = (id: Line['grind']) => t(`grinds.${id}`);
    /** "500 g · molido para moka" (gear: its short description). */
    const variant = (l: Pick<Line, 'product' | 'size' | 'grind'>) =>
      productById(l.product).kind === 'gear' ? t(`products.${l.product}.short`) : `${size(l.size)} · ${grind(l.grind)}`;
    const items = (lines: Line[]) => lines.reduce((s, l) => s + l.qty, 0);
    return { t, fmt, product, person, size, grind, variant, items };
  }, [t, fmt]);
}

export function PersonAvatar({ id, className = '' }: { id: CustomerId | 'you'; className?: string }) {
  const { person } = useShopText();
  if (id === 'you') return <Avatar initials="★" color="var(--demo-ink)" ink="var(--demo-bg)" className={className} />;
  const c = PEOPLE[id];
  const name = person(id);
  return <Avatar initials={name.slice(0, 1).toUpperCase()} color={c.bg} ink={c.ink} className={className} />;
}

const EVENT_ICON: Record<EventKind, { icon: LucideIcon; tone: Tone }> = {
  order: { icon: ShoppingBag, tone: 'ink' },
  chat: { icon: MessageCircleQuestion, tone: 'info' },
  checkout: { icon: ShoppingCart, tone: 'neutral' },
  abandon: { icon: ShoppingCart, tone: 'bad' },
  sent: { icon: MessageCircle, tone: 'ok' },
  unsent: { icon: XCircle, tone: 'bad' },
  read: { icon: MessageCircle, tone: 'info' },
  back: { icon: Undo2, tone: 'accent' },
  recovered: { icon: RotateCcw, tone: 'accent' },
  lost: { icon: XCircle, tone: 'bad' },
  stock: { icon: TriangleAlert, tone: 'warn' },
  restock: { icon: Flame, tone: 'ok' },
  levelup: { icon: Coffee, tone: 'accent2' },
  faq: { icon: MessageCircleQuestion, tone: 'info' },
  mineAbandon: { icon: ShoppingCart, tone: 'bad' },
  mineSent: { icon: BellRing, tone: 'ok' },
  mineUnsent: { icon: XCircle, tone: 'bad' },
  mineOrder: { icon: PackageCheck, tone: 'accent' },
};
export const eventIcon = (kind: EventKind) => EVENT_ICON[kind];

/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const { t, product, person } = useShopText();
  const { view } = useShop();
  const money = useShopMoney();
  return (e: ShopEvent): string => {
    const order = e.orderKey ? view.orders.find((o) => o.key === e.orderKey) : undefined;
    return t(`feed.${e.kind}`, {
      name: e.customer ? person(e.customer) : '',
      product: e.product ? product(e.product) : '',
      total: order ? money.fmt(money.totals(order.lines, order.coupon).total) : '',
      id: order ? String(order.id) : '',
      left: e.product ? view.stock[e.product] : 0,
    });
  };
}

export function useEventTime() {
  const { fmt } = useShopText();
  return (e: ShopEvent) => fmt.time(e.clock);
}

export function useFeedItems(limit = 6, filter?: (e: ShopEvent) => boolean): FeedItem[] {
  const { view, recent } = useShop();
  const text = useEventText();
  const time = useEventTime();
  return [...view.events]
    .filter((e) => (filter ? filter(e) : e.kind !== 'checkout'))
    .reverse()
    .slice(0, limit)
    .map((e) => ({ id: e.id, ...EVENT_ICON[e.kind], text: text(e), time: time(e), fresh: !e.mine && recent(e.at, 2600) }));
}

/** Events worth a toast. Story ones show while their beat plays (beats end after they leave). */
const TOAST_KINDS: EventKind[] = ['order', 'abandon', 'sent', 'recovered', 'levelup', 'stock', 'lost'];
/** The visitor's own: a toast for a few seconds after their click (a local timer, never the story clock). */
const OWN_KINDS: EventKind[] = ['mineOrder', 'mineSent', 'mineUnsent'];
export function useToastItems(): ToastItem[] {
  const { view, reduced, recent } = useShop();
  const text = useEventText();
  const t = useTranslations('demoShop.toast');
  const ids = view.events
    .filter((e) => OWN_KINDS.includes(e.kind))
    .map((e) => e.id)
    .join('|');
  const known = useRef<Set<string> | null>(null);
  const timers = useRef<number[]>([]);
  const [own, setOwn] = useState<string[]>([]);
  useEffect(() => {
    const now = ids ? ids.split('|') : [];
    const before = known.current;
    known.current = new Set(now);
    const added = before ? now.filter((id) => !before.has(id)) : [];
    if (!added.length) return;
    setOwn((r) => [...r, ...added]);
    timers.current.push(window.setTimeout(() => setOwn((r) => r.filter((x) => !added.includes(x))), 3400));
  }, [ids]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);
  if (reduced) return [];
  return view.events
    .filter((e) => (OWN_KINDS.includes(e.kind) ? own.includes(e.id) : !e.mine && TOAST_KINDS.includes(e.kind) && recent(e.at, 3400)))
    .slice(-2)
    .map((e) => ({ id: e.id, ...EVENT_ICON[e.kind], title: t(e.kind), body: text(e), leaving: !OWN_KINDS.includes(e.kind) && view.t - e.at >= 2900 }));
}

/** One polite announcement of the latest change (one instance per pair). */
export function Announcer() {
  const { view, announce, recent } = useShop();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...view.events].reverse().find((e) => e.at >= 0 && e.kind !== 'checkout' && (e.mine ? e.at === view.t : recent(e.at, 2600)));
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** Section header of the owner's panel: chunky title + one quiet line + an aside. */
export function ViewHead({ title, sub, aside, className = '' }: { title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={`shop-head ${className}`}>
      <div className="min-w-0">
        <h2 className="shop-title demo-display">{title}</h2>
        {sub ? <p className="shop-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="shop-head-aside">{aside}</div> : null}
    </div>
  );
}
