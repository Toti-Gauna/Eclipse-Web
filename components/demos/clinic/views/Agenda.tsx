'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button, Calendar, Card, Pill, Readout } from '../../kit';
import { DAY_END, DAY_START, PROS, STEP, TREATMENTS, proById, type ProId, type TreatmentId } from '../data';
import { act, dayStats } from '../story';
import { useClinic } from '../context';
import { STATUS, ProAvatar, StatusMark, useApptEvent, useClinicText, ViewHead } from '../ui';

type Filter = 'all' | ProId;

function useFreeCheck() {
  const { view } = useClinic();
  return (pro: string, minute: number) =>
    minute >= view.clock - 10 && !view.appts.some((a) => a.pro === pro && a.start < minute + STEP && minute < a.end);
}

/** Treatments of the pro's specialty that fit before their next appointment. */
function useFitting(pro: ProId, start: number): TreatmentId[] {
  const { view } = useClinic();
  const next = view.appts.filter((a) => a.pro === pro && a.start >= start + STEP).reduce((m, a) => Math.min(m, a.start), DAY_END);
  return (Object.keys(TREATMENTS) as TreatmentId[]).filter(
    (id) => TREATMENTS[id].specialty === proById(pro).specialty && start + TREATMENTS[id].minutes <= next,
  );
}

function BookingForm({ pro, start, onDone, onCancel }: { pro: ProId; start: number; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations('demoClinic.agenda');
  const { store } = useClinic();
  const { fmt, pro: proName, treatment, day } = useClinicText();
  const options = useFitting(pro, start);
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
            {day(3)} · {fmt.time(start)}
          </p>
          <p className="text-[0.7em] text-[var(--demo-muted)]">{proName(pro)}</p>
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
          store.update(act.book({ pro, start, treatment: pick, via: 'agenda' }));
          store.engage();
          onDone();
        }}
      >
        {t('confirm')}
      </Button>
    </div>
  );
}

function Filters({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const t = useTranslations('demoClinic');
  const { proShort } = useClinicText();
  return (
    <div role="group" aria-label={t('agenda.filter')} className="no-scrollbar flex gap-[0.35em] overflow-x-auto">
      {(['all', ...PROS.map((p) => p.id)] as Filter[]).map((f) => (
        <button key={f} type="button" aria-pressed={f === value} onClick={() => onChange(f)} className="clinic-chip">
          {f === 'all' ? null : <ProAvatar pro={f} className="-ml-[0.35em] text-[0.62em]" />}
          {f === 'all' ? t('agenda.all') : proShort(f)}
        </button>
      ))}
    </div>
  );
}

function AgendaCalendar({
  filter,
  selected,
  onSelect,
  rowHeight,
}: {
  filter: Filter;
  selected: { column: string; minute: number } | null;
  onSelect: (pro: ProId, minute: number) => void;
  rowHeight: string;
}) {
  const t = useTranslations('demoClinic');
  const { view, screen } = useClinic();
  const { fmt, pro, proShort } = useClinicText();
  const toEvent = useApptEvent();
  const isFree = useFreeCheck();
  const cols = PROS.filter((p) => filter === 'all' || p.id === filter);
  const narrow = screen === 'phone' && cols.length > 1;
  return (
    <Calendar
      label={t('agenda.label')}
      columns={cols.map((p) => ({
        id: p.id,
        label: narrow ? proShort(p.id) : pro(p.id),
        sub: narrow ? undefined : t(`specialties.${p.specialty}`),
        mark: <ProAvatar pro={p.id} className="text-[0.62em]" />,
      }))}
      start={DAY_START}
      end={DAY_END}
      step={STEP}
      events={view.appts.map(toEvent)}
      now={view.clock}
      formatTime={fmt.time}
            formatGutter={fmt.gutter}
      isFree={isFree}
      onFree={(col, minute) => onSelect(col as ProId, minute)}
      freeText={narrow ? undefined : t('agenda.free')}
      freeLabel={(c, m) => t('agenda.freeSlot', { time: fmt.time(m), pro: c.label })}
      selected={selected}
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

export function PhoneAgenda() {
  const t = useTranslations('demoClinic.agenda');
  const { view } = useClinic();
  const { day } = useClinicText();
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<{ pro: ProId; minute: number } | null>(null);
  const stats = dayStats(view.appts);
  return (
    <div className="flex flex-col gap-[0.7em] pt-[0.2em]">
      <ViewHead title={t('title')} sub={t('summary', { day: day(3), count: stats.count, pct: Math.round(stats.occupancy * 100) })} />
      <Filters value={filter} onChange={setFilter} />
      <Card className="px-[0.5em] pb-[0.3em] pt-[0.65em]">
        <AgendaCalendar filter={filter} selected={sel ? { column: sel.pro, minute: sel.minute } : null} onSelect={(pro, minute) => setSel({ pro, minute })} rowHeight="2.6em" />
      </Card>
      {sel ? (
        <div className="clinic-sheet" role="dialog" aria-label={t('bookTitle')}>
          <BookingForm key={`${sel.pro}${sel.minute}`} pro={sel.pro} start={sel.minute} onDone={() => setSel(null)} onCancel={() => setSel(null)} />
        </div>
      ) : (
        <p className="clinic-hint">{t('hintPhone')}</p>
      )}
    </div>
  );
}

export function LaptopAgenda() {
  const t = useTranslations('demoClinic.agenda');
  const { view } = useClinic();
  const { day } = useClinicText();
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<{ pro: ProId; minute: number } | null>(null);
  const stats = dayStats(view.appts);
  const grid = useRef<HTMLDivElement>(null);
  const close = () => {
    setSel(null);
    grid.current?.focus({ preventScroll: true });
  };
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead title={t('title')} sub={t('summary', { day: day(3, 'long'), count: stats.count, pct: Math.round(stats.occupancy * 100) })} aside={<Filters value={filter} onChange={setFilter} />} />
      <div className="grid grid-cols-[minmax(0,1fr)_13.5em] items-start gap-[0.8em]">
        <div ref={grid} tabIndex={-1} className="outline-none">
          <Card className="p-[0.75em] pb-[0.4em]">
            <AgendaCalendar filter={filter} selected={sel ? { column: sel.pro, minute: sel.minute } : null} onSelect={(pro, minute) => setSel({ pro, minute })} rowHeight="2.3em" />
          </Card>
        </div>
        <div className="flex flex-col gap-[0.8em]">
          <Card className="p-[0.85em]">
            {sel ? (
              <BookingForm key={`${sel.pro}${sel.minute}`} pro={sel.pro} start={sel.minute} onDone={close} onCancel={close} />
            ) : (
              <>
                <Waitlist />
                <p className="mt-[0.8em] border-t border-[var(--demo-line)] pt-[0.6em] text-[0.66em] text-[var(--demo-muted)]">{t('hintLaptop')}</p>
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
