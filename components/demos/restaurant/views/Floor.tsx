'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { CalendarCheck, Globe, History, PhoneIncoming, Receipt, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Button, CalendarToolbar, ChatWidget, runChat, useCalendarNav, type CalendarNav, type ChatScript } from '../../kit';
import { FLOOR, TABLES, TODAY, isOpenDay, tableById, type BookingVia, type PersonId, type Table } from '../data';
import { act, bookTimes, dayBookings, dayTables, isStoryFresh, type Booking, type TableView } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LuceroMark, SimCue, ViewHead } from '../ui';

const DIMS: Record<Table['shape'], [number, number]> = { round: [7, 7], square: [10, 8], long: [17, 8] };
/** Chairs around a table, as offsets (−1…1) from its center. */
const CHAIRS: Record<Table['shape'], [number, number][]> = {
  round: [
    [-1, 0],
    [1, 0],
  ],
  square: [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ],
  long: [
    [-0.55, -1],
    [0, -1],
    [0.55, -1],
    [-0.55, 1],
    [0, 1],
    [0.55, 1],
  ],
};

/** A zone of the plan (x, y, w, h in plan units), rotated for the portrait phone plan. */
function zone(portrait: boolean, x: number, y: number, w: number, h: number): CSSProperties {
  return portrait
    ? { left: `${(y / FLOOR.h) * 100}%`, top: `${(x / FLOOR.w) * 100}%`, width: `${(h / FLOOR.h) * 100}%`, height: `${(w / FLOOR.w) * 100}%` }
    : { left: `${(x / FLOOR.w) * 100}%`, top: `${(y / FLOOR.h) * 100}%`, width: `${(w / FLOOR.w) * 100}%`, height: `${(h / FLOOR.h) * 100}%` };
}

const VIA_ICON: Record<BookingVia, LucideIcon> = { ai: PhoneIncoming, web: Globe, phone: PhoneIncoming, you: Sparkles };

/**
 * The salón as an architect's plan: kitchen pass and bar at the back, the street window
 * in front. Tables show who's seated, who's coming and what's free; free tables can be
 * booked (`onSelect`). Landscape on the laptop, rotated on the phone. `tables` is the
 * plan of the day being looked at (default: tonight, live).
 */
