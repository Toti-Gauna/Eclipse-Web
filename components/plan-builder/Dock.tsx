'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AnimatedMoney } from '@/components/ui/Money';
import { l } from '@/lib/content';
import type { Quote } from '@/lib/pricing';
import type { Locale } from '@/i18n/routing';
import { recurringSplit, type PlanSwitch, type StepId } from './rules';
import { DetectBanner, SendAction } from './parts';

/**
 * Sticky bar under every step: the running total split in "pago único" + what repeats,
 * Back, and the step's one primary action (Siguiente → Ver resumen → Enviar por WhatsApp).
 * The package suggestion rides on top of it while the plan is being built.
 * The amounts here are visual: the builder announces totals in its own live region.
 */
export function Dock({
  step,
  quote: q,
  empty,
  suggestion,
  onSwitch,
  onBack,
  onNext,
  message,
  analytics,
  glint,
}: {
  step: StepId;
  quote: Quote;
  empty: boolean;
  suggestion: PlanSwitch | null;
  onSwitch: () => void;
  onBack: () => void;
  onNext: () => void;
  message: string;
  analytics: { items: string; plan: string; total: number; count: number };
  /** Changes on success moments (package switch): replays the diamond-ring glint. */
  glint: number;
}) {
  const t = useTranslations('builder');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const rec = recurringSplit(q);
  const first = step === 'objetivo';
  const last = step === 'resumen';
  const hintId = `${useId()}-send-hint`;

  return (
    <div className="pb-dock">
      {suggestion && !last ? (
        <DetectBanner suggestion={suggestion} planName={l(suggestion.plan.name, locale)} onSwitch={onSwitch} compact />
      ) : null}
      <div className="pb-dock-row">
        <button
          type="button"
          className="pb-dock-back"
          onClick={first ? undefined : onBack}
          aria-disabled={first || undefined}
          aria-label={t('back')}
          title={t('back')}
        >
          <ArrowLeft aria-hidden strokeWidth={1.5} />
        </button>

        <div aria-hidden className="pb-dock-total">
          <span className="label pb-dock-label">
            {t('dockOneTime')}
            {q.plan ? ` · ${t('dockFrom')}` : null}
          </span>
          <span className="pb-dock-amount readout">
            <AnimatedMoney usd={q.totalUsd} />
            {glint ? <span key={glint} className="pb-glint" /> : null}
          </span>
          {rec.monthlyUsd > 0 || rec.yearlyUsd > 0 ? (
            <span className="pb-dock-rec readout">
              {rec.monthlyUsd > 0 ? (
                <span>
                  + {format(rec.monthlyUsd)}
                  {tc('perMonth')}
                </span>
              ) : null}
              {rec.yearlyUsd > 0 ? (
                <span>
                  + {format(rec.yearlyUsd)}
                  {tc('perYear')}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        {!last ? (
          <button type="button" className="btn btn-primary pb-dock-next" onClick={onNext}>
            <span>{t('next')}</span>
            <ArrowRight aria-hidden className="size-4 shrink-0" strokeWidth={1.8} />
          </button>
        ) : null}
        {/* Mounted on every step (the message is always ready), shown on the summary. */}
        <span className="pb-dock-send" hidden={!last}>
          <SendAction message={message} disabled={empty} describedBy={empty ? hintId : undefined} analytics={analytics} label={
              <>
                <span className="sm:hidden">{t('sendShort')}</span>
                <span className="hidden sm:inline">{t('send')}</span>
              </>
            } className="pb-dock-next" />
        </span>
      </div>
      {empty && last ? (
        <p id={hintId} className="pb-dock-hint">
          {t('sendDisabled')}
        </p>
      ) : null}
    </div>
  );
}
