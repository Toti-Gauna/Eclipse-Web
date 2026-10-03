'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type MouseEvent, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { parseTyped } from '@/lib/calculator';

/** Long press: first repeat after this delay, then every REPEAT_MS; ×5 steps after ACCEL_AFTER repeats. */
const HOLD_MS = 420;
const REPEAT_MS = 75;
const ACCEL_AFTER = 18;

type Direction = 1 | -1;

/**
 * −/+ that also repeat while held. The first step fires on pointer down (instant
 * feedback); the click that follows a press is ignored, so keyboard / assistive-tech
 * activations (no pointer down before them) still step exactly once.
 */
function useRepeatPress(fire: (times: number, repeat: number) => void) {
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  });
  const timers = useRef<{ hold?: number; repeat?: number; count: number; pressedAt: number }>({ count: 0, pressedAt: 0 });

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.hold);
    window.clearInterval(timers.current.repeat);
    timers.current.count = 0;
  }, []);
  useEffect(() => stop, [stop]);

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      timers.current.pressedAt = performance.now();
      stop();
      fireRef.current(1, 0);
      timers.current.hold = window.setTimeout(() => {
        timers.current.repeat = window.setInterval(() => {
          timers.current.count += 1;
          fireRef.current(timers.current.count > ACCEL_AFTER ? 5 : 1, timers.current.count);
        }, REPEAT_MS);
      }, HOLD_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // A pointer press already stepped; keyboard clicks have detail 0.
      if (e.detail !== 0 && performance.now() - timers.current.pressedAt < 1500) return;
      fireRef.current(1, 0);
    },
  };
}

/**
 * One value inside the calculator sentence: [−] 10 [+] turnos.
 * - The number is a real text field (role="spinbutton"): type over it (all selected
 *   on focus), ArrowUp/Down step, PageUp/PageDown step ×10, Home/End jump to the ends.
 * - −/+ are 44px targets (visual 30–40px) that repeat while held; they stay out of the
 *   tab order (the field already handles the arrows), like the APG spin button.
 * The visible unit after the pill is plain text, part of the sentence.
 */
export function ValueField({
  id,
  label,
  value,
  display,
  min,
  max,
  valueText,
  prefix,
  suffix,
  decreaseLabel,
  increaseLabel,
  onStep,
  onType,
  onEdge,
  onFocusField,
  active = false,
  flashKey,
}: {
  id: string;
  /** Accessible name, e.g. "Turnos perdidos por semana". */
  label: string;
  /** Current value in the units the visitor types (a local amount for the ticket). */
  value: number;
  /** Formatted value shown while not typing ("44.000"). */
  display: string;
  min: number;
  max: number;
  valueText: string;
  /** Currency symbol before the number. */
  prefix?: string;
  /** Unit after the pill ("turnos"). */
  suffix?: ReactNode;
  decreaseLabel: string;
  increaseLabel: string;
  /** `repeat` counts the steps of a held button (0 for a single press or a key). */
  onStep: (direction: Direction, times: number, repeat: number) => void;
  /** A typed number (already parsed, not clamped). */
  onType: (value: number) => void;
  onEdge: (edge: 'min' | 'max') => void;
  onFocusField?: () => void;
  active?: boolean;
  /** Changing it replays the "new reading" animation (vertical change). */
  flashKey?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const selectOnMouseUp = useRef(false);
  const down = useRepeatPress((times, repeat) => onStep(-1, times, repeat));
  const up = useRepeatPress((times, repeat) => onStep(1, times, repeat));

  const text = draft ?? display;
  const atMin = value <= min;
  const atMax = value >= max;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowUp: () => onStep(1, 1, 0),
      ArrowDown: () => onStep(-1, 1, 0),
      PageUp: () => onStep(1, 10, 0),
      PageDown: () => onStep(-1, 10, 0),
      Home: () => onEdge('min'),
      End: () => onEdge('max'),
      Enter: () => {
        setDraft(null);
        const el = e.currentTarget;
        requestAnimationFrame(() => el.select());
      },
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    if (e.key !== 'Enter') setDraft(null);
    action();
  };

  return (
    <span className="vf-wrap">
      <span className="vf" data-active={active || undefined}>
        <button
          type="button"
          tabIndex={-1}
          aria-label={decreaseLabel}
          aria-controls={id}
          aria-disabled={atMin || undefined}
          className="vf-btn"
          {...down}
        >
          <Minus aria-hidden strokeWidth={1.5} />
        </button>
        <span key={flashKey} className="vf-value" data-flash={flashKey ? '' : undefined}>
          {prefix ? (
            <span aria-hidden className="vf-prefix">
              {prefix}
            </span>
          ) : null}
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            spellCheck={false}
            role="spinbutton"
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={valueText}
            value={text}
            style={{ width: `${Math.max(1, text.length) + 0.35}ch` }}
            className="vf-input"
            onFocus={(e) => {
              onFocusField?.();
              selectOnMouseUp.current = true;
              const el = e.currentTarget;
              requestAnimationFrame(() => el.select());
            }}
            onMouseUp={(e) => {
              // Keep the select-all from focus when the focus came from a click.
              if (selectOnMouseUp.current) e.preventDefault();
              selectOnMouseUp.current = false;
            }}
            onBlur={() => {
              selectOnMouseUp.current = false;
              setDraft(null);
            }}
            onChange={(e) => {
              const raw = e.currentTarget.value.replace(/[^\d.,\s]/g, '').slice(0, 13);
              setDraft(raw);
              const n = parseTyped(raw);
              if (n !== null) onType(n);
            }}
            onKeyDown={onKeyDown}
          />
        </span>
        <button
          type="button"
          tabIndex={-1}
          aria-label={increaseLabel}
          aria-controls={id}
          aria-disabled={atMax || undefined}
          className="vf-btn"
          {...up}
        >
          <Plus aria-hidden strokeWidth={1.5} />
        </button>
      </span>
      {suffix ? (
        <>
          {' '}
          <span className="vf-unit">{suffix}</span>
        </>
      ) : null}
    </span>
  );
}
