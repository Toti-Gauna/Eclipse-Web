'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { featuredPlanId, plans } from '@/lib/content';
import { plansByTier, type Billing } from '@/lib/pricing';
import { DrawLine } from '@/components/motion/DrawLine';
import { PlanRow } from './PlanRow';

/**
 * Tab A · Paquetes: the 7 packages in their two groups, every row with the same
 * fields in the same place — para quién · qué incluye · desde (pago único, range,
 * saving) · mantenimiento sugerido · CTAs — so they compare at a glance. Desktop
 * gets a column header; phones get compact rows that open to the details.
 */
export function Packages({ billing, now, onShowPieces }: { billing: Billing; now: number | null; onShowPieces: () => void }) {
  const t = useTranslations('pricing');
  const groups = plansByTier();

  return (
    <div className="pr-packages">
      <p className="pr-panel-intro">
        <span>{t('ways.bundles.text')}</span>
        <span className="pr-panel-meta">{t('ways.bundles.count', { count: plans.length, groups: groups.length })}</span>
      </p>

      {groups.map((group, gi) => {
        const titleId = `pr-group-${group.tier}`;
        return (
          <div key={group.tier} role="group" aria-labelledby={titleId} className="pr-group" data-tier={group.tier}>
            <div className="pr-group-head">
              <span aria-hidden className="pr-group-index">
                {`A${gi + 1}`}
              </span>
              <h3 id={titleId} className="pr-group-title">
                {t(`groups.${group.tier}.title`)}
              </h3>
              <p className="pr-group-text">{t(`groups.${group.tier}.text`)}</p>
              <p className="pr-group-count">{t('groups.count', { count: group.plans.length })}</p>
            </div>
            <DrawLine className="pr-group-rule" />
            {/* Desktop: names the two unlabeled columns; the price and maintenance columns label themselves in
                every row ("Desde · Pago único", "Mantenimiento sugerido"). Rows carry these for assistive tech. */}
            <p aria-hidden className="pr-cols">
              <span>{t('plan.audienceLabel')}</span>
              <span>{t('plan.includes')}</span>
            </p>
            <div className="pr-group-list">
              {group.plans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} featured={plan.id === featuredPlanId} billing={billing} now={now} />
              ))}
            </div>
          </div>
        );
      })}

      <p className="pr-nonefits">
        <span>{t('noneFits')}</span>
        <button type="button" aria-controls="pr-panel-pieces" onClick={onShowPieces} className="pr-link">
          {t('noneFitsCta')}
          <ArrowRight aria-hidden strokeWidth={1.5} />
        </button>
      </p>
    </div>
  );
}
