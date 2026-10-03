'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { toneClass, type Tone } from './primitives';
import './calendar.css';

export interface CalendarColumn {
  id: string;
  label: string;
  sub?: string;
  /** Avatar / color mark next to the label. */
  mark?: ReactNode;
}

export interface CalendarEvent {
  id: string;
  column: string;
  /** Minutes from midnight. */
  start: number;
  end: number;
  title: string;
  sub?: string;
  tone?: Tone;
  /** Small trailing mark (status icon / pill). Decorative: say it in `label`. */
  status?: ReactNode;
  /** done: muted · ghost: dashed (a freed slot) · mine: the visitor's own booking. */
  state?: 'default' | 'done' | 'ghost' | 'mine';
  /** Just changed: entrance + halo. */
  fresh?: boolean;
  /** Accessible description (default: "time, title, sub"). */
  label?: string;
  /** Changes when the event's content changes (replays the entrance). */
  version?: string | number;
}

export interface CalendarProps {
  columns: CalendarColumn[];
  /** Visible range in minutes from midnight, and the row step (default 30). */
  start: number;
  end: number;
  step?: number;
  events: CalendarEvent[];
  /** Which empty cells can be booked (they become buttons). */
  isFree?: (column: string, minute: number) => boolean;
  onFree?: (column: string, minute: number) => void;
  /** Visible text of a bookable cell ("Free"). */
  freeText?: string;
  /** Accessible name of a bookable cell. */
  freeLabel?: (column: CalendarColumn, minute: number) => string;
  selected?: { column: string; minute: number } | null;
  /** Current time → a "now" line. */
  now?: number;
  formatTime: (minute: number) => string;
  /** Labels of the time gutter (default: formatTime). Use a compact one (see useDemoFormat().gutter). */
  formatGutter?: (minute: number) => string;
  /** Accessible name of the whole calendar ("Agenda, Thursday 8"). */
  label: string;
  /** Row height (one step) and time gutter width, in em. */
  rowHeight?: string;
  gutter?: string;
  /** Print every step in the gutter or only full hours. */
  times?: 'all' | 'hours';
  /** Free cells always visible (default) or only on hover/focus. */
  freeVisible?: boolean;
  className?: string;
}

/**
 * Day/week grid: columns are people, rooms or days; events span rows by duration.
 * Reading order is chronological (good for screen readers); free cells are buttons.
 */
export function Calendar({
  columns,
  start,
  end,
  step = 30,
  events,
  isFree,
  onFree,
  freeText,
  freeLabel,
  selected,
  now,
  formatTime,
  formatGutter = formatTime,
  label,
  rowHeight = '2.4em',
  gutter = '3.3em',
  times = 'all',
  freeVisible = true,
  className = '',
}: CalendarProps) {
  const rows = Math.round((end - start) / step);
  const col = (id: string) => columns.findIndex((c) => c.id === id);
  const row = (minute: number) => Math.round((minute - start) / step);
  const visible = events.filter((e) => col(e.column) >= 0 && e.end > start && e.start < end);
  const busy = new Set<string>();
  for (const e of visible) for (let m = Math.max(start, e.start); m < Math.min(end, e.end); m += step) busy.add(`${e.column}@${m}`);

  // Cells in chronological order (row-major), so the DOM reads like the day goes.
  const cells: { minute: number; column: CalendarColumn; ci: number; event?: CalendarEvent }[] = [];
  for (let r = 0; r < rows; r++) {
    const minute = start + r * step;
    columns.forEach((c, ci) => {
      const ev = visible.find((e) => e.column === c.id && Math.max(start, e.start) === minute);
      if (ev) cells.push({ minute, column: c, ci, event: ev });
      else if (!busy.has(`${c.id}@${minute}`)) cells.push({ minute, column: c, ci });
    });
  }

  const style = {
    '--cal-cols': columns.length,
    '--cal-rows': rows,
    '--cal-row': rowHeight,
    '--cal-gutter': gutter,
  } as CSSProperties;
  const nowTop = now !== undefined && now >= start && now <= end ? (now - start) / step : null;

  return (
    <div className={`demo-cal ${className}`} style={style} role="group" aria-label={label} data-free={freeVisible ? 'visible' : undefined}>
      <div className="demo-cal-head" aria-hidden>
        {columns.map((c) => (
          <div key={c.id} className="demo-cal-colhead">
            {c.mark}
            <span className="min-w-0 leading-[1.15]">
              <span className="block truncate text-[0.74em] font-semibold">{c.label}</span>
              {c.sub ? <span className="block truncate text-[0.6em] text-[var(--demo-muted)]">{c.sub}</span> : null}
            </span>
          </div>
        ))}
      </div>
      <div className="demo-cal-body">
        <div aria-hidden className="demo-cal-lines" />
        {Array.from({ length: rows }, (_, r) => {
          const minute = start + r * step;
          if (times === 'hours' && minute % 60) return null;
          // The "now" label takes the gutter near it.
          if (now !== undefined && Math.abs(minute - now) < step * 0.45) return null;
          return (
            <span key={minute} aria-hidden className="demo-cal-time demo-num" style={{ gridRow: r + 1 }}>
              {formatGutter(minute)}
            </span>
          );
        })}
        {cells.map(({ minute, column, ci, event }) => {
          if (event) {
            const r0 = row(Math.max(start, event.start));
            const span = Math.max(1, row(Math.min(end, event.end)) - r0);
            const evStyle = { gridRow: `${r0 + 1} / span ${span}`, gridColumn: ci + 2 } as CSSProperties;
            return (
              <div
                key={`${event.id}-${event.version ?? ''}`}
                className={`demo-cal-event ${toneClass(event.tone ?? 'accent')} ${event.fresh ? 'demo-fresh' : ''}`}
                data-state={event.state ?? 'default'}
                data-short={span === 1 ? '' : undefined}
                data-new={event.version !== undefined && event.version !== 'base' ? '' : undefined}
                style={evStyle}
              >
                <span aria-hidden className="demo-cal-event-text">
                  <span className="demo-cal-event-title">{event.title}</span>
                  {event.sub ? <span className="demo-cal-event-sub">{event.sub}</span> : null}
                </span>
                {event.status ? (
                  <span aria-hidden className="demo-cal-event-status">
                    {event.status}
                  </span>
                ) : null}
                <span className="sr-only">
                  {event.label ?? `${formatTime(event.start)}, ${column.label}: ${event.title}${event.sub ? `, ${event.sub}` : ''}`}
                </span>
              </div>
            );
          }
          const free = isFree?.(column.id, minute) && (now === undefined || minute + step > now);
          if (!free) return null;
          const on = selected?.column === column.id && selected.minute === minute;
          return (
            <button
              key={`${column.id}@${minute}`}
              type="button"
              className="demo-cal-free"
              aria-pressed={on}
              aria-label={freeLabel ? freeLabel(column, minute) : `${formatTime(minute)}, ${column.label}`}
              onClick={() => onFree?.(column.id, minute)}
              style={{ gridRow: row(minute) + 1, gridColumn: ci + 2 }}
            >
              <Plus aria-hidden strokeWidth={2.2} />
              {freeText ? <span>{freeText}</span> : null}
            </button>
          );
        })}
        {nowTop !== null ? (
          <div aria-hidden className="demo-cal-now" style={{ '--now': nowTop } as CSSProperties}>
            <span className="demo-cal-now-time demo-num">{formatGutter(now!)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
