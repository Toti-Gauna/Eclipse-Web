'use client';

import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { featuredPlanId, items, plans } from '@/lib/content';
import { lowestItemPrice, plansByTier, type Billing } from '@/lib/pricing';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { DrawLine } from '@/components/motion/DrawLine';
import { PlanRow } from './PlanRow';
import { PRICING_ANCHORS } from './anchors';

/**
 * "Dos formas de comprar": A · Paquetes (the 7 packages in two groups, below) and
 * B · Pieza por pieza (opens "Armá tu plan" with whatever the visitor already has).
 */
export function Packages({ billing, now }: { billing: Billing; now: number | null }) {
  const t = useTranslations('pricing');
  const { openBuilder } = useExperience();
  const { format } = useCurrency();
  const { play } = useSound();
  const groups = plansByTier();
  const cheapestPiece = lowestItemPrice(items.map((i) => i.id));

  const openPieces = () => {
    play('open');
    openBuilder('pricing');
  };

  return (
    <div id={PRICING_ANCHORS.packages} className="pr-packages">
      <p className="pr-label">{t('ways.label')}</p>
      <div className="pr-ways">
        <div className="pr-way" data-way="a">
          <span aria-hidden className="pr-way-mark">
            A
          </span>
          <h3 className="pr-way-title">{t('ways.bundles.title')}</h3>
          <p className="pr-way-text">{t('ways.bundles.text')}</p>
          <p className="pr-way-meta">
            {t('ways.bundles.count', { count: plans.length, groups: groups.length })}
            <ArrowDown aria-hidden strokeWidth={1.5} />
          </p>
        </div>
        <div className="pr-way" data-way="b">
          <span aria-hidden className="pr-way-mark">
            B
          </span>
          <p className="pr-way-title">{t('ways.pieces.title')}</p>
          <p className="pr-way-text">
            {t('ways.pieces.text')}
            {cheapestPiece !== null ? <span className="pr-way-from"> {t('ways.pieces.from', { price: format(cheapestPiece) })}</span> : null}
          </p>
          <button type="button" aria-haspopup="dialog" onClick={openPieces} className="btn btn-sm pr-btn-ghost pr-way-cta">
            {t('ways.pieces.cta')}
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {groups.map((group, gi) => {
        const titleId = `pr-group-${group.tier}`;
        return (
          <div key={group.tier} role="group" aria-labelledby={titleId} className="pr-group" data-tier={group.tier}>
            <div className="pr-group-head">
              <span aria-hidden className="pr-group-index">
                {`A${gi + 1}`}
              </span>
              <p id={titleId} className="pr-group-title">
                {t(`groups.${group.tier}.title`)}
              </p>
              <p className="pr-group-text">{t(`groups.${group.tier}.text`)}</p>
              <p className="pr-group-count">{t('groups.count', { count: group.plans.length })}</p>
            </div>
            <DrawLine className="pr-group-rule" />
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
        <button type="button" aria-haspopup="dialog" onClick={openPieces} className="pr-link">
          {t('noneFitsCta')}
          <ArrowRight aria-hidden strokeWidth={1.5} />
        </button>
      </p>
    </div>
  );
}
