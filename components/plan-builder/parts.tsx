'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Check, Clock, MessageCircle } from 'lucide-react';
import { useIsClient } from '@/components/motion/useIsClient';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { itemById, l } from '@/lib/content';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import type { PlanSwitch } from './rules';
import { timeLeft } from './rules';
import { copyText } from './browser';

/** The square (multi-select) or round (single choice) mark of a row. Decorative. */
export function Mark({ checked, round = false }: { checked: boolean; round?: boolean }) {
  return (
    <span aria-hidden className={`pb-mark ${round ? 'pb-mark--round' : ''}`} data-checked={checked || undefined}>
      {round ? <span className="pb-mark-dot" /> : <Check strokeWidth={2.4} />}
    </span>
  );
}

/** Button that copies text and confirms with a polite status ("Copiado"). */
export function CopyButton({
  getText,
  icon,
  label,
  doneLabel,
  className,
  labelClassName = '',
  disabled = false,
}: {
  disabled?: boolean;
  getText: () => string;
  icon: ReactNode;
  label: string;
  doneLabel: string;
  className: string;
  labelClassName?: string;
}) {
  const t = useTranslations('builder');
  const { play } = useSound();
  const [status, setStatus] = useState<'idle' | 'done' | 'fail'>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const id = window.setTimeout(() => setStatus('idle'), 2400);
    return () => window.clearTimeout(id);
  }, [status]);
  const message = status === 'done' ? doneLabel : status === 'fail' ? t('copyFailed') : '';
  return (
    <>
      <button
        type="button"
        aria-disabled={disabled || undefined}
        className={`${className} ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
        onClick={async (e) => {
          if (disabled) return;
          const ok = await copyText(getText(), e.currentTarget.closest('dialog'));
          setStatus(ok ? 'done' : 'fail');
          if (ok) play('success');
        }}
      >
        {status === 'done' ? <Check aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={2} /> : icon}
        <span className={labelClassName}>{status === 'idle' ? label : message}</span>
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}

/**
 * "Enviar por WhatsApp". A real wa.me link; while nothing is selected it is an
 * aria-disabled button that stays focusable and explains why.
 */
export function SendAction({
  message,
  disabled,
  describedBy,
  analytics,
  className = '',
  label,
}: {
  message: string;
  disabled: boolean;
  describedBy?: string;
  analytics: { items: string; plan: string; total: number; count: number };
  className?: string;
  /** Visible label (the accessible name is always the full "Enviar mi plan por WhatsApp"). */
  label?: ReactNode;
}) {
  const t = useTranslations('builder');
  const { play } = useSound();
  const full = t('send');
  const content = (
    <>
      <MessageCircle aria-hidden className="size-[1.1em] shrink-0" strokeWidth={1.8} />
      <span>{label ?? full}</span>
    </>
  );
  const aria = label !== undefined && label !== full ? full : undefined;
  if (disabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={aria}
        aria-describedby={describedBy}
        className={`btn btn-primary ${className} cursor-not-allowed opacity-45 !shadow-none`}
      >
        {content}
      </button>
    );
  }
  return (
    <WhatsAppLink
      origin="builder"
      message={message}
      extra={{ items: analytics.count, plan: analytics.plan }}
      aria-label={aria}
      className={`btn btn-primary ${className}`}
      onClick={() => {
        play('glint');
        track('builder_sent', { items: analytics.items, plan: analytics.plan, total: analytics.total });
      }}
    >
      {content}
    </WhatsAppLink>
  );
}

/**
 * "Con esto te conviene el paquete Sistema: ahorrás ≈ X%" + one tap to switch.
 * When the package brings more pieces than the visitor picked, it says which.
 */
export function DetectBanner({
  suggestion,
  planName,
  onSwitch,
  compact = false,
}: {
  suggestion: PlanSwitch;
  planName: string;
  onSwitch: () => void;
  compact?: boolean;
}) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const more = suggestion.adds.length > 0;
  const title = more
    ? t('detectMoreTitle', { plan: planName, count: suggestion.adds.length, pct: suggestion.savingsPct })
    : t('detectTitle', { plan: planName, pct: suggestion.savingsPct });
  const list = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
    suggestion.adds.map((id) => {
      const item = itemById(id);
      return item ? l(item.name, locale) : id;
    }),
  );
  const body = more ? t('detectMoreBody', { list, amount: format(suggestion.savingsUsd) }) : t('detectBody', { amount: format(suggestion.savingsUsd) });
  const id = useId();
  return (
    <div className="pb-detect" data-compact={compact || undefined}>
      <PhaseGlyph phase={1} size={compact ? 18 : 22} className="pb-detect-glyph" />
      <div className="pb-detect-text">
        <p id={`${id}-title`} className="pb-detect-title">
          {title}
        </p>
        <p className={`pb-detect-body ${compact ? 'sr-only' : ''}`}>{body}</p>
      </div>
      <button type="button" onClick={onSwitch} className="pb-detect-cta" aria-describedby={`${id}-title`}>
        <span>{compact ? t('detectCtaShort') : t('detectCta')}</span>
        <ArrowRight aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />
      </button>
    </div>
  );
}

function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

/** Subtle countdown for offers with `endsAt` (client only; hidden once expired). */
export function OfferCountdown({ endsAt }: { endsAt: string | null }) {
  const t = useTranslations('builder');
  const client = useIsClient();
  const now = useNow();
  if (!endsAt || !client || !now) return null;
  const left = timeLeft(endsAt, now);
  if (!left) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
      <Clock aria-hidden className="size-3.5" strokeWidth={1.6} />
      {left.days >= 1 ? t('endsInDays', { days: left.days }) : t('endsInHours', { hours: left.hours })}
    </span>
  );
}
