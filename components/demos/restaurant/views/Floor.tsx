'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { CalendarCheck, Globe, PhoneIncoming, Receipt, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Button, ChatWidget, runChat, type ChatScript } from '../../kit';
import { BOOK_TIMES, FLOOR, TABLES, tableById, type BookingVia, type Table } from '../data';
import { act, type Booking, type TableView } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LuceroMark, ViewHead } from '../ui';

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
 * booked (`onSelect`). Landscape on the laptop, rotated on the phone.
 */
export function FloorMap({
  portrait = false,
  selected = null,
  onSelect,
  mini = false,
  className = '',
}: {
  portrait?: boolean;
  selected?: number | null;
  onSelect?: (table: number) => void;
  mini?: boolean;
  className?: string;
}) {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const byId = new Map(view.tables.map((tb) => [tb.id, tb]));

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
        const fresh = tv.changedAt >= 0 && view.t - tv.changedAt < 2400;
        const sub =
          tv.status === 'free'
            ? t('floor.free')
            : tv.status === 'reserved'
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
  if (tv.status === 'reserved') {
    const b = tv.booking!;
    return `${base}: ${t('table.status.reserved')} ${fmt.time(b.time)}, ${x.person(b.name)}, ${t('floor.people', { count: b.people })}`;
  }
  return `${base}: ${t(`table.status.${tv.status}`)}, ${t('floor.people', { count: tv.people ?? 0 })}`;
}

/** Floor occupancy numbers. */
export function useFloorStats() {
  const { view } = useRestaurant();
  const seated = view.tables.filter((tb) => tb.status === 'seated' || tb.status === 'bill');
  return {
    seated: seated.length,
    people: seated.reduce((s, tb) => s + (tb.people ?? 0), 0),
    reserved: view.tables.filter((tb) => tb.status === 'reserved').length,
    free: view.tables.filter((tb) => tb.status === 'free').length,
    total: TABLES.length,
  };
}

