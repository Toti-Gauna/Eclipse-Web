'use client';

import { ArrowRight, QrCode } from 'lucide-react';
import { Readout } from '../../kit';
import { BOARD_STAGES } from '../data';
import type { LineId } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LineLamps, TicketCard } from '../ui';
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

/** The newest tickets, as a rail of receipts (newest first). */
function TicketRail({ limit }: { limit: number }) {
  const { view, go } = useRestaurant();
  const { t } = useRestaurantText();
  const latest = [...view.board].sort((a, b) => b.placed - a.placed || b.num - a.num).slice(0, limit);
  return (
    <section className="rl-rail">
      <header className="rl-section-head">
        <h3 className="rl-rubric">{t('service.rail')}</h3>
        <button type="button" className="rl-linkbtn" onClick={() => go('kitchen')}>
          {t('service.toKitchen')}
          <ArrowRight aria-hidden strokeWidth={1.8} />
        </button>
      </header>
      <div className="rl-rail-list">
        {latest.map((tk) => (
          <TicketCard key={tk.id} ticket={tk} fresh={tk.placed >= 0 && view.t - tk.placed < 2400} className="rl-rail-ticket" />
        ))}
      </div>
    </section>
  );
}

/** Kitchen at a glance: tickets per stage. */
function StageCounts() {
  const { view, go } = useRestaurant();
  const { t } = useRestaurantText();
  return (
    <section className="rl-stagecounts">
      <header className="rl-section-head">
        <h3 className="rl-rubric">{t('service.kitchen')}</h3>
        <button type="button" className="rl-linkbtn" onClick={() => go('kitchen')}>
          {t('service.toKitchen')}
          <ArrowRight aria-hidden strokeWidth={1.8} />
        </button>
      </header>
      <ul>
        {BOARD_STAGES.map((stage) => (
          <li key={stage} data-stage={stage}>
            <span className="rl-stagecounts-n demo-mono">
              <Readout value={view.board.filter((tk) => tk.stage === stage).length} rollDown />
            </span>
            <span className="rl-stagecounts-l">{t(`stage.${stage}`)}</span>
          </li>
        ))}
      </ul>
      <div className="rl-stagecounts-mini">
        {[...view.board]
          .sort((a, b) => b.placed - a.placed || b.num - a.num)
          .slice(0, 3)
          .map((tk) => (
            <TicketCard key={tk.id} ticket={tk} variant="mini" fresh={tk.placed >= 0 && view.t - tk.placed < 2400} />
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
    <section className="rl-glance">
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
          <li key={b.key} className={b.at >= 0 && view.t - b.at < 3000 ? 'demo-pop' : ''}>
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
      <div className="rl-switchboard" data-variant="compact">
        {([1, 2, 3] as LineId[]).map((line) => (
          <LineCard key={line} line={line} variant="compact" />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-[0.9em]">
        <TicketRail limit={3} />
        <SalonGlance withMap />
      </div>
      <Ledger layout="row" />
    </div>
  );
}

export function PhoneService() {
  const { view, go, openCustomer } = useRestaurant();
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
          <LineLamps onPick={(line) => go('phone', line)} />
        </div>
      </header>
      <div className="rl-linerows">
        {([1, 2, 3] as LineId[]).map((line) => (
          <LineRow key={line} line={line} />
        ))}
      </div>
      <StageCounts />
      <SalonGlance withMap={false} />
      <Ledger layout="rows" />
      <button type="button" className="rl-customer-cta" onClick={() => openCustomer('menu')} aria-haspopup="dialog">
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
