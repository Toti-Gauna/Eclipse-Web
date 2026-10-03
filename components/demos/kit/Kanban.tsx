'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useFlip } from './flip';
import { toneClass, type Tone } from './primitives';
import './kanban.css';

export interface KanbanColumn {
  id: string;
  title: string;
  tone?: Tone;
}

export interface KanbanCard {
  id: string;
  column: string;
  title: string;
  sub?: string;
  /** Right-aligned meta (time, amount). */
  meta?: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  /** Just moved/arrived: halo. */
  fresh?: boolean;
}

/**
 * A pipeline whose cards move between columns as the story advances (FLIP: the
 * card slides from its old column). `columns` layout on laptops, `stack` on phones.
 */
export function Kanban({
  columns,
  cards,
  label,
  layout = 'columns',
  empty,
  className = '',
}: {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  label: string;
  layout?: 'columns' | 'stack';
  /** Text for an empty column. */
  empty?: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useFlip(root, cards.map((c) => `${c.id}:${c.column}`).join('|'));
  return (
    <div ref={root} className={`demo-kanban ${className}`} data-layout={layout} role="group" aria-label={label} style={{ '--kb-cols': columns.length } as CSSProperties}>
      {columns.map((col) => {
        const list = cards.filter((c) => c.column === col.id);
        return (
          <section key={col.id} className={`demo-kanban-col ${toneClass(col.tone ?? 'neutral')}`} aria-label={`${col.title} (${list.length})`}>
            <header className="demo-kanban-head">
              <span aria-hidden className="demo-kanban-dot" />
              <span className="min-w-0 flex-1 truncate">{col.title}</span>
              <span className="demo-kanban-count demo-num" aria-hidden>
                {list.length}
              </span>
            </header>
            <ul className="demo-kanban-list">
              {list.map((card) => {
                const Icon = card.icon;
                return (
                  <li
                    key={card.id}
                    data-flip={card.id}
                    className={`demo-kanban-card ${toneClass(card.tone ?? col.tone ?? 'neutral')} ${card.fresh ? 'demo-fresh' : ''}`}
                  >
                    {Icon ? (
                      <span aria-hidden className="demo-icon-chip">
                        <Icon strokeWidth={1.8} />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 leading-[1.25]">
                      <span className="block truncate text-[0.74em] font-semibold">{card.title}</span>
                      {card.sub ? <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">{card.sub}</span> : null}
                    </span>
                    {card.meta ? <span className="demo-kanban-meta">{card.meta}</span> : null}
                  </li>
                );
              })}
              {!list.length && empty ? <li className="demo-kanban-empty">{empty}</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
