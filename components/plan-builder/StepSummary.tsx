'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ChevronDown, Copy, Link2 } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { CurrencySwitcher } from '@/components/layout/CurrencySwitcher';
import { AnimatedMoney } from '@/components/ui/Money';
import { annualMonthsCharged, itemById, l, planById, voiceUsage, type FounderOffer, type Offer } from '@/lib/content';
import type { Quote } from '@/lib/pricing';
import type { Locale } from '@/i18n/routing';
import type { PlanSwitch, StepId } from './rules';
import { recurringSplit } from './rules';
import { CopyButton, DetectBanner } from './parts';

/**
 * Step 4 — the plan, clean: what is paid once vs. what is paid every month (and every
 * year, with annual maintenance), the package suggestion if there is one, sharing
 * (link + summary) and the exact message that will be sent. Sending lives in the dock.
 */
export function StepSummary({
  quote: q,
  empty,
  suggestion,
  onSwitch,
  onGo,
  founder,
  offersById,
  message,
  shareUrl,
  Sub,
}: {
  quote: Quote;
  empty: boolean;
  suggestion: PlanSwitch | null;
  onSwitch: () => void;
  onGo: (step: StepId) => void;
  founder: { offer: FounderOffer } | null;
  offersById: Partial<Record<string, Offer>>;
  message: string;
  shareUrl: () => string;
  Sub: 'h3' | 'h4';
}) {
  const t = useTranslations('builder');
  const tAll = useTranslations();
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const uid = useId();

  if (empty) {
    return (
      <div className="pb-empty">
        <p className="pb-empty-title">{t('emptyTitle')}</p>
        <button type="button" className="btn btn-ghost" onClick={() => onGo('objetivo')}>
          {t('emptyCta')}
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.6} />
        </button>
      </div>
    );
  }

  const name = (id: string, kind: 'plan' | 'item') => {
    const entity = kind === 'plan' ? planById(id) : itemById(id);
    return entity ? l(entity.name, locale) : id;
  };
  const combo = offersById['combo-voz'];
  const founderApplied = q.offers.applied.find((a) => a.kind === 'founder');
  const range = q.plan && q.rangeUsd && q.rangeUsd.to > q.rangeUsd.from ? q.rangeUsd : null;
  const rec = recurringSplit(q);
  const m = q.maintenance;
  const free = 12 - annualMonthsCharged;

  return (
    <>
      {suggestion ? <DetectBanner suggestion={suggestion} planName={l(suggestion.plan.name, locale)} onSwitch={onSwitch} /> : null}

      <div className="pb-ledger">
        <section className="pb-ledger-block" aria-labelledby={`${uid}-once`}>
          <header className="pb-ledger-head">
            <Sub id={`${uid}-once`} className="label pb-ledger-title">
              {t('ledgerOneTime')}
            </Sub>
            <button type="button" className="pb-link" onClick={() => onGo('piezas')}>
              {t('edit')}
              <span className="sr-only">: {t('ledgerOneTime')}</span>
            </button>
          </header>
          <ul className="pb-ledger-lines">
            {q.lines.map((line) => (
              <li key={`${line.kind}-${line.id}`} className="pb-ledger-line">
                <span className="pb-ledger-name">
                  {line.kind === 'plan' ? t('packageHead', { plan: name(line.id, 'plan') }) : name(line.id, 'item')}
                  {line.priceUsd < line.listUsd && combo ? <span className="pb-tag pb-tag--accent">{l(combo.label, locale)}</span> : null}
                </span>
                <span aria-hidden className="leader" />
                <span className="pb-ledger-amount readout">
                  {line.kind === 'plan' ? <span className="pb-ledger-from">{t('ledgerFrom')} </span> : null}
                  {format(line.priceUsd)}
                </span>
              </li>
            ))}
            {founderApplied && founder ? (
              <li className="pb-ledger-line pb-ledger-discount">
                <span className="pb-ledger-name">{l(founder.offer.label, locale)}</span>
                <span aria-hidden className="leader" />
                <span className="pb-ledger-amount readout">{`− ${format(founderApplied.savingsUsd)}`}</span>
              </li>
            ) : null}
          </ul>
          <p className="pb-ledger-total">
            <span>{t('ledgerTotal')}</span>
            <span aria-hidden className="leader" />
            <span className="pb-ledger-sum readout">
              {q.plan ? <span className="pb-ledger-from">{t('ledgerFrom')} </span> : null}
              <AnimatedMoney usd={q.totalUsd} />
            </span>
          </p>
          {range ? <p className="pb-ledger-note">{t('rangeNote', { to: format(range.to) })}</p> : null}
        </section>

        <section className="pb-ledger-block" aria-labelledby={`${uid}-month`}>
          <header className="pb-ledger-head">
            <Sub id={`${uid}-month`} className="label pb-ledger-title">
              {t('ledgerMonthly')}
            </Sub>
            <button type="button" className="pb-link" onClick={() => onGo('mantenimiento')}>
              {t('edit')}
              <span className="sr-only">: {t('ledgerMonthly')}</span>
            </button>
          </header>
          {rec.monthlyUsd > 0 ? (
            <>
              <ul className="pb-ledger-lines">
                {m.plan && m.billing === 'monthly' ? (
                  <li className="pb-ledger-line">
                    <span className="pb-ledger-name">{t('maintenanceLine', { name: l(m.plan.name, locale) })}</span>
                    <span aria-hidden className="leader" />
                    <span className="pb-ledger-amount readout">{format(m.periodUsd)}</span>
                  </li>
                ) : null}
                {m.voiceUsageMonthlyUsd > 0 ? (
                  <li className="pb-ledger-line">
                    <span className="pb-ledger-name">
                      {t('voiceLine')}
                      <span className="pb-ledger-sub">{l(voiceUsage.note, locale)}</span>
                    </span>
                    <span aria-hidden className="leader" />
                    <span className="pb-ledger-amount readout">{format(m.voiceUsageMonthlyUsd)}</span>
                  </li>
                ) : null}
              </ul>
              <p className="pb-ledger-total">
                <span>{t('ledgerTotal')}</span>
                <span aria-hidden className="leader" />
                <span className="pb-ledger-sum readout">
                  <AnimatedMoney usd={rec.monthlyUsd} />
                  <span className="pb-ledger-period">{tAll('common.perMonth')}</span>
                </span>
              </p>
            </>
          ) : (
            <p className="pb-ledger-note">{rec.yearlyUsd > 0 ? '—' : t('nothingMonthly')}</p>
          )}

          {rec.yearlyUsd > 0 && m.plan ? (
            <div className="pb-ledger-year">
              <p className="label pb-ledger-title">{t('ledgerYearly')}</p>
              <p className="pb-ledger-line">
                <span className="pb-ledger-name">
                  {t('maintenanceAnnualLine', { name: l(m.plan.name, locale) })}
                  {free > 0 ? <span className="pb-tag pb-tag--accent">{t('freeMonths', { count: free })}</span> : null}
                </span>
                <span aria-hidden className="leader" />
                <span className="pb-ledger-amount readout">
                  {format(rec.yearlyUsd)}
                  <span className="pb-ledger-period">{tAll('common.perYear')}</span>
                </span>
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <div className="pb-share">
        <CopyButton
          getText={shareUrl}
          icon={<Link2 aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />}
          label={t('copyLink')}
          doneLabel={t('linkCopied')}
          className="btn btn-ghost btn-sm"
        />
        <CopyButton
          getText={() => message}
          icon={<Copy aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />}
          label={t('copySummary')}
          doneLabel={t('summaryCopied')}
          className="btn btn-ghost btn-sm"
        />
      </div>

      <details className="pb-message">
        <summary>
          <span>{t('messagePreview')}</span>
          <ChevronDown aria-hidden className="pb-message-caret" strokeWidth={1.5} />
        </summary>
        <pre className="pb-message-text">{message}</pre>
      </details>

      <div className="pb-currency">
        <span className="label">{tAll('header.currency')}</span>
        <CurrencySwitcher />
      </div>
      <p className="pb-fine">
        {t('notice')} {tAll('currency.notice')}
      </p>
    </>
  );
}
