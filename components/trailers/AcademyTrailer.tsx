'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, GraduationCap, MessageCircle } from 'lucide-react';
import { verticalById, type Vertical } from '@/lib/content';
import { pop, swap, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';
import './academy-trailer.css';

const VERTICAL = verticalById('academias') as Vertical;

/** Demo scenario: students who drop out per week (the rubro's default in /content). */
const PAIN: TrailerNumber = { value: VERTICAL.calculator.lostPerWeek, prefix: '', suffix: '' };

/** Same story as the demo: Valentina's streak and level, Martín brought back by a nudge. */
const STREAK = { from: 11, to: 12 };
/** The key number (/content) as the share of the completion meter. */
const COMPLETION = (VERTICAL.keyNumber?.value ?? 0) / 100;

/** The nudge goes out, Martín comes back, Valentina's streak ticks and she levels up to B1. */
const animateMock: MockAnimator = (tl, q, at) => {
  const rows = q('[data-trl="row"]');
  tl.fromTo(rows, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, at - 0.75);
  const [toast1] = q('[data-trl="toast-1"]');
  const [toast2] = q('[data-trl="toast-2"]');
  pop(tl, toast1, at, { yPercent: -140, y: 0, scale: 1 });
  swap(tl, q('[data-trl="risk"]')[0], at + 0.85);
  if (toast1) {
    tl.fromTo(toast1, { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -140, duration: 0.4, ease: 'power2.in', immediateRender: false }, at + 1.2);
  }
  swap(tl, q('[data-trl="streak"]')[0], at + 1.25);
  const [flame] = q('[data-trl="flame"]');
  if (flame) tl.fromTo(flame, { scale: 0.6, rotate: -16 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(3)' }, at + 1.3);
  const [level] = q('[data-trl="level"]');
  swap(tl, level, at + 1.65);
  const sticker = level?.querySelector<HTMLElement>('[data-trl-after]') ?? undefined;
  if (sticker) tl.fromTo(sticker, { rotate: -28 }, { rotate: -7, duration: 0.8, ease: 'back.out(2.4)', immediateRender: false }, at + 1.83);
  pop(tl, toast2, at + 1.95, { yPercent: -140, y: 0, scale: 1 });
  const [meter] = q('[data-trl="meter"]');
  if (meter) tl.fromTo(meter, { scaleX: 0 }, { scaleX: COMPLETION, duration: 1.2, ease: 'power3.inOut' }, at - 0.3);
};

function AcademyScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.academy.screen');
  const tc = useTranslations('common');
  return (
    <div className="mk mk-academy">
      <div className="mk-bar">
        <span className="mk-logo" />
        <span>{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-bar-end">{t('today')}</span>
      </div>
      <p className="mk-title">{t('title')}</p>
      <ul className="mk-rows">
        <li className="mk-card mk-ac-row" data-trl="row">
          <span className="mk-ac-av" data-tone="sky">
            VR
          </span>
          <span className="mk-ac-who">
            <b>{t('valentina')}</b>
            <small>{t('valentinaSub')}</small>
          </span>
          <span className="mk-swap mk-ac-streak" data-trl="streak">
            <span data-trl-before>
              <Flame aria-hidden strokeWidth={2} />
              {t('streak', { count: STREAK.from })}
            </span>
            <span data-trl-after>
              <span data-trl="flame" className="mk-ac-flame">
                <Flame aria-hidden strokeWidth={2} />
              </span>
              {t('streak', { count: STREAK.to })}
            </span>
          </span>
          <span className="mk-swap mk-ac-level" data-trl="level">
            <span data-trl-before className="mk-ac-lvl">
              A2
            </span>
            <span data-trl-after className="mk-ac-sticker">
              B1
            </span>
          </span>
        </li>
        <li className="mk-card mk-ac-row" data-trl="row">
          <span className="mk-ac-av" data-tone="orange">
            MS
          </span>
          <span className="mk-ac-who">
            <b>{t('martin')}</b>
            <small>{t('martinSub')}</small>
          </span>
          <span className="mk-swap" data-trl="risk">
            <span className="mk-pill mk-pill--bad" data-trl-before>
              {t('risk')}
            </span>
            <span className="mk-pill mk-pill--ok" data-trl-after>
              {t('back')}
            </span>
          </span>
        </li>
        <li className="mk-card mk-ac-meter" data-trl="row">
          <span className="mk-label">{t('completion')}</span>
          <span className="mk-ac-track" aria-hidden>
            <span data-trl="meter" style={{ '--to': COMPLETION } as CSSProperties} />
          </span>
        </li>
      </ul>
      <p className="mk-toast mk-toast--gone" data-trl="toast-1">
        <MessageCircle aria-hidden strokeWidth={1.8} />
        {t('nudge')}
      </p>
      <p className="mk-toast" data-trl="toast-2">
        <GraduationCap aria-hidden strokeWidth={1.8} />
        {t('levelUp')}
      </p>
    </div>
  );
}

/** "Atrio Idiomas — Demo": they sign up, they drift away by week 3 → streaks, an AI tutor and a nudge → 82 % finish. */
export function AcademyTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="academy"
      pain={PAIN}
      screen={<AcademyScreen business={VERTICAL.business ?? ''} />}
      mock={animateMock}
      {...props}
    />
  );
}

export default AcademyTrailer;
