'use client';

import { Bars, Donut, Kpi, Legend, type BarDatum } from '../../kit';
import { LOST_AFTER, LOST_BEFORE_WOBBLE, LOST_WEEKS_BEFORE, ORDERS_BY_SLOT, TONIGHT_BASE, TONIGHT_CHANNELS } from '../data';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { ViewHead } from '../ui';

/** Tonight's owner numbers, derived from the story (+ the rubro's average ticket). */
export function useTonight() {
  const { view, ticketUsd } = useRestaurant();
  const s = view.stats;
  const usd = TONIGHT_BASE.orders * ticketUsd + s.usd;
  const story = view.tickets.filter((tk) => tk.placed >= 0);
  const by = (pred: (tk: (typeof story)[number]) => boolean) => story.filter(pred).length;
  return {
    covers: s.covers,
    orders: s.orders,
    avgUsd: usd / Math.max(1, s.orders),
    direct: s.direct,
    calls: s.calls,
    missed: s.missed,
    peak: s.peak,
    bookings: s.bookings,
    channels: {
      salon: TONIGHT_CHANNELS.salon + by((tk) => tk.channel === 'salon'),
      delivery: TONIGHT_CHANNELS.delivery + by((tk) => tk.channel === 'delivery'),
      pickup: TONIGHT_CHANNELS.pickup + by((tk) => tk.channel === 'pickup'),
    },
    /** Orders in the current half hour (21:30 →). */
    rush: story.length,
  };
}

function OrdersByHalfHour() {
  const { t, fmt } = useRestaurantText();
  const n = useTonight();
  const data: BarDatum[] = [...ORDERS_BY_SLOT, n.rush].map((value, i) => ({
    label: fmt.time(20 * 60 + i * 30),
    value,
    tone: i === ORDERS_BY_SLOT.length ? 'accent' : 'neutral',
  }));
  return (
    <figure className="rl-chart">
      <figcaption className="rl-rubric">{t('numbers.byHour.title', { time: fmt.time(20 * 60 + ORDERS_BY_SLOT.length * 30) })}</figcaption>
      <Bars data={data} label={t('numbers.byHour.label')} values="all" height="6.2em" />
    </figure>
  );
}

function LostPerWeek() {
  const { lostPerWeek } = useRestaurant();
  const { t } = useRestaurantText();
  const before = Array.from({ length: LOST_WEEKS_BEFORE }, (_, i) => lostPerWeek + LOST_BEFORE_WOBBLE[i % LOST_BEFORE_WOBBLE.length]);
  const data: BarDatum[] = [
    ...before.map((value, i) => ({ label: t('numbers.lost.week', { n: i + 1 }), value, tone: 'bad' as const })),
    ...LOST_AFTER.map((value, i) => ({ label: t('numbers.lost.week', { n: LOST_WEEKS_BEFORE + i + 1 }), value, tone: 'accent2' as const })),
  ];
  return (
    <figure className="rl-chart">
      <figcaption className="rl-rubric">{t('numbers.lost.title')}</figcaption>
      <Bars data={data} label={t('numbers.lost.label', { before: lostPerWeek })} values="ends" height="6.2em" />
      <p className="rl-chart-note">
        <span data-tone="bad">{t('numbers.lost.before')}</span>
        <span data-tone="olive">{t('numbers.lost.after')}</span>
      </p>
    </figure>
  );
}

function Channels() {
  const { t } = useRestaurantText();
  const n = useTonight();
  const segments = [
    { label: t('channel.salon'), value: n.channels.salon, tone: 'neutral' as const },
    { label: t('channel.delivery'), value: n.channels.delivery, tone: 'accent' as const },
    { label: t('channel.pickup'), value: n.channels.pickup, tone: 'accent2' as const },
  ];
  return (
    <figure className="rl-chart rl-chart-row">
      <Donut segments={segments} label={t('numbers.channels.label')} size="5.4em" center={<span className="demo-mono text-[0.9em]">{n.orders}</span>} />
      <div className="min-w-0 flex-1">
        <figcaption className="rl-rubric">{t('numbers.channels.title')}</figcaption>
        <Legend items={segments.map((s) => ({ ...s, value: s.value }))} />
      </div>
    </figure>
  );
}

export function LaptopNumbers() {
  const x = useRestaurantText();
  const { t } = x;
  const n = useTonight();
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead rubric={t('numbers.rubric')} title={t('numbers.title')} sub={t('numbers.subtitle')} />
      <div className="grid grid-cols-4 gap-[0.6em]">
        <Kpi label={t('numbers.kpis.covers')} value={n.covers} hint={t('numbers.kpis.coversHint')} />
        <Kpi label={t('numbers.kpis.avg')} value={n.avgUsd} format={(v) => x.money(v)} hint={t('numbers.kpis.avgHint')} />
        <Kpi label={t('numbers.kpis.direct')} value={n.direct} hint={t('numbers.kpis.directHint')} />
        <Kpi label={t('numbers.kpis.peak')} value={n.peak} emphasis suffix={t('numbers.kpis.peakSuffix')} hint={t('numbers.kpis.peakHint', { missed: n.missed })} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-[0.9em]">
        <OrdersByHalfHour />
        <LostPerWeek />
      </div>
      <Channels />
    </div>
  );
}

export function PhoneNumbers() {
  const x = useRestaurantText();
  const { t } = x;
  const n = useTonight();
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead rubric={t('numbers.rubric')} title={t('numbers.titleShort')} />
      <div className="grid grid-cols-2 gap-[0.55em]">
        <Kpi label={t('numbers.kpis.peak')} value={n.peak} emphasis suffix={t('numbers.kpis.peakSuffix')} />
        <Kpi label={t('numbers.kpis.covers')} value={n.covers} />
        <Kpi label={t('numbers.kpis.avg')} value={n.avgUsd} format={(v) => x.money(v)} />
        <Kpi label={t('numbers.kpis.direct')} value={n.direct} />
      </div>
      <LostPerWeek />
      <OrdersByHalfHour />
      <Channels />
    </div>
  );
}