/** Legend of the plan (with counts). */
export function FloorLegend({ className = '' }: { className?: string }) {
  const { t } = useRestaurantText();
  const s = useFloorStats();
  const rows: [string, number][] = [
    ['seated', s.seated],
    ['reserved', s.reserved],
    ['free', s.free],
  ];
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
function BookingForm({ table, onDone, onCancel }: { table: number; onDone: () => void; onCancel: () => void }) {
  const { store, active } = useRestaurant();
  const { t, fmt } = useRestaurantText();
  const { play } = useSound();
  const tb = tableById(table);
  const options = useMemo(() => Array.from({ length: tb.seats }, (_, i) => i + 1).filter((n) => n >= Math.min(2, tb.seats)), [tb.seats]);
  const [people, setPeople] = useState(options[options.length - 1]);
  const [time, setTime] = useState(BOOK_TIMES[0]);
  return (
    <div className="rl-bookform demo-pop">
      <p className="rl-bookform-title">
        <span className="demo-display">{t('table.label', { n: table })}</span>
        <span className="demo-mono">{t('floor.seats', { count: tb.seats })}</span>
      </p>
      {tb.window ? <p className="rl-bookform-note">{t('floor.byWindow')}</p> : null}
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
        {BOOK_TIMES.map((m) => (
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
      <div className="flex items-center gap-[0.5em]">
        <Button
          icon={CalendarCheck}
          onClick={() => {
            store.update(act.book({ table, time, people, via: 'you' }));
            store.engage();
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

/** Tonight's reservations, by time. */
function Bookings({ limit = 8 }: { limit?: number }) {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  return (
    <ol className="rl-bookings">
      {view.bookings.slice(0, limit).map((b) => {
        const Icon = VIA_ICON[b.via];
        const fresh = b.at >= 0 && view.t - b.at < 3000;
        return (
          <li key={b.key} className={fresh ? 'demo-pop' : ''} data-mine={b.name === 'you' ? '' : undefined} data-pending={b.pending ? '' : undefined}>
            <span className="demo-mono rl-bookings-time">{fmt.time(b.time)}</span>
            <span className="min-w-0 flex-1 leading-[1.25]">
              <span className="block truncate font-semibold">{x.person(b.name)}</span>
              <span className="block truncate text-[0.86em] text-[var(--demo-muted)]">
                {t('table.label', { n: b.table })} · {t('floor.people', { count: b.people })}
              </span>
            </span>
            <span className="rl-via" data-via={b.via}>
              <Icon aria-hidden strokeWidth={1.8} />
              {b.pending ? t('floor.pending') : t(`floor.via.${b.via}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The WhatsApp confirmation of the latest new booking (AI or the visitor's). */
export function BookingWhatsApp({ className = '' }: { className?: string }) {
  const { view, reduced, business } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const latest: Booking | undefined = [...view.bookings].filter((b) => b.at >= 0 && !b.pending).sort((a, b) => a.at - b.at).pop();
  if (!latest) {
    return (
      <div className={`rl-wa-empty ${className}`}>
        <p className="rl-rubric">{t('floor.wa.title')}</p>
        <p className="text-[0.74em] text-[var(--demo-muted)]">{t('floor.wa.empty')}</p>
      </div>
    );
  }
  const name = latest.name === 'you' ? null : x.first(latest.name);
  const script: ChatScript = {
    start: 'conf',
    steps: {
      conf: {
        from: 'bot',
        typingMs: 900,
        text: name
          ? t('floor.wa.conf', { name, time: fmt.time(latest.time), people: latest.people, table: latest.table })
          : t('floor.wa.confYou', { time: fmt.time(latest.time), people: latest.people, table: latest.table }),
        next: 'note',
      },
      note: { from: 'note', typingMs: 600, text: t('floor.wa.note') },
    },
  };
  const run = runChat(script, view.t - latest.at, {}, { instant: reduced });
  return (
    <ChatWidget
      key={latest.key}
      variant="whatsapp"
      run={run}
      title={business}
      avatar={<LuceroMark />}
      label={t('floor.wa.label')}
      announce={false}
      stamp={(at) => fmt.time(view.clock - Math.max(0, Math.floor((view.t - latest.at - at) / 2000)))}
      composer={false}
      className={`rl-wa ${className}`}
    />
  );
}

export function LaptopFloor() {
  const { t } = useRestaurantText();
  const s = useFloorStats();
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead
        rubric={t('floor.rubric')}
        title={t('floor.title')}
        sub={t('floor.subtitle', { seated: s.seated, total: s.total, people: s.people })}
        aside={<FloorLegend className="w-[12em]" />}
      />
      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] items-start gap-[0.9em]">
        <div className="flex flex-col gap-[0.6em]">
          <FloorMap selected={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} />
          <p className="rl-footnote">
            <UserRound aria-hidden strokeWidth={1.7} />
            {t('floor.hint')}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-[0.7em]">
          {selected !== null ? <BookingForm key={selected} table={selected} onDone={() => setSelected(null)} onCancel={() => setSelected(null)} /> : null}
          <section className="rl-panel">
            <h3 className="rl-rubric">{t('floor.listTitle')}</h3>
            <Bookings limit={selected !== null ? 3 : 6} />
          </section>
          {selected === null ? <BookingWhatsApp /> : null}
        </div>
      </div>
    </div>
  );
}

export function PhoneFloor() {
  const { t } = useRestaurantText();
  const s = useFloorStats();
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead rubric={t('floor.rubric')} title={t('floor.titleShort')} sub={t('floor.subtitle', { seated: s.seated, total: s.total, people: s.people })} />
      <FloorMap portrait selected={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} />
      {selected !== null ? (
        <BookingForm key={selected} table={selected} onDone={() => setSelected(null)} onCancel={() => setSelected(null)} />
      ) : (
        <p className="rl-footnote">
          <UserRound aria-hidden strokeWidth={1.7} />
          {t('floor.hintPhone')}
        </p>
      )}
      <FloorLegend />
      <section className="rl-panel">
        <h3 className="rl-rubric">{t('floor.listTitle')}</h3>
        <Bookings limit={6} />
      </section>
      <BookingWhatsApp />
    </div>
  );
}
