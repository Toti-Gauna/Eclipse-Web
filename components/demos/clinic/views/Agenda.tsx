'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Button, Calendar, CalendarToolbar, Card, Pill, Readout, useCalendarNav, type CalendarColumn, type CalendarNav } from '../../kit';
import { DAY_START, PROS, STEP, TODAY, TREATMENTS, isOpenDay, proById, type ProId, type TreatmentId } from '../data';
import { act, dayAppts, dayEnd, dayStats, type Appt } from '../story';
import { useClinic } from '../context';
import { STATUS, ProAvatar, StatusMark, useApptEvent, useClinicText, ViewHead } from '../ui';

type Filter = 'all' | ProId;
interface Slot {
  pro: ProId;
  day: number;
  minute: number;
}

/** The appointments of any day (today from the story, others derived). */
function useDay(day: number): Appt[] {
  const { state, view } = useClinic();
  return dayAppts(day, state, view);
}

/** Can this empty cell be booked? Past days: no · today: from now on · future: yes. */
function useFreeCheck() {
  const { state, view } = useClinic();
  return (day: number, pro: ProId, minute: number) => {
    if (day < TODAY || minute + STEP > dayEnd(day)) return false;
    if (day === TODAY && minute < view.clock - 10) return false;
    return !dayAppts(day, state, view).some((a) => a.pro === pro && a.start < minute + STEP && minute < a.end);
  };
}

/** Treatments of the pro's specialty that fit before their next appointment that day. */
function useFitting({ pro, day, minute }: Slot): TreatmentId[] {
  const list = useDay(day);
  const next = list.filter((a) => a.pro === pro && a.start >= minute + STEP).reduce((m, a) => Math.min(m, a.start), dayEnd(day));
  return (Object.keys(TREATMENTS) as TreatmentId[]).filter((id) => TREATMENTS[id].specialty === proById(pro).specialty && minute + TREATMENTS[id].minutes <= next);
}

