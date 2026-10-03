'use client';

import { useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Gift, Lock, Sprout, Truck } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Readout, upperFirst } from '../../kit';
import { LEVELS, MY_CLUB, levelFor, unitUsd, type LevelId } from '../data';
import { useShop } from '../context';
import { useShopText } from '../ui';
import { useFront } from './context';

const MAX = 900;
const PERKS: { id: string; icon: typeof Truck; level: LevelId }[] = [
  { id: 'presale', icon: Sprout, level: 'light' },
  { id: 'shipping', icon: Truck, level: 'medium' },
  { id: 'gift', icon: Gift, level: 'dark' },
];

/** A roast ruler: light → dark, ticks at each level, a marker at your granos. */
export function RoastRuler({ granos, className = '' }: { granos: number; className?: string }) {
  const pos = Math.min(1, granos / MAX);
  return (
    <span className={`sf-ruler ${className}`} aria-hidden>
      <span className="sf-ruler-track" />
      {LEVELS.slice(1).map((l) => (
        <span key={l.id} className="sf-ruler-tick" style={{ left: `${(l.from / MAX) * 100}%` }} />
      ))}
      <span className="sf-ruler-marker" style={{ left: `${pos * 100}%` } as CSSProperties} />
    </span>
  );
}

/** The customer's granos: their membership + what they bought here (Inés in the story, else the visitor). */
export function useMyGranos(story: boolean, bonus = 0) {
  const { view } = useShop();
  const paid = view.orders.filter((o) => o.customer === (story ? 'ines' : 'you'));
  const earned = Math.round(paid.reduce((s, o) => s + o.lines.reduce((a, l) => a + unitUsd(l) * l.qty, 0), 0));
  const granos = MY_CLUB.granos + earned + bonus;
  return { granos, level: levelFor(granos), next: LEVELS.find((l) => l.from > granos) ?? null };
}

/** The customer's club: level by roast, granos, month streak, perks, subscription. */
export function ClubPage() {
  const f = useFront();
  const t = useTranslations('demoShop.front.club');
  const tl = useTranslations('demoShop.levels');
  const { active } = useShop();
  const { fmt } = useShopText();
  const { play } = useSound();
  const [plan, setPlan] = useState<'2w' | '4w'>('2w');
  const [joined, setJoined] = useState(false);

  const { granos, level, next } = useMyGranos(f.story, joined ? 50 : 0);
  const months = Array.from({ length: 4 }, (_, i) => upperFirst(fmt.date(new Date(Date.UTC(2026, 6 + i, 1)), { month: 'short' }).replace('.', '')));

  return (
    <div className="sf-club">
      <p className="sf-kicker demo-mono">{t('kicker')}</p>
      <h3 className="sf-club-title demo-display">{t('title')}</h3>
      <div className="sf-club-card" data-level={level}>
        <span className="sf-club-label">{t('yourLevel')}</span>
        <b className="sf-club-level demo-display">{tl(level)}</b>
        <span className="sf-club-granos demo-mono">
          <Readout value={granos} /> {t('granos')}
        </span>
        <RoastRuler granos={granos} />
        <span className="sf-club-scale" aria-hidden>
          {LEVELS.map((l) => (
            <span key={l.id}>{tl(l.id)}</span>
          ))}
        </span>
        <p className="sf-club-next">{next ? t('toNext', { count: next.from - granos, level: tl(next.id) }) : t('top')}</p>
      </div>
      <div className="sf-streak">
        <p className="sf-streak-head">
          <b className="demo-display">{MY_CLUB.streak}</b>
          <span>{t('streak', { count: MY_CLUB.streak })}</span>
        </p>
        <ol className="sf-months">
          {months.map((m, i) => (
            <li key={m} data-done={i < MY_CLUB.streak ? '' : undefined} data-now={i === MY_CLUB.streak ? '' : undefined}>
              <span aria-hidden className={`sf-month-dot ${i === MY_CLUB.streak ? 'demo-loop' : ''}`}>
                {i < MY_CLUB.streak ? <Check strokeWidth={2.6} /> : null}
              </span>
              <span className="demo-mono">{m}</span>
              <span className="sr-only">{i < MY_CLUB.streak ? t('monthDone') : t('monthNow')}</span>
            </li>
          ))}
        </ol>
        <p className="sf-streak-note">{t('streakNote', { bonus: 100 })}</p>
      </div>
      <ul className="sf-perks">
        {PERKS.map((p) => {
          const open = LEVELS.findIndex((l) => l.id === level) >= LEVELS.findIndex((l) => l.id === p.level);
          const Icon = open ? p.icon : Lock;
          return (
            <li key={p.id} data-open={open ? '' : undefined}>
              <span className="sf-perk-icon" aria-hidden>
                <Icon strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1 leading-[1.25]">
                <span className="block font-semibold">{t(`perks.${p.id}`)}</span>
                <span className="block text-[0.82em] text-[var(--demo-muted)]">{open ? t('perkOpen') : t('perkFrom', { level: tl(p.level) })}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="sf-plan">
        <div className="sf-opts-row" role="radiogroup" aria-label={t('every')}>
          {(['2w', '4w'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={plan === p}
              className="sf-pill"
              onClick={() => {
                f.act(() => ({}), 'select');
                setPlan(p);
              }}
            >
              {t(`plans.${p}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sf-cta sf-cta-wide"
          aria-pressed={joined}
          onClick={() => {
            f.act(() => ({}), null);
            setJoined(true);
            if (active && !joined) play('success', { volume: 0.6 });
          }}
        >
          {joined ? <Check aria-hidden strokeWidth={2.4} /> : null}
          {joined ? t('joined') : t('join')}
        </button>
        <p className="sf-secure" aria-live="polite">
          {joined ? t('joinedNote') : t('joinNote')}
        </p>
      </div>
    </div>
  );
}
