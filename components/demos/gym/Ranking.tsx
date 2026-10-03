'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Flame, Minus, Smartphone, TrendingDown, TrendingUp } from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { BOARD, CHECKIN_POINTS, ME, MEMBERS, MISSIONS, WEEK_BONUS, type MemberId } from './data';
import { standings } from './sim';
import { useFmt, useGym } from './context';
import { Avatar, Card, RollingNumber, ViewTitle, useMissionName } from './ui';
import { MemberToasts } from './activity';
import { MissionStats } from './Missions';

export type Board = 'week' | 'month';

/** Positions before the live story (the arrows compare against them). */
function useBaseRanks(board: Board) {
  return useMemo(() => {
    const ranks = new Map<MemberId, number>();
    BOARD.map((id, i) => ({ m: MEMBERS.find((x) => x.id === id)!, i }))
      .sort((a, b) => b.m[board] - a.m[board] || a.i - b.i)
      .forEach((x, i) => ranks.set(x.m.id, i + 1));
    return ranks;
  }, [board]);
}

export function BoardToggle({ board, onBoard, className = '' }: { board: Board; onBoard: (b: Board) => void; className?: string }) {
  const t = useTranslations('demoGym.ranking');
  return (
    <div role="group" aria-label={t('period')} className={`inline-flex shrink-0 rounded-full bg-black/[0.05] p-[0.2em] ${className}`}>
      {(['week', 'month'] as const).map((b) => (
        <button
          key={b}
          type="button"
          aria-pressed={b === board}
          onClick={() => onBoard(b)}
          className={`rounded-full px-[0.85em] py-[0.35em] text-[0.72em] font-semibold transition-colors ${
            b === board ? 'bg-white text-[var(--demo-ink)] shadow-[0_0.1em_0.4em_rgb(21_21_27/0.12)]' : 'text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
          }`}
        >
          {t(b)}
        </button>
      ))}
    </div>
  );
}

