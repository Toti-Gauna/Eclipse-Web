'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { AudioLines, CalendarCheck, PhoneIncoming, Wheat } from 'lucide-react';
import { verticalById, type Vertical } from '@/lib/content';
import { AI_TABLES, BASE_TICKETS, FIRST_TICKET, RESTAURANT_THEME } from '@/components/demos/restaurant/data';
import { pop, swap, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';
import './restaurant-trailer.css';

const VERTICAL = verticalById('restaurantes') as Vertical;

/** Demo scenario: orders or bookings lost per week at rush hour (the rubro's default in /content). */
const PAIN: TrailerNumber = { value: VERTICAL.calculator.lostPerWeek, prefix: '', suffix: '' };

/** The three rush-hour calls of the demo (same lines and topics). */
const LINES = [
  { n: 1, topic: 'order' },
  { n: 2, topic: 'booking' },
  { n: 3, topic: 'gf' },
] as const;
/** The tickets those calls print in the demo (#148 delivery, #150 gluten-free) and the table the AI books. */
const FIRST_STORY_TICKET = FIRST_TICKET + BASE_TICKETS.length;
const TICKETS = [
  { num: FIRST_STORY_TICKET + 1, key: 'ticketOrder', gf: false },
  { num: FIRST_STORY_TICKET + 3, key: 'ticketGf', gf: true },
] as const;
const TABLE = AI_TABLES[0];

/** Bodegón Lucero's palette (same as the demo: dark warm · cream · wine · olive). */
const T = RESTAURANT_THEME;
const RESTAURANT_MOCK = {
  '--mk-accent': T.accent,
  '--mk-accent-soft': `color-mix(in oklab, ${T.accent} 30%, ${T.bg})`,
  '--mk-ink': T.ink,
  '--mk-muted': T.muted,
  '--mk-line': T.line,
  '--mk-card': T.surface,
  '--mk-olive': T.accent2,
  '--mk-olive-text': T.accent2Text,
  '--mk-wine-text': T.accentText,
  '--mk-bg': T.bg,
  background: T.bg,
  color: T.ink,
} as CSSProperties;

/** Three lines ring → the AI answers all three → tickets print in the kitchen → the table is booked. */
const animateMock: MockAnimator = (tl, q, at) => {
  const rows = q('[data-trl="row"]');
  tl.fromTo(rows, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, at - 0.75);
  rows.forEach((row, i) => swap(tl, row, at + 0.15 + i * 0.28));
  const tickets = q('[data-trl="ticket"]');
  tickets.forEach((tk, i) => {
    tl.fromTo(tk, { autoAlpha: 0, yPercent: -40, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, yPercent: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' }, at + 1.25 + i * 0.35);
  });
  const [toast] = q('[data-trl="toast"]');
  pop(tl, toast, at + 2.0, { yPercent: 140, y: 0, scale: 1 });
};

function RestaurantScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.restaurant.screen');
  const tc = useTranslations('common');

  return (
    <div className="mk mk-rl" style={RESTAURANT_MOCK}>
      <div className="mk-bar">
        <span className="mk-logo" />
        <span className="mk-rl-brand">{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-bar-end mk-rl-mono">{t('tonight')}</span>
      </div>
      <p className="mk-title mk-rl-title">{t('title')}</p>
      <ul className="mk-rl-lines">
        {LINES.map((line) => (
          <li key={line.n} className="mk-rl-line" data-trl="row">
            <span className="mk-rl-lamp" aria-hidden />
            <span className="mk-rl-mono mk-rl-n">{t('line', { n: line.n })}</span>
            <span className="mk-rl-topic">{t(line.topic)}</span>
            <span className="mk-swap">
              <span className="mk-pill mk-rl-ring" data-trl-before>
                <PhoneIncoming aria-hidden strokeWidth={2} />
                {t('ringing')}
              </span>
              <span className="mk-pill mk-rl-live" data-trl-after>
                <AudioLines aria-hidden strokeWidth={2} />
                {t('answered')}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mk-label">{t('kitchen')}</p>
      <div className="mk-rl-tickets">
        {TICKETS.map((tk) => (
          <div key={tk.num} className="mk-rl-ticket" data-trl="ticket">
            <b className="mk-rl-mono">#{tk.num}</b>
            <span>
              {tk.gf ? <Wheat aria-hidden strokeWidth={2} /> : null}
              {t(tk.key)}
            </span>
          </div>
        ))}
      </div>
      <p className="mk-toast mk-rl-toast" data-trl="toast">
        <CalendarCheck aria-hidden strokeWidth={1.8} />
        {t('toast', { table: TABLE })}
      </p>
    </div>
  );
}

/** "Bodegón Lucero — Demo": the phone won't stop at rush hour → an AI voice agent on every line. */
export function RestaurantTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="restaurant"
      pain={PAIN}
      screen={<RestaurantScreen business={VERTICAL.business ?? ''} />}
      mock={animateMock}
      {...props}
    />
  );
}

export default RestaurantTrailer;
