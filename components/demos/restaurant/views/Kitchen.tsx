'use client';

import { useRef } from 'react';
import { ChefHat } from 'lucide-react';
import { Readout, useFlip } from '../../kit';
import { BOARD_STAGES } from '../data';
import type { Ticket } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { TicketCard, ViewHead } from '../ui';

const isFreshTicket = (tk: Ticket, t: number) => tk.stageAt >= 0 && t - tk.stageAt < 2200;

/** Tickets per stage, oldest first (the kitchen works top-down). */
function useColumns() {
  const { view } = useRestaurant();
  return BOARD_STAGES.map((stage) => ({ stage, tickets: view.board.filter((tk) => tk.stage === stage).sort((a, b) => a.clock - b.clock || a.num - b.num) }));
}

/** The kitchen display: tickets slide Nuevo → En cocina → Listo → En camino (FLIP). */
export function KitchenBoard({ layout = 'columns', className = '' }: { layout?: 'columns' | 'stack'; className?: string }) {
  const { view } = useRestaurant();
  const { t } = useRestaurantText();
  const cols = useColumns();
  const ref = useRef<HTMLDivElement>(null);
  useFlip(ref, view.board.map((tk) => `${tk.id}:${tk.stage}`).join('|'));
  return (
    <div ref={ref} className={`rl-board ${className}`} data-layout={layout}>
      {cols.map(({ stage, tickets }) => (
        <section key={stage} className="rl-board-col" data-stage={stage} aria-label={`${t(`stage.${stage}`)}: ${tickets.length}`}>
          <h3 className="rl-board-head">
            <span aria-hidden className="rl-board-dot" />
            <span className="flex-1">{t(`stage.${stage}`)}</span>
            <Readout value={tickets.length} rollDown className="demo-mono" />
          </h3>
          <div className="rl-board-list">
            {tickets.map((tk) => (
              <div key={tk.id} data-flip={tk.id} className="rl-board-item">
                <TicketCard ticket={tk} fresh={isFreshTicket(tk, view.t)} />
              </div>
            ))}
            {!tickets.length ? <p className="rl-board-empty">{t('kitchen.empty')}</p> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function useKitchenStats() {
  const { view } = useRestaurant();
  const cooking = view.board.filter((tk) => tk.stage === 'cooking').length;
  const waiting = view.board.filter((tk) => tk.stage === 'new').length;
  const late = view.board.filter((tk) => view.clock - tk.clock >= 15 && tk.stage !== 'out').length;
  return { cooking, waiting, late, orders: view.stats.orders };
}

export function LaptopKitchen() {
  const { t } = useRestaurantText();
  const s = useKitchenStats();
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead
        rubric={t('kitchen.rubric')}
        title={t('kitchen.title')}
        sub={t('kitchen.subtitle')}
        aside={
          <dl className="rl-readouts">
            <div>
              <dt>{t('kitchen.stats.cooking')}</dt>
              <dd className="demo-mono">
                <Readout value={s.cooking} rollDown />
              </dd>
            </div>
            <div>
              <dt>{t('kitchen.stats.orders')}</dt>
              <dd className="demo-mono">
                <Readout value={s.orders} />
              </dd>
            </div>
            <div>
              <dt>{t('kitchen.stats.late')}</dt>
              <dd className="demo-mono" data-late={s.late ? '' : undefined}>
                <Readout value={s.late} rollDown />
              </dd>
            </div>
          </dl>
        }
      />
      <KitchenBoard />
      <p className="rl-footnote">
        <ChefHat aria-hidden strokeWidth={1.7} />
        {t('kitchen.footnote')}
      </p>
    </div>
  );
}

export function PhoneKitchen() {
  const { t } = useRestaurantText();
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead rubric={t('kitchen.rubric')} title={t('kitchen.title')} />
      <KitchenBoard layout="stack" />
      <p className="rl-footnote">
        <ChefHat aria-hidden strokeWidth={1.7} />
        {t('kitchen.footnote')}
      </p>
    </div>
  );
}
