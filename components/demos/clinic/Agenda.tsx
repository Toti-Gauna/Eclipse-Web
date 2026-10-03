'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Plus, X } from 'lucide-react';
import { DAYS, NOW_MIN, PROS, TIMES, TODAY, TREATMENTS, proById, type Specialty, type TreatmentId } from './data';
import { dayOccupancy, daySlots, type SlotView } from './sim';
import { useClinic, useFmt } from './context';
import { Card, Eyebrow, ProAvatar, RollingNumber, StatusChip, StatusIcon } from './ui';
import { ActivityFeed, LiveToast } from './activity';

type Filter = 'all' | Specialty;
const FILTERS: Filter[] = ['all', 'dental', 'ortho', 'aesthetic'];

/* ------------------------------------------------------------------ */
/* Shared controls                                                      */
/* ------------------------------------------------------------------ */
function WeekStrip({ day, onDay, className = '' }: { day: number; onDay: (d: number) => void; className?: string }) {
  const t = useTranslations('demoClinic.agenda');
  const fmt = useFmt();
  const { agenda } = useClinic();
  return (
    <div role="group" aria-label={t('days')} className={`grid grid-cols-6 gap-[0.3em] ${className}`}>
      {DAYS.map((d) => {
        const occ = dayOccupancy(agenda, d);
        const on = d === day;
        const isToday = d === TODAY;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={`${fmt.long(d)}. ${t('occupancy', occ)}`}
            onClick={() => onDay(d)}
            className={`flex flex-col items-center gap-[0.18em] rounded-[0.75em] border py-[0.45em] transition-[background-color,border-color,box-shadow] duration-300 ${
              on
                ? 'border-transparent bg-[var(--demo-accent)] text-white shadow-[0_0.4em_1em_-0.4em_rgb(13_107_116/0.7)]'
                : 'border-[var(--demo-line)] bg-white hover:border-[var(--demo-accent)]'
            }`}
          >
            <span
              className={`text-[0.6em] font-semibold uppercase tracking-[0.08em] ${
                on ? 'text-white/90' : isToday ? 'text-[var(--clinic-accent-ink)]' : 'text-[var(--demo-muted)]'
              }`}
            >
              {fmt.weekday(d)}
            </span>
            <span className="tabular text-[0.95em] font-semibold leading-none">{fmt.dayNum(d)}</span>
            <span aria-hidden className={`clinic-meter mt-[0.2em] h-[0.2em] w-[55%] overflow-hidden rounded-full ${on ? 'bg-white/30' : 'bg-black/10'}`}>
              <span className={on ? 'bg-white' : 'bg-[var(--demo-accent)]'} style={{ transform: `scaleX(${occ.booked / occ.total})` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterChips({ filter, onFilter, className = '' }: { filter: Filter; onFilter: (f: Filter) => void; className?: string }) {
  const t = useTranslations('demoClinic');
  return (
    <div role="group" aria-label={t('agenda.filter')} className={`no-scrollbar flex gap-[0.35em] overflow-x-auto ${className}`}>
      {FILTERS.map((f) => {
        const on = f === filter;
        const pro = PROS.find((p) => p.specialty === f);
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => onFilter(f)}
            className={`inline-flex shrink-0 items-center gap-[0.4em] rounded-full border px-[0.75em] py-[0.38em] text-[0.74em] font-medium transition-colors ${
              on ? 'border-[var(--demo-ink)] bg-[var(--demo-ink)] text-white' : 'border-[var(--demo-line)] bg-white text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
            }`}
          >
            {pro ? <span aria-hidden className="size-[0.55em] rounded-full" style={{ background: pro.color }} /> : null}
            {t(`specialties.${f}`)}
          </button>
        );
      })}
    </div>
  );
}

/** Treatment picker + confirm, used inline on the phone and in the laptop's side panel. */
function BookingForm({
  slot,
  onDone,
  onCancel,
  variant = 'inline',
}: {
  slot: SlotView;
  onDone: () => void;
  onCancel: () => void;
  /** inline: card under the slot (phone) · panel: inside the laptop's side panel. */
  variant?: 'inline' | 'panel';
}) {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { store, reduced } = useClinic();
  const ref = useRef<HTMLDivElement>(null);
  const options = TREATMENTS[proById(slot.pro).specialty].slice(0, 3);
  const [treatment, setTreatment] = useState<TreatmentId>(options[0]);
  const inline = variant === 'inline';

  // Laptop: the panel opens before the grid in reading order → take focus there.
  // Phone: bring the whole form into view inside the phone (never scrolls the page).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inline) {
      el.querySelector('button')?.focus({ preventScroll: true });
      return;
    }
    const scroller = el.closest('.demo-scroll');
    if (!scroller) return;
    const box = el.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const overflow = box.bottom - (view.bottom - view.height * 0.16);
    if (overflow > 0) scroller.scrollBy({ top: overflow, behavior: reduced ? 'auto' : 'smooth' });
  }, [inline, reduced]);

  return (
    <div
      ref={ref}
      className={
        inline
          ? 'clinic-pop rounded-[0.95em] border border-[var(--demo-accent)] bg-white p-[0.85em] shadow-[0_0.6em_1.6em_-0.8em_rgb(13_107_116/0.45)]'
          : 'clinic-pop'
      }
    >
      {inline ? <Eyebrow>{t('agenda.bookTitle')}</Eyebrow> : null}
      <p className={`text-[0.88em] font-semibold ${inline ? 'mt-[0.25em]' : ''}`}>
        {t('agenda.bookWhen', { day: fmt.shortDay(slot.day), time: fmt.time(slot.minutes), pro: t(`pros.${slot.pro}.name`) })}
      </p>
      <p className="mt-[0.75em] text-[0.7em] font-medium text-[var(--demo-muted)]">{t('agenda.treatment')}</p>
      <div className="mt-[0.35em] flex flex-wrap gap-[0.35em]">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === treatment}
            onClick={() => setTreatment(o)}
            className={`rounded-full border px-[0.7em] py-[0.35em] text-[0.72em] font-medium transition-colors ${
              o === treatment
                ? 'border-[var(--demo-accent)] bg-[var(--demo-accent-soft)] text-[var(--clinic-accent-ink)]'
                : 'border-[var(--demo-line)] text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
            }`}
          >
            {t(`treatments.${o}`)}
          </button>
        ))}
      </div>
      <div className={`mt-[0.85em] flex gap-[0.4em] ${inline ? '' : 'flex-col'}`}>
        <button
          type="button"
          onClick={() => {
            store.book(slot.key, treatment);
            onDone();
          }}
          className="flex-1 rounded-full bg-[var(--demo-accent)] px-[0.9em] py-[0.6em] text-[0.8em] font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {t('agenda.confirm')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--demo-line)] px-[0.9em] py-[0.6em] text-[0.8em] font-medium text-[var(--demo-muted)] hover:text-[var(--demo-ink)]"
        >
          {t('agenda.cancel')}
        </button>
      </div>
    </div>
  );
}