/** Book a free slot (local demo data): pick a treatment, confirm → it shows in the agenda. */
function BookingForm({ slot, onDone, onCancel }: { slot: Slot; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations('demoClinic.agenda');
  const { store, active } = useClinic();
  const { play } = useSound();
  const { fmt, pro: proName, treatment, day } = useClinicText();
  const options = useFitting(slot);
  const [pick, setPick] = useState<TreatmentId | null>(options[0] ?? null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="flex flex-col gap-[0.6em]">
      <div className="flex items-start justify-between gap-[0.6em]">
        <div className="min-w-0">
          <p className="demo-label">{t('bookTitle')}</p>
          <p className="mt-[0.2em] text-[0.86em] font-semibold">
            {day(slot.day)} · {fmt.time(slot.minute)}
          </p>
          <p className="text-[0.7em] text-[var(--demo-muted)]">{proName(slot.pro)}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label={t('cancel')} className="demo-side-toggle -mr-[0.3em] -mt-[0.2em]">
          <X aria-hidden strokeWidth={1.8} />
        </button>
      </div>
      <fieldset>
        <legend className="text-[0.66em] font-medium text-[var(--demo-muted)]">{t('treatment')}</legend>
        <div className="mt-[0.35em] flex flex-wrap gap-[0.35em]">
          {options.map((o) => (
            <button key={o} type="button" aria-pressed={o === pick} onClick={() => setPick(o)} className="clinic-chip">
              {treatment(o)}
              <span className="demo-num opacity-70">{t('minutes', { n: TREATMENTS[o].minutes })}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        disabled={!pick}
        onClick={() => {
          if (!pick) return;
          store.update(act.book({ pro: slot.pro, day: slot.day, start: slot.minute, treatment: pick, via: 'agenda' }));
          if (active) play('success');
          onDone();
        }}
      >
        {t('confirm')}
      </Button>
      <p className="text-[0.62em] text-[var(--demo-muted)]">{t('localNote')}</p>
    </div>
  );
}

function Filters({ value, onChange, all = true }: { value: Filter; onChange: (f: Filter) => void; all?: boolean }) {
  const t = useTranslations('demoClinic');
  const { proShort } = useClinicText();
  return (
    <div role="group" aria-label={t('agenda.filter')} className="no-scrollbar flex gap-[0.35em] overflow-x-auto">
      {([...(all ? ['all'] : []), ...PROS.map((p) => p.id)] as Filter[]).map((f) => (
        <button key={f} type="button" aria-pressed={f === value} onClick={() => onChange(f)} className="clinic-chip">
          {f === 'all' ? null : <ProAvatar pro={f} className="-ml-[0.35em] text-[0.62em]" />}
          {f === 'all' ? t('agenda.all') : proShort(f)}
        </button>
      ))}
    </div>
  );
}

/** The agenda grid: a day (columns = pros) or a week of one pro (columns = days). */
function AgendaCalendar({
  nav,
  filter,
  selected,
  onSelect,
  rowHeight,
}: {
  nav: CalendarNav;
  filter: Filter;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
  rowHeight: string;
}) {
  const t = useTranslations('demoClinic');
  const { view, state, screen } = useClinic();
  const { fmt, pro, proShort, day: dayName } = useClinicText();
  const toEvent = useApptEvent();
  const isFree = useFreeCheck();
  const week = nav.view === 'week';
  const weekPro: ProId = filter === 'all' ? 'lucia' : filter;

  if (week) {
    const columns: CalendarColumn[] = nav.week.map((d) => ({
      id: String(d),
      label: dayName(d),
      state: d === TODAY ? 'today' : d < TODAY ? 'past' : undefined,
    }));
    const events = nav.week.flatMap((d) =>
      dayAppts(d, state, view)
        .filter((a) => a.pro === weekPro)
        .map((a) => ({ ...toEvent(a), column: String(d), id: `${d}-${a.key}` })),
    );
    return (
      <Calendar
        label={t('agenda.weekLabel', { pro: pro(weekPro), from: dayName(nav.week[0]), to: dayName(nav.week[nav.week.length - 1]) })}
        columns={columns}
        start={DAY_START}
        end={dayEnd(TODAY)}
        step={STEP}
        events={events}
        now={nav.week.includes(TODAY) ? view.clock : undefined}
        nowColumn={String(TODAY)}
        formatTime={fmt.time}
        formatGutter={fmt.gutter}
        isFree={(col, minute) => isFree(Number(col), weekPro, minute)}
        onFree={(col, minute) => onSelect({ pro: weekPro, day: Number(col), minute })}
        freeLabel={(c, m) => t('agenda.freeSlotDay', { time: fmt.time(m), pro: proShort(weekPro), day: c.label })}
        selected={selected && selected.pro === weekPro ? { column: String(selected.day), minute: selected.minute } : null}
        rowHeight={rowHeight}
        gutter={screen === 'phone' ? '2.7em' : '3.2em'}
        className="clinic-cal-week"
      />
    );
  }

  const cols = PROS.filter((p) => filter === 'all' || p.id === filter);
  const narrow = screen === 'phone' && cols.length > 1;
  const list = dayAppts(nav.day, state, view);
  return (
    <Calendar
      label={t('agenda.dayLabel', { day: dayName(nav.day, 'long') })}
      columns={cols.map((p) => ({
        id: p.id,
        label: narrow ? proShort(p.id) : pro(p.id),
        sub: narrow ? undefined : t(`specialties.${p.specialty}`),
        mark: <ProAvatar pro={p.id} className="text-[0.62em]" />,
      }))}
      start={DAY_START}
      end={dayEnd(TODAY)}
      step={STEP}
      events={list.map((a) => toEvent(a))}
      now={nav.day === TODAY ? view.clock : undefined}
      formatTime={fmt.time}
      formatGutter={fmt.gutter}
      isFree={(col, minute) => isFree(nav.day, col as ProId, minute)}
      onFree={(col, minute) => onSelect({ pro: col as ProId, day: nav.day, minute })}
      freeText={narrow ? undefined : t('agenda.free')}
      freeLabel={(c, m) => t('agenda.freeSlot', { time: fmt.time(m), pro: c.label })}
      selected={selected && selected.day === nav.day ? { column: selected.pro, minute: selected.minute } : null}
      rowHeight={rowHeight}
      gutter={screen === 'phone' ? '2.7em' : '3.2em'}
      className={narrow ? 'clinic-cal-narrow' : ''}
    />
  );
}

function Legend() {
  const t = useTranslations('demoClinic');
  const items = ['new', 'voice', 'waitlist', 'confirmed', 'reminded', 'freed'] as const;
  return (
    <ul className="flex flex-col gap-[0.4em]">
      {items.map((s) => (
        <li key={s} className={`clinic-legend demo-tone-${STATUS[s].tone}`}>
          <span aria-hidden className="clinic-legend-mark">
            <StatusMark status={s} />
          </span>
          {t(`status.${s}`)}
        </li>
      ))}
    </ul>
  );
}

function Waitlist() {
  const t = useTranslations('demoClinic.agenda');
  const { view } = useClinic();
  const { patient } = useClinicText();
  const took = view.events.find((e) => e.kind === 'waitlist');
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="demo-card-title">{t('waitlist')}</h3>
        <span className="demo-display text-[1.5em]">
          <Readout value={view.waitlist} />
        </span>
      </div>
      <ul className="mt-[0.45em] flex flex-col gap-[0.35em]">
        {(['paula', 'ivan', 'sol'] as const).map((p) => (
          <li key={p} className="flex items-center gap-[0.5em] text-[0.72em]">
            <span className="min-w-0 flex-1 truncate">{p === 'paula' ? patient('paula') : t(`waiters.${p}`)}</span>
            {p === 'paula' && took ? (
              <span className="demo-pop">
                <Pill tone="ok">{t('took')}</Pill>
              </span>
            ) : (
              <span className="text-[0.9em] text-[var(--demo-muted)]">{t(`wants.${p}`)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Agenda state shared by both screens: date navigation, filter, selected slot. */
function useAgenda() {
  const { agendaDay } = useClinic();
  const nav = useCalendarNav({ today: TODAY, initialDay: agendaDay, open: isOpenDay });
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<Slot | null>(null);
  // The week view shows one professional (its columns are days).
  return { nav, filter: nav.view === 'week' && filter === 'all' ? ('lucia' as Filter) : filter, setFilter, sel, setSel };
}

function Period({ nav, long = false }: { nav: CalendarNav; long?: boolean }) {
  const { day } = useClinicText();
  if (nav.view === 'week') return <>{`${day(nav.week[0])} – ${day(nav.week[nav.week.length - 1])}`}</>;
  return <>{day(nav.day, long ? 'long' : 'short')}</>;
}

function useSummary(nav: CalendarNav) {
  const t = useTranslations('demoClinic.agenda');
  const { state, view } = useClinic();
  const { day } = useClinicText();
  const stats = dayStats(dayAppts(nav.day, state, view));
  if (nav.view === 'week') return t('weekSummary');
  return t(nav.day < TODAY ? 'summaryPast' : 'summary', { day: day(nav.day), count: stats.count, pct: Math.round(stats.occupancy * 100) });
}

export function PhoneAgenda() {
  const t = useTranslations('demoClinic.agenda');
  const { nav, filter, setFilter, sel, setSel } = useAgenda();
  const summary = useSummary(nav);
  return (
    <div className="flex flex-col gap-[0.7em] pt-[0.2em]">
      <ViewHead title={t('title')} sub={summary} />
      <div className="flex flex-col gap-[0.7em]" data-focus="agenda">
        <CalendarToolbar nav={nav} period={<Period nav={nav} />} compact />
        <Filters value={filter} onChange={setFilter} all={nav.view === 'day'} />
        <Card className="px-[0.5em] pb-[0.3em] pt-[0.65em]" tour="agenda">
          <AgendaCalendar nav={nav} filter={filter} selected={sel} onSelect={setSel} rowHeight="2.6em" />
        </Card>
      </div>
      {sel ? (
        <div className="clinic-sheet" role="dialog" aria-label={t('bookTitle')}>
          <BookingForm key={`${sel.day}${sel.pro}${sel.minute}`} slot={sel} onDone={() => setSel(null)} onCancel={() => setSel(null)} />
        </div>
      ) : (
        <p className="clinic-hint">{nav.day < TODAY && nav.view === 'day' ? t('hintPast') : t('hintPhone')}</p>
      )}
    </div>
  );
}

export function LaptopAgenda() {
  const t = useTranslations('demoClinic.agenda');
  const { nav, filter, setFilter, sel, setSel } = useAgenda();
  const summary = useSummary(nav);
  const grid = useRef<HTMLDivElement>(null);
  const close = () => {
    setSel(null);
    grid.current?.focus({ preventScroll: true });
  };
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={summary} aside={<Filters value={filter} onChange={setFilter} all={nav.view === 'day'} />} />
      <div className="grid grid-cols-[minmax(0,1fr)_13.5em] items-start gap-[0.8em]">
        <div ref={grid} tabIndex={-1} className="outline-none" data-focus="agenda">
          <Card className="p-[0.75em] pb-[0.4em]" tour="agenda">
            <CalendarToolbar nav={nav} period={<Period nav={nav} long />} className="mb-[0.7em]" />
            <AgendaCalendar nav={nav} filter={filter} selected={sel} onSelect={setSel} rowHeight="2.3em" />
          </Card>
        </div>
        <div className="flex flex-col gap-[0.8em]">
          <Card className="p-[0.85em]">
            {sel ? (
              <BookingForm key={`${sel.day}${sel.pro}${sel.minute}`} slot={sel} onDone={close} onCancel={close} />
            ) : (
              <>
                <Waitlist />
                <p className="mt-[0.8em] border-t border-[var(--demo-line)] pt-[0.6em] text-[0.66em] text-[var(--demo-muted)]">
                  {nav.day < TODAY && nav.view === 'day' ? t('hintPast') : t('hintLaptop')}
                </p>
              </>
            )}
          </Card>
          <Card className="p-[0.85em]">
            <Legend />
          </Card>
        </div>
      </div>
    </div>
  );
}
