'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AudioLines, CheckCheck, PhoneIncoming, PhoneOff, Sparkles, type LucideIcon } from 'lucide-react';
import { useDemoFormat } from './format';
import './voice.css';

/* ------------------------------------------------------------------ */
/* Engine (pure): a call script + time since it started ringing         */
/* ------------------------------------------------------------------ */
export interface VoiceLine {
  who: 'agent' | 'caller' | 'tool';
  text: string;
  /** Speaking time (the words reveal across it). Default: by word count. */
  ms?: number;
  /** Silence after it. Default 300 ms. */
  gapMs?: number;
  /** Tool lines: an icon for the action (search, calendar…). */
  icon?: LucideIcon;
}

export interface VoiceScript {
  /** Ringing before the AI answers. Default 1800 ms. */
  ringMs?: number;
  lines: VoiceLine[];
  /** Nobody answers (e.g. the AI agent is switched off): rings `ringMs`, then a missed call. */
  missed?: boolean;
}

export interface TimedLine extends VoiceLine {
  index: number;
  /** ms since the call started ringing. */
  start: number;
  ms: number;
}

export interface VoiceState {
  phase: 'idle' | 'ringing' | 'live' | 'ended' | 'missed';
  /** Time since answered (the call timer). */
  talkMs: number;
  /** Lines that started so far. */
  lines: TimedLine[];
  /** The line being spoken (−1 between lines / before / after). */
  current: number;
  speaking: VoiceLine['who'] | null;
  /** ms (since ringing) at which the call ends. */
  endsAt: number;
  /** ms (since ringing) at which each line starts — sync other UI to them. */
  starts: number[];
  elapsed: number;
}

const lineMs = (l: VoiceLine) => l.ms ?? (l.who === 'tool' ? 1000 : Math.max(1300, l.text.split(/\s+/).length * 320));

/** Where a call is at `elapsed` ms after it started ringing (negative = not yet). Pure. */
export function runVoice(script: VoiceScript, elapsed: number, options: { instant?: boolean } = {}): VoiceState {
  const ring = script.ringMs ?? 1800;
  if (script.missed) {
    const at = options.instant ? ring : elapsed;
    const base = { endsAt: ring, starts: [], elapsed: at, talkMs: 0, lines: [], current: -1, speaking: null };
    return { ...base, phase: at < 0 ? 'idle' : at < ring ? 'ringing' : 'missed' };
  }
  const timed: TimedLine[] = [];
  let c = ring;
  script.lines.forEach((l, index) => {
    const ms = lineMs(l);
    timed.push({ ...l, index, start: c, ms });
    c += ms + (l.gapMs ?? 300);
  });
  const endsAt = c + 200;
  const at = options.instant ? endsAt : elapsed;
  const base = { endsAt, starts: timed.map((l) => l.start), elapsed: at };
  if (at < 0) return { ...base, phase: 'idle', talkMs: 0, lines: [], current: -1, speaking: null };
  if (at < ring) return { ...base, phase: 'ringing', talkMs: 0, lines: [], current: -1, speaking: null };
  const lines = timed.filter((l) => l.start <= at);
  const live = at < endsAt;
  const cur = live ? lines.findIndex((l) => at < l.start + l.ms) : -1;
  return {
    ...base,
    phase: live ? 'live' : 'ended',
    talkMs: Math.min(at, endsAt) - ring,
    lines,
    current: cur,
    speaking: cur >= 0 ? lines[cur].who : null,
  };
}

/* ------------------------------------------------------------------ */
/* Waveform: bars that only scale (transform)                            */
/* ------------------------------------------------------------------ */
const BAR_SHAPE = [0.42, 0.7, 0.55, 0.92, 0.6, 0.35, 0.78, 1, 0.66, 0.48, 0.85, 0.58, 0.4, 0.74, 0.95, 0.52, 0.68, 0.38, 0.82, 0.6, 0.45, 0.9, 0.62, 0.5];

export type WaveLevel = 'off' | 'ring' | 'idle' | 'caller' | 'agent';

/** Live audio bars. A loop: it pauses with the demo; static with reduced motion. */
export function Waveform({ level, bars = 28, className = '' }: { level: WaveLevel; bars?: number; className?: string }) {
  return (
    <span aria-hidden className={`demo-wave demo-loop ${className}`} data-level={level}>
      {Array.from({ length: bars }, (_, i) => {
        const h = BAR_SHAPE[i % BAR_SHAPE.length];
        const style = {
          '--h': h,
          '--d': `${0.55 + ((i * 37) % 9) * 0.07}s`,
          '--delay': `${-((i * 53) % 17) * 0.06}s`,
        } as CSSProperties;
        return <span key={i} style={style} />;
      })}
    </span>
  );
}

