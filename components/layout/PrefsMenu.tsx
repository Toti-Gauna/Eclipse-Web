'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { SoundBadge, SoundToggle } from '@/components/sound/SoundToggle';
import { PrefsPanel } from './PrefsPanel';
import './prefs.css';

/**
 * The header's one preferences trigger ("ES · ARS", plus a tiny equalizer while sound is
 * on) and its anchored, non-modal popover: a title row with the sound master switch,
 * then <PrefsPanel> (language links, currency with today's rate and source, effects /
 * music switches). Esc or a click / focus outside closes it; focus moves into the panel
 * (the current language) on open and back to the trigger when closed with Esc or the
 * trigger.
 *
 * The popover positions itself against the nearest positioned ancestor (the header
 * row), so this component's wrapper must stay static. `className` sets its display.
 */
export function PrefsMenu({ className = 'flex' }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { enabled, music, play } = useSound();
  const [open, setOpen] = useState(false);
  // Mounted on first open, then kept so it can animate out.
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = `${panelId}-title`;

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
    (p?.querySelector<HTMLElement>('a[aria-current="true"]') ?? p?.querySelector<HTMLElement>('a[href], input, button'))?.focus({
      preventScroll: true,
    });
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
        {/* Name: "Idioma, moneda y sonido: ES · ARS" — the visible readout stays in it (WCAG 2.5.3). */}
        <span className="sr-only">{t('prefs.title')}: </span>
        <span className="prefs-trigger-readout">
          {locale.toUpperCase()}
          <span aria-hidden className="mx-1.5 text-fg-muted">
            ·
          </span>
          {currency}
        </span>
        <SoundBadge inline />
        {enabled || music ? <span className="sr-only"> · {t('header.soundOn')}</span> : null}
        <ChevronDown aria-hidden className="prefs-trigger-chevron size-3.5" strokeWidth={1.5} />
      </button>
      {mounted ? (
        <div ref={panel} id={panelId} role="dialog" aria-labelledby={titleId} data-open={open || undefined} className="prefs-pop">
          <div className="prefs-pop-head">
            <p id={titleId} className="prefs-pop-title">
              {t('prefs.title')}
            </p>
            <SoundToggle />
          </div>
          <PrefsPanel />
        </div>
      ) : null}
    </>
  );
}
