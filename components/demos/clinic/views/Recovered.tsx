'use client';

import { useTranslations } from 'next-intl';
import { useSound } from '@/components/sound/SoundContext';
import { AudioLines, CalendarClock, CalendarX2, Hourglass, Send, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { Bars, Card, Donut, Kanban, Legend, Pill, Readout, type KanbanCard } from '../../kit';
import { NO_SHOWS, NO_SHOWS_BEFORE_WEEKS, RECOVERED_BY_DAY, TODAY, WAITLIST_OFFERED } from '../data';
import { act, type KanbanColumnId, type RecoveryCard } from '../story';
import { useClinic } from '../context';
import { useClinicText, ViewHead } from '../ui';

/** The week as a sunrise: Mon → Fri along a low arc over the horizon, the sun on today. */
const ARC = { cx: 50, cy: 37, rx: 44, ry: 25 };
const arcY = (x: number) => ARC.cy - ARC.ry * Math.sqrt(Math.max(0, 1 - ((x - ARC.cx) / ARC.rx) ** 2));

function WeekArc() {
  const t = useTranslations('demoClinic.recovered');
  const { view } = useClinic();
  const { fmt } = useClinicText();
  const today = Math.max(0, view.recovered.total - RECOVERED_BY_DAY.reduce((a, b) => a + b, 0));
  const perDay = [...RECOVERED_BY_DAY, today, null];
  const pts = perDay.map((_, i) => ({ x: 10 + i * 20, y: arcY(10 + i * 20) }));
  const sun = pts[TODAY];
  const weekday = (i: number) => fmt.date(new Date(Date.UTC(2026, 9, 5 + i)), { weekday: 'narrow' });
  const left = `M${ARC.cx - ARC.rx} ${ARC.cy}`;
  return (
    <figure className="clinic-arc">
      <svg viewBox="0 0 100 44" aria-hidden>
        <line x1="1" y1={ARC.cy} x2="99" y2={ARC.cy} className="clinic-arc-horizon" />
        <path d={`${left} A${ARC.rx} ${ARC.ry} 0 0 1 ${ARC.cx + ARC.rx} ${ARC.cy}`} className="clinic-arc-track" />
        <path d={`${left} A${ARC.rx} ${ARC.ry} 0 0 1 ${sun.x} ${sun.y.toFixed(2)}`} className="clinic-arc-fill" />
        {pts.map((p, i) => (
          <g key={i}>
            {i !== TODAY ? <circle cx={p.x} cy={p.y} r="1.2" className={i < TODAY ? 'clinic-arc-dot' : 'clinic-arc-dot-off'} /> : null}
            {perDay[i] !== null ? (
              <text x={p.x} y={p.y - (i === TODAY ? 5.6 : 3.6)} className="clinic-arc-num" textAnchor="middle">
                {perDay[i]}
              </text>
            ) : null}
            <text x={p.x} y="43.4" className="clinic-arc-day" textAnchor="middle">
              {weekday(i)}
            </text>
          </g>
        ))}
        <circle cx={sun.x} cy={sun.y} r="2.9" className="clinic-arc-sun" />
      </svg>
      <figcaption className="sr-only">{t('arcLabel', { days: perDay.filter((v) => v !== null).join(', ') })}</figcaption>
    </figure>
  );
}

export function RecoveredHero() {
  const t = useTranslations('demoClinic.recovered');
  const { view, ticketUsd } = useClinic();
  return (
    <section className="clinic-hero" data-tour="recovered">
      <div className="min-w-0">
        <p className="clinic-hero-label">{t('heroLabel')}</p>
        <p className="clinic-hero-value demo-display">
          <Readout value={view.recovered.total} />
        </p>
        <p className="clinic-hero-goal">{t('heroToday', { count: Math.max(0, view.recovered.total - RECOVERED_BY_DAY.reduce((a, b) => a + b, 0)) })}</p>
        <p className="clinic-hero-money">
          <Money usd={view.recovered.total * ticketUsd} approx className="font-semibold" /> {t('money')}
        </p>
      </div>
      <WeekArc />
    </section>
  );
}

function Sources() {
  const t = useTranslations('demoClinic.recovered');
  const { view } = useClinic();
  const r = view.recovered;
  const segments = [
    { label: t('sources.reminder'), value: r.reminder, tone: 'accent' as const },
    { label: t('sources.waitlist'), value: r.waitlist, tone: 'accent2' as const },
    { label: t('sources.voice'), value: r.voice, tone: 'ink' as const },
  ];
  return (
    <Card className="flex flex-col gap-[0.7em] p-[0.85em]">
      <h3 className="demo-card-title">{t('sourcesTitle')}</h3>
      <div className="clinic-sources">
        <Donut
          label={t('sourcesTitle')}
          segments={segments}
          size="6.6em"
          center={
            <span className="demo-display text-[1.7em]">
              <Readout value={r.total} />
            </span>
          }
        />
        <Legend className="min-w-0 flex-1" items={segments.map((s) => ({ label: s.label, tone: s.tone, value: s.value }))} />
      </div>
    </Card>
  );
}

function NoShows() {
  const t = useTranslations('demoClinic.recovered');
  const { fmt } = useClinicText();
  const before = Math.round(NO_SHOWS.slice(0, NO_SHOWS_BEFORE_WEEKS).reduce((a, b) => a + b, 0) / NO_SHOWS_BEFORE_WEEKS);
  const now = NO_SHOWS[NO_SHOWS.length - 1];
  return (
    <Card className="flex flex-col gap-[0.6em] p-[0.85em]">
      <div className="flex items-start justify-between gap-[0.6em]">
        <h3 className="demo-card-title">{t('noShowsTitle')}</h3>
        <Pill tone="ok">{t('noShowsDelta', { value: fmt.signedPct((now - before) / before) })}</Pill>
      </div>
      <Bars
        label={t('noShowsTitle')}
        height="6.2em"
        data={NO_SHOWS.map((v, i) => ({
          label: i === NO_SHOWS.length - 1 ? t('thisWeek') : t('week', { n: i + 1 }),
          value: v,
          tone: i < NO_SHOWS_BEFORE_WEEKS ? 'neutral' : 'accent',
        }))}
      />
      <p className="flex flex-wrap gap-x-[0.9em] gap-y-[0.2em] text-[0.62em] text-[var(--demo-muted)]">
        <span className="clinic-key" data-tone="neutral">
          {t('before')}
        </span>
        <span className="clinic-key" data-tone="accent">
          {t('after')}
        </span>
      </p>
    </Card>
  );
}

const NOTE_ICON: Record<RecoveryCard['note'], LucideIcon> = {
  cancelled: CalendarX2,
  rescheduled: CalendarClock,
  offerWaitlist: Send,
  offerBoth: Hourglass,
  byWaitlist: Users,
  byVoice: AudioLines,
  byYou: Sparkles,
};

function Board({ layout }: { layout: 'columns' | 'stack' }) {
  const t = useTranslations('demoClinic.recovered');
  const { view, store, active } = useClinic();
  const { play } = useSound();
  const { fmt, proShort, patient, day } = useClinicText();
  const cards: KanbanCard[] = view.cards
    .slice()
    .sort((a, b) => (b.changedAt === -Infinity ? -1 : b.changedAt) - (a.changedAt === -Infinity ? -1 : a.changedAt))
    .map((c) => ({
      id: c.id,
      column: c.column,
      title: `${fmt.time(c.start)} · ${proShort(c.pro)}`,
      sub: t(`notes.${c.note}`, { patient: patient(c.patient), count: WAITLIST_OFFERED }),
      meta: c.day === TODAY ? t('today') : day(c.day),
      icon: NOTE_ICON[c.note],
      tone: c.column === 'won' ? 'ok' : c.column === 'offered' ? 'warn' : 'bad',
      fresh: c.changedAt >= 0 && view.t - c.changedAt < 2200,
    }));
  return (
    <div className="flex flex-col gap-[0.55em]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-[0.8em] px-[0.2em]">
        <h3 className="demo-card-title">{t('boardTitle')}</h3>
        <p className="text-[0.62em] text-[var(--demo-muted)]">{t('boardHint')}</p>
      </div>
      <Kanban
        label={t('boardTitle')}
        layout={layout}
        empty={t('empty')}
        columns={[
          { id: 'freed', title: t('columns.freed'), tone: 'bad' },
          { id: 'offered', title: t('columns.offered'), tone: 'warn' },
          { id: 'won', title: t('columns.won'), tone: 'ok' },
        ]}
        cards={cards}
        onMove={(id, column) => {
          store.update(act.moveCard(id, column as KanbanColumnId));
          if (active) play('select');
        }}
      />
    </div>
  );
}

export function PhoneRecovered() {
  const t = useTranslations('demoClinic.recovered');
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead title={t('title')} sub={t('subtitle')} />
      <RecoveredHero />
      <Sources />
      <NoShows />
      <Board layout="stack" />
    </div>
  );
}

export function LaptopRecovered() {
  const t = useTranslations('demoClinic.recovered');
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={t('subtitle')} />
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-[0.8em]">
        <RecoveredHero />
        <Sources />
        <NoShows />
      </div>
      <Board layout="columns" />
    </div>
  );
}
