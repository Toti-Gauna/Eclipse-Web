'use client';

import type { CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, Check, MessageCircle } from 'lucide-react';
import { localeTags, type Locale } from '@/i18n/routing';
import { verticalById, type Vertical } from '@/lib/content';
import { pop, swap, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';

const VERTICAL = verticalById('clinicas') as Vertical;

/** Demo scenario: the empty slots per week that the demo then recovers (/content key number). */
const PAIN: TrailerNumber = { value: VERTICAL.keyNumber?.value ?? 0, prefix: '', suffix: '' };

type Tone = 'muted' | 'ok' | 'bad' | 'free' | 'accent';
interface Row {
  hour: number;
  minute: number;
  before: [Tone, string];
  after: [Tone, string];
  recovered?: boolean;
}

const ROWS: Row[] = [
  { hour: 9, minute: 0, before: ['muted', 'unconfirmed'], after: ['ok', 'confirmed'] },
  { hour: 10, minute: 30, before: ['bad', 'cancelled'], after: ['accent', 'reassigned'], recovered: true },
  { hour: 11, minute: 15, before: ['free', 'free'], after: ['ok', 'booked'], recovered: true },
  { hour: 12, minute: 0, before: ['muted', 'unconfirmed'], after: ['ok', 'confirmed'] },
];

/** Agenda: reminders confirm, the waitlist fills the cancelled and open slots. */
const animateMock: MockAnimator = (tl, q, at) => {
  const rows = q('[data-trl="row"]');
  tl.fromTo(rows, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07 }, at - 0.75);
  const [toast1] = q('[data-trl="toast-1"]');
  const [toast2] = q('[data-trl="toast-2"]');
  pop(tl, toast1, at, { yPercent: -140, y: 0, scale: 1 });
  swap(tl, rows[0], at + 0.35);
  swap(tl, rows[3], at + 0.6);
  if (toast1) {
    tl.fromTo(toast1, { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -140, duration: 0.4, ease: 'power2.in', immediateRender: false }, at + 1.2);
  }
  swap(tl, rows[1], at + 1.05);
  pop(tl, rows[1]?.querySelector<HTMLElement>('[data-trl="plus"]') ?? undefined, at + 1.35, { scale: 0.5, y: 0 });
  pop(tl, toast2, at + 1.5, { yPercent: -140, y: 0, scale: 1 });
  swap(tl, rows[2], at + 1.8);
  pop(tl, rows[2]?.querySelector<HTMLElement>('[data-trl="plus"]') ?? undefined, at + 2.1, { scale: 0.5, y: 0 });
};

function ClinicScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.clinic.screen');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const time = new Intl.DateTimeFormat(localeTags[locale], { hour: 'numeric', minute: '2-digit', hour12: locale === 'en' });

  return (
    <div className="mk" style={{ '--mk-accent': '#2f8f83' } as CSSProperties}>
      <div className="mk-bar">
        <span className="mk-logo" />
        <span>{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-bar-end">{t('today')}</span>
      </div>
      <p className="mk-title">{t('title')}</p>
      <ul className="mk-rows">
        {ROWS.map((row) => (
          <li key={`${row.hour}:${row.minute}`} className="mk-row mk-card" data-trl="row">
            <span className="mk-time">{time.format(new Date(2026, 0, 5, row.hour, row.minute))}</span>
            <span className="mk-skel" />
            {row.recovered ? (
              <span className="mk-plus" data-trl="plus">
                +1
              </span>
            ) : (
              <span />
            )}
            <span className="mk-swap">
              <span className={`mk-pill mk-pill--${row.before[0]}`} data-trl-before>
                {t(row.before[1])}
              </span>
              <span className={`mk-pill mk-pill--${row.after[0]}`} data-trl-after>
                {row.after[0] === 'ok' ? <Check aria-hidden strokeWidth={2.2} /> : null}
                {t(row.after[1])}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mk-toast mk-toast--gone" data-trl="toast-1">
        <MessageCircle aria-hidden strokeWidth={1.8} />
        {t('toastReminder')}
      </p>
      <p className="mk-toast" data-trl="toast-2">
        <CalendarCheck aria-hidden strokeWidth={1.8} />
        {t('toastWaitlist')}
      </p>
    </div>
  );
}

/** "Clínica Aurora — Demo": empty slots → reminders + waitlist → slots recovered. */
export function ClinicTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="clinic"
      pain={PAIN}
      screen={<ClinicScreen business={VERTICAL.business ?? ''} />}
      mock={animateMock}
      {...props}
    />
  );
}

export default ClinicTrailer;
