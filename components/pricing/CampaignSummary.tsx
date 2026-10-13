'use client';

import { useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { bonusMonths, campaignSelection } from '@/lib/campaign';
import type { Quote } from '@/lib/pricing';

/** All commercial surfaces use the same quote and explain when its amounts apply. */
export function CampaignSummary({ quote: q }: { quote: Quote }) {
  const t = useTranslations('campaign');
  const { format } = useCurrency();
  const campaign = campaignSelection(
    q.plan?.id,
    q.lines.filter((l) => l.kind === 'item').map((l) => l.id),
  );
  if (!campaign) return <p className="pr-panel-meta">{t('outside')}</p>;
  const months = bonusMonths(q.plan?.id, q.maintenance.plan?.id);
  const cents = Math.round(q.totalUsd * 100);
  return (
    <div className="campaign-summary">
      <p className="label">{t('label')}</p>
      <dl>
        <div>
          <dt>{t('total')}</dt>
          <dd>{format(cents / 100)}</dd>
        </div>
        <div>
          <dt>{t('deposit')}</dt>
          <dd>{format(Math.ceil(cents / 2) / 100)}</dd>
        </div>
        <div>
          <dt>{t('balance')}</dt>
          <dd>{format(Math.floor(cents / 2) / 100)}</dd>
        </div>
        <div>
          <dt>{t('monthly')}</dt>
          <dd>{q.maintenance.plan ? `${format(q.maintenance.monthlyUsd)} ${t('perMonth')}` : t('unselected')}</dd>
        </div>
      </dl>
      <p>{t(months ? 'bonus' : 'activation')}</p>
      <p>{t('externals')}</p>
      <p>{t('scope')}</p>
      <p>{t('noDebit')}</p>
    </div>
  );
}
