'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Coffee, Flame, Gift, Repeat, Sparkles } from 'lucide-react';
import { Card, Kpi, Leaderboard, type LeaderRow } from '../../kit';
import { BOARD, CLUB, LEVELS, PEOPLE, levelFor } from '../data';
import { useShop } from '../context';
import { PersonAvatar, useShopMoney, useShopText, ViewHead } from '../ui';
import { RoastRuler } from '../front/Club';

/** Members per level as one bar, colored like roast degrees. */
function LevelBar() {
  const t = useTranslations('demoShop.club');
  const tl = useTranslations('demoShop.levels');
  const { view } = useShop();
  const total = LEVELS.reduce((s, l) => s + view.club.byLevel[l.id], 0);
  return (
    <figure className="shop-levels">
      <figcaption className="shop-card-title">{t('levels')}</figcaption>
      <div className="shop-levels-bar" aria-hidden>
        {LEVELS.map((l) => (
          <span key={l.id} style={{ flexGrow: view.club.byLevel[l.id], background: l.color, color: l.ink } as CSSProperties}>
            <b className="demo-mono">{view.club.byLevel[l.id]}</b>
          </span>
        ))}
      </div>
      <ul className="shop-levels-legend">
        {LEVELS.map((l) => (
          <li key={l.id}>
            <span aria-hidden style={{ background: l.color }} />
            {tl(l.id)}
            <span className="demo-mono text-[var(--demo-muted)]">
              {' '}
              · {t('from', { count: l.from })}
            </span>
            <span className="sr-only">: {t('membersSr', { count: view.club.byLevel[l.id], total })}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Tomás's six months in a row: the streak bonus pushes him to dark roast. */
function LevelUpCard({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoShop.club');
  const tl = useTranslations('demoShop.levels');
  const { view } = useShop();
  const { person } = useShopText();
  const row = view.club.board.find((r) => r.id === 'tomas')!;
  const up = view.club.levelUpAt !== null;
  const fresh = up && view.t - (view.club.levelUpAt ?? 0) < 3000;
  return (
    <Card className={`shop-levelup ${fresh ? 'demo-fresh' : ''}`} elevated>
      <div className="shop-levelup-head">
        <PersonAvatar id="tomas" />
        <span className="min-w-0 flex-1 leading-[1.2]">
          <span className="block truncate font-semibold">{person('tomas')}</span>
          <span className="block truncate text-[0.8em] text-[var(--demo-muted)]">{t('streakMonths', { count: row.streak })}</span>
        </span>
        <span className="shop-levelup-badge" data-up={up ? '' : undefined} data-glint={fresh ? '' : undefined}>
          {up ? <Sparkles aria-hidden strokeWidth={1.8} /> : <Flame aria-hidden strokeWidth={1.8} />}
          {tl(row.level)}
        </span>
      </div>
      <RoastRuler granos={row.granos} className="shop-levelup-ruler" />
      <p className="shop-levelup-text" aria-live="polite">
        {up ? t('levelUp', { name: person('tomas'), bonus: CLUB.streakBonus, level: tl(row.level) }) : t('almost', { name: person('tomas'), count: LEVELS[2].from - row.granos })}
      </p>
      {!compact ? (
        <p className="shop-levelup-perk">
          <Gift aria-hidden strokeWidth={1.8} />
          {up ? t('perkUnlocked') : t('perkNext')}
        </p>
      ) : null}
    </Card>
  );
}

function Board({ limit = 5 }: { limit?: number }) {
  const t = useTranslations('demoShop.club');
  const tl = useTranslations('demoShop.levels');
  const { view } = useShop();
  const { person } = useShopText();
  const rows: LeaderRow[] = view.club.board.map((r) => {
    const startRank = BOARD.findIndex((b) => b.id === r.id);
    const rank = view.club.board.findIndex((b) => b.id === r.id);
    return {
      id: r.id,
      name: person(r.id),
      initials: person(r.id).slice(0, 1),
      color: PEOPLE[r.id].bg,
      points: r.granos,
      delta: startRank - rank,
      sub: `${tl(levelFor(r.granos))} · ${t('streakShort', { count: r.streak })}`,
    };
  });
  return (
    <Card className="shop-board-card">
      <h3 className="shop-card-title">{t('ranking')}</h3>
      <Leaderboard rows={rows} label={t('ranking')} unit={t('granos')} limit={limit} />
    </Card>
  );
}

function HowItWorks() {
  const t = useTranslations('demoShop.club.how');
  const items = [
    { icon: Coffee, text: t('buy') },
    { icon: Repeat, text: t('streak', { bonus: CLUB.streakBonus }) },
    { icon: Gift, text: t('gift') },
  ];
  return (
    <Card className="shop-how">
      <h3 className="shop-card-title">{t('title')}</h3>
      <ul>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.text}>
              <Icon aria-hidden strokeWidth={1.7} />
              <span>{it.text}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ClubKpis() {
  const t = useTranslations('demoShop.club');
  const { view } = useShop();
  const money = useShopMoney();
  const { fmt } = useShopText();
  const one = new Intl.NumberFormat(fmt.tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="shop-kpis">
      <Kpi label={t('members')} value={view.club.members} />
      <Kpi label={t('mrr')} value={money.local(CLUB.subUsd) * view.club.members} format={money.fmt} emphasis />
      <Kpi label={t('avgStreak')} value={Math.round(CLUB.avgStreak * 10)} format={(n) => one.format(n / 10)} suffix={t('months')} />
    </div>
  );
}

export function LaptopClub() {
  const t = useTranslations('demoShop.club');
  return (
    <div className="shop-clubview">
      <ViewHead title={t('title')} sub={t('sub')} />
      <ClubKpis />
      <div className="shop-clubview-row">
        <div className="flex min-w-0 flex-col gap-[0.8em]">
          <LevelUpCard />
          <LevelBar />
          <HowItWorks />
        </div>
        <Board />
      </div>
    </div>
  );
}

export function PhoneClub() {
  const t = useTranslations('demoShop.club');
  return (
    <div className="shop-clubview" data-screen="phone">
      <ViewHead title={t('title')} sub={t('sub')} />
      <ClubKpis />
      <LevelUpCard compact />
      <Board limit={5} />
      <LevelBar />
    </div>
  );
}