/** Words of the line being spoken, revealed across `ms` from the moment it mounts. */
function SpokenWords({ text, ms, offset }: { text: string; ms: number; offset: number }) {
  // Captured once: later renders must not re-time the running reveal.
  const [start] = useState(offset);
  const words = text.split(/\s+/);
  const step = ms / Math.max(1, words.length);
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="demo-word" style={{ animationDelay: `${Math.round(i * step - start)}ms` }}>
          {w}{' '}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Call card                                                            */
/* ------------------------------------------------------------------ */
export interface VoiceCallProps {
  state: VoiceState;
  /** Who is calling ("+54 11 5•••-2817", "Nuevo paciente"…). */
  caller: string;
  callerSub?: string;
  /** The AI agent's name ("Recepcionista IA"). */
  agent: string;
  /** Transcript speaker tags. */
  agentTag?: string;
  callerTag?: string;
  /** Shown when the call ends or is missed (booking, order, what was lost…). */
  outcome?: ReactNode;
  /** "Sent by WhatsApp" line under the outcome; false hides it. */
  sent?: string | false;
  variant?: 'full' | 'compact';
  /** Accessible name of the call. */
  label: string;
  /** Only one instance per showcase announces the transcript. */
  announce?: boolean;
  /** Compact: open the full call view. */
  onOpen?: () => void;
  openLabel?: string;
  className?: string;
}

/**
 * An incoming call answered by an AI agent: ringing → timer + live waveform +
 * live transcript (agent / caller / tool actions) → outcome card + "sent by WhatsApp".
 */
export function VoiceCall({
  state,
  caller,
  callerSub,
  agent,
  agentTag,
  callerTag,
  outcome,
  sent,
  variant = 'full',
  label,
  announce = true,
  onOpen,
  openLabel,
  className = '',
}: VoiceCallProps) {
  const t = useTranslations('demoKit.voice');
  const fmt = useDemoFormat();
  const { phase } = state;
  const level: WaveLevel =
    phase === 'ringing' ? 'ring' : phase === 'live' ? (state.speaking === 'agent' ? 'agent' : state.speaking === 'caller' ? 'caller' : 'idle') : 'off';
  const status =
    phase === 'ringing'
      ? t('incoming')
      : phase === 'live'
        ? state.speaking === 'tool'
          ? t('working', { agent })
          : t('answeredBy', { agent })
        : phase === 'ended'
          ? t('ended')
          : phase === 'missed'
            ? t('missed')
            : t('waiting');
  const OrbIcon = phase === 'ended' || phase === 'missed' ? PhoneOff : phase === 'ringing' ? PhoneIncoming : AudioLines;
  const tag = (who: VoiceLine['who']) => (who === 'agent' ? (agentTag ?? agent) : who === 'caller' ? (callerTag ?? t('caller')) : t('action'));
  const compact = variant === 'compact';
  const lines = compact ? state.lines.slice(-1) : state.lines;
  const latest = state.lines[state.lines.length - 1];

  return (
    <section className={`demo-voice ${className}`} data-variant={variant} data-phase={phase} aria-label={label}>
      <header className="demo-voice-head">
        <span className="demo-voice-orb" aria-hidden>
          {phase === 'ringing' || phase === 'live' ? <span className="demo-voice-rings demo-loop" /> : null}
          <OrbIcon strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 leading-[1.2]">
          <span className="demo-voice-caller block truncate">{caller}</span>
          <span className="demo-voice-status block truncate">{callerSub && phase !== 'live' ? `${callerSub} · ${status}` : status}</span>
        </span>
        {phase !== 'idle' ? (
          <span className="demo-voice-timer demo-mono" aria-label={t('duration', { time: fmt.duration(state.talkMs) })}>
            {fmt.duration(state.talkMs)}
          </span>
        ) : null}
      </header>

      <div className="demo-voice-meter">
        <span className="demo-voice-agent">
          <Sparkles aria-hidden strokeWidth={1.8} />
          {agent}
        </span>
        <Waveform level={level} bars={compact ? 30 : 34} />
      </div>

      {lines.length ? (
        <ol className="demo-voice-transcript" aria-live={announce ? 'polite' : 'off'} aria-label={t('transcript')}>
          {lines.map((l) => {
            const Icon = l.icon;
            const speaking = l.index === state.current;
            return (
              <li key={l.index} className="demo-voice-line" data-who={l.who} data-current={speaking ? '' : undefined}>
                {l.who === 'tool' ? (
                  <p className="demo-voice-tool">
                    {Icon ? <Icon aria-hidden strokeWidth={1.8} /> : null}
                    <span>{l.text}</span>
                  </p>
                ) : (
                  <>
                    <span className="demo-voice-tag">{tag(l.who)}</span>
                    <p className="demo-voice-text">
                      {speaking ? <SpokenWords text={l.text} ms={l.ms} offset={state.elapsed - l.start} /> : l.text}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      ) : phase === 'ringing' ? (
        <p className="demo-voice-empty">{t('answering', { agent })}</p>
      ) : null}

      {!compact && (phase === 'ended' || phase === 'missed') && outcome ? (
        <div className="demo-voice-outcome">
          {outcome}
          {sent ? (
            <p className="demo-voice-sent">
              <CheckCheck aria-hidden strokeWidth={2} />
              {sent}
            </p>
          ) : null}
        </div>
      ) : null}

      {compact && onOpen ? (
        <button type="button" className="demo-voice-open" onClick={onOpen}>
          {openLabel ?? t('open')}
        </button>
      ) : null}
      {compact && latest && phase === 'ended' && sent ? (
        <p className="demo-voice-sent">
          <CheckCheck aria-hidden strokeWidth={2} />
          {sent}
        </p>
      ) : null}
    </section>
  );
}
