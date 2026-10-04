'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { ActivityFeed, Kanban, Readout, type KanbanCard } from '../../kit';
import { SOURCES, STAGES, STAGE_TONE, listingById, type Stage } from '../data';
import { act } from '../story';
import { useEstate } from '../context';
import { SOURCE_ICON, useCardNote, useEstateText, useFeedItems, waitedMinutes } from '../ui';
import { LeadFile, useInquiry } from './Inbox';
import { useFollow } from './Followups';

/** The vertical's key number: inquiries answered in under a minute. */
function KeyNumber({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const t = useTranslations('demoRealEstate.today');
  const { view, keySuffix } = useEstate();
  const x = useEstateText();
  const k = view.kpis;
  const pct = Math.round(k.fastPct * 100);
  return (
    <div className="re-key" data-size={size} data-off={pct < 100 ? '' : undefined}>
      <p className="re-key-num demo-display">
        <Readout value={pct} rollDown />
        <span>{keySuffix}</span>
      </p>
      <p className="re-key-label">{t('key')}</p>
      <p className="re-key-of demo-num">
        {k.waiting ? t('keyWaiting', { wait: x.wait(waitedMinutes(view.clock)) }) : t('keyOf', { fast: k.fast, total: Math.round(k.fast / k.fastPct) })}
      </p>
    </div>
  );
}

/** Three readings in a row, separated by hairlines. */
function Ledger({ className = '' }: { className?: string }) {
  const t = useTranslations('demoRealEstate.today');
  const tt = useTranslations('demoRealEstate.time');
  const { view } = useEstate();
  const k = view.kpis;
  const avg = k.avgSec < 60 ? tt('seconds', { seconds: k.avgSec }) : tt('minutes', { minutes: Math.round(k.avgSec / 60) });
  const cells = [
    { id: 'avg', label: t('avg'), value: <span className="demo-num">{avg}</span>, hint: t('avgHint'), bad: k.avgSec >= 60 },
    { id: 'visits', label: t('visits'), value: <Readout value={k.visits} />, hint: t('visitsHint') },
    { id: 'after', label: t('afterHours'), value: <Readout value={k.afterHours} />, hint: t('afterHoursHint', { count: k.afterHours, total: k.inquiries }) },
    { id: 'reserves', label: t('reserves'), value: <Readout value={k.reserves} />, hint: t('reservesHint') },
  ];
  return (
    <dl className={`re-ledger ${className}`}>
      {cells.map((c) => (
        <div key={c.id} className="re-ledger-cell" data-bad={c.bad ? '' : undefined}>
          <dt className="re-label">{c.label}</dt>
          <dd className="re-ledger-value demo-display">{c.value}</dd>
          <dd className="re-ledger-hint">{c.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Inquiries by source: hairline bars, the conclusion as the label. */
function Sources() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const k = view.kpis;
  const max = Math.max(...SOURCES.map((s) => k.bySource[s]));
  return (
    <section className="re-panel" aria-labelledby="re-sources">
      <h3 id="re-sources" className="re-panel-title">
        {t('today.sources')}
      </h3>
      <ul className="re-sources" aria-label={t('today.sourcesLabel', { count: k.bySource.web, total: k.inquiries })}>
        {SOURCES.map((s) => {
          const Icon = SOURCE_ICON[s];
          return (
            <li key={s} data-top={s === 'web' ? '' : undefined}>
              <Icon aria-hidden strokeWidth={1.6} />
              <span className="re-sources-name">{t(`sources.${s}`)}</span>
              <span className="re-sources-bar" aria-hidden>
                <span style={{ '--v': k.bySource[s] / max } as CSSProperties} />
              </span>
              <span className="re-sources-n demo-num">{k.bySource[s]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The pipeline as kit Kanban cards (shared by Today and Pipeline). */
export function usePipelineCards(): KanbanCard[] {
  const { view, recent } = useEstate();
  const x = useEstateText();
  const note = useCardNote();
  return view.cards.map((c) => ({
    id: c.id,
    column: c.column,
    title: x.short(c.person),
    sub: note(c),
    meta: c.note === 'lost' ? '—' : String(c.score),
    icon: SOURCE_ICON[c.source],
    tone: c.note === 'lost' || c.note === 'waiting' ? 'bad' : c.person === 'carolina' ? 'accent' : c.person === 'you' ? 'accent2' : 'neutral',
    fresh: recent(c.changedAt, 2400),
    lines: 2,
  }));
}

export function PipelineBoard({ layout = 'columns', className = '' }: { layout?: 'columns' | 'stack'; className?: string }) {
  const t = useTranslations('demoRealEstate');
  const { view, store, active } = useEstate();
  const { play } = useSound();
  const cards = usePipelineCards();
  // Carolina (and the visitor's own leads) first in their column.
  const sorted = [...cards].sort((a, b) => Number(b.tone !== 'neutral') - Number(a.tone !== 'neutral'));
  return (
    <Kanban
      columns={STAGES.map((s) => ({ id: s, title: t(`stages.${s}`), tone: STAGE_TONE[s] }))}
      cards={sorted}
      label={t('pipeline.label', { count: view.cards.length })}
      layout={layout}
      empty={t('pipeline.empty')}
      onMove={(id, column) => {
        store.update(act.moveCard(id, column as Stage));
        if (active) play('select');
      }}
      className={`re-kanban ${className}`}
    />
  );
}

/** "Now": the live inquiry, its latest line and what the assistant learned. */
function NowCard() {
  const t = useTranslations('demoRealEstate');
  const { view, go } = useEstate();
  const { run } = useInquiry();
  const follow = useFollow().run;
  const thread = follow ?? run;
  const last = [...thread.items].reverse().find((i) => i.from !== 'note');
  const started = view.t >= view.inquiryAt;
  return (
    <section className="re-panel re-now" data-off={view.botOff ? '' : undefined} aria-labelledby="re-now" data-tour="chat">
      <div className="flex items-center justify-between gap-[0.6em]">
        <h3 id="re-now" className="re-panel-title">
          {t('today.now')}
        </h3>
        <button type="button" className="re-link" onClick={() => go('inbox')}>
          {t('today.openInbox')}
          <ArrowUpRight aria-hidden strokeWidth={1.8} />
        </button>
      </div>
      {started ? (
        <>
          <p className="re-now-who">
            <span className="font-semibold">{t('people.carolina')}</span>
            <span className="demo-num text-[var(--demo-muted)]">
              {' '}
              · {follow ? t('sources.whatsapp') : t('sources.web')} · {listingById(view.listing).street}
            </span>
          </p>
          {last ? (
            <div key={last.id} className="re-now-line" data-from={last.from}>
              {thread.typing ? <span className="re-label">{t('bot.name')} …</span> : last.text}
            </div>
          ) : null}
          <LeadFile compact />
        </>
      ) : (
        <p className="re-empty">{t('today.nowEmpty')}</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */
export function PhoneToday() {
  const t = useTranslations('demoRealEstate.today');
  const { view } = useEstate();
  const x = useEstateText();
  const feed = useFeedItems(5);
  return (
    <div className="flex flex-col gap-[1em] pt-[0.3em]">
      <header>
        <p className="re-kicker">{t('kicker', { date: x.day(3, 'long') })}</p>
        <h2 className="re-title demo-display">{view.botOff ? t('headlineOff') : t.rich('headline', { em: (c) => <em>{c}</em> })}</h2>
      </header>
      <KeyNumber size="md" />
      <Ledger className="re-ledger-2" />
      <NowCard />
      <Sources />
      <section className="re-panel">
        <ActivityFeed title={t('activity')} items={feed} />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop                                                               */
/* ------------------------------------------------------------------ */
export function LaptopToday() {
  const t = useTranslations('demoRealEstate.today');
  const { view, go } = useEstate();
  const x = useEstateText();
  const feed = useFeedItems(5);
  const jumped = view.timelapseAt !== null && view.t >= view.timelapseAt;
  const reserved = view.outcome === 'reserve' && view.outcomeAt !== null && view.t >= view.outcomeAt;
  const lost = view.lostAt !== null && view.t >= view.lostAt;
  return (
    <div className="flex flex-col gap-[1.1em]">
      <div className="re-today-top">
        <header className="min-w-0">
          <p className="re-kicker">{t('kicker', { date: `${x.day(view.clock.day, 'long')} · ${x.clock(view.clock)}` })}</p>
          <h2 className="re-title re-title-xl demo-display">
            {view.botOff
              ? lost
                ? t.rich('headlineLost', { late: x.late, em: (c) => <em>{c}</em> })
                : view.opensAt !== null && view.t >= view.opensAt
                  ? t('headlineOpens')
                  : t('headlineOff')
              : reserved
                ? t.rich('headlineReserved', { em: (c) => <em>{c}</em> })
                : jumped
                  ? t('headlineJump')
                  : t.rich('headline', { em: (c) => <em>{c}</em> })}
          </h2>
        </header>
        <KeyNumber />
      </div>
      <Ledger />
      <div className="grid grid-cols-[minmax(0,1fr)_17em] items-start gap-[1em]">
        <section className="re-panel" aria-labelledby="re-pipe" data-tour="pipeline">
          <div className="mb-[0.6em] flex items-center justify-between gap-[0.6em]">
            <h3 id="re-pipe" className="re-panel-title">
              {t('pipeline')}
            </h3>
            <button type="button" className="re-link" onClick={() => go('pipeline')}>
              {t('openPipeline')}
              <ArrowUpRight aria-hidden strokeWidth={1.8} />
            </button>
          </div>
          <PipelineBoard className="re-kanban-mini" />
        </section>
        <NowCard />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-[1em]">
        <Sources />
        <section className="re-panel">
          <ActivityFeed title={t('activity')} items={feed} />
        </section>
      </div>
    </div>
  );
}
