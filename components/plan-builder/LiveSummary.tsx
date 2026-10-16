'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AnimatedMoney } from '@/components/ui/Money';
import { itemById, l, planById, type FounderOffer } from '@/lib/content';
import type { Quote } from '@/lib/pricing';
import type { Locale } from '@/i18n/routing';
import { recurringSplit } from './rules';

/**
 * Fullscreen builder (desktop): the plan as it is built, always in sight on the right —
 * what is paid once (each line, the package bonus without a price, the founder discount)
 * and what repeats every month. Read-only and compact: editing happens in the steps, the
 * full ledger, sharing and sending live in step 4 and the dock. Same numbers as the dock
 * and the summary (one Quote from rules.ts). Labelled for what it is: a proposal request.
 */
export function LiveSummary({
  quote: q,
  empty,
  bonusName,
  founder,
}: {
  quote: Quote;
  empty: boolean;
  bonusName: string | null;
  founder: FounderOffer | null;
}) {
  const t = useTranslations('builder');
  const tAll = useTranslations();
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const rec = recurringSplit(q);
  const m = q.maintenance;
  const founderApplied = q.offers.applied.find((a) => a.kind === 'founder');
  const name = (id: string, kind: 'plan' | 'item') => {
    const entity = kind === 'plan' ? planById(id) : itemById(id);
    return entity ? l(entity.name, locale) : id;
  };

  return (
    <aside className="pb-live" aria-labelledby="pb-live-title">
      <p id="pb-live-title" className="label pb-live-title">
        {t('liveTitle')}
      </p>
      {empty ? (
        <p className="pb-live-empty">{t('liveEmpty')}</p>
      ) : (
        <>
          <p className="label pb-live-sub">{t('ledgerOneTime')}</p>
          <ul className="pb-live-lines">
            {q.lines.map((line) => (
              <li key={`${line.kind}-${line.id}`}>
                <span>{line.kind === 'plan' ? t('packageHead', { plan: name(line.id, 'plan') }) : name(line.id, 'item')}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{format(line.priceUsd)}</span>
              </li>
            ))}
            {bonusName ? (
              <li>
                <span>{t('bonusIncluded', { name: bonusName })}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{t('bonusFree')}</span>
              </li>
            ) : null}
            {founderApplied && founder ? (
              <li>
                <span>{l(founder.label, locale)}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{`− ${format(founderApplied.savingsUsd)}`}</span>
              </li>
            ) : null}
          </ul>
          <p className="pb-live-total">
            <span>{t('ledgerTotal')}</span>
            <span className="readout">
              {q.plan ? <span className="pb-ledger-from">{t('ledgerFrom')} </span> : null}
              <AnimatedMoney usd={q.totalUsd} />
            </span>
          </p>
          <ul className="pb-live-lines">
            <li>
              <span>{t('deposit')}</span>
              <span aria-hidden className="leader" />
              <span className="readout">{format(q.depositUsd)}</span>
            </li>
            <li>
              <span>{t('balance')}</span>
              <span aria-hidden className="leader" />
              <span className="readout">{format(q.balanceUsd)}</span>
            </li>
            {q.pending.map((p) => (
              <li key={p.id}>
                <span>{name(p.id, 'item')}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{t('reviewRange', { from: format(p.fromUsd), to: format(p.toUsd) })}</span>
              </li>
            ))}
          </ul>

          <p className="label pb-live-sub">{t('ledgerMonthly')}</p>
          {rec.monthlyUsd > 0 ? (
            <ul className="pb-live-lines">
              {m.plan && m.billing === 'monthly' ? (
                <li>
                  <span>{t('maintenanceLine', { name: l(m.plan.name, locale) })}</span>
                  <span aria-hidden className="leader" />
                  <span className="readout">{format(m.periodUsd)}</span>
                </li>
              ) : null}
              <li className="pb-live-month">
                <span>{t('ledgerTotal')}</span>
                <span aria-hidden className="leader" />
                <span className="readout">
                  {format(rec.monthlyUsd)}
                  {tAll('common.perMonth')}
                </span>
              </li>
            </ul>
          ) : (
            <p className="pb-live-empty">{rec.yearlyUsd > 0 ? '—' : t('nothingMonthly')}</p>
          )}
          {m.intro && m.plan ? (
            <p className="pb-live-empty">
              {t('careIntro', { months: m.intro.months, intro: format(m.intro.monthlyUsd), regular: format(m.monthlyUsd), next: m.intro.months + 1 })}
            </p>
          ) : null}
        </>
      )}
      <p className="pb-live-note">{t('proposalText')}</p>
    </aside>
  );
}
