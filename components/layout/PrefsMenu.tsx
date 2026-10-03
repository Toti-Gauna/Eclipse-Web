'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { PrefsPanel } from './PrefsPanel';
import './prefs.css';

/**
 * Header trigger ("Idioma y moneda · ES · ARS") + an anchored, non-modal popover with
 * <PrefsPanel>. Esc or a click / focus outside closes it; focus moves into the panel
 * on open and back to the trigger when closed with Esc or the trigger.
 *
 * The popover positions itself against the nearest positioned ancestor (the header
 * row), so this component's wrapper must stay static. `className` sets its display.
 */
export function PrefsMenu({ className = 'flex' }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  // Mounted on first open, then kept so it can animate out.
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      play('close');
      if (restoreFocus) trigger.current?.focus();
    },
    [play],
  );

  useEffect(() => {
    if (!open) return;
    const p = panel.current;
    p?.querySelector<HTMLElement>('a[aria-current="true"], a[href], input, button')?.focus({ preventScroll: true });
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (!!p?.contains(target) || !!trigger.current?.contains(target));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (!inside(e.target)) close(false);
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={mounted ? panelId : undefined}
        onClick={() => {
          if (open) {
            close(true);
            return;
          }
          setMounted(true);
          setOpen(true);
          play('open');
        }}
        className={`prefs-trigger ${className}`}
      >
        <Globe aria-hidden className="size-4 shrink-0 text-fg-muted" strokeWidth={1.5} />
        <span className="prefs-trigger-caption sr-only xl:not-sr-only">{t('header.prefsTrigger')}</span>
        <span className="prefs-trigger-readout">
          {locale.toUpperCase()}
          <span aria-hidden className="mx-1.5 text-fg-muted">
            ·
          </span>
          {currency}
        </span>
        <ChevronDown aria-hidden className="prefs-trigger-chevron size-3.5" strokeWidth={1.5} />
      </button>
      {mounted ? (
        <div ref={panel} id={panelId} role="dialog" aria-label={t('prefs.title')} data-open={open || undefined} className="prefs-pop">
          <PrefsPanel />
        </div>
      ) : null}
    </>
  );
}
