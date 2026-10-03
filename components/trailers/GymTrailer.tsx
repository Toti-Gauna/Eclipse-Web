'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Flame, Trophy } from 'lucide-react';
import { verticalById, type Vertical } from '@/lib/content';
import { pop, swap, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';

const VERTICAL = verticalById('gimnasios') as Vertical;

/** Demo scenario: members who cancel per week (the rubro's default in /content). */
const PAIN: TrailerNumber = { value: VERTICAL.calculator.lostPerWeek, prefix: '', suffix: '' };

/** Mock values of the member's week: streak days and level before → after. */
const STREAK = { from: 9, to: 10 };
const LEVEL = { from: 4, to: 5 };
const MISSIONS = [
  { key: 'm1', from: 0.67, to: 1, done: true },
  { key: 'm2', from: 0.2, to: 0.5, done: false },
  { key: 'm3', from: 0.15, to: 0.15, done: false },
] as const;

/** The streak ticks up, a mission completes, the level-up lands. */
const animateMock: MockAnimator = (tl, q, at) => {
  const [streak] = q('[data-trl="streak"]');
  const missions = q('[data-trl="mission"]');
  tl.fromTo([streak, ...missions].filter(Boolean), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07 }, at - 0.75);
  swap(tl, streak, at + 0.25);
  const [flame] = q('[data-trl="flame"]');
  if (flame) tl.fromTo(flame, { scale: 0.6, rotate: -18 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(3)' }, at + 0.3);
  const meters = q('[data-trl="meter"]');
  MISSIONS.forEach((m, i) => {
    const meter = meters[i];
    if (!meter || m.from === m.to) return;
    tl.fromTo(meter, { scaleX: m.from }, { scaleX: m.to, duration: 0.9, ease: 'power3.inOut' }, at + 0.7 + i * 0.3);
  });
  const [check] = q('[data-trl="check"]');
  pop(tl, check, at + 1.5, { scale: 0, y: 0 });
  const [toast] = q('[data-trl="levelup"]');
  pop(tl, toast, at + 1.8, { yPercent: -140, y: 0, scale: 1 });
  swap(tl, q('[data-trl="level"]')[0], at + 2.0);
};

function GymScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.gym.screen');
  const tc = useTranslations('common');

  return (
    <div className="mk" style={{ '--mk-accent': '#5a48d0' } as CSSProperties}>
      <div className="mk-bar">
        <span className="mk-logo" />
        <span>{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-bar-end mk-swap" data-trl="level">
          <span data-trl-before>{t('level', { count: LEVEL.from })}</span>
          <span data-trl-after>{t('level', { count: LEVEL.to })}</span>
        </span>
      </div>
      <p className="mk-title">{t('title')}</p>
      <div className="mk-streak mk-card" data-trl="streak">
        <span className="mk-flame" data-trl="flame">
          <Flame aria-hidden strokeWidth={1.8} />
        </span>
        <div>
          <span className="mk-label">{t('streak')}</span>
          <span className="mk-swap">
            <b data-trl-before>{t('days', { count: STREAK.from })}</b>
            <b data-trl-after>{t('days', { count: STREAK.to })}</b>
          </span>
        </div>
      </div>
      <p className="mk-label">{t('missions')}</p>
      <ul className="mk-missions">
        {MISSIONS.map((m) => (
          <li key={m.key} className="mk-mission mk-card" data-trl="mission">
            <span className="mk-check">
              {m.done ? (
                <span className="mk-check-fill" data-trl="check">
                  <Check aria-hidden strokeWidth={2.4} />
                </span>
              ) : null}
            </span>
            <span>{t(m.key)}</span>
            <span className="mk-meter">
              <span data-trl="meter" style={{ '--to': m.to } as CSSProperties} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mk-toast" data-trl="levelup">
        <Trophy aria-hidden strokeWidth={1.8} />
        {t('levelUp')} · {t('level', { count: LEVEL.to })}
      </p>
    </div>
  );
}

/** "Órbita Fitness — Demo": members drifting away → missions and streaks → fewer cancellations. */
export function GymTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="gym"
      pain={PAIN}
      screen={<GymScreen business={VERTICAL.business ?? ''} />}
      mock={animateMock}
      {...props}
    />
  );
}

export default GymTrailer;
