'use client';

import { ArrowRight, QrCode } from 'lucide-react';
import { Readout } from '../../kit';
import { STAGES } from '../data';
import { isStoryFresh, type LineId, type Ticket } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LineLamps, SimCue, TicketCard, useStageLabel } from '../ui';
import { LineCard, LineRow } from './Calls';
import { FloorLegend, FloorMap, useFloorStats } from './Floor';
import { useTonight } from './Numbers';

/** The night's ledger: covers, average ticket, direct orders, calls — a receipt's totals. */
function Ledger({ layout }: { layout: 'row' | 'rows' }) {
  const x = useRestaurantText();
  const { t } = x;
  const n = useTonight();
  const rows: { key: string; value: number; format?: (v: number) => string; emphasis?: boolean }[] = [
    { key: 'covers', value: n.covers },
    { key: 'avg', value: n.avgUsd, format: (v) => x.money(v) },
    { key: 'direct', value: n.direct },
    { key: 'missed', value: n.missed, emphasis: true },
  ];
  return (
    <dl className="rl-ledger" data-layout={layout}>
      {rows.map((r) => (
        <div key={r.key} data-emphasis={r.emphasis ? '' : undefined} data-bad={r.key === 'missed' && r.value > 0 ? '' : undefined}>
          <dt>{t(`service.ledger.${r.key}`)}</dt>
          {layout === 'rows' ? <span aria-hidden className="rl-leader" /> : null}
          <dd className="demo-mono">
            <Readout value={r.value} format={r.format} rollDown={r.key === 'missed'} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Tonight's clock as the big readout of the view. */
function ServiceClock({ size }: { size: 'lg' | 'md' }) {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  return (
    <span className="rl-clock" data-size={size}>
      <span className="rl-clock-time demo-display">{x.fmt.time(view.clock)}</span>
    </span>
  );
}

/** A ticket that the story just printed or moved (never the visitor's own: they see it at once). */
export const ticketFresh = (tk: Ticket, t: number) => (!tk.mine && isStoryFresh(t, tk.placed)) || (!tk.movedByYou && tk.stageAt !== tk.placed && isStoryFresh(t, tk.stageAt, 2200));

/** The tickets still on the pass, as a rail of receipts (newest first), each with its bump button. */
function TicketRail({ limit }: { limit: number }) {
  const { view, go } = useRestaurant();
  const { t } = useRestaurantText();
  const latest = view.board
    .filter((tk) => tk.stage !== 'out')
    .sort((a, b) => b.num - a.num)
    .slice(0, limit);
  return (
    <section className="rl-rail" data-tour="kitchen">
      <header className="rl-section-head">
        <h3 className="rl-rubric">{t('service.rail')}</h3>
        <button type="button" className="rl-linkbtn" onClick={() => go('kitchen')}>
          {t('service.toKitchen')}
          <ArrowRight aria-hidden strokeWidth={1.8} />
        </button>
      </header>
      <div className="rl-rail-list">
        {latest.map((tk) => (
          <TicketCard key={tk.id} ticket={tk} fresh={ticketFresh(tk, view.t)} bump className="rl-rail-ticket" />
        ))}
      </div>
    </section>
  );
}

/** Kitchen at a glance: tickets per stage. */
function StageCounts() {
  const { view, go } = useRestaurant();
  const { t } = useRestaurantText();
  const stage = useStageLabel();
  return (
    <section className="rl-stagecounts" data-tour="kitchen" data-focus="pass">
      <header className="rl-section-head">
        <h3 className="rl-rubric">{t('service.kitchen')}</h3>
        <button type="button" className="rl-linkbtn" onClick={() => go('kitchen')}>
          {t('service.toKitchen')}
          <ArrowRight aria-hidden strokeWidth={1.8} />
        </button>
      </header>
      <ul>
        {STAGES.slice(0, 3).map((s) => (
          <li key={s} data-stage={s}>
            <span className="rl-stagecounts-n demo-mono">
              <Readout value={view.board.filter((tk) => tk.stage === s).length} rollDown />
            </span>
            <span className="rl-stagecounts-l">{stage(s)}</span>
          </li>
        ))}
      </ul>
      <div className="rl-stagecounts-mini">
        {view.board
          .filter((tk) => tk.stage !== 'out')
          .sort((a, b) => b.num - a.num)
          .slice(0, 3)
          .map((tk) => (
            <TicketCard key={tk.id} ticket={tk} variant="mini" fresh={ticketFresh(tk, view.t)} />
          ))}
      </div>
    </section>
  );
}

function SalonGlance({ withMap }: { withMap: boolean }) {
  const { view, go } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const s = useFloorStats();
  // The newest bookings first (the AI's lands on top), then by time.
  const next = [...view.bookings]
    .filter((b) => !b.pending)
    .sort((a, b) => b.at - a.at || a.time - b.time)
    .slice(0, 2);
  return (
    <section className="rl-glance" data-tour="floor">
      <header className="rl-section-head">
        <h3 className="rl-rubric">{t('service.salon')}</h3>
        <button type="button" className="rl-linkbtn" onClick={() => go('floor')}>
          {t('service.toFloor')}
          <ArrowRight aria-hidden strokeWidth={1.8} />
        </button>
      </header>
      {withMap ? (
        <div className="flex items-start gap-[0.7em]">
          <FloorMap mini className="min-w-0 flex-1" />
          <FloorLegend className="w-[8.6em] shrink-0" />
        </div>
      ) : (
        <p className="rl-glance-line">
          <span className="demo-mono">{t('service.tables', { seated: s.seated, total: s.total })}</span>
          <span>{t('service.people', { count: s.people })}</span>
        </p>
      )}
      <ul className="rl-glance-next">
        {next.map((b) => (
          <li key={b.key} className={!b.mine && isStoryFresh(view.t, b.at, 3000) ? 'demo-pop' : ''}>
            <span className="demo-mono">{fmt.time(b.time)}</span>
            <span className="min-w-0 flex-1 truncate">
              {x.person(b.name)} · {t('floor.people', { count: b.people })}
            </span>
            <span className="demo-mono text-[var(--demo-muted)]">{t('table.short', { n: b.table })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Simular: llamada para pedir" / "3 llamadas a la vez" while those beats are ahead. */
function CallCue() {
  const { beat } = useRestaurant();
  return beat < 0 ? <SimCue beat="order" /> : beat < 1 ? <SimCue beat="rush" /> : null;
}

export function LaptopService() {
  const { view } = useRestaurant();
  const x = useRestaurantText();
  const { t } = x;
  return (
    <div className="rl-service" data-screen="laptop">
      <header className="rl-service-head">
        <div className="min-w-0">
          <p className="rl-rubric">{t('service.rubric', { day: x.day() })}</p>
          <h2 className="rl-service-title demo-display">
            {t('service.title')}
            <ServiceClock size="lg" />
          </h2>
        </div>
        <div className="rl-service-live">
          <span className="rl-service-count demo-display">
            <Readout value={view.liveCount} rollDown />
          </span>
          <span className="rl-service-countl">{t('service.live', { count: view.liveCount })}</span>
          <LineLamps />
        </div>
      </header>
      <section className="flex flex-col gap-[0.45em]" data-tour="voice">
        <header className="rl-section-head">
          <h3 className="rl-rubric">{t('service.switchboard')}</h3>
          <CallCue />
        </header>
        <div className="rl-switchboard" data-variant="compact">
          {([1, 2, 3] as LineId[]).map((line) => (
            <LineCard key={line} line={line} variant="compact" />
          ))}
        </div>
      </section>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-[0.9em]" data-focus="pass">
        <TicketRail limit={3} />
        <SalonGlance withMap />
      </div>
      <Ledger layout="row" />
    </div>
  );
}

export function PhoneService() {
  const { view, openCustomer } = useRestaurant();
  const x = useRestaurantText();
  const { t } = x;
  return (
    <div className="rl-service" data-screen="phone">
      <header className="rl-service-head">
        <div className="min-w-0">
          <p className="rl-rubric">{t('service.rubricShort', { day: x.weekday() })}</p>
          <ServiceClock size="md" />
        </div>
        <div className="rl-service-live">
          <span className="rl-service-countl">{t('service.live', { count: view.liveCount })}</span>
          {/* The line rows below open each call: the lamps here are a readout. */}
          <LineLamps />
        </div>
      </header>
      <section className="flex flex-col gap-[0.45em]" data-tour="voice">
        <div className="rl-linerows">
          {([1, 2, 3] as LineId[]).map((line) => (
            <LineRow key={line} line={line} />
          ))}
        </div>
        <CallCue />
      </section>
      <StageCounts />
      <SalonGlance withMap={false} />
      <Ledger layout="rows" />
      <button type="button" className="rl-customer-cta" onClick={() => openCustomer()} aria-haspopup="dialog" data-tour="order">
        <QrCode aria-hidden strokeWidth={1.6} />
        <span className="min-w-0 flex-1 text-left leading-[1.25]">
          <span className="block font-semibold">{t('service.customer')}</span>
          <span className="block text-[0.86em] text-[var(--demo-muted)]">{t('service.customerSub')}</span>
        </span>
        <ArrowRight aria-hidden strokeWidth={1.8} />
      </button>
    </div>
  );
}
