'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { PORTAL_TOUR_EVENT } from '@/lib/portal/tour';
import './guide.css';

export interface InfoTipCopy {
  /** Accessible name of the trigger: "Más información: Fecha estimada". */
  label: string;
  title: string;
  body: string;
  /** "Cerrar". */
  close: string;
  /** Visible text next to the icon (legend chips); without it the trigger is the icon alone. */
  text?: string;
}

const OPEN_EVENT = 'eclipse:portal-info';
const GUTTER = 16;

/**
 * "Más información": a small disclosure next to a term that needs context. Button with
 * aria-expanded/aria-controls; the card follows it in the DOM (Tab reaches its close button),
 * Escape or a tap/click outside closes it and Escape returns focus to the button. One open
 * at a time. The card is kept inside the viewport (shifted sideways, flipped up when there's
 * no room below). Built from spans so it can sit inside a <dt> or a line of text.
 */
export function InfoTip({ copy, className = '' }: { copy: InfoTipCopy; className?: string }) {
  const id = useId();
  const panelId = `${id}-panel`;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const { play } = useSound();

  const toggle = () => {
    const next = !open;
    if (next) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    play(next ? 'open' : 'close');
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
      button.current?.focus();
    };
    const onOther = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) close();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOther);
    window.addEventListener(PORTAL_TOUR_EVENT, close);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOther);
      window.removeEventListener(PORTAL_TOUR_EVENT, close);
    };
  }, [open, id]);

  // Keep the card on screen: shift it sideways and flip it above when there's no room below.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    el.style.setProperty('--shift', '0px');
    el.removeAttribute('data-side');
    const rect = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let shift = 0;
    if (rect.right > vw - GUTTER) shift = vw - GUTTER - rect.right;
    if (rect.left + shift < GUTTER) shift = GUTTER - rect.left;
    el.style.setProperty('--shift', `${Math.round(shift)}px`);
    const anchor = button.current?.getBoundingClientRect();
    if (anchor && rect.bottom > window.innerHeight - 8 && anchor.top > rect.height + 24) el.setAttribute('data-side', 'top');
  }, [open]);

  return (
    <span
      ref={wrap}
      className={`pt-info ${className}`}
      data-open={open ? '' : undefined}
      onBlur={(event) => {
        // Leaving the trigger + card with Tab closes it (the card isn't a modal).
        const next = event.relatedTarget as Node | null;
        if (open && next && !wrap.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className={copy.text ? 'pt-info-chip' : 'pt-info-btn'}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={copy.text ? undefined : copy.label}
        data-portal-info
        onClick={toggle}
      >
        <span aria-hidden className="pt-info-icon">
          <Info strokeWidth={1.6} />
        </span>
        {copy.text ? (
          <>
            {copy.text}
            <span className="sr-only">: {copy.label}</span>
          </>
        ) : null}
      </button>
      <span ref={panel} id={panelId} className="pt-info-panel" hidden={!open} tabIndex={-1} data-portal-info-panel>
        <span className="pt-info-title">{copy.title}</span>
        <span className="pt-info-body">{copy.body}</span>
        <button
          type="button"
          className="pt-info-close"
          onClick={() => {
            setOpen(false);
            play('close');
            button.current?.focus();
          }}
        >
          <X aria-hidden strokeWidth={1.6} />
          <span className="sr-only">{copy.close}</span>
        </button>
      </span>
    </span>
  );
}
