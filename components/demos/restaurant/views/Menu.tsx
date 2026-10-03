'use client';

import { useId, useMemo } from 'react';
import { PhoneCall, Star, Wheat } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Switch } from '../../kit';
import { CATEGORIES, MENU, SITE_URL, type Dish } from '../data';
import { act, isSoldOut } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { MenuLine, ViewHead } from '../ui';

/** A decorative QR (finder squares + a deterministic pattern). */
export function QrMark({ seed = 7, className = '' }: { seed?: number; className?: string }) {
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    let s = seed * 9301 + 49297;
    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        const finder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
        if (finder) continue;
        s = (s * 9301 + 49297) % 233280;
        if (s / 233280 > 0.52) out.push([x, y]);
      }
    }
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.2} fill="none" stroke="currentColor" strokeWidth={1} transform="translate(0.5 0.5) scale(0.93)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox="0 0 21 21" aria-hidden className={className} shapeRendering="crispEdges">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </svg>
  );
}

function StockSwitch({ dish }: { dish: Dish }) {
  const { state, store, active } = useRestaurant();
  const x = useRestaurantText();
  const { play } = useSound();
  const id = useId();
  const off = isSoldOut(state.soldOut, dish.id);
  return (
    <span className="rl-stock" data-off={off ? '' : undefined}>
      <span id={id} className="rl-stock-label">
        {off ? x.t('menu.out') : x.t('menu.in')}
      </span>
      <Switch
        checked={!off}
        label={x.t('menu.stockLabel', { dish: x.dish(dish.id) })}
        describedBy={id}
        onChange={() => {
          store.update(act.toggleStock(dish.id));
          store.engage(18_000);
          if (active) play('toggle');
        }}
      />
    </span>
  );
}

/** The carta: categories, dotted leaders, prices; each dish with its stock switch. */
function Carta({ columns = 1 }: { columns?: 1 | 2 }) {
  const { state } = useRestaurant();
  const x = useRestaurantText();
  const { t } = x;
  return (
    <div className="rl-carta" data-columns={columns}>
      {CATEGORIES.map((cat) => (
        <section key={cat} className="rl-carta-cat">
          <h3 className="rl-carta-h">{t(`cats.${cat}`)}</h3>
          {MENU.filter((d) => d.cat === cat).map((d) => {
            const off = isSoldOut(state.soldOut, d.id);
            return (
              <MenuLine
                key={d.id}
                off={off}
                name={x.dish(d.id)}
                price={x.cash(x.price(d.id))}
                desc={t(`dishes.${d.id}.desc`)}
                tags={
                  <>
                    {d.house ? <Star role="img" aria-label={t('menu.house')} className="rl-line-tag" strokeWidth={1.8} /> : null}
                    {d.gf ? <Wheat role="img" aria-label={t('menu.gf')} className="rl-line-tag" data-tone="olive" strokeWidth={1.8} /> : null}
                  </>
                }
                aside={<StockSwitch dish={d} />}
              />
            );
          })}
        </section>
      ))}
    </div>
  );
}

/** What the AI does with the dish the visitor just marked out of stock. */
function SoldOutEffect() {
  const { state, view, go } = useRestaurant();
  const x = useRestaurantText();
  const { t } = x;
  const extra = state.extra?.kind === 'alt' ? state.extra : null;
  if (!extra) {
    return (
      <div className="rl-effect">
        <p className="rl-rubric">{t('menu.effect.title')}</p>
        <p className="rl-effect-body">{t('menu.effect.idle')}</p>
      </div>
    );
  }
  const call = view.calls.find((c) => c.id === `extra-${extra.at}`);
  const line = call?.line ?? 1;
  const phase = call ? (call.start > view.t ? 'soon' : call.voice.phase) : 'line1';
  const alt = call?.subs?.[0]?.[1] ?? null;
  return (
    <div className="rl-effect demo-pop" key={extra.at}>
      <p className="rl-rubric">{t('menu.effect.title')}</p>
      <p className="rl-effect-body">
        {t('menu.effect.body', { dish: x.dish(extra.dish), alt: alt ? x.dish(alt) : x.dish(extra.dish) })}
      </p>
      <p className="rl-effect-status demo-mono" data-phase={phase}>
        {t(`menu.effect.${phase === 'ringing' || phase === 'live' || phase === 'ended' || phase === 'missed' || phase === 'soon' ? phase : 'line1'}`, { n: line })}
      </p>
      <button type="button" className="rl-linkbtn" onClick={() => go('phone', line)}>
        <PhoneCall aria-hidden strokeWidth={1.8} />
        {t('menu.effect.listen', { n: line })}
      </button>
    </div>
  );
}

function QrCard() {
  const { t } = useRestaurantText();
  return (
    <div className="rl-qr">
      <QrMark className="rl-qr-code" />
      <div className="min-w-0">
        <p className="rl-rubric">{t('menu.qr.title')}</p>
        <p className="rl-qr-url demo-mono">{SITE_URL}/carta</p>
        <p className="text-[0.7em] text-[var(--demo-muted)]">{t('menu.qr.body')}</p>
      </div>
    </div>
  );
}

export function LaptopMenu() {
  const { t } = useRestaurantText();
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead rubric={t('menu.rubric')} title={t('menu.title')} sub={t('menu.subtitle')} />
      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-[1em]">
        <Carta columns={2} />
        <div className="flex min-w-0 flex-col gap-[0.7em]">
          <SoldOutEffect />
          <QrCard />
        </div>
      </div>
    </div>
  );
}

export function PhoneMenu() {
  const { t } = useRestaurantText();
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead rubric={t('menu.rubric')} title={t('menu.title')} sub={t('menu.subtitleShort')} />
      <SoldOutEffect />
      <Carta />
      <QrCard />
    </div>
  );
}
