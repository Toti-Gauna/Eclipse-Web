'use client';

import { useId } from 'react';
import { useSound } from '@/components/sound/SoundContext';
import { Bike, CalendarCheck, CheckCheck, ChevronRight, Info, PhoneMissed, ShoppingBag, Wheat } from 'lucide-react';
import { Kpi, Switch, VoiceCall, Waveform } from '../../kit';
import { AI_BOOKING } from '../data';
import { act, isOffNow, type CallPlan, type LineId } from '../story';
import { useRestaurant } from '../context';
import { useCallScripts } from '../scripts';
import { useRestaurantText } from '../text';
import { Lamp, LineLamps, SimCue, ViewHead, lampState } from '../ui';

/** What the call produced (inside the full card, under the transcript). */
export function CallOutcome({ call }: { call: CallPlan }) {
  const x = useRestaurantText();
  const { t, fmt } = x;
  if (call.missed) {
    return (
      <p className="rl-outcome" data-tone="bad">
        <PhoneMissed aria-hidden strokeWidth={1.8} />
        <span>
          <b>{t('calls.outcome.missed')}</b>
          <span className="block">{t(`calls.outcome.lost.${call.kind}`)}</span>
        </span>
      </p>
    );
  }
  if (call.kind === 'booking') {
    return call.table ? (
      <p className="rl-outcome" data-tone="olive">
        <CalendarCheck aria-hidden strokeWidth={1.8} />
        <span>
          <b>{t('calls.outcome.booking', { table: call.table, time: fmt.time(AI_BOOKING.time), people: AI_BOOKING.people })}</b>
          <span className="block">{x.person('ramiro')}</span>
        </span>
      </p>
    ) : (
      <p className="rl-outcome">
        <Info aria-hidden strokeWidth={1.8} />
        <b>{t('calls.outcome.waitlist')}</b>
      </p>
    );
  }
  const items = call.items ?? {};
  if (!Object.keys(items).length) {
    return (
      <p className="rl-outcome">
        <Info aria-hidden strokeWidth={1.8} />
        <b>{t('calls.outcome.none')}</b>
      </p>
    );
  }
  const delivery = call.kind === 'order';
  const Icon = call.kind === 'gf' ? Wheat : delivery ? Bike : ShoppingBag;
  return (
    <p className="rl-outcome" data-tone={call.kind === 'gf' ? 'olive' : 'wine'}>
      <Icon aria-hidden strokeWidth={1.8} />
      <span className="min-w-0">
        <b>
          {t(delivery ? 'calls.outcome.delivery' : 'calls.outcome.pickup', {
            num: call.ticket ?? '',
            time: call.eta !== undefined ? fmt.time(call.eta) : '',
          })}
        </b>
        <span className="block">
          {x.spoken(items)} · <span className="demo-mono">{x.cash(x.sum(items))}</span>
        </span>
      </span>
    </p>
  );
}

/**
 * One phone line: a strip (line number, lamp, what the call is about) over the kit's
 * VoiceCall (ringing → live transcript → outcome + WhatsApp). Idle before it rings.
 */
