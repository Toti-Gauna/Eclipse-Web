'use client';

import { useCurrency } from '@/components/providers/CurrencyProvider';
import type { ApiPlanRequest } from '@/lib/api/types';
import { itemById, l, maintenanceById, planById, verticalById } from '@/lib/content';
import { annualMonthsCharged } from '@/lib/content';
import { useLive } from './hooks';

/** Name of a plan/item/maintenance id from the commercial content; falls back to the id. */
export function useNames() {
  const { locale } = useLive();
  return {
    line: (id: string, kind: 'plan' | 'item') => {
      const entity = kind === 'plan' ? planById(id) : itemById(id);
      return entity ? l(entity.name, locale) : id;
    },
    maintenance: (id: string | null) => {
      const m = maintenanceById(id);
      return m ? l(m.name, locale) : null;
    },
    vertical: (id: string | null) => {
      const v = verticalById(id);
      return v ? l(v.name, locale) : null;
    },
  };
}

/** Status in words, never by color alone. */
export function StatusTag({ status }: { status: ApiPlanRequest['status'] }) {
  const { t } = useLive();
  const tone = status === 'accepted' || status === 'reviewed' ? '' : status === 'submitted' || status === 'under_review' ? 'pt-tag-attn' : 'pt-tag-out';
  return <span className={`pt-tag ${tone}`}>{t(`requests.status.${status}`)}</span>;
}

/**
 * What the team stored: the provisional estimate the SERVER calculated from its catalog (the
 * browser never sends a price). Amounts are USD cents; shown in the visitor's currency with
 * the same "≈" convention as the builder. One-time total apart from what repeats.
 */
export function EstimateLedger({ request }: { request: ApiPlanRequest }) {
  const { t } = useLive();
  const { format } = useCurrency();
  const names = useNames();
  const e = request.estimate;
  const usd = (cents: number) => format(cents / 100);
  const m = e.maintenance;
  const maintenanceName = names.maintenance(m.id);
  const range = request.selection.planId && e.rangeCents && e.rangeCents.to > e.rangeCents.from ? e.rangeCents : null;
  const months = 12 - annualMonthsCharged;

  return (
    <div className="lv-ledger">
      <p className="label">{t('requests.estimateLabel')}</p>
      <ul className="lv-led-lines">
        {e.lines.map((line) => (
          <li key={`${line.kind}-${line.id}`} className="lv-led-line">
            <span className="lv-led-name">{line.kind === 'plan' ? t('requests.packageHead', { plan: names.line(line.id, 'plan') }) : names.line(line.id, 'item')}</span>
            <span aria-hidden className="leader" />
            <span className="lv-led-amount readout">
              {line.kind === 'plan' ? <span className="lv-led-from">{t('requests.from')} </span> : null}
              {usd(line.priceCents)}
            </span>
          </li>
        ))}
        {e.founderDiscountCents > 0 ? (
          <li className="lv-led-line lv-led-discount">
            <span className="lv-led-name">{t('requests.founder')}</span>
            <span aria-hidden className="leader" />
            <span className="lv-led-amount readout">{`− ${usd(e.founderDiscountCents)}`}</span>
          </li>
        ) : null}
      </ul>
      <p className="lv-led-total">
        <span>{t('requests.total')}</span>
        <span aria-hidden className="leader" />
        <span className="lv-led-sum readout">
          {request.selection.planId ? <span className="lv-led-from">{t('requests.from')} </span> : null}
          {usd(e.totalCents)}
        </span>
      </p>
      {range ? <p className="pt-fine">{t('requests.range', { to: usd(range.to) })}</p> : null}
      {m.id && maintenanceName ? (
        <p className="pt-fine">
          {m.billing === 'annual'
            ? t('requests.maintenanceYear', { name: maintenanceName, price: usd(m.periodCents), months })
            : t('requests.maintenanceMonth', { name: maintenanceName, price: usd(m.monthlyCents) })}
        </p>
      ) : (
        <p className="pt-fine">{t('requests.maintenanceNone')}</p>
      )}
      {m.voiceUsageMonthlyCents > 0 ? <p className="pt-fine">{t('requests.voiceUsage', { price: usd(m.voiceUsageMonthlyCents) })}</p> : null}
      <p className="pt-fine">{t('requests.estimateNote')}</p>
    </div>
  );
}
