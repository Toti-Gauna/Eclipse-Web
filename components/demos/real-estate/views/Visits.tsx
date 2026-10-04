'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing, Check, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Avatar, Button, Calendar, CalendarToolbar, useCalendarNav, weekdayOf, type CalendarEvent, type CalendarNav, type Tone } from '../../kit';
import { ADVISORS, CAL_END, CAL_START, CAL_STEP, LISTINGS, TODAY, dayEndFor, isOpenDay, listingById, type AdvisorId, type ListingId } from '../data';
import { act, dayVisits, isVisitFree, type VisitView } from '../story';
import { useEstate } from '../context';
import { useEstateText, ViewHead } from '../ui';

const TONE: Record<VisitView['what'], Tone> = { visit: 'accent2', appraisal: 'neutral', openHouse: 'neutral', signing: 'ink' };

interface Slot {
  day: number;
  start: number;
  advisor: AdvisorId;
}

function useVisitEvents(): (v: VisitView, column?: string) => CalendarEvent {
  const t = useTranslations('demoRealEstate');
  const { recent } = useEstate();
  const x = useEstateText();
  return (v, column) => {
    const title = v.who === 'you' ? t('visits.you') : v.who ? x.person(v.who) : t(`visits.what.${v.what}`);
    const sub = `${v.who && v.what !== 'visit' ? `${t(`visits.what.${v.what}`)} · ` : ''}${listingById(v.listing).street}`;
    return {
      id: v.id,
      column: column ?? v.advisor,
      start: v.start,
      end: v.end,
      title,
      sub,
      tone: v.who === 'carolina' || v.who === 'you' ? 'accent' : TONE[v.what],
      status: v.state === 'done' ? <Check strokeWidth={2.4} /> : undefined,
      state: v.state === 'done' ? 'done' : v.state === 'mine' ? 'mine' : 'default',
      fresh: recent(v.changedAt, 2400),
      version: v.state === 'done' ? 'done' : v.changedAt >= 0 ? `new-${v.changedAt}` : 'base',
      label: `${x.day(v.day)} ${x.fmt.time(v.start)}: ${title}, ${sub}. ${t('visits.withAdvisor', { advisor: t(`people.${v.advisor}`) })}${v.state === 'done' ? `. ${t('visits.done')}` : ''}`,
    };
  };
}

