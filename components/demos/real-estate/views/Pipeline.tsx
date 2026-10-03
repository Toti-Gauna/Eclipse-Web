'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { STAGES, listingById } from '../data';
import { useEstate } from '../context';
import { useEstateText, ViewHead } from '../ui';
import { PipelineBoard } from './Today';

/** Per stage: how many leads and the value of the homes they are after. */
function StageLedger() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  const compact = useMemo(() => new Intl.NumberFormat(x.fmt.tag, { notation: 'compact', maximumFractionDigits: 1 }), [x.fmt.tag]);
  return (
    <dl className="re-stages">
      {STAGES.map((s) => {
        const cards = view.cards.filter((c) => c.column === s && c.note !== 'lost');
        const value = cards.reduce((sum, c) => sum + listingById(c.listing).price, 0);
        return (
          <div key={s} className="re-stages-cell" data-stage={s}>
            <dt className="re-label">{t(`stages.${s}`)}</dt>
            <dd className="re-stages-n demo-display">{cards.length}</dd>
            <dd className="re-stages-v demo-num">{t('pipeline.value', { amount: compact.format(value) })}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function PhonePipeline() {
  const t = useTranslations('demoRealEstate.pipeline');
  return (
    <div className="flex flex-col gap-[0.9em] pt-[0.3em]">
      <ViewHead title={t('title')} sub={t('note')} />
      <StageLedger />
      <PipelineBoard layout="stack" />
    </div>
  );
}

export function LaptopPipeline() {
  const t = useTranslations('demoRealEstate.pipeline');
  return (
    <div className="flex flex-col gap-[1em]">
      <ViewHead title={t('title')} sub={t('note')} aside={<StageLedger />} />
      <PipelineBoard className="re-kanban-full" />
    </div>
  );
}