export function FloorMap({
  portrait = false,
  tables,
  selected = null,
  onSelect,
  mini = false,
  className = '',
}: {
  portrait?: boolean;
  tables?: TableView[];
  selected?: number | null;
  onSelect?: (table: number) => void;
  mini?: boolean;
  className?: string;
}) {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const byId = new Map((tables ?? view.tables).map((tb) => [tb.id, tb]));

  return (
    <div className={`rl-floor ${className}`} data-portrait={portrait ? '' : undefined} data-mini={mini ? '' : undefined} role="group" aria-label={t('floor.mapLabel')}>
      <span aria-hidden className="rl-floor-zone" data-zone="kitchen" style={zone(portrait, 2, 2, 34, 6)}>
        <span>{t('floor.zones.kitchen')}</span>
      </span>
      <span aria-hidden className="rl-floor-zone" data-zone="bar" style={zone(portrait, 66, 2, 32, 6)}>
        <span>{t('floor.zones.bar')}</span>
      </span>
      <span aria-hidden className="rl-floor-window" style={zone(portrait, 3, 60.4, 70, 1.2)} />
      {!mini ? (
        <span aria-hidden className="rl-floor-label" style={zone(portrait, 3, 56.6, 30, 3)}>
          {t('floor.zones.window')}
        </span>
      ) : null}
      <span aria-hidden className="rl-floor-door" style={zone(portrait, 80, 55, 12, 7)}>
        {!mini ? <span>{t('floor.zones.door')}</span> : null}
      </span>
      {TABLES.map((tb) => {
        const tv = byId.get(tb.id)!;
        const [w, h] = DIMS[tb.shape];
        const style = {
          left: `${((portrait ? tb.y : tb.x) / (portrait ? FLOOR.h : FLOOR.w)) * 100}%`,
          top: `${((portrait ? tb.x : tb.y) / (portrait ? FLOOR.w : FLOOR.h)) * 100}%`,
          '--w': portrait ? h : w,
          '--h': portrait ? w : h,
        } as CSSProperties;
        const mine = tv.booking?.name === 'you';
        const status = tv.status === 'reserved' && mine ? 'mine' : tv.booking?.pending ? 'pending' : tv.status;
        const fresh = isStoryFresh(view.t, tv.changedAt);
        const sub =
          tv.status === 'free'
            ? t('floor.free')
            : tv.status === 'reserved' || tv.status === 'done'
              ? fmt.time(tv.booking!.time)
              : tv.status === 'bill'
                ? t('floor.billShort')
                : t('floor.seatedShort', { people: tv.people ?? 0 });
        const label = tableLabel(x, tb, tv);
        const bookable = !!onSelect && tv.status === 'free';
        const content = (
          <>
            {CHAIRS[tb.shape].map(([cx, cy], i) => {
              const [ox, oy] = portrait ? [cy, cx] : [cx, cy];
              return <span key={i} aria-hidden className="rl-chair" style={{ '--cx': ox, '--cy': oy } as CSSProperties} />;
            })}
            <span aria-hidden className="rl-table-top">
              <span className="rl-table-n demo-mono">{tb.id}</span>
              {!mini ? <span className="rl-table-sub demo-mono">{sub}</span> : null}
              {tv.status === 'bill' ? <Receipt className="rl-table-bill" strokeWidth={1.8} /> : null}
            </span>
          </>
        );
        return bookable ? (
          <button
            key={tb.id}
            type="button"
            className={`rl-table ${fresh ? 'rl-fresh' : ''}`}
            data-shape={tb.shape}
            data-status={status}
            aria-pressed={selected === tb.id}
            aria-label={label}
            style={style}
            onClick={() => onSelect(tb.id)}
          >
            {content}
          </button>
        ) : (
          <span key={tb.id} role="img" className={`rl-table ${fresh ? 'rl-fresh' : ''}`} data-shape={tb.shape} data-status={status} aria-label={label} style={style}>
            {content}
          </span>
        );
      })}
    </div>
  );
}

function tableLabel(x: ReturnType<typeof useRestaurantText>, tb: Table, tv: TableView) {
  const { t, fmt } = x;
  const base = t('table.label', { n: tb.id });
  if (tv.status === 'free') return `${base}: ${t('table.status.free')}, ${t('floor.seats', { count: tb.seats })}`;
  if (tv.status === 'reserved' || tv.status === 'done') {
    const b = tv.booking!;
    return `${base}: ${t(`table.status.${tv.status}`)} ${fmt.time(b.time)}, ${x.person(b.name)}, ${t('floor.people', { count: b.people })}`;
  }
  return `${base}: ${t(`table.status.${tv.status}`)}, ${t('floor.people', { count: tv.people ?? 0 })}`;
}

/** Floor occupancy numbers (tonight unless `tables` says otherwise). */
export function useFloorStats(tables?: TableView[]) {
  const { view } = useRestaurant();
  const list = tables ?? view.tables;
  const seated = list.filter((tb) => tb.status === 'seated' || tb.status === 'bill');
  return {
    seated: seated.length,
    people: seated.reduce((s, tb) => s + (tb.people ?? 0), 0),
    reserved: list.filter((tb) => tb.status === 'reserved').length,
    done: list.filter((tb) => tb.status === 'done').length,
    free: list.filter((tb) => tb.status === 'free').length,
    total: TABLES.length,
  };
}

