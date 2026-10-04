'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowRight,
  Bike,
  Play,
  CalendarCheck,
  ChefHat,
  Globe,
  HandPlatter,
  PhoneIncoming,
  PhoneMissed,
  QrCode,
  Receipt,
  ShoppingBag,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { ToastStack, type Tone, type ToastItem } from '../kit';
import { BEATS, STAGES, itemList, type BeatId, type Channel, type Source, type Stage } from './data';
import { act, isMine, type LineId, type RestaurantEvent, type Ticket } from './story';
import { useSound } from '@/components/sound/SoundContext';
import { useRestaurant } from './context';
import { useRestaurantText } from './text';

/** Bodegón Lucero's mark: the morning star ("lucero") on a plate. */
export function LuceroMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6.4" strokeOpacity={0.45} />
      <path d="M12 7.2 13 11l3.8 1-3.8 1-1 3.8-1-3.8-3.8-1 3.8-1Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Section head: a small-caps rubric + a serif italic title (a menu heading). */
export function ViewHead({ rubric, title, sub, aside, className = '' }: { rubric?: ReactNode; title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={`rl-head ${className}`}>
      <div className="min-w-0">
        {rubric ? <p className="rl-rubric">{rubric}</p> : null}
        <h2 className="rl-title demo-display">{title}</h2>
        {sub ? <p className="rl-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="rl-head-aside">{aside}</div> : null}
    </div>
  );
}

/** A carta line: dish (serif italic) · dotted leader · price (mono); description + `aside` under it. */
export function MenuLine({ name, price, desc, tags, off = false, className = '', aside }: { name: ReactNode; price: ReactNode; desc?: ReactNode; tags?: ReactNode; off?: boolean; className?: string; aside?: ReactNode }) {
  return (
    <div className={`rl-line ${className}`} data-off={off ? '' : undefined}>
      <p className="rl-line-row">
        <span className="rl-line-name">{name}</span>
        {tags}
        <span aria-hidden className="rl-leader" />
        <span className="rl-line-price demo-mono">{price}</span>
      </p>
      {desc || aside ? (
        <div className="rl-line-foot">
          {desc ? <p className="rl-line-desc">{desc}</p> : null}
          {aside}
        </div>
      ) : null}
    </div>
  );
}

export const STAGE_TONE: Record<Stage, Tone> = { new: 'accent', cooking: 'warn', ready: 'accent2', out: 'info' };
export const CHANNEL_ICON: Record<Channel, LucideIcon> = { salon: UtensilsCrossed, delivery: Bike, pickup: ShoppingBag };
export const SOURCE_ICON: Record<Source, LucideIcon> = { qr: QrCode, web: Globe, ai: PhoneIncoming, waiter: HandPlatter };

/** A stage's name; "out" depends on the channel (served · on the way · picked up). */
export function useStageLabel() {
  const { t } = useRestaurantText();
  return (stage: Stage, channel?: Channel) => (stage === 'out' && channel ? t(`stageOut.${channel}`) : t(`stage.${stage}`));
}

/** The ticket's stage as a small stamp. */
export function StageStamp({ stage, channel, className = '' }: { stage: Stage; channel?: Channel; className?: string }) {
  const label = useStageLabel();
  return (
    <span className={`rl-stage ${className}`} data-stage={stage}>
      {label(stage, channel)}
    </span>
  );
}

/** Where a ticket goes: the table, the customer, or the channel. */
export function useTicketWhere() {
  const x = useRestaurantText();
  return (ticket: Ticket) =>
    ticket.channel === 'salon'
      ? x.t('table.label', { n: ticket.table ?? '' })
      : ticket.who
        ? ticket.who === 'you'
          ? x.t('people.you')
          : x.person(ticket.who)
        : x.t(`channel.${ticket.channel}`);
}

/**
 * A kitchen ticket printed on paper: number, channel, items, note, who / table, timer.
 * `variant="mini"` is the one-line strip used on the phone's service view. With `bump`
 * a button moves it to the next stage (what the cook taps on a kitchen display).
 */
export function TicketCard({ ticket, variant = 'board', fresh = false, bump = false, className = '' }: { ticket: Ticket; variant?: 'board' | 'mini'; fresh?: boolean; bump?: boolean; className?: string }) {
  const x = useRestaurantText();
  const { view, store, active } = useRestaurant();
  const { play } = useSound();
  const { t, fmt } = x;
  const stageLabel = useStageLabel();
  const whereOf = useTicketWhere();
  const Channel = CHANNEL_ICON[ticket.channel];
  const Src = SOURCE_ICON[ticket.source];
  const age = Math.max(0, view.clock - ticket.clock);
  const where = whereOf(ticket);
  const items = itemList(ticket.items);
  const label = t('kitchen.ticketLabel', {
    num: ticket.num,
    channel: t(`channel.${ticket.channel}`),
    stage: stageLabel(ticket.stage, ticket.channel),
    items: x.spoken(ticket.items),
  });
  const next = STAGES[STAGES.indexOf(ticket.stage) + 1] as Stage | undefined;

  if (variant === 'mini') {
    return (
      <article className={`rl-ticket rl-ticket-mini ${fresh ? 'rl-fresh' : ''} ${className}`} data-stage={ticket.stage} data-mine={ticket.mine ? '' : undefined} aria-label={label}>
        <p className="rl-ticket-num demo-mono">#{ticket.num}</p>
        <p className="rl-ticket-mini-items">{items.map(([d, n]) => `${n}× ${x.dishShort(d)}`).join(' · ')}</p>
        <Channel aria-hidden className="rl-ticket-mini-icon" strokeWidth={1.7} />
      </article>
    );
  }

  return (
    <article className={`rl-ticket ${fresh ? 'rl-fresh' : ''} ${className}`} data-stage={ticket.stage} data-mine={ticket.mine ? '' : undefined} aria-label={label}>
      <header className="rl-ticket-head">
        <span className="rl-ticket-num demo-mono">#{ticket.num}</span>
        <span className="rl-ticket-age demo-mono" data-late={age >= 15 && ticket.stage !== 'out' ? '' : undefined}>
          {t('kitchen.age', { min: age })}
        </span>
      </header>
      <p className="rl-ticket-meta">
        <Channel aria-hidden strokeWidth={1.8} />
        <span className="truncate">{where}</span>
        <span aria-hidden className="rl-ticket-src">
          <Src strokeWidth={1.8} />
        </span>
      </p>
      <ul className="rl-ticket-items">
        {items.map(([d, n]) => (
          <li key={d}>
            <span className="demo-mono">{n}</span>
            <span className="min-w-0 truncate">{x.dishShort(d)}</span>
          </li>
        ))}
      </ul>
      {ticket.note ? <p className="rl-ticket-note">«{ticket.note}»</p> : null}
      {ticket.gf || ticket.mine ? (
        <p className="rl-ticket-stamps">
          {ticket.gf ? (
            <span className="rl-stamp" data-tone="olive">
              <Wheat aria-hidden strokeWidth={2} />
              {t('kitchen.gf')}
            </span>
          ) : null}
          {ticket.mine ? (
            <span className="rl-stamp" data-tone="wine">
              {t('kitchen.yours')}
            </span>
          ) : null}
        </p>
      ) : null}
      <footer className="rl-ticket-foot demo-mono">
        <span>{fmt.time(ticket.clock)}</span>
        {ticket.eta !== undefined ? <span>{t(ticket.channel === 'delivery' ? 'kitchen.arrives' : 'kitchen.pickupAt', { time: fmt.time(ticket.eta) })}</span> : null}
      </footer>
      {bump && next ? (
        <button
          type="button"
          className="rl-bump"
          data-to={next}
          onClick={() => {
            store.update(act.move(ticket.id, next));
            if (active) play(next === 'out' ? 'success' : 'select');
          }}
          aria-label={t('kitchen.bumpLabel', { num: ticket.num, stage: stageLabel(next, ticket.channel) })}
        >
          <span>{stageLabel(next, ticket.channel)}</span>
          <ArrowRight aria-hidden strokeWidth={2} />
        </button>
      ) : null}
    </article>
  );
}

/**
 * A contextual "Simular: …" button for a beat that is still ahead (same as the SimBar).
 */
export function SimCue({ beat, className = '' }: { beat: BeatId; className?: string }) {
  const ctx = useRestaurant();
  const { t } = useRestaurantText();
  const index = BEATS.findIndex((b) => b.id === beat);
  // Hidden once reached, and while any beat plays (the SimBar shows that one).
  if (index <= ctx.beat || ctx.playing) return null;
  return (
    <button type="button" className={`rl-simcue ${className}`} onClick={() => ctx.playBeat(beat)}>
      <Play aria-hidden strokeWidth={2} />
      <span className="min-w-0">{t('simCue', { label: t(`sim.${beat}`) })}</span>
    </button>
  );
}

/** One phone line's lamp: idle · ringing (blinks) · live · ended · missed. */
export function Lamp({ state, className = '' }: { state: 'idle' | 'ringing' | 'live' | 'ended' | 'missed'; className?: string }) {
  return <span aria-hidden className={`rl-lamp ${state === 'ringing' || state === 'live' ? 'demo-loop' : ''} ${className}`} data-state={state} />;
}

export function lampState(phase: string | undefined): 'idle' | 'ringing' | 'live' | 'ended' | 'missed' {
  return phase === 'ringing' || phase === 'live' || phase === 'ended' || phase === 'missed' ? phase : 'idle';
}

/** The switchboard: three lamps that light up as the lines ring. */
export function LineLamps({ className = '', onPick }: { className?: string; onPick?: (line: LineId) => void }) {
  const { view } = useRestaurant();
  const { t } = useRestaurantText();
  return (
    <span className={`rl-lamps ${className}`}>
      {([1, 2, 3] as LineId[]).map((line) => {
        const call = view.lines[line];
        const state = call && call.start <= view.t ? lampState(call.voice.phase) : 'idle';
        const content = (
          <>
            <Lamp state={state} />
            <span className="demo-mono">{line}</span>
          </>
        );
        const label = t('calls.lampLabel', { n: line, state: t(`calls.state.${state}`) });
        return onPick ? (
          <button key={line} type="button" className="rl-lamp-btn" onClick={() => onPick(line)} aria-label={label}>
            {content}
          </button>
        ) : (
          <span key={line} className="rl-lamp-btn" role="img" aria-label={label}>
            {content}
          </span>
        );
      })}
    </span>
  );
}

const EVENT: Record<RestaurantEvent['kind'], { icon: LucideIcon; tone: Tone }> = {
  ring: { icon: PhoneIncoming, tone: 'accent' },
  aiOrder: { icon: ChefHat, tone: 'accent' },
  aiBooking: { icon: CalendarCheck, tone: 'accent2' },
  aiGf: { icon: Wheat, tone: 'accent2' },
  web: { icon: Globe, tone: 'info' },
  qr: { icon: QrCode, tone: 'neutral' },
  walkIn: { icon: Users, tone: 'neutral' },
  out: { icon: Bike, tone: 'info' },
  bill: { icon: Receipt, tone: 'warn' },
  missed: { icon: PhoneMissed, tone: 'bad' },
  alt: { icon: Sparkles, tone: 'accent2' },
  youOrder: { icon: ShoppingBag, tone: 'accent' },
  youBooking: { icon: CalendarCheck, tone: 'accent' },
  webBooking: { icon: CalendarCheck, tone: 'accent' },
};
export const eventIcon = (kind: RestaurantEvent['kind']) => EVENT[kind];

/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const x = useRestaurantText();
  return (e: RestaurantEvent): string =>
    x.t(e.kind === 'alt' && !e.alt ? 'feed.altSame' : `feed.${e.kind}`, {
      line: e.line ?? '',
      num: e.ticket ?? '',
      table: e.table ?? '',
      people: e.people ?? 0,
      time: e.time !== undefined ? x.fmt.time(e.time) : '',
      day: e.day !== undefined ? x.dayOf(e.day, 'short') : '',
      dish: e.dish ? x.dish(e.dish) : '',
      alt: e.alt ? x.dish(e.alt) : '',
      who: e.who ? x.first(e.who) : '',
    });
}

