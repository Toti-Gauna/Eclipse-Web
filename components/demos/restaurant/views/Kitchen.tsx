'use client';

import { ChefHat, Hand } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Kanban, Readout, type KanbanCard } from '../../kit';
import { STAGES, itemList, type Stage } from '../data';
import { act } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { CHANNEL_ICON, STAGE_TONE, SimCue, ViewHead, useTicketWhere } from '../ui';
import { ticketFresh } from './Service';

/**
 * The kitchen display: tickets as paper on four rails (Nuevo → En cocina → Listo → Salió).
 * The visitor is the cook: drag a ticket to the next rail (mouse, or touch by its grip) or
 * use its "Mover" button. Their moves stay (the story only pushes a ticket further along in
 * a later beat). Customers following the order see the new stage.
 */
export function KitchenBoard({ layout = 'columns', className = '' }: { layout?: 'columns' | 'stack'; className?: string }) {
  const { view, store, active } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const { play } = useSound();
  const where = useTicketWhere();
  const order = (a: (typeof view.board)[number], b: (typeof view.board)[number]) =>
    a.stage === 'out' ? b.stageAt - a.stageAt || b.num - a.num : a.clock - b.clock || a.num - b.num;
  const cards: KanbanCard[] = [...view.board].sort(order).map((tk) => {
    const age = Math.max(0, view.clock - tk.clock);
    const items = itemList(tk.items)
      .map(([d, n]) => `${n}× ${x.dishShort(d)}`)
      .join(' · ');
    return {
      id: tk.id,
      column: tk.stage,
      title: `#${tk.num} · ${where(tk)}`,
      sub: tk.note ? `${items} — «${tk.note}»` : items,
      icon: CHANNEL_ICON[tk.channel],
      tone: STAGE_TONE[tk.stage],
      fresh: ticketFresh(tk, view.t),
      meta: (
        <span className="rl-kds-meta">
          <span className="demo-mono" data-late={age >= 15 && tk.stage !== 'out' ? '' : undefined}>
            {tk.stage === 'out' ? fmt.time(tk.clock) : t('kitchen.age', { min: age })}
          </span>
          {tk.mine ? <span className="rl-kds-tag">{t('kitchen.yoursShort')}</span> : tk.gf ? <span className="rl-kds-tag" data-tone="olive">{t('kitchen.gfShort')}</span> : null}
        </span>
      ),
    };
  });
  return (
    <Kanban
      className={`rl-kds ${className}`}
      layout={layout}
      label={t('kitchen.boardLabel')}
      empty={t('kitchen.empty')}
      columns={STAGES.map((s) => ({ id: s, title: t(`kitchen.cols.${s}`), tone: STAGE_TONE[s] }))}
      cards={cards}
      onMove={(id, column) => {
        store.update(act.move(id, column as Stage));
        if (active) play(column === 'out' ? 'success' : 'select');
      }}
    />
  );
}

function useKitchenStats() {
  const { view } = useRestaurant();
  const cooking = view.board.filter((tk) => tk.stage === 'cooking').length;
  const late = view.board.filter((tk) => view.clock - tk.clock >= 15 && tk.stage !== 'out').length;
  return { cooking, late, orders: view.stats.orders };
}

function KitchenHint() {
  const { t } = useRestaurantText();
  return (
    <p className="rl-footnote">
      <Hand aria-hidden strokeWidth={1.7} />
      {t('kitchen.hint')}
    </p>
  );
}

export function LaptopKitchen() {
  const { t } = useRestaurantText();
  const { beat } = useRestaurant();
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
      <div className="flex flex-wrap items-center justify-between gap-[0.5em]">
        <KitchenHint />
        {beat < 0 ? <SimCue beat="order" /> : null}
      </div>
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
      <KitchenHint />
      <KitchenBoard layout="stack" />
      <p className="rl-footnote">
        <ChefHat aria-hidden strokeWidth={1.7} />
        {t('kitchen.footnote')}
      </p>
    </div>
  );
}
