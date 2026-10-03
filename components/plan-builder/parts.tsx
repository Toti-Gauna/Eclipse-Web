'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { useIsClient } from '@/components/motion/useIsClient';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { track } from '@/lib/analytics';
import type { PlanSwitch } from './rules';
import { timeLeft } from './rules';
import { copyText } from './browser';

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
        }}
      >
        {status === 'done' ? <Check aria-hidden className="size-4 shrink-0 text-corona" strokeWidth={2} /> : icon}
        <span className={labelClassName}>{status === 'idle' ? label : message}</span>
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}

/**
 * "Enviar mi plan por WhatsApp". A real wa.me link; while nothing is selected it is
 * an aria-disabled button that stays focusable and explains why.
 */
export function SendAction({
  message,
  disabled,
  compact = false,
  describedBy,
  analytics,
}: {
  message: string;
  disabled: boolean;
  compact?: boolean;
  describedBy?: string;
  analytics: { items: string; plan: string; total: number; count: number };
}) {
  const t = useTranslations('builder');
  const label = compact ? t('sendShort') : t('send');
  const className = `btn btn-primary ${compact ? 'btn-sm shrink-0 !px-4' : 'w-full'}`;
  const content = (
    <>
      <MessageCircle aria-hidden className="size-[1.1em] shrink-0" strokeWidth={1.8} />
      {label}
    </>
  );
  if (disabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={compact ? t('send') : undefined}
        aria-describedby={describedBy}
        className={`${className} cursor-not-allowed opacity-45 !shadow-none`}
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
      aria-label={compact ? t('send') : undefined}
      className={className}
      onClick={() => track('builder_sent', { items: analytics.items, plan: analytics.plan, total: analytics.total })}
    >
      {content}
    </WhatsAppLink>
  );
}

/** "Esto es el plan Sistema: ahorrás ≈ X%" + "Cambiar al plan". */
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
  const { format } = useCurrency();
  const title = t('detectTitle', { plan: planName, pct: suggestion.savingsPct });
  if (compact) {
    return (
      <div className="pb-pop flex items-center gap-3 border-b border-corona/25 bg-[linear-gradient(90deg,rgb(245_185_66/0.16),rgb(245_185_66/0.06))] px-4 py-2.5">
        <Sparkles aria-hidden className="size-4 shrink-0 text-corona" strokeWidth={1.6} />
        <p className="min-w-0 flex-1 text-[0.8rem] font-medium leading-snug text-flare">{title}</p>
        <button type="button" onClick={onSwitch} className="btn btn-primary btn-sm shrink-0 !min-h-11 !px-3.5 text-[0.8rem]">
          {t('detectCta')}
        </button>
      </div>
    );
  }
  return (
    <div className="pb-pop relative overflow-hidden rounded-card-sm border border-corona/40 bg-[radial-gradient(120%_140%_at_100%_0%,rgb(245_185_66/0.22),rgb(245_185_66/0.05)_60%)] p-4">
      <div className="flex items-start gap-3">
        <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-corona" strokeWidth={1.5} />
        <div className="min-w-0">
          <p className="font-medium leading-snug text-flare">{title}</p>
          <p className="mt-1 text-sm text-fg-muted">{t('detectBody', { amount: format(suggestion.savingsUsd) })}</p>
        </div>
      </div>
      <button type="button" onClick={onSwitch} className="btn btn-primary btn-sm mt-4 w-full">
        {t('detectCta')}
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