/** Book a free slot (local demo data): pick the property, confirm → it shows in the calendar and the pipeline. */
function BookForm({ slot, onDone, onCancel }: { slot: Slot; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations('demoRealEstate.visits');
  const { store, active } = useEstate();
  const { play } = useSound();
  const x = useEstateText();
  const [pick, setPick] = useState<ListingId>('olmos');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="re-bookform">
      <div className="flex items-start justify-between gap-[0.6em]">
        <div className="min-w-0">
          <p className="re-label">{t('bookTitle')}</p>
          <p className="re-bookform-when demo-display">
            {x.day(slot.day)} · {x.fmt.time(slot.start)}
          </p>
          <p className="text-[0.68em] text-[var(--demo-muted)]">{t('withAdvisor', { advisor: x.t(`people.${slot.advisor}`) })}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label={t('cancel')} className="re-iconbtn">
          <X aria-hidden strokeWidth={1.8} />
        </button>
      </div>
      <fieldset>
        <legend className="re-label">{t('property')}</legend>
        <div className="re-bookform-list">
          {LISTINGS.map((l) => (
            <button key={l.id} type="button" className="re-chip" aria-pressed={pick === l.id} onClick={() => setPick(l.id)}>
              {l.street}
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        onClick={() => {
          store.update(act.book({ day: slot.day, start: slot.start, listing: pick, advisor: slot.advisor, via: 'calendar' }));
          if (active) play('success');
          onDone();
        }}
      >
        {t('confirm')}
      </Button>
      <p className="text-[0.6em] text-[var(--demo-muted)]">{t('localNote')}</p>
    </div>
  );
}

/** The visits calendar: a day (columns = advisors) or a week (columns = days), any date. */
function VisitsCalendar({ nav, selected, onSelect, compact = false }: { nav: CalendarNav; selected: Slot | null; onSelect: (s: Slot) => void; compact?: boolean }) {
  const t = useTranslations('demoRealEstate.visits');
  const tr = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  const toEvent = useVisitEvents();
  const free = (day: number, minute: number) => minute % 60 === 0 && isVisitFree(view, day, minute);

  if (nav.view === 'week') {
    return (
      <Calendar
        label={t('weekLabel', { from: x.day(nav.week[0]), to: x.day(nav.week[nav.week.length - 1]) })}
        columns={nav.week.map((d) => ({ id: String(d), label: x.day(d), state: d === TODAY ? 'today' : d < TODAY ? 'past' : undefined }))}
        start={CAL_START}
        end={CAL_END}
        step={CAL_STEP}
        events={nav.week.flatMap((d) => dayVisits(d, view).map((v) => toEvent(v, String(d))))}
        isFree={(col, minute) => free(Number(col), minute)}
        onFree={(col, minute) => onSelect({ day: Number(col), start: minute, advisor: 'marcos' })}
        freeLabel={(c, minute) => t('freeLabel', { day: c.label, time: x.fmt.time(minute) })}
        freeVisible={false}
        selected={selected ? { column: String(selected.day), minute: selected.start } : null}
        formatTime={x.fmt.time}
        formatGutter={x.fmt.gutter}
        rowHeight={compact ? '1.55em' : '1.32em'}
        gutter={compact ? '2.7em' : '3em'}
        times="hours"
        className="re-cal"
      />
    );
  }
  const closed = !isOpenDay(weekdayOf(nav.day));
  return (
    <Calendar
      label={t('dayLabel', { day: x.day(nav.day, 'long') })}
      columns={ADVISORS.map((a) => ({
        id: a.id,
        label: compact ? tr(`people.${a.id}First`) : tr(`people.${a.id}`),
        mark: <Avatar initials={a.initials} color={a.color} ink={a.ink} className="text-[0.6em]" />,
      }))}
      start={CAL_START}
      end={closed ? CAL_START + 120 : Math.max(dayEndFor(weekdayOf(nav.day)), CAL_START + 120)}
      step={CAL_STEP}
      events={dayVisits(nav.day, view).map((v) => toEvent(v))}
      isFree={(_, minute) => free(nav.day, minute)}
      onFree={(col, minute) => onSelect({ day: nav.day, start: minute, advisor: col as AdvisorId })}
      freeText={compact ? undefined : t('free')}
      freeLabel={(c, minute) => t('freeLabelWith', { time: x.fmt.time(minute), advisor: c.label })}
      freeVisible={false}
      selected={selected && selected.day === nav.day ? { column: selected.advisor, minute: selected.start } : null}
      formatTime={x.fmt.time}
      formatGutter={x.fmt.gutter}
      rowHeight={compact ? '1.7em' : '1.5em'}
      gutter={compact ? '2.7em' : '3em'}
      times="hours"
      className="re-cal"
    />
  );
}

function Period({ nav, long = false }: { nav: CalendarNav; long?: boolean }) {
  const x = useEstateText();
  if (nav.view === 'week') return <>{`${x.day(nav.week[0])} – ${x.day(nav.week[nav.week.length - 1])}`}</>;
  return <>{x.day(nav.day, long ? 'long' : 'short')}</>;
}

/** What the calendar shows (count + hint). */
function useSummary(nav: CalendarNav): string {
  const t = useTranslations('demoRealEstate.visits');
  const { view } = useEstate();
  const x = useEstateText();
  if (nav.view === 'week') return t('weekSummary', { count: nav.week.reduce((n, d) => n + dayVisits(d, view).length, 0) });
  const n = dayVisits(nav.day, view).length;
  const past = nav.day < view.clock.day;
  if (!isOpenDay(weekdayOf(nav.day))) return t('closed', { day: x.day(nav.day) });
  return t(past ? 'summaryPast' : 'summary', { day: x.day(nav.day), count: n });
}

/** Carolina's visit (or the visitor's latest), with the automatic reminder. */
function NextVisit() {
  const t = useTranslations('demoRealEstate');
  const { view, recent } = useEstate();
  const x = useEstateText();
  const live = view.visits.find((v) => v.who === 'carolina') ?? [...view.visits].reverse().find((v) => v.who === 'you');
  if (!live) {
    return (
      <section className="re-panel">
        <h3 className="re-panel-title">{t('visits.next')}</h3>
        <p className="re-empty mt-[0.5em]">{t('visits.nextEmpty')}</p>
        <p className="re-hint mt-[0.6em]">{t('visits.hint')}</p>
      </section>
    );
  }
  const advisor = ADVISORS.find((a) => a.id === live.advisor)!;
  const done = live.state === 'done';
  return (
    <section className={`re-panel re-nextvisit ${recent(live.changedAt, 2400) ? 'demo-fresh' : ''}`} data-done={done ? '' : undefined}>
      <h3 className="re-panel-title">{t('visits.next')}</h3>
      <p className="re-nextvisit-time demo-display">{x.fmt.time(live.start)}</p>
      <p className="re-nextvisit-day">{x.day(live.day, 'long')}</p>
      <p className="mt-[0.6em] text-[0.78em] font-semibold">{live.who === 'you' ? t('visits.you') : t('people.carolina')}</p>
      <p className="text-[0.7em] text-[var(--demo-muted)]">{listingById(live.listing).street}</p>
      <p className="mt-[0.6em] flex items-center gap-[0.5em] text-[0.7em]">
        <Avatar initials={advisor.initials} color={advisor.color} ink={advisor.ink} className="text-[0.8em]" />
        {t('visits.withAdvisor', { advisor: t(`people.${advisor.id}`) })}
      </p>
      <p className="re-reminder">
        {done ? <Check aria-hidden strokeWidth={2} /> : <BellRing aria-hidden strokeWidth={1.8} />}
        {done ? t('visits.done') : t('visits.reminder')}
      </p>
    </section>
  );
}

function Legend() {
  const t = useTranslations('demoRealEstate.visits');
  return (
    <ul className="re-legend" aria-hidden>
      <li data-tone="accent">{t('legendLive')}</li>
      <li data-tone="accent2">{t('what.visit')}</li>
      <li data-tone="ink">{t('what.signing')}</li>
      <li data-tone="neutral">
        {t('what.appraisal')} · {t('what.openHouse')}
      </li>
    </ul>
  );
}

/** Calendar state shared by both screens: date navigation and the selected slot. */
function useVisits(initialView: 'day' | 'week') {
  const { visitsDay } = useEstate();
  const nav = useCalendarNav({ today: TODAY, initialDay: visitsDay, initialView, open: isOpenDay });
  const [sel, setSel] = useState<Slot | null>(null);
  return { nav, sel, setSel };
}

export function PhoneVisits() {
  const t = useTranslations('demoRealEstate.visits');
  const { nav, sel, setSel } = useVisits('day');
  const summary = useSummary(nav);
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.3em]">
      <ViewHead title={t('title')} sub={summary} />
      <CalendarToolbar nav={nav} period={<Period nav={nav} />} compact />
      <section className="re-panel p-[0.5em]" data-tour="visits">
        <VisitsCalendar nav={nav} selected={sel} onSelect={setSel} compact />
      </section>
      {sel ? (
        <div className="re-sheetform" role="dialog" aria-label={t('bookTitle')}>
          <BookForm key={`${sel.day}-${sel.start}-${sel.advisor}`} slot={sel} onDone={() => setSel(null)} onCancel={() => setSel(null)} />
        </div>
      ) : (
        <p className="re-hint">{nav.day < TODAY && nav.view === 'day' ? t('hintPast') : t('hint')}</p>
      )}
      <NextVisit />
    </div>
  );
}

export function LaptopVisits() {
  const t = useTranslations('demoRealEstate.visits');
  const { nav, sel, setSel } = useVisits('week');
  const summary = useSummary(nav);
  const grid = useRef<HTMLDivElement>(null);
  const close = () => {
    setSel(null);
    grid.current?.focus({ preventScroll: true });
  };
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={summary} aside={<Legend />} />
      <div className="grid grid-cols-[minmax(0,1fr)_14em] items-start gap-[1em]">
        <div ref={grid} tabIndex={-1} className="outline-none">
          <section className="re-panel p-[0.7em]" data-tour="visits">
            <CalendarToolbar nav={nav} period={<Period nav={nav} long />} className="mb-[0.6em]" />
            <VisitsCalendar nav={nav} selected={sel} onSelect={setSel} />
          </section>
        </div>
        <div className="flex flex-col gap-[0.9em]">
          {sel ? (
            <section className="re-panel">
              <BookForm key={`${sel.day}-${sel.start}-${sel.advisor}`} slot={sel} onDone={close} onCancel={close} />
            </section>
          ) : null}
          <NextVisit />
          {sel ? null : <p className="re-hint">{t('hintLaptop')}</p>}
        </div>
      </div>
    </div>
  );
}