function useSlotText() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  return (slot: SlotView) => {
    const base = { time: fmt.time(slot.minutes), pro: t(`pros.${slot.pro}.name`) };
    if (!slot.booking) return slot.past ? t('agenda.emptySlot', base) : t('agenda.freeSlot', base);
    return t('agenda.busySlot', {
      ...base,
      patient: t(`patients.${slot.booking.patient}`),
      treatment: t(`treatments.${slot.booking.treatment}`),
      status: t(`status.${slot.booking.status}`),
    });
  };
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */
function BookedCard({ slot, focusOnMount }: { slot: SlotView; focusOnMount: boolean }) {
  const t = useTranslations('demoClinic');
  const { state } = useClinic();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusOnMount) ref.current?.focus({ preventScroll: true });
  }, [focusOnMount]);
  const b = slot.booking!;
  const pro = proById(slot.pro);
  const fresh = slot.changedAt >= 0 && state.tick - slot.changedAt <= 1;
  const muted = b.status === 'done' || b.status === 'freed' || b.status === 'noshow';
  return (
    <div
      ref={ref}
      tabIndex={focusOnMount ? -1 : undefined}
      className={`demo-card relative flex items-center gap-[0.55em] rounded-[0.85em] py-[0.55em] pl-[0.95em] pr-[0.55em] outline-none ${
        slot.version !== 'base' ? 'clinic-pop' : ''
      } ${fresh ? 'clinic-fresh' : ''} ${b.status === 'you' ? 'border-[var(--clinic-amber)] shadow-[0_0_0_0.12em_var(--clinic-amber)]' : ''} ${
        b.status === 'freed' ? 'border-dashed bg-[var(--clinic-bad-bg)]/40' : ''
      }`}
    >
      <span aria-hidden className="absolute inset-y-[0.5em] left-[0.4em] w-[0.22em] rounded-full" style={{ background: pro.color, opacity: muted ? 0.45 : 1 }} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[0.86em] font-semibold ${muted ? 'text-[var(--demo-muted)]' : ''}`}>{t(`patients.${b.patient}`)}</span>
        <span className="block truncate text-[0.7em] text-[var(--demo-muted)]">
          {t(`treatments.${b.treatment}`)} · {t(`pros.${slot.pro}.short`)}
        </span>
      </span>
      <StatusChip status={b.status} />
    </div>
  );
}

function PhoneSlot({
  slot,
  open,
  onOpen,
  onClose,
  onBooked,
  focusOnMount,
}: {
  slot: SlotView;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBooked: () => void;
  focusOnMount: boolean;
}) {
  const t = useTranslations('demoClinic');
  const trigger = useRef<HTMLButtonElement>(null);
  if (slot.booking) return <BookedCard slot={slot} focusOnMount={focusOnMount} />;
  if (slot.past) {
    return (
      <div className="rounded-[0.85em] border border-dashed border-[var(--demo-line)] px-[0.95em] py-[0.6em] text-[0.74em] text-[var(--demo-muted)]">
        {t('agenda.pastFree')} · {t(`pros.${slot.pro}.short`)}
      </div>
    );
  }
  return (
    <div>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
        className="clinic-free flex w-full items-center gap-[0.6em] rounded-[0.85em] px-[0.7em] py-[0.55em] text-left"
      >
        <span aria-hidden className={`grid size-[1.7em] shrink-0 place-items-center rounded-full bg-[var(--demo-accent)] text-white transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <Plus className="size-[1em]" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.84em] font-semibold text-[var(--clinic-accent-ink)]">
            {t('agenda.free')} · {t(`pros.${slot.pro}.short`)}
          </span>
          <span className="block text-[0.7em] text-[var(--demo-muted)]">{t('agenda.freeHint')}</span>
        </span>
      </button>
      {open ? (
        <div className="mt-[0.4em]">
          <BookingForm
            slot={slot}
            onDone={onBooked}
            onCancel={() => {
              onClose();
              trigger.current?.focus({ preventScroll: true });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PhoneAgenda() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { agenda } = useClinic();
  const [day, setDay] = useState(TODAY);
  const [filter, setFilter] = useState<Filter>('all');
  const [showPast, setShowPast] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [justBooked, setJustBooked] = useState<string | null>(null);

  const all = daySlots(agenda, day).filter((s) => filter === 'all' || proById(s.pro).specialty === filter);
  const isToday = day === TODAY;
  const pastCount = isToday ? all.filter((s) => s.past).length : 0;
  const visible = isToday && !showPast ? all.filter((s) => !s.past) : all;
  const occ = dayOccupancy(agenda, day);
  const groups = TIMES.map((minutes, idx) => ({ minutes, idx, slots: visible.filter((s) => s.idx === idx) })).filter((g) => g.slots.length);
  const nowAfter = isToday ? groups.findLast((g) => g.minutes <= NOW_MIN)?.idx : undefined;

  return (
    <div className="flex flex-col gap-[0.75em]">
      <LiveToast />
      <WeekStrip
        day={day}
        onDay={(d) => {
          setDay(d);
          setOpen(null);
        }}
      />
      <FilterChips filter={filter} onFilter={setFilter} />

      <Card className="p-[0.85em]">
        <p className="truncate text-[0.74em] font-semibold text-[var(--demo-muted)]">{fmt.long(day)}</p>
        <p className="mt-[0.35em] text-[1.02em] font-semibold tracking-[-0.01em]">
          <RollingNumber value={occ.booked} /> <span className="font-normal text-[var(--demo-muted)]">/ {occ.total}</span>
          <span className="sr-only"> {t('agenda.occupancy', occ)}</span>
        </p>
        <span aria-hidden className="clinic-meter mt-[0.5em] block h-[0.38em] overflow-hidden rounded-full bg-[var(--demo-accent-soft)]">
          <span className="rounded-full bg-[var(--demo-accent)]" style={{ transform: `scaleX(${occ.booked / occ.total})` }} />
        </span>
        <p className="mt-[0.45em] text-[0.72em] text-[var(--demo-muted)]">{t('agenda.freeLeft', { count: occ.total - occ.booked })}</p>
      </Card>

      {pastCount ? (
        <button
          type="button"
          aria-expanded={showPast}
          onClick={() => setShowPast((v) => !v)}
          className="flex items-center justify-center gap-[0.35em] rounded-full py-[0.3em] text-[0.72em] font-medium text-[var(--demo-muted)] hover:text-[var(--demo-ink)]"
        >
          {showPast ? t('agenda.hidePast') : t('agenda.showPast', { count: pastCount })}
          <ChevronDown aria-hidden className={`size-[1.1em] transition-transform ${showPast ? 'rotate-180' : ''}`} strokeWidth={2} />
        </button>
      ) : null}

      <ol className="flex flex-col gap-[0.55em]">
        {groups.map((g) => (
          <li key={g.idx} className="flex flex-col gap-[0.55em]">
            <div className="flex gap-[0.5em]">
              <span className="tabular w-[3.1em] shrink-0 pt-[0.85em] text-right text-[0.72em] font-semibold leading-tight text-[var(--demo-muted)]">
                {fmt.time(g.minutes)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[0.4em]">
                {g.slots.map((s) => (
                  <PhoneSlot
                    key={`${s.key}-${s.version}`}
                    slot={s}
                    open={open === s.key}
                    onOpen={() => setOpen(s.key)}
                    onClose={() => setOpen(null)}
                    onBooked={() => {
                      setOpen(null);
                      setJustBooked(s.key);
                    }}
                    focusOnMount={justBooked === s.key}
                  />
                ))}
              </div>
            </div>
            {g.idx === nowAfter ? (
              <div aria-hidden className="flex items-center gap-[0.4em] text-[var(--clinic-bad)]">
                <span className="tabular w-[3.1em] shrink-0 text-right text-[0.66em] font-bold">{fmt.time(NOW_MIN)}</span>
                <span className="size-[0.45em] rounded-full bg-current" />
                <span className="h-px flex-1 bg-current opacity-50" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop                                                               */
/* ------------------------------------------------------------------ */
function Kpi({
  label,
  value,
  hint,
  meter,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  meter?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1em] border p-[0.85em] ${
        highlight ? 'border-transparent text-white' : 'border-[var(--demo-line)] bg-white'
      }`}
      style={
        highlight
          ? { background: 'radial-gradient(70% 90% at 105% -10%, rgb(245 185 66 / 0.28), transparent 60%), linear-gradient(150deg, #0d6b74, #084a51)' }
          : undefined
      }
    >
      <p className={`text-[0.7em] font-medium ${highlight ? 'text-white/90' : 'text-[var(--demo-muted)]'}`}>{label}</p>
      <p className="mt-[0.15em] text-[1.75em] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      {meter !== undefined ? (
        <span aria-hidden className="clinic-meter mt-[0.6em] block h-[0.3em] overflow-hidden rounded-full bg-[var(--demo-accent-soft)]">
          <span className="rounded-full bg-[var(--demo-accent)]" style={{ transform: `scaleX(${meter})` }} />
        </span>
      ) : null}
      {hint ? <p className={`mt-[0.45em] text-[0.64em] leading-[1.3] ${highlight ? 'text-white/90' : 'text-[var(--demo-muted)]'}`}>{hint}</p> : null}
    </div>
  );
}

export function KpiRow() {
  const t = useTranslations('demoClinic.kpis');
  const { kpis } = useClinic();
  return (
    <div className="grid grid-cols-4 gap-[0.75em]">
      <Kpi
        label={t('today')}
        value={
          <>
            <RollingNumber value={kpis.booked} />
            <span className="text-[0.55em] font-medium text-[var(--demo-muted)]"> / {kpis.total}</span>
          </>
        }
        meter={kpis.booked / kpis.total}
      />
      <Kpi label={t('confirmed')} value={<RollingNumber value={kpis.confirmed} />} hint={t('confirmedOf', { count: kpis.booked })} />
      <Kpi highlight label={t('recovered')} value={<RollingNumber value={kpis.recoveredWeek} />} hint={t('recoveredHint')} />
      <Kpi label={t('waitlist')} value={<RollingNumber value={kpis.waitlist} />} hint={t('waitlistHint')} />
    </div>
  );
}

const ROW = 2.3; // em, row height of the grid
const GAP = 0.3; // em, border-spacing
const HEAD = 2.3; // em, header row height
const TIME_COL = 3.3; // em

function GridCell({ slot, selected, onSelect }: { slot: SlotView; selected: boolean; onSelect: () => void }) {
  const t = useTranslations('demoClinic');
  const { state } = useClinic();
  const label = useSlotText()(slot);
  const b = slot.booking;
  if (!b) {
    if (slot.past) {
      return (
        <div className="h-full rounded-[0.6em] bg-[repeating-linear-gradient(135deg,transparent_0_0.35em,rgb(21_21_27/0.04)_0.35em_0.7em)]">
          <span className="sr-only">{label}</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={onSelect}
        className={`clinic-free flex h-full w-full items-center gap-[0.35em] rounded-[0.6em] px-[0.6em] text-[0.7em] font-semibold text-[var(--clinic-accent-ink)] ${
          selected ? '!border-solid !border-[var(--demo-accent)] !bg-[var(--demo-accent-soft)] shadow-[0_0_0_0.15em_rgb(13_107_116/0.2)]' : ''
        }`}
      >
        <Plus aria-hidden className="size-[1.1em]" strokeWidth={2.4} />
        {t('agenda.free')}
      </button>
    );
  }
  const pro = proById(slot.pro);
  const fresh = slot.changedAt >= 0 && state.tick - slot.changedAt <= 1;
  const muted = b.status === 'done' || b.status === 'freed' || b.status === 'noshow';
  return (
    <div
      className={`relative flex h-full items-center gap-[0.4em] overflow-hidden rounded-[0.6em] border pl-[0.65em] pr-[0.4em] ${
        slot.version !== 'base' ? 'clinic-pop' : ''
      } ${fresh ? 'clinic-fresh' : ''} ${
        b.status === 'you'
          ? 'border-[var(--clinic-amber)] bg-[#fff8e8]'
          : b.status === 'freed'
            ? 'border-dashed border-[var(--clinic-bad)]/40 bg-[var(--clinic-bad-bg)]/60'
            : 'border-[var(--demo-line)] bg-white'
      }`}
    >
      <span aria-hidden className="absolute inset-y-[0.35em] left-[0.25em] w-[0.18em] rounded-full" style={{ background: pro.color, opacity: muted ? 0.4 : 1 }} />
      <span aria-hidden className="min-w-0 flex-1 leading-[1.2]">
        <span className={`block truncate text-[0.72em] font-semibold ${muted ? 'text-[var(--demo-muted)]' : ''}`}>{t(`patients.${b.patient}`)}</span>
        <span className="block truncate text-[0.6em] text-[var(--demo-muted)]">{t(`treatments.${b.treatment}`)}</span>
      </span>
      <StatusIcon status={b.status} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function AgendaGrid({ day, filter, selected, onSelect }: { day: number; filter: Filter; selected: string | null; onSelect: (k: string) => void }) {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { agenda } = useClinic();
  const pros = PROS.filter((p) => filter === 'all' || p.specialty === filter);
  const slots = daySlots(agenda, day);
  const nowRows = (NOW_MIN - TIMES[0]) / 30;
  const nowRow = Math.floor(nowRows);
  const nowTop = 2 * GAP + HEAD + nowRow * (ROW + GAP) + (nowRows - nowRow) * ROW;
  return (
    <div className="relative">
      <table className="relative z-10 w-full table-fixed border-separate" style={{ borderSpacing: `${GAP}em` }}>
        <caption className="sr-only">{fmt.long(day)}</caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: `${TIME_COL}em` }}>
              <span className="sr-only">{t('agenda.title')}</span>
            </th>
            {pros.map((p) => (
              <th key={p.id} scope="col" className="text-left font-normal" style={{ height: `${HEAD}em` }}>
                <span className="flex items-center gap-[0.45em]">
                  <ProAvatar pro={p.id} />
                  <span className="min-w-0 leading-[1.15]">
                    <span className="block truncate text-[0.74em] font-semibold">{t(`pros.${p.id}.name`)}</span>
                    <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">{t(`specialties.${p.specialty}`)}</span>
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMES.map((minutes, idx) => (
            <tr key={minutes}>
              <th scope="row" className="tabular pr-[0.3em] text-right align-top text-[0.64em] font-semibold text-[var(--demo-muted)]" style={{ height: `${ROW / 0.64}em` }}>
                {fmt.time(minutes)}
              </th>
              {pros.map((p) => {
                const slot = slots.find((s) => s.pro === p.id && s.idx === idx)!;
                return (
                  <td key={p.id} className="p-0" style={{ height: `${ROW}em` }}>
                    <GridCell key={slot.version} slot={slot} selected={selected === slot.key} onSelect={() => onSelect(slot.key)} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {day === TODAY ? (
        <div
          aria-hidden
          className="pointer-events-none absolute right-[0.3em] z-0 flex items-center text-[var(--clinic-bad)]"
          style={{ top: `${nowTop}em`, left: `${GAP * 1.5 + TIME_COL}em` }}
        >
          <span className="-ml-[0.3em] size-[0.55em] rounded-full bg-current" />
          <span className="h-[0.12em] flex-1 bg-current opacity-70" />
        </div>
      ) : null}
    </div>
  );
}

export function LaptopAgenda() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { agenda } = useClinic();
  const [day, setDay] = useState(TODAY);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const selectedSlot = selected ? agenda.slots.get(selected) : undefined;
  const bookable = selectedSlot && !selectedSlot.booking && !selectedSlot.past ? selectedSlot : undefined;
  const occ = dayOccupancy(agenda, day);
  const gridRef = useRef<HTMLDivElement>(null);
  // Back to the grid (where the booked slot now shows) when the side panel closes.
  const closePanel = () => {
    setSelected(null);
    gridRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--clinic-safe-top,0em)] flex items-end justify-between gap-[1em]">
        <div className="min-w-0">
          <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('agenda.title')}</h2>
          <p className="truncate text-[0.78em] text-[var(--demo-muted)]">
            {fmt.long(day)} · {t('agenda.occupancy', occ)}
          </p>
        </div>
        <WeekStrip
          day={day}
          onDay={(d) => {
            setDay(d);
            setSelected(null);
          }}
          className="w-[19em] shrink-0"
        />
      </div>

      {/* The phone of the showcase covers the right edge: keep the body clear of it. */}
      <div className="mr-[var(--clinic-safe,0em)] flex flex-col gap-[0.9em]">
        <KpiRow />
        <div className="grid grid-cols-[12.5em_minmax(0,1fr)] items-start gap-[0.8em]">
          <Card className="p-[0.85em]">
            {bookable ? (
              <div className="flex flex-col gap-[0.6em]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.9em] font-semibold">{t('agenda.bookTitle')}</h3>
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label={t('agenda.cancel')}
                    className="grid size-[1.8em] place-items-center rounded-full text-[var(--demo-muted)] hover:bg-black/[0.04]"
                  >
                    <X aria-hidden className="size-[1em]" strokeWidth={2} />
                  </button>
                </div>
                <BookingForm key={bookable.key} variant="panel" slot={bookable} onDone={closePanel} onCancel={closePanel} />
              </div>
            ) : (
              <>
                <ActivityFeed limit={5} />
                <p className="mt-[0.9em] border-t border-[var(--demo-line)] pt-[0.7em] text-[0.68em] text-[var(--demo-muted)]">{t('agenda.pickSlot')}</p>
              </>
            )}
          </Card>
          <div ref={gridRef} tabIndex={-1} className="outline-none">
            <Card className="p-[0.6em]">
              <FilterChips filter={filter} onFilter={setFilter} className="px-[0.3em] pb-[0.2em]" />
              <AgendaGrid day={day} filter={filter} selected={bookable ? bookable.key : null} onSelect={setSelected} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
