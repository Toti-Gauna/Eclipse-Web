'use client';

import { useRef, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Flame, Lock, Minus, type LucideIcon } from 'lucide-react';
import { useFlip } from './flip';
import { useDemoFormat } from './format';
import { Avatar, Readout, toneClass, type Tone } from './primitives';
import './gamification.css';

/** Level + progress to the next one, on a ruler (10 ticks). */
export function XpBar({
  level,
  xp,
  next,
  unit = 'XP',
  className = '',
}: {
  level: number;
  /** XP inside the current level. */
  xp: number;
  /** XP needed to reach the next level. */
  next: number;
  unit?: string;
  className?: string;
}) {
  const t = useTranslations('demoKit.game');
  const fmt = useDemoFormat();
  const ratio = Math.max(0, Math.min(1, xp / (next || 1)));
  return (
    <div className={`demo-xp ${className}`}>
      <div className="demo-xp-row">
        <span className="demo-xp-level demo-display">{t('level', { n: level })}</span>
        <span className="demo-xp-count demo-num">
          <Readout value={xp} /> / {fmt.num(next)} {unit}
        </span>
      </div>
      <div
        className="demo-xp-track"
        role="progressbar"
        aria-label={t('toNext', { n: level + 1 })}
        aria-valuemin={0}
        aria-valuemax={next}
        aria-valuenow={xp}
      >
        <span className="demo-xp-fill" style={{ transform: `scaleX(${ratio})` }} />
        <span aria-hidden className="demo-xp-ticks" />
      </div>
    </div>
  );
}

/** Streak: the count + this week's days (done / today / pending). */
export function Streak({
  days,
  week,
  weekLabels,
  today,
  className = '',
}: {
  days: number;
  /** One entry per weekday: done or not. */
  week: boolean[];
  /** Short weekday labels (same length as `week`). */
  weekLabels: string[];
  /** Index of today in `week`. */
  today: number;
  className?: string;
}) {
  const t = useTranslations('demoKit.game');
  return (
    <div className={`demo-streak ${className}`}>
      <div className="demo-streak-head">
        <span className="demo-streak-flame demo-loop" aria-hidden>
          <Flame strokeWidth={1.8} />
        </span>
        <span className="demo-streak-days demo-display">
          <Readout value={days} />
        </span>
        <span className="demo-streak-label">{t('streak', { count: days })}</span>
      </div>
      <ol className="demo-streak-week">
        {week.map((done, i) => (
          <li key={i} data-done={done ? '' : undefined} data-today={i === today ? '' : undefined}>
            <span aria-hidden className="demo-streak-dot" />
            <span className="demo-streak-day" aria-hidden>
              {weekLabels[i]}
            </span>
            <span className="sr-only">
              {weekLabels[i]}: {done ? t('done') : t('pending')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface BadgeItem {
  id: string;
  label: string;
  icon: LucideIcon;
  earned: boolean;
  /** Locked badges: progress 0–1. */
  progress?: number;
  tone?: Tone;
  /** Just earned: pop + glint. */
  fresh?: boolean;
}

/** Medals: earned ones in color, locked ones with their progress ring. */
export function BadgeGrid({ badges, label, columns = 4, className = '' }: { badges: BadgeItem[]; label: string; columns?: number; className?: string }) {
  const t = useTranslations('demoKit.game');
  return (
    <ul className={`demo-badges ${className}`} aria-label={label} style={{ '--bg-cols': columns } as CSSProperties}>
      {badges.map((b) => {
        const Icon = b.earned ? b.icon : Lock;
        const p = Math.max(0, Math.min(1, b.progress ?? 0));
        return (
          <li key={b.id} className={`demo-badge-item ${toneClass(b.tone ?? 'accent')}`} data-earned={b.earned ? '' : undefined} data-fresh={b.fresh ? '' : undefined}>
            <span className="demo-medal" aria-hidden>
              {!b.earned ? (
                <svg viewBox="0 0 36 36" className="demo-medal-ring">
                  <circle cx="18" cy="18" r="16" pathLength={100} />
                  <circle cx="18" cy="18" r="16" pathLength={100} strokeDasharray={`${p * 100} 100`} className="demo-medal-progress" />
                </svg>
              ) : null}
              <Icon strokeWidth={1.8} />
              {b.fresh ? <span className="demo-medal-glint" /> : null}
            </span>
            <span className="demo-badge-label">{b.label}</span>
            <span className="sr-only">{b.earned ? t('earned') : t('progress', { pct: Math.round(p * 100) })}</span>
          </li>
        );
      })}
    </ul>
  );
}

export interface LeaderRow {
  id: string;
  name: string;
  initials: string;
  color?: string;
  points: number;
  /** Rank change since last time (+ up, − down). */
  delta?: number;
  sub?: string;
  /** The visitor / current member. */
  me?: boolean;
}

/** Ranking whose rows slide to their new place when points change (FLIP). Pass rows sorted. */
export function Leaderboard({
  rows,
  label,
  unit,
  limit = 6,
  className = '',
}: {
  rows: LeaderRow[];
  label: string;
  unit?: string;
  limit?: number;
  className?: string;
}) {
  const t = useTranslations('demoKit.game');
  const root = useRef<HTMLOListElement>(null);
  const shown = rows.slice(0, limit);
  useFlip(root, shown.map((r) => r.id).join('|'));
  return (
    <ol ref={root} className={`demo-board ${className}`} aria-label={label}>
      {shown.map((r, i) => {
        const Trend = !r.delta ? Minus : r.delta > 0 ? ChevronUp : ChevronDown;
        return (
          <li key={r.id} data-flip={r.id} className="demo-board-row" data-me={r.me ? '' : undefined} data-rank={i + 1}>
            <span className="demo-board-rank demo-num" aria-label={t('rank', { n: i + 1 })}>
              {i + 1}
            </span>
            <Avatar initials={r.initials} color={r.color} />
            <span className="min-w-0 flex-1 leading-[1.2]">
              <span className="block truncate text-[0.78em] font-semibold">{r.name}</span>
              {r.sub ? <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">{r.sub}</span> : null}
            </span>
            <span className="demo-board-trend" data-dir={!r.delta ? 'flat' : r.delta > 0 ? 'up' : 'down'} aria-hidden>
              <Trend strokeWidth={2.4} />
            </span>
            <span className="demo-board-points demo-num">
              <Readout value={r.points} />
              {unit ? <span className="demo-board-unit"> {unit}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