const MEDAL = ['#f5b942', '#cfd2dc', '#e3a77c'];

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL[rank - 1];
  return (
    <span
      aria-hidden
      className={`tabular grid size-[1.75em] shrink-0 place-items-center rounded-full text-[0.74em] font-bold ${medal ? 'text-[#05050a]' : 'text-[var(--demo-muted)]'}`}
      style={medal ? { background: medal } : undefined}
    >
      {rank}
    </span>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <Minus aria-hidden className="size-[0.9em] shrink-0 text-[var(--demo-muted)] opacity-60" strokeWidth={2} />;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center gap-[0.15em] text-[0.66em] font-semibold ${up ? 'text-[var(--gym-ok)]' : 'text-[var(--gym-bad)]'}`}>
      <Icon className="size-[1.15em]" strokeWidth={2.2} />
      {Math.abs(value)}
    </span>
  );
}

/**
 * The leaderboard. Rows keep their DOM order = ranking order (so screen readers
 * read it right) and slide to their new place with a FLIP animation.
 */
export function Leaderboard({ board, variant = 'phone' }: { board: Board; variant?: 'phone' | 'laptop' }) {
  const t = useTranslations('demoGym');
  const { world, paired } = useGym();
  const rows = standings(world.members, board);
  const base = useBaseRanks(board);
  const list = useRef<HTMLOListElement>(null);
  const tops = useRef(new Map<string, number>());
  const order = rows.map((r) => r.id).join();

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>('[data-row]')];
    const prev = tops.current;
    const next = new Map(items.map((item) => [item.dataset.row!, item.offsetTop]));
    tops.current = next;
    if (!prev.size || prefersReducedMotion()) return;
    for (const item of items) {
      const before = prev.get(item.dataset.row!);
      const after = next.get(item.dataset.row!)!;
      if (before === undefined || before === after) continue;
      const current = Number(gsap.getProperty(item, 'y')) || 0;
      gsap.fromTo(item, { y: before - after + current }, { y: 0, duration: 0.9, ease: 'expo.out', overwrite: true });
    }
  }, [order]);

  const laptop = variant === 'laptop';
  return (
    <ol ref={list} className="relative flex flex-col gap-[0.3em]">
      {rows.map((m, i) => {
        const rank = i + 1;
        const me = m.id === ME;
        const change = (base.get(m.id) ?? rank) - rank;
        const name = t(`members.${m.id}`);
        const summary = [
          t('ranking.rowLabel', { rank, name: me ? `${name} (${t('you.tag')})` : name, points: m[board] }),
          change > 0 ? t('ranking.up', { count: change }) : change < 0 ? t('ranking.down', { count: -change }) : '',
        ]
          .filter(Boolean)
          .join(', ');
        return (
          <li
            key={m.id}
            data-row={m.id}
            className={`relative flex items-center gap-[0.55em] rounded-[0.85em] px-[0.55em] py-[0.42em] ${
              me ? 'z-10 bg-white shadow-[0_0_0_0.12em_var(--demo-accent),0_0.6em_1.4em_-0.7em_rgb(91_52_214/0.6)]' : ''
            }`}
          >
            <RankBadge rank={rank} />
            <Avatar id={m.id} />
            <span aria-hidden className="min-w-0 flex-1 leading-[1.2]">
              <span className="flex items-center gap-[0.35em]">
                <span className="truncate text-[0.8em] font-semibold">{name}</span>
                {me ? (
                  <span className="shrink-0 rounded-full bg-[var(--demo-accent)] px-[0.45em] py-[0.05em] text-[0.58em] font-bold uppercase tracking-[0.06em] text-white">
                    {t('you.tag')}
                  </span>
                ) : null}
                {rank === 1 ? <Crown className="size-[0.85em] shrink-0 text-[#b7791f]" strokeWidth={2.2} /> : null}
              </span>
              {laptop ? (
                me && paired ? (
                  <span className="flex items-center gap-[0.25em] text-[0.6em] font-semibold text-[var(--gym-accent-ink)]">
                    <Smartphone className="size-[1.1em] shrink-0" strokeWidth={2} />
                    <span className="truncate">{t('activity.onPhone')}</span>
                  </span>
                ) : null
              ) : (
                <span className="flex items-center gap-[0.25em] text-[0.64em] text-[var(--demo-muted)]">
                  {m.streak > 0 ? (
                    <>
                      <Flame className="size-[1.05em] text-[var(--gym-flame)]" strokeWidth={2} />
                      {t('ranking.streak', { count: m.streak })}
                    </>
                  ) : (
                    t('ranking.noStreak')
                  )}
                </span>
              )}
            </span>
            {laptop ? (
              <span aria-hidden className="flex w-[7em] shrink-0 items-center gap-[0.3em] text-[0.7em] text-[var(--demo-muted)]">
                {m.streak > 0 ? (
                  <>
                    <Flame className="size-[1.1em] text-[var(--gym-flame)]" strokeWidth={2} />
                    {t('ranking.streak', { count: m.streak })}
                  </>
                ) : (
                  t('ranking.noStreak')
                )}
              </span>
            ) : null}
            <span className={`flex shrink-0 justify-center ${laptop ? 'w-[3.2em]' : 'w-[2em]'}`}>
              <Delta value={change} />
            </span>
            <span aria-hidden className={`tabular shrink-0 text-right text-[0.8em] font-semibold ${laptop ? 'w-[4.5em]' : 'w-[3.4em]'}`}>
              <RollingNumber value={m[board]} />
            </span>
            <span className="sr-only">{summary}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** "#3 · 550 pts · 6 pts to pass Bruno" — the member's own position. */
function MyRank({ board }: { board: Board }) {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world } = useGym();
  const rows = standings(world.members, board);
  const base = useBaseRanks(board);
  const idx = rows.findIndex((m) => m.id === ME);
  const me = rows[idx];
  const above = rows[idx - 1];
  const climbed = (base.get(ME) ?? idx + 1) - (idx + 1);
  return (
    <section className="relative overflow-hidden rounded-[1.2em] p-[0.95em] text-white" style={{ background: 'var(--gym-space)' }}>
      <div className="flex items-center gap-[0.8em]">
        <p className="leading-none">
          <span className="block text-[0.68em] font-semibold uppercase tracking-[0.1em] text-white/80">{t('ranking.yourPlace')}</span>
          <span key={`${board}-${idx}`} className="gym-count-in mt-[0.2em] block text-[2.8em] font-semibold tracking-[-0.04em]">
            <span aria-hidden>#</span>
            {fmt.num(idx + 1)}
            <span className="sr-only"> {t('ranking.position', { rank: idx + 1 })}</span>
          </span>
        </p>
        <div className="min-w-0 flex-1">
          <p className="text-[0.95em] font-semibold">
            <RollingNumber value={me[board]} /> {t('pts')}
          </p>
          {climbed > 0 ? (
            <p className="mt-[0.2em] inline-flex items-center gap-[0.25em] rounded-full bg-white/15 px-[0.5em] py-[0.15em] text-[0.66em] font-semibold">
              <TrendingUp aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
              {t('ranking.youUp', { count: climbed })}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-[0.7em] border-t border-white/15 pt-[0.6em] text-[0.7em] leading-[1.35] text-white/90">
        {above
          ? t('ranking.toPass', { points: above[board] - me[board] + 1, name: t(`members.${above.id}`) })
          : t('ranking.first')}
      </p>
    </section>
  );
}

export function PhoneRanking() {
  const t = useTranslations('demoGym');
  const [board, setBoard] = useState<Board>('week');
  return (
    <div className="flex flex-col gap-[0.75em]">
      <MemberToasts />
      <div className="flex items-end justify-between gap-[0.6em]">
        <ViewTitle eyebrow={t('memberView')} title={t('ranking.title')} />
        <BoardToggle board={board} onBoard={setBoard} />
      </div>
      <MyRank board={board} />
      <Card className="p-[0.4em]">
        <Leaderboard board={board} />
      </Card>
      <p className="px-[0.2em] text-[0.66em] leading-[1.4] text-[var(--demo-muted)]">
        {t('ranking.howPoints', { checkin: CHECKIN_POINTS, bonus: WEEK_BONUS })}
      </p>
    </div>
  );
}

/** How members earn points (the mechanics the owner sets). */
function PointsRules() {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const name = useMissionName();
  const rows = [
    { label: t('rules.checkin'), points: CHECKIN_POINTS },
    ...MISSIONS.map((m) => ({ label: name(m.id), points: m.reward })),
    { label: t('rules.bonus'), points: WEEK_BONUS },
  ];
  return (
    <Card className="p-[0.85em]" as="section">
      <h3 className="text-[0.86em] font-semibold">{t('rules.title')}</h3>
      <ul className="mt-[0.45em] divide-y divide-[var(--demo-line)]">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-[0.6em] py-[0.32em] text-[0.7em]">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="tabular shrink-0 font-semibold text-[var(--gym-accent-ink)]">
              +{fmt.num(r.points)} {t('pts')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function LaptopRanking() {
  const t = useTranslations('demoGym');
  const [board, setBoard] = useState<Board>('week');
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--gym-safe-top,0em)] flex items-end justify-between gap-[1em]">
        <ViewTitle size="laptop" title={t('ranking.title')} subtitle={t('ranking.ownerSubtitle')} />
        <BoardToggle board={board} onBoard={setBoard} />
      </div>
      <div className="mr-[var(--gym-safe,0em)] grid grid-cols-[minmax(0,1fr)_14.5em] items-start gap-[0.8em]">
        <Card className="p-[0.6em]" as="section">
          <div aria-hidden className="flex items-center gap-[0.55em] border-b border-[var(--demo-line)] px-[0.55em] pb-[0.45em] pt-[0.15em] font-semibold uppercase tracking-[0.08em] text-[var(--demo-muted)]">
            <span className="w-[1.3em] text-center">
              <span className="text-[0.6em]">#</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-[0.6em]">{t('ranking.colMember')}</span>
            </span>
            <span className="w-[4.9em]">
              <span className="text-[0.6em]">{t('ranking.colStreak')}</span>
            </span>
            <span className="w-[3.2em] text-center">
              <span className="text-[0.6em]">{t('ranking.colChange')}</span>
            </span>
            <span className="w-[3.6em] text-right">
              <span className="text-[0.6em]">{t('ranking.colPoints')}</span>
            </span>
          </div>
          <Leaderboard board={board} variant="laptop" />
        </Card>
        <div className="flex flex-col gap-[0.8em]">
          <MissionStats />
          <PointsRules />
        </div>
      </div>
    </div>
  );
}