/** Events worth a toast / an announcement. */
const LOUD: RestaurantEvent['kind'][] = ['aiOrder', 'aiBooking', 'aiGf', 'web', 'missed', 'alt', 'youOrder', 'youBooking', 'webBooking', 'out'];
export const isLoud = (e: RestaurantEvent) => LOUD.includes(e.kind);

export function RestaurantToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const { view, reduced } = useRestaurant();
  const text = useEventText();
  const { t } = useRestaurantText();
  if (reduced) return null;
  const items: ToastItem[] = view.events
    .filter((e) => e.at >= 0 && isLoud(e) && !isMine(e) && view.t - e.at < 3200)
    .slice(-2)
    .map((e) => ({
      id: e.id,
      icon: EVENT[e.kind].icon,
      tone: EVENT[e.kind].tone,
      title: t(`toast.${e.kind}`),
      body: text(e),
      leaving: view.t - e.at >= 2700,
    }));
  return <ToastStack items={items} placement={placement} className="rl-toasts" />;
}

/** One polite announcement of the latest live change (one instance per pair). */
export function Announcer() {
  const { view, announce } = useRestaurant();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...view.events].reverse().find((e) => e.at >= 0 && isLoud(e) && !isMine(e) && view.t - e.at < 2600);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** A perforated paper strip (receipts, tickets). Decorative wrapper. */
export function Paper({ children, className = '', style, as: Tag = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag className={`rl-paper ${className}`} style={style}>
      {children}
    </Tag>
  );
}
