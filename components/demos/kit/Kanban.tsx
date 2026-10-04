'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRightLeft, GripVertical, type LucideIcon } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
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

interface Drag {
  id: string;
  el: HTMLElement;
  pointer: number;
  x: number;
  y: number;
  scale: number;
  moved: boolean;
}

/**
 * A pipeline. Cards slide between columns when their `column` changes (FLIP).
 * `columns` layout on laptops, `stack` on phones.
 *
 * With `onMove` the visitor moves cards themselves (local demo data only):
 * - pointer: drag a card (mouse: anywhere on it; touch/pen: by its grip, so the page still scrolls)
 *   and drop it on another column;
 * - keyboard / buttons: each card has a "Mover" button listing the other columns ("Mover a …");
 * - every move is announced in a polite live region and focus returns to the moved card.
 * Labels come from `demoKit.kanban`.
 */
export function Kanban({
  columns,
  cards,
  label,
  layout = 'columns',
  empty,
  onMove,
  className = '',
}: {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  label: string;
  layout?: 'columns' | 'stack';
  /** Text for an empty column. */
  empty?: string;
  /** Makes cards movable (drag and drop + "Mover a …" menu). */
  onMove?: (cardId: string, toColumn: string) => void;
  className?: string;
}) {
  const t = useTranslations('demoKit.kanban');
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const capture = useFlip(root, cards.map((c) => `${c.id}:${c.column}`).join('|'));
  const drag = useRef<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  const focusAfter = useRef<string | null>(null);

  const titleOf = (id: string) => columns.find((c) => c.id === id)?.title ?? id;
  const move = (card: KanbanCard, to: string, focus: boolean) => {
    if (!onMove || to === card.column) return;
    capture();
    onMove(card.id, to);
    setSaid(t('moved', { card: card.title, column: titleOf(to) }));
    if (focus) focusAfter.current = card.id;
  };

  // Focus follows the moved card (its node is re-created in the new column).
  useEffect(() => {
    const id = focusAfter.current;
    if (!id) return;
    focusAfter.current = null;
    root.current?.querySelector<HTMLElement>(`[data-flip="${CSS.escape(id)}"] .demo-kanban-move`)?.focus({ preventScroll: true });
  });

  // Menu: Escape / outside click close it.
  useEffect(() => {
    if (!menu) return;
    const el = root.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      el?.querySelector<HTMLElement>(`[data-flip="${CSS.escape(menu)}"] .demo-kanban-move`)?.focus({ preventScroll: true });
      setMenu(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.demo-kanban-menu, .demo-kanban-move')) setMenu(null);
    };
    el?.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      el?.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menu]);

  const columnAt = (x: number, y: number) => {
    for (const el of root.current?.querySelectorAll<HTMLElement>('[data-col]') ?? []) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el.dataset.col!;
    }
    return null;
  };
  const onPointerDown = (card: KanbanCard) => (e: ReactPointerEvent<HTMLLIElement>) => {
    if (!onMove || e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest('.demo-kanban-move, .demo-kanban-menu')) return;
    if (e.pointerType !== 'mouse' && !target.closest('.demo-kanban-grip')) return;
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    drag.current = { id: card.id, el, pointer: e.pointerId, x: e.clientX, y: e.clientY, scale: el.offsetWidth ? box.width / el.offsetWidth : 1, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    d.el.dataset.dragging = '';
    d.el.style.transform = `translate(${dx / (d.scale || 1)}px, ${dy / (d.scale || 1)}px)`;
    setOver(columnAt(e.clientX, e.clientY));
  };
  const end = (card: KanbanCard, drop: boolean) => (e: ReactPointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    setOver(null);
    const to = drop && d.moved ? columnAt(e.clientX, e.clientY) : null;
    if (to && to !== card.column) {
      move(card, to, false);
    } else if (d.moved) {
      const from = d.el.style.transform;
      d.el.style.transform = '';
      if (!prefersReducedMotion()) d.el.animate([{ transform: from }, { transform: 'none' }], { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    delete d.el.dataset.dragging;
  };

  return (
    <div
      ref={root}
      className={`demo-kanban ${className}`}
      data-layout={layout}
      data-movable={onMove ? '' : undefined}
      role="group"
      aria-label={label}
      aria-describedby={onMove ? `${uid}-hint` : undefined}
      style={{ '--kb-cols': columns.length } as CSSProperties}
    >
      {onMove ? (
        <p id={`${uid}-hint`} className="sr-only">
          {t('hint')}
        </p>
      ) : null}
      {columns.map((col) => {
        const list = cards.filter((c) => c.column === col.id);
        return (
          <section
            key={col.id}
            data-col={col.id}
            data-over={over === col.id ? '' : undefined}
            className={`demo-kanban-col ${toneClass(col.tone ?? 'neutral')}`}
            aria-label={`${col.title} (${list.length})`}
          >
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
                const open = menu === card.id;
                return (
                  <li
                    key={card.id}
                    data-flip={card.id}
                    data-menu={open ? '' : undefined}
                    className={`demo-kanban-card ${toneClass(card.tone ?? col.tone ?? 'neutral')} ${card.fresh ? 'demo-fresh' : ''}`}
                    onPointerDown={onPointerDown(card)}
                    onPointerMove={onPointerMove}
                    onPointerUp={end(card, true)}
                    onPointerCancel={end(card, false)}
                  >
                    {onMove ? (
                      <span aria-hidden className="demo-kanban-grip">
                        <GripVertical strokeWidth={1.8} />
                      </span>
                    ) : null}
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
                    {onMove ? (
                      <>
                        <button
                          type="button"
                          className="demo-kanban-move"
                          aria-label={t('moveCard', { card: card.title })}
                          aria-expanded={open}
                          aria-controls={`${uid}-${card.id}-menu`}
                          onClick={() => setMenu(open ? null : card.id)}
                        >
                          <ArrowRightLeft aria-hidden strokeWidth={1.9} />
                        </button>
                        <div id={`${uid}-${card.id}-menu`} className="demo-kanban-menu" hidden={!open}>
                          {columns
                            .filter((c) => c.id !== card.column)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className={toneClass(c.tone ?? 'neutral')}
                                onClick={() => {
                                  setMenu(null);
                                  move(card, c.id, true);
                                }}
                              >
                                <span aria-hidden className="demo-kanban-dot" />
                                {t('moveTo', { column: c.title })}
                              </button>
                            ))}
                        </div>
                      </>
                    ) : null}
                  </li>
                );
              })}
              {!list.length && empty ? <li className="demo-kanban-empty">{empty}</li> : null}
            </ul>
          </section>
        );
      })}
      {onMove ? (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {said}
        </p>
      ) : null}
    </div>
  );
}