export function LineCard({
  line,
  variant = 'full',
  announce = false,
  maxLines,
  onOpen,
  className = '',
}: {
  line: LineId;
  variant?: 'full' | 'compact';
  announce?: boolean;
  /** Full card in a fixed height: only the latest lines (a teleprompter), fewer once the outcome shows. */
  maxLines?: number;
  onOpen?: () => void;
  className?: string;
}) {
  const { view, reduced } = useRestaurant();
  const scripts = useCallScripts();
  const { t } = useRestaurantText();
  const call = view.lines[line];
  const started = !!call && call.start <= view.t;
  const full = call ? scripts.display(call, view.t, reduced) : null;
  const keep = full && maxLines ? (full.phase === 'ended' || full.phase === 'missed' ? maxLines - 1 : maxLines) : 0;
  // While a tool runs (menu / floor check) the header keeps saying who answers: the kit's
  // generic "checking the agenda" doesn't fit a carta lookup; the tool line shows what it does.
  const shown = full && full.speaking === 'tool' ? { ...full, speaking: null } : full;
  const state = shown && keep ? { ...shown, lines: shown.lines.slice(-keep) } : shown;
  const phase = started ? lampState(state?.phase) : 'idle';
  const topic = call ? t(`calls.topic.${call.kind}`) : '';

  return (
    <div className={`rl-linecard ${className}`} data-phase={phase} data-variant={variant}>
      <p className="rl-linecard-strip">
        <Lamp state={phase} />
        <span className="demo-mono rl-linecard-n">{t('calls.line', { n: line })}</span>
        <span className="truncate">{started ? topic : t('calls.idle')}</span>
      </p>
      {call && state && started ? (
        <VoiceCall
          state={state}
          caller={scripts.caller(call, state).name}
          callerSub={scripts.caller(call, state).sub}
          agent={call.missed ? t('calls.counter') : t('calls.agent')}
          agentTag={t('calls.agentTag')}
          callerTag={t('calls.callerTag')}
          label={t('calls.label', { n: line })}
          announce={announce}
          outcome={<CallOutcome call={call} />}
          sent={call.missed || (call.kind === 'booking' && !call.table) ? false : t(`calls.sent.${call.kind}`)}
          variant={variant}
          onOpen={onOpen}
          openLabel={t('calls.open')}
          className="rl-voice"
        />
      ) : null}
      {call && started && variant === 'compact' && call.missed && phase === 'missed' ? (
        <p className="rl-linecard-lost">
          <PhoneMissed aria-hidden strokeWidth={1.8} />
          {t(`calls.outcome.lost.${call.kind}`)}
        </p>
      ) : null}
      {call && state && started ? null : (
        <div className="rl-linecard-idle">
          <span className="demo-mono">{t('calls.waiting')}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The phone's switchboard row: one line in one glance (lamp, caller, what's being said
 * right now or how it ended). Opens the full call.
 */
export function LineRow({ line }: { line: LineId }) {
  const { view, reduced, go } = useRestaurant();
  const scripts = useCallScripts();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const call = view.lines[line];
  const started = !!call && call.start <= view.t;
  const state = call && started ? scripts.display(call, view.t, reduced) : null;
  const phase = started ? lampState(state?.phase) : 'idle';
  const who = call && state ? scripts.caller(call, state) : null;
  const last = state?.lines[state.lines.length - 1];
  const said = last ? (last.who === 'tool' ? last.text : `${last.who === 'agent' ? t('calls.agentTag') : t('calls.callerTag')}: ${last.text}`) : phase === 'ringing' ? t(call?.missed ? 'calls.ringingCounter' : 'calls.ringingNow') : t('calls.waiting');
  const level = phase === 'ringing' ? 'ring' : phase === 'live' ? (state?.speaking === 'agent' ? 'agent' : state?.speaking === 'caller' ? 'caller' : 'idle') : 'off';
  let done: string | null = null;
  if (call && (phase === 'ended' || phase === 'missed')) {
    if (call.missed) done = t('calls.outcome.missed');
    else if (call.kind === 'booking') done = call.table ? t('calls.outcome.booking', { table: call.table, time: fmt.time(AI_BOOKING.time), people: AI_BOOKING.people }) : t('calls.outcome.waitlist');
    else if (call.items && Object.keys(call.items).length) done = t(call.kind === 'order' ? 'calls.outcome.delivery' : 'calls.outcome.pickup', { num: call.ticket ?? '', time: call.eta !== undefined ? fmt.time(call.eta) : '' });
    else done = t('calls.outcome.none');
  }
  return (
    <button type="button" className="rl-linerow" data-phase={phase} onClick={() => go('phone', line)} aria-label={`${t('calls.line', { n: line })}: ${t(`calls.state.${phase}`)}. ${t('calls.open')}`}>
      <span className="rl-linerow-n">
        <Lamp state={phase} />
        <span className="demo-mono">{t('calls.lineShort', { n: line })}</span>
      </span>
      <span className="rl-linerow-main">
        <span className="rl-linerow-top">
          <span className="truncate font-semibold">{who ? who.name : t('calls.idle')}</span>
          <span className="rl-linerow-topic truncate">{started && call ? t(`calls.topic.${call.kind}`) : ''}</span>
          {state && phase !== 'idle' ? <span className="demo-mono rl-linerow-time">{fmt.duration(state.talkMs)}</span> : null}
        </span>
        {done ? (
          <span className="rl-linerow-done" data-missed={call?.missed ? '' : undefined}>
            {call?.missed ? <PhoneMissed aria-hidden strokeWidth={2} /> : <CheckCheck aria-hidden strokeWidth={2} />}
            <span className="truncate">{done}</span>
          </span>
        ) : (
          <span className="rl-linerow-said">
            {phase === 'ringing' || phase === 'live' ? <Waveform level={level} bars={12} className="rl-linerow-wave" /> : null}
            <span className="truncate">{said}</span>
          </span>
        )}
      </span>
      <ChevronRight aria-hidden className="rl-linerow-go" strokeWidth={1.8} />
    </button>
  );
}

function AiSwitch({ compact = false }: { compact?: boolean }) {
  const { state, store, active } = useRestaurant();
  const { t } = useRestaurantText();
  const { play } = useSound();
  const id = useId();
  const on = !isOffNow(state.aiOff);
  return (
    <div className="rl-switchrow" data-off={on ? undefined : ''} data-compact={compact ? '' : undefined}>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span id={`${id}-l`} className="block text-[0.76em] font-semibold">
          {t('phone.switch')}
        </span>
        <span id={`${id}-d`} className="block text-[0.64em] text-[var(--demo-muted)]">
          {on ? t('phone.switchOn') : t('phone.switchOff')}
        </span>
      </span>
      <Switch
        checked={on}
        labelledBy={`${id}-l`}
        describedBy={`${id}-d`}
        onChange={() => {
          store.update(act.toggleAi());
          if (active) play('toggle');
        }}
      />
    </div>
  );
}

/** The call beats still ahead, as buttons ("Simular: llamada para pedir", "… 3 llamadas a la vez"). */
function CallCues() {
  const { beat } = useRestaurant();
  if (beat >= 1) return null;
  return (
    <div className="flex flex-wrap gap-[0.45em]">
      {beat < 0 ? <SimCue beat="order" /> : null}
      <SimCue beat="rush" />
    </div>
  );
}

function useCallStats() {
  const { view } = useRestaurant();
  return { calls: view.stats.calls, live: view.liveCount, peak: view.stats.peak, missed: view.stats.missed };
}

/** Tonight's call log: the live lines first, then the earlier calls. */
function CallLog({ limit = 6 }: { limit?: number }) {
  const { view } = useRestaurant();
  const { t, fmt } = useRestaurantText();
  const rows = [...view.calls]
    .filter((c) => c.start <= view.t)
    .sort((a, b) => b.start - a.start)
    .map((c) => ({
      id: c.id,
      time: fmt.time(view.clock - Math.max(0, Math.floor((view.t - c.start) / 2000))),
      line: c.line,
      topic: t(`calls.topic.${c.kind}`),
      state: lampState(c.voice.phase),
    }));
  const earlier = (['ea', 'eb', 'ec'] as const).map((k, i) => ({ id: k, time: fmt.time(21 * 60 + 24 - i * 7), line: ((i % 3) + 1) as LineId, topic: t(`phone.earlier.${k}`), state: 'ended' as const }));
  return (
    <div className="rl-log">
      <h3 className="rl-rubric">{t('phone.logTitle')}</h3>
      <ol>
        {[...rows, ...earlier].slice(0, limit).map((r) => (
          <li key={r.id} className={r.state === 'ringing' || r.state === 'live' ? 'demo-pop' : ''}>
            <span className="demo-mono rl-log-time">{r.time}</span>
            <Lamp state={r.state} />
            <span className="demo-mono rl-log-line">{t('calls.lineShort', { n: r.line })}</span>
            <span className="min-w-0 flex-1 truncate">{r.topic}</span>
            <span className="rl-log-state" data-state={r.state}>
              {t(`calls.state.${r.state}`)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PhoneCalls() {
  const { focusLine, go, announce } = useRestaurant();
  const { t } = useRestaurantText();
  const s = useCallStats();
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead rubric={t('phone.rubric')} title={t('phone.title')} />
      <div className="rl-linepick" role="group" aria-label={t('phone.pick')}>
        <LineLamps onPick={(line) => go('phone', line)} />
        <span className="rl-linepick-live demo-mono" aria-live="off">
          {t('phone.liveNow', { count: s.live })}
        </span>
      </div>
      <div data-tour="voice">
        <LineCard key={focusLine} line={focusLine} announce={announce} />
      </div>
      <CallCues />
      <AiSwitch />
      <div className="grid grid-cols-2 gap-[0.55em]">
        <Kpi label={t('phone.kpis.calls')} value={s.calls} />
        <Kpi label={t('phone.kpis.peak')} value={s.peak} suffix={t('phone.kpis.peakSuffix')} />
      </div>
      <CallLog limit={5} />
    </div>
  );
}

export function LaptopCalls() {
  const { announce } = useRestaurant();
  const { t } = useRestaurantText();
  const s = useCallStats();
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead
        rubric={t('phone.rubric')}
        title={t('phone.title')}
        sub={t('phone.subtitle')}
        aside={
          <div className="w-[16em]">
            <AiSwitch />
          </div>
        }
      />
      <div className="grid grid-cols-4 gap-[0.6em]">
        <Kpi label={t('phone.kpis.live')} value={s.live} emphasis hint={t('phone.kpis.liveHint')} />
        <Kpi label={t('phone.kpis.calls')} value={s.calls} hint={t('phone.kpis.callsHint')} />
        <Kpi label={t('phone.kpis.peak')} value={s.peak} suffix={t('phone.kpis.peakSuffix')} hint={t('phone.kpis.peakHint')} />
        <Kpi label={t('phone.kpis.missed')} value={s.missed} hint={s.missed ? t('phone.kpis.missedHintOff') : t('phone.kpis.missedHint')} />
      </div>
      <CallCues />
      <div className="rl-switchboard" data-tour="voice">
        {([1, 2, 3] as LineId[]).map((line) => (
          <LineCard key={line} line={line} announce={announce && line === 1} maxLines={4} />
        ))}
      </div>
      <p className="rl-footnote">{t('phone.footnote')}</p>
    </div>
  );
}
