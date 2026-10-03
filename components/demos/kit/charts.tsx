'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Readout, toneClass, type Tone } from './primitives';
import './charts.css';

/**
 * Small charts that tell one story each. SVG/HTML only, sized in em, drawn in with
 * clip-path / transform (never width/height), static with reduced motion.
 * Every chart takes a `label` (its accessible summary) — say the conclusion, not the data.
 */

/** A trend line (optionally filled). The last point gets a dot. */
export function Sparkline({
  values,
  label,
  tone = 'accent',
  area = true,
  className = '',
  replayKey,
}: {
  values: number[];
  label: string;
  tone?: Tone;
  area?: boolean;
  className?: string;
  /** Change it to draw the line in again. */
  replayKey?: string | number;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [values.length > 1 ? (i / (values.length - 1)) * 100 : 50, 28 - ((v - min) / span) * 24] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <span role="img" aria-label={label} className={`demo-spark ${toneClass(tone)} ${className}`}>
      <svg key={replayKey} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
        {area ? <path d={`${line} L100,32 L0,32 Z`} className="demo-spark-area" /> : null}
        <path d={line} className="demo-spark-line" vectorEffect="non-scaling-stroke" />
      </svg>
      {last ? <span aria-hidden className="demo-spark-dot" style={{ left: `${last[0]}%`, top: `${(last[1] / 32) * 100}%` }} /> : null}
    </span>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
}

/** Vertical bars (e.g. weeks before/after). Bars grow with scaleY; values update with a transition. */
export function Bars({
  data,
  label,
  max,
  height = '7em',
  format = (n) => String(n),
  values = 'ends',
  className = '',
}: {
  data: BarDatum[];
  label: string;
  max?: number;
  height?: string;
  format?: (n: number) => string;
  /** Which bars print their value. */
  values?: 'all' | 'ends' | 'none';
  className?: string;
}) {
  const top = (max ?? Math.max(...data.map((d) => d.value))) * 1.15 || 1;
  return (
    <figure className={`demo-bars ${className}`}>
      <div aria-hidden className="demo-bars-plot" style={{ height }}>
        {data.map((d, i) => {
          const show = values === 'all' || (values === 'ends' && (i === 0 || i === data.length - 1));
          return (
            <div key={d.label} className={`demo-bars-col ${toneClass(d.tone ?? 'accent')}`} style={{ '--i': i } as CSSProperties}>
              <span className="demo-bars-value demo-num" data-show={show ? '' : undefined}>
                {format(d.value)}
              </span>
              <span className="demo-bars-track">
                <span className="demo-bars-bar" style={{ transform: `scaleY(${Math.max(0.02, d.value / top)})` }} />
              </span>
            </div>
          );
        })}
      </div>
      <div aria-hidden className="demo-bars-axis">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        {label}: {data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}
      </figcaption>
    </figure>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  tone: Tone;
}

/** Share of a total (e.g. where recovered bookings came from). */
export function Donut({
  segments,
  label,
  center,
  size = '7.5em',
  className = '',
}: {
  segments: DonutSegment[];
  label: string;
  center?: ReactNode;
  size?: string;
  className?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  // Where each segment starts (percent of the ring).
  const starts = segments.map((_, i) => segments.slice(0, i).reduce((a, s) => a + (s.value / total) * 100, 0));
  return (
    <figure className={`demo-donut ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" aria-hidden>
        <circle cx="21" cy="21" r="15.915" className="demo-donut-track" />
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          const gap = segments.length > 1 && pct > 0 ? 1.2 : 0;
          const dash = `${Math.max(0, pct - gap)} ${100 - Math.max(0, pct - gap)}`;
          const offset = 25 - starts[i];
          return (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r="15.915"
              className={`demo-donut-seg ${toneClass(s.tone)}`}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              style={{ '--i': i } as CSSProperties}
            />
          );
        })}
      </svg>
      {center ? <div className="demo-donut-center">{center}</div> : null}
      <figcaption className="sr-only">
        {label}: {segments.map((s) => `${s.label} ${s.value}`).join(', ')}
      </figcaption>
    </figure>
  );
}

/** Legend row for Donut / Bars. */
export function Legend({ items, className = '' }: { items: { label: string; tone: Tone; value?: ReactNode }[]; className?: string }) {
  return (
    <ul className={`demo-legend ${className}`}>
      {items.map((it) => (
        <li key={it.label} className={toneClass(it.tone)}>
          <span aria-hidden className="demo-legend-swatch" />
          <span className="min-w-0 flex-1 truncate">{it.label}</span>
          {it.value !== undefined ? <span className="demo-num font-semibold">{it.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export interface KpiDelta {
  text: string;
  /** Direction of the change. */
  dir: 'up' | 'down' | 'flat';
  /** Is this change good news? (colors it ok/bad). Default: up is good. */
  good?: boolean;
}

/** A labelled readout: label + number that rolls + delta + optional sparkline/meter. */
export function Kpi({
  label,
  value,
  format,
  suffix,
  delta,
  hint,
  spark,
  sparkLabel,
  emphasis = false,
  size = 'md',
  className = '',
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Small text after the number ("/ 36"). */
  suffix?: ReactNode;
  delta?: KpiDelta;
  hint?: ReactNode;
  spark?: number[];
  sparkLabel?: string;
  /** The one number that matters on the screen: solid accent card. */
  emphasis?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const good = delta ? (delta.good ?? delta.dir === 'up') : true;
  const Arrow = delta?.dir === 'up' ? ArrowUpRight : delta?.dir === 'down' ? ArrowDownRight : ArrowRight;
  return (
    <div className={`demo-kpi ${className}`} data-emphasis={emphasis ? '' : undefined} data-size={size}>
      <p className="demo-kpi-label">{label}</p>
      <p className="demo-kpi-value">
        <Readout value={value} format={format} className="demo-display" />
        {suffix ? <span className="demo-kpi-suffix">{suffix}</span> : null}
      </p>
      {delta ? (
        <p className={`demo-kpi-delta ${toneClass(delta.dir === 'flat' ? 'neutral' : good ? 'ok' : 'bad')}`}>
          <Arrow aria-hidden strokeWidth={2.2} />
          {delta.text}
        </p>
      ) : null}
      {hint ? <p className="demo-kpi-hint">{hint}</p> : null}
      {spark ? <Sparkline values={spark} label={sparkLabel ?? label} tone={emphasis ? 'ink' : 'accent'} className="demo-kpi-spark" /> : null}
    </div>
  );
}
