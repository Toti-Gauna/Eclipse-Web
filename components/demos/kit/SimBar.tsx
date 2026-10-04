'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ListChecks, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { nextBeat, useStoreSnapshot, type DemoStore } from './store';
import './sim.css';

export interface SimConfig {
  /** The demo's store, created with `beats` (see kit/store.ts). */
  store: DemoStore<unknown>;
  /** Visible name of a beat (e.g. `t(\`sim.${id}\`)` → "Llega una reserva online"). */
  label: (beatId: string) => string;
  /** One short line on what is simulated (default: `demoKit.sim.note`). */
  note?: string;
  /** `data-tour` id of the bar (guide step), e.g. "sim". */
  tour?: string;
}

/**
 * The demo's simulation controls (v3, no autoplay): play the next beat ("Simular: …"),
 * see where the story is ("Evento 2 de 4"), jump to any later beat, skip to the end of the
 * one playing and restart. AppShell renders it (prop `sim`) as a strip above the laptop app
 * and under the phone status bar; paired views share the store, so both show the same state.
 * Simulations only change local demo data: nothing is sent anywhere.
 */
export function SimBar({
  store,
  label,
  note,
  tour,
  variant,
  active = true,
  announce = true,
}: SimConfig & {
  variant: 'laptop' | 'phone';
  /** false while hidden: no sounds. */
  active?: boolean;
  /** This instance speaks state changes (one per showcase). */
  announce?: boolean;
}) {
  const t = useTranslations('demoKit.sim');
  const { play } = useSound();
  const snap = useStoreSnapshot(store);
  const beats = store.beats ?? [];
  const uid = useId();
  const panelId = `${uid}-panel`;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  const reached = snap.beat ?? -1;
  const seg = snap.segment ?? null;
  const playing = !!snap.playing && !!seg;
  const upcoming = nextBeat(store, snap);
  const total = beats.length;
  const done = !playing && reached >= total - 1;
  const current = playing ? seg.beat + 1 : reached + 1;
  const progress = playing ? Math.min(1, Math.max(0, (snap.t - seg.from) / Math.max(1, seg.to - seg.from))) : 0;
  const playingLabel = playing ? label(beats[seg.beat].id) : '';
  const counter = current === 0 ? t('counterIdle', { total }) : t('counter', { current, total });
  const noteText = note ?? t('note');

  // Popover: Escape / outside click close it (focus back to its button).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      toggle.current?.focus({ preventScroll: true });
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const el = root.current;
    el?.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      el?.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const sound = (name: 'select' | 'open' | 'close' | 'toggle') => {
    if (active) play(name);
  };
  const run = (id?: string) => {
    store.play?.(id);
    sound('select');
  };
  const reset = () => {
    store.reset?.();
    setOpen(false);
    sound('toggle');
    // "Reiniciar" turns disabled (or leaves): keep the focus in the bar, on "Simular".
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.demo-sim-play')?.focus({ preventScroll: true }));
  };

  const primary = playing ? (
    <button type="button" className="demo-sim-play" data-playing="" aria-disabled="true" style={{ '--sim-p': progress } as CSSProperties}>
      <span aria-hidden className="demo-sim-progress" />
      <span className="demo-sim-play-text">{t('playing', { label: playingLabel })}</span>
    </button>
  ) : done ? (
    <button type="button" className="demo-sim-play" onClick={reset}>
      <RotateCcw aria-hidden strokeWidth={2} />
      <span className="demo-sim-play-text">{t('resetAll')}</span>
    </button>
  ) : (
    <button type="button" className="demo-sim-play" onClick={() => run()}>
      <Play aria-hidden strokeWidth={2} />
      <span className="demo-sim-play-text">{t('play', { label: upcoming ? label(upcoming.id) : '' })}</span>
    </button>
  );

  const ticks = (
    <span aria-hidden className="demo-sim-ticks">
      {beats.map((b, i) => (
        <span key={b.id} data-state={i <= reached ? 'done' : playing && i <= seg.beat ? 'playing' : undefined} />
      ))}
    </span>
  );

  return (
    <div ref={root} role="group" className="demo-sim" data-variant={variant} aria-label={t('title')} data-tour={tour}>
      {variant === 'laptop' ? (
        <>
          <p className="demo-sim-tag">{t('title')}</p>
          <p className="demo-sim-note">{noteText}</p>
          <span className="demo-sim-count demo-num">
            {ticks}
            {counter}
          </span>
        </>
      ) : null}
      {primary}
      {playing ? (
        <button type="button" className="demo-sim-icon" aria-label={t('skip')} title={t('skip')} onClick={() => store.finish?.()}>
          <SkipForward aria-hidden strokeWidth={2} />
        </button>
      ) : null}
      <button
        ref={toggle}
        type="button"
        className={variant === 'phone' ? 'demo-sim-icon demo-sim-countbtn demo-num' : 'demo-sim-icon'}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${t('events')} · ${counter}`}
        title={t('events')}
        onClick={() => {
          setOpen((o) => !o);
          sound(open ? 'close' : 'open');
        }}
      >
        {variant === 'phone' ? (
          <span aria-hidden>
            {current}/{total}
          </span>
        ) : (
          <ListChecks aria-hidden strokeWidth={1.9} />
        )}
      </button>
      {variant === 'laptop' ? (
        <button type="button" className="demo-sim-icon" aria-label={t('reset')} title={t('reset')} onClick={reset} disabled={reached < 0 && !playing}>
          <RotateCcw aria-hidden strokeWidth={1.9} />
        </button>
      ) : null}

      <div id={panelId} className="demo-sim-panel" hidden={!open}>
        <div className="demo-sim-panel-head">
          <p className="demo-sim-tag">{t('events')}</p>
          <button type="button" className="demo-sim-icon" aria-label={t('close')} onClick={() => setOpen(false)}>
            <X aria-hidden strokeWidth={1.9} />
          </button>
        </div>
        <p className="demo-sim-panel-note">{noteText}</p>
        <ol className="demo-sim-list">
          {beats.map((b, i) => {
            const state = i <= reached ? 'done' : playing && i <= seg.beat ? 'playing' : i === reached + 1 ? 'next' : 'pending';
            const isDone = state === 'done' || state === 'playing';
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className="demo-sim-item"
                  data-state={state}
                  aria-disabled={isDone || undefined}
                  onClick={() => {
                    if (isDone) return;
                    run(b.id);
                    setOpen(false);
                    toggle.current?.focus({ preventScroll: true });
                  }}
                >
                  <span aria-hidden className="demo-sim-item-index demo-num">
                    {isDone ? <Check strokeWidth={2.4} /> : i + 1}
                  </span>
                  <span className="demo-sim-item-text">
                    <span className="block">{label(b.id)}</span>
                    <span className="demo-sim-item-state">{t(`state.${state}`)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="demo-sim-reset" onClick={reset}>
          <RotateCcw aria-hidden strokeWidth={1.9} />
          {t('reset')}
        </button>
      </div>
      {announce ? (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {playing ? t('playing', { label: playingLabel }) : reached >= 0 ? t('landed', { label: label(beats[reached].id), counter }) : ''}
        </p>
      ) : null}
    </div>
  );
}