/** Legend of the plan (with counts). */
export function FloorLegend({ tables, day = TODAY, className = '' }: { tables?: TableView[]; day?: number; className?: string }) {
  const { t } = useRestaurantText();
  const s = useFloorStats(tables);
  const rows: [string, number][] = day < TODAY ? [['done', s.done]] : day > TODAY ? [['reserved', s.reserved], ['free', s.free]] : [['seated', s.seated], ['reserved', s.reserved], ['free', s.free]];
  return (
    <ul className={`rl-legend ${className}`}>
      {rows.map(([k, n]) => (
        <li key={k} data-status={k}>
          <span aria-hidden className="rl-legend-swatch" />
          <span className="flex-1">{t(`table.status.${k}`)}</span>
          <span className="demo-mono">{n}</span>
        </li>
      ))}
    </ul>
  );
}

/** Book a free table: people + time → reserved, WhatsApp confirmation. */
function BookingForm({ day, table, onDone, onCancel }: { day: number; table: number; onDone: () => void; onCancel: () => void }) {
  const { store, active, view } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const { play } = useSound();
  const tb = tableById(table);
  const times = bookTimes(day, view);
  const options = useMemo(() => Array.from({ length: tb.seats }, (_, i) => i + 1).filter((n) => n >= Math.min(2, tb.seats)), [tb.seats]);
  const [people, setPeople] = useState(options[options.length - 1]);
  const [time, setTime] = useState(times[0]);
  return (
    <div className="rl-bookform demo-pop" role="group" aria-label={t('floor.form.title', { n: table })}>
      <p className="rl-bookform-title">
        <span className="demo-display">{t('table.label', { n: table })}</span>
        <span className="demo-mono">{t('floor.seats', { count: tb.seats })}</span>
      </p>
      <p className="rl-bookform-note">
        {day === TODAY ? t('floor.form.tonight') : x.dayOf(day)}
        {tb.window ? ` · ${t('floor.byWindow')}` : ''}
      </p>
      <p className="rl-rubric">{t('floor.form.people')}</p>
      <div className="rl-chips" role="group" aria-label={t('floor.form.people')}>
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className="rl-chip"
            aria-pressed={people === n}
            onClick={() => {
              setPeople(n);
              if (active) play('select');
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="rl-rubric">{t('floor.form.time')}</p>
      <div className="rl-chips" role="group" aria-label={t('floor.form.time')}>
        {times.map((m) => (
          <button
            key={m}
            type="button"
            className="rl-chip demo-mono"
            aria-pressed={time === m}
            onClick={() => {
              setTime(m);
              if (active) play('select');
            }}
          >
            {fmt.time(m)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-[0.5em]">
        <Button
          icon={CalendarCheck}
          disabled={time === undefined}
          onClick={() => {
            if (time === undefined) return;
            store.update(act.book({ day, table, time, people, via: 'you' }));
            if (active) play('success');
            onDone();
          }}
        >
          {t('floor.form.book', { n: table })}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('floor.form.cancel')}
        </Button>
      </div>
    </div>
  );
}

/** A day's reservations, by time. */
function Bookings({ list, limit = 8, past = false }: { list: Booking[]; limit?: number; past?: boolean }) {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  if (!list.length) return <p className="rl-bookings-empty">{t('floor.noBookings')}</p>;
  return (
    <ol className="rl-bookings">
      {list.slice(0, limit).map((b) => {
        const Icon = VIA_ICON[b.via];
        const fresh = !b.mine && isStoryFresh(view.t, b.at, 3000);
        return (
          <li key={b.key} className={fresh ? 'demo-pop' : ''} data-mine={b.mine ? '' : undefined} data-pending={b.pending ? '' : undefined} data-past={past ? '' : undefined}>
            <span className="demo-mono rl-bookings-time">{fmt.time(b.time)}</span>
            <span className="min-w-0 flex-1 leading-[1.25]">
              <span className="block truncate font-semibold">{x.person(b.name)}</span>
              <span className="block truncate text-[0.86em] text-[var(--demo-muted)]">
                {t('table.label', { n: b.table })} · {t('floor.people', { count: b.people })}
              </span>
            </span>
            <span className="rl-via" data-via={b.via}>
              <Icon aria-hidden strokeWidth={1.8} />
              {past ? t('floor.attended') : b.pending ? t('floor.pending') : t(`floor.via.${b.via}`)}
            </span>
          </li>
        );
      })}
      {list.length > limit ? <li className="rl-bookings-more demo-mono">{t('floor.more', { count: list.length - limit })}</li> : null}
    </ol>
  );
}

/** The WhatsApp confirmation of the latest new booking (the AI's, the site's or the visitor's). */
export function BookingWhatsApp({ className = '' }: { className?: string }) {
  const { view, state, reduced, business } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  type Sent = { key: string; day: number; table: number; time: number; people: number; name: PersonId | null; at: number; mine: boolean };
  const sent: Sent[] = [
    ...view.events
      .filter((e) => (e.kind === 'aiBooking' || e.kind === 'webBooking') && e.at >= 0)
      .map((e) => ({ key: e.id, day: e.day ?? TODAY, table: e.table ?? 0, time: e.time ?? 0, people: e.people ?? 2, name: e.who ?? null, at: e.at, mine: false })),
    ...state.bookings.map((b) => ({ key: `mine-${b.day}-${b.table}`, day: b.day, table: b.table, time: b.time, people: b.people, name: null, at: b.at, mine: true })),
  ];
  const latest = sent.sort((a, b) => a.at - b.at || Number(a.mine) - Number(b.mine)).pop();
  if (!latest) {
    return (
      <div className={`rl-wa-empty ${className}`}>
        <p className="rl-rubric">{t('floor.wa.title')}</p>
        <p className="text-[0.74em] text-[var(--demo-muted)]">{t('floor.wa.empty')}</p>
      </div>
    );
  }
  const values = { time: fmt.time(latest.time), people: latest.people, table: latest.table, day: x.dayOf(latest.day) };
  const today = latest.day === TODAY;
  const text = latest.name
    ? t(today ? 'floor.wa.conf' : 'floor.wa.confDay', { ...values, name: x.first(latest.name) })
    : t(today ? 'floor.wa.confYou' : 'floor.wa.confYouDay', values);
  const script: ChatScript = {
    start: 'conf',
    steps: {
      conf: { from: 'bot', typingMs: 900, text, next: 'note' },
      note: { from: 'note', typingMs: 600, text: t('floor.wa.note') },
    },
  };
  // The visitor's own booking answers at once (the clock is stopped); the story's plays in its beat.
  const run = runChat(script, latest.mine ? 0 : view.t - latest.at, {}, { instant: latest.mine || reduced });
  return (
    <ChatWidget
      key={latest.key}
      variant="whatsapp"
      run={run}
      title={business}
      avatar={<LuceroMark />}
      label={t('floor.wa.label')}
      announce={false}
      stamp={(at) => fmt.time(latest.mine ? view.clock : view.clock - Math.max(0, Math.floor((view.t - latest.at - at) / 2000)))}
      composer={false}
      className={`rl-wa ${className}`}
    />
  );
}

/** Where the reservations book is looking (any open day; past ones read-only) + the selected table. */
function useFloorDay() {
  const { state, view } = useRestaurant();
  const nav = useCalendarNav({ today: TODAY, open: isOpenDay, initialView: 'day' });
  const [sel, setSel] = useState<{ day: number; table: number } | null>(null);
  const day = nav.day;
  const tables = dayTables(day, state, view);
  const bookings = dayBookings(day, state, view);
  const selected = sel && sel.day === day && tables.find((tb) => tb.id === sel.table)?.status === 'free' ? sel.table : null;
  const canBook = bookTimes(day, view).length > 0;
  return {
    nav,
    day,
    tables,
    bookings,
    selected,
    canBook,
    select: (table: number) => setSel((cur) => (cur && cur.day === day && cur.table === table ? null : { day, table })),
    clear: () => setSel(null),
  };
}

function Period({ nav }: { nav: CalendarNav }) {
  const x = useRestaurantText();
  const { t } = x;
  const when = nav.day === TODAY ? t('floor.period.tonight') : nav.day < TODAY ? t('floor.period.past') : t('floor.period.ahead');
  return (
    <>
      {x.dayOf(nav.day)}
      <span className="rl-period-tag"> · {when}</span>
    </>
  );
}

function DayNote({ day, count }: { day: number; count: number }) {
  const { t } = useRestaurantText();
  if (day < TODAY) {
    return (
      <p className="rl-footnote">
        <History aria-hidden strokeWidth={1.7} />
        {t('floor.pastNote', { count })}
      </p>
    );
  }
  return (
    <p className="rl-footnote">
      <UserRound aria-hidden strokeWidth={1.7} />
      {t(day === TODAY ? 'floor.hint' : 'floor.hintAhead')}
    </p>
  );
}

export function LaptopFloor() {
  const { t } = useRestaurantText();
  const { beat } = useRestaurant();
  const f = useFloorDay();
  const s = useFloorStats();
  const tonight = f.day === TODAY;
  return (
    <div className="flex flex-col gap-[0.75em]">
      <ViewHead
        rubric={t('floor.rubric')}
        title={tonight ? t('floor.title') : t('floor.titleBook')}
        sub={tonight ? t('floor.subtitle', { seated: s.seated, total: s.total, people: s.people }) : t('floor.subtitleDay', { count: f.bookings.length })}
        aside={<FloorLegend tables={f.tables} day={f.day} className="w-[12em]" />}
      />
      <CalendarToolbar nav={f.nav} period={<Period nav={f.nav} />} views={['day']} className="rl-calbar" />
      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] items-start gap-[0.9em]">
        <div className="flex flex-col gap-[0.6em]" data-tour="floor">
          <FloorMap tables={f.tables} selected={f.selected} onSelect={f.canBook ? f.select : undefined} />
          <DayNote day={f.day} count={f.bookings.length} />
        </div>
        <div className="flex min-w-0 flex-col gap-[0.7em]">
          {f.selected !== null ? <BookingForm key={`${f.day}-${f.selected}`} day={f.day} table={f.selected} onDone={f.clear} onCancel={f.clear} /> : null}
          <section className="rl-panel">
            <h3 className="rl-rubric">{tonight ? t('floor.listTitle') : t('floor.listDay')}</h3>
            <Bookings list={f.bookings} limit={f.selected !== null ? 3 : 6} past={f.day < TODAY} />
          </section>
          {f.selected === null ? <BookingWhatsApp /> : null}
          {beat < 1 && tonight ? <SimCue beat="rush" className="self-start" /> : null}
        </div>
      </div>
    </div>
  );
}

export function PhoneFloor() {
  const { t } = useRestaurantText();
  const f = useFloorDay();
  const s = useFloorStats();
  const tonight = f.day === TODAY;
  return (
    <div className="flex flex-col gap-[0.75em] pt-[0.2em]">
      <ViewHead
        rubric={t('floor.rubric')}
        title={tonight ? t('floor.titleShort') : t('floor.titleBook')}
        sub={tonight ? t('floor.subtitle', { seated: s.seated, total: s.total, people: s.people }) : t('floor.subtitleDay', { count: f.bookings.length })}
      />
      <CalendarToolbar nav={f.nav} period={<Period nav={f.nav} />} views={['day']} compact className="rl-calbar" />
      <div data-tour="floor">
        <FloorMap portrait tables={f.tables} selected={f.selected} onSelect={f.canBook ? f.select : undefined} />
      </div>
      {f.selected !== null ? <BookingForm key={`${f.day}-${f.selected}`} day={f.day} table={f.selected} onDone={f.clear} onCancel={f.clear} /> : <DayNote day={f.day} count={f.bookings.length} />}
      <FloorLegend tables={f.tables} day={f.day} />
      <section className="rl-panel">
        <h3 className="rl-rubric">{tonight ? t('floor.listTitle') : t('floor.listDay')}</h3>
        <Bookings list={f.bookings} limit={6} past={f.day < TODAY} />
      </section>
      <BookingWhatsApp />
    </div>
  );
}
