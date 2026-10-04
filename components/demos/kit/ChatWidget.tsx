'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCheck, EllipsisVertical, Mic, Phone, SendHorizontal, Video, type LucideIcon } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { TypingDots } from './primitives';
import './chat.css';

/* ------------------------------------------------------------------ */
/* Engine (pure): a script + the time since the chat started → what shows */
/* ------------------------------------------------------------------ */
export interface ChatReply {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Step to continue with when this reply is chosen (default: the step's `next`). */
  goto?: string;
}

export interface ChatStep {
  from: 'bot' | 'user' | 'note';
  text?: ReactNode;
  /** A result card under the text (booking, product, map…). */
  card?: ReactNode;
  /** Time before it appears. Bot: shown as "typing…" (default 1100 ms); user/note: plain delay. */
  typingMs?: number;
  /** Pause after it, before the next step starts (default 350 ms). */
  pauseMs?: number;
  /** Quick replies the visitor can tap; each may branch with `goto`. */
  replies?: ChatReply[];
  /** Reply picked on its own after `autoMs` (default 2600) unless the visitor already took over. */
  auto?: string;
  autoMs?: number;
  next?: string;
}

export interface ChatScript {
  start: string;
  steps: Record<string, ChatStep>;
}

/** A reply the visitor tapped, stamped with the chat time (ms since the chat started). */
export interface ChatPick {
  reply: string;
  at: number;
}

export interface ChatItem {
  id: string;
  step: string;
  from: 'bot' | 'user' | 'note';
  text?: ReactNode;
  card?: ReactNode;
  /** Chat time it appeared at. */
  at: number;
  replies?: ChatReply[];
  chosen?: string;
}

export interface ChatRun {
  items: ChatItem[];
  /** The bot is typing right now. */
  typing: boolean;
  /** Quick replies waiting for an answer. */
  awaiting: { step: string; replies: ChatReply[] } | null;
  done: boolean;
  /** Chat time each step appeared at (sync other UI to it, e.g. an agenda change). */
  at: Record<string, number>;
  /** Reply chosen per step (tapped or automatic). */
  chosen: Record<string, string>;
  /** The visitor answered at least once (automatic replies are off from then on). */
  manual: boolean;
}

/**
 * Plays `script` up to `elapsed` ms. Pure: call it with the story time so two screens
 * (or a reduced-motion render with `instant`) always agree.
 */
export function runChat(script: ChatScript, elapsed: number, picks: Record<string, ChatPick> = {}, options: { instant?: boolean } = {}): ChatRun {
  const instant = !!options.instant;
  const manual = Object.keys(picks).length > 0;
  const run: ChatRun = { items: [], typing: false, awaiting: null, done: false, at: {}, chosen: {}, manual };
  if (elapsed < 0) return run;
  let clock = 0;
  let id: string | undefined = script.start;
  for (let guard = 0; id && guard < 80; guard++) {
    const step: ChatStep | undefined = script.steps[id];
    if (!step) break;
    const wait = instant ? 0 : (step.typingMs ?? (step.from === 'bot' ? 1100 : step.from === 'note' ? 450 : 900));
    if (elapsed < clock + wait) {
      run.typing = step.from === 'bot' && elapsed >= clock;
      return run;
    }
    clock += wait;
    const item: ChatItem = { id, step: id, from: step.from, text: step.text, card: step.card, at: clock };
    run.items.push(item);
    run.at[id] = clock;

    let nextId: string | undefined = step.next;
    if (step.replies?.length) {
      item.replies = step.replies;
      const pick: ChatPick | undefined = picks[id];
      let chosen: string | undefined;
      let pickedAt = clock;
      if (pick) {
        chosen = pick.reply;
        pickedAt = Math.max(clock, pick.at);
      } else if (step.auto && !manual) {
        const autoAt = clock + (instant ? 0 : (step.autoMs ?? 2600));
        if (elapsed >= autoAt) {
          chosen = step.auto;
          pickedAt = autoAt;
        }
      }
      if (!chosen) {
        run.awaiting = { step: id, replies: step.replies };
        return run;
      }
      const reply: ChatReply | undefined = step.replies.find((r) => r.id === chosen);
      item.chosen = chosen;
      run.chosen[id] = chosen;
      clock = pickedAt;
      run.items.push({ id: `${id}:reply`, step: id, from: 'user', text: reply?.label, at: clock });
      nextId = reply?.goto ?? step.next;
    }
    clock += instant ? 0 : (step.pauseMs ?? 350);
    id = nextId;
  }
  run.done = true;
  return run;
}

/* ------------------------------------------------------------------ */
/* Peek: a collapsed site chat (latest message + quick replies)         */
/* ------------------------------------------------------------------ */
/**
 * The launcher of a site chat with the latest bot message and its quick replies
 * floating above it — the conversation is visible without covering the page.
 */
export function ChatPeek({
  run,
  title,
  avatar,
  onPick,
  onOpen,
  openLabel,
  side = 'right',
  className = '',
}: {
  run: ChatRun;
  title: string;
  avatar: ReactNode;
  onPick?: (step: string, reply: string) => void;
  onOpen: () => void;
  openLabel: string;
  /** Corner the launcher sits in. */
  side?: 'left' | 'right';
  className?: string;
}) {
  const t = useTranslations('demoKit.chat');
  const last = [...run.items].reverse().find((i) => i.from === 'bot');
  return (
    <div className={`demo-chat-peek ${className}`} data-side={side}>
      {last || run.typing ? (
        <div className="demo-chat-peek-card">
          <p className="demo-chat-peek-who">{title}</p>
          <div aria-live="polite">
            {run.typing ? (
              <TypingDots label={t('typingLabel', { name: title })} />
            ) : last ? (
              <div key={last.id} className="demo-chat-peek-text">
                {last.text}
                {last.card ? <div className="demo-msg-card">{last.card}</div> : null}
              </div>
            ) : null}
          </div>
          {run.awaiting && !run.typing ? (
            <div className="demo-chat-peek-replies" role="group" aria-label={t('replies')}>
              {run.awaiting.replies.map((r) => (
                <button key={r.id} type="button" className="demo-chat-chip" onClick={() => onPick?.(run.awaiting!.step, r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <button type="button" className="demo-chat-launcher" onClick={onOpen} aria-label={openLabel}>
        {avatar}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                               */
/* ------------------------------------------------------------------ */
export interface ChatWidgetProps {
  run: ChatRun;
  /** The visitor tapped a quick reply (store it as a ChatPick with the current chat time). */
  onPick?: (step: string, reply: string) => void;
  /** whatsapp: the channel look (overridable --chat-* variables) · widget: a site chat in the theme colors. */
  variant?: 'whatsapp' | 'widget';
  /** Contact / bot name in the header. */
  title: string;
  /** Header status (default "online"; "typing…" while typing). */
  subtitle?: string;
  avatar?: ReactNode;
  /** Timestamp label of a message (chat time → "9:42"). */
  stamp?: (at: number) => string;
  /** Day separator at the top ("Today"). */
  dateLabel?: string;
  /** Accessible name of the conversation. */
  label: string;
  /** Only one instance per showcase should announce new messages. */
  announce?: boolean;
  /** Placeholder of the (decorative) composer; false hides it. */
  composer?: string | false;
  header?: boolean;
  /** buttons: under the bot's bubble (WhatsApp interactive message) · chips: a row above the composer. */
  replyLayout?: 'buttons' | 'chips';
  /** Extra content after the messages (e.g. a "replay" button). */
  footer?: ReactNode;
  className?: string;
}

/**
 * A scripted conversation (WhatsApp or site chat): typing indicator, quick replies
 * that branch, result cards. Feed it `runChat(...)`.
 */
export function ChatWidget({
  run,
  onPick,
  variant = 'widget',
  title,
  subtitle,
  avatar,
  stamp,
  dateLabel,
  label,
  announce = true,
  composer,
  header = true,
  replyLayout,
  footer,
  className = '',
}: ChatWidgetProps) {
  const t = useTranslations('demoKit.chat');
  const log = useRef<HTMLDivElement>(null);
  const layout = replyLayout ?? (variant === 'whatsapp' ? 'buttons' : 'chips');
  const status = run.typing ? t('typing') : (subtitle ?? t('online'));
  const placeholder = composer === undefined ? t('composer') : composer;

  // Keep the newest message in view (inside the device, never the page).
  useLayoutEffect(() => {
    const el = log.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [run.items.length, run.typing, run.awaiting, run.done]);

  const pick = (step: string, reply: string) => onPick?.(step, reply);

  return (
    <section className={`demo-chat ${className}`} data-variant={variant}>
      {header ? (
        <header className="demo-chat-head">
          {avatar ? <span className="demo-chat-avatar">{avatar}</span> : null}
          <span className="min-w-0 flex-1 leading-[1.2]">
            <span className="block truncate text-[0.86em] font-semibold">{title}</span>
            <span className="demo-chat-status block truncate text-[0.68em]" data-typing={run.typing ? '' : undefined}>
              {status}
            </span>
          </span>
          {variant === 'whatsapp' ? (
            <span aria-hidden className="demo-chat-tools">
              <Video strokeWidth={1.7} />
              <Phone strokeWidth={1.7} />
              <EllipsisVertical strokeWidth={1.7} />
            </span>
          ) : null}
        </header>
      ) : null}
      {/* Focusable: the log scrolls, and keyboard users must be able to scroll it too. */}
      <div ref={log} role="log" tabIndex={0} aria-live={announce ? 'polite' : 'off'} aria-label={label} className="demo-chat-log">
        {dateLabel ? <p className="demo-chat-date">{dateLabel}</p> : null}
        {run.items.map((item) => {
          if (item.from === 'note') {
            return (
              <p key={item.id} className="demo-chat-note">
                {item.text}
              </p>
            );
          }
          const out = item.from === 'user';
          return (
            <div key={item.id} className="demo-msg-wrap" data-from={item.from}>
              <div className="demo-msg" data-from={item.from}>
                {item.text ? <div className="demo-msg-text">{item.text}</div> : null}
                {item.card ? <div className="demo-msg-card">{item.card}</div> : null}
                {stamp ? (
                  <p className="demo-msg-meta">
                    <span className="demo-num">{stamp(item.at)}</span>
                    {out ? (
                      <>
                        <CheckCheck aria-hidden className="demo-msg-read" strokeWidth={2.2} />
                        <span className="sr-only">{t('read')}</span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              {layout === 'buttons' && item.replies ? (
                <div className="demo-chat-buttons" role="group" aria-label={t('replies')}>
                  {item.replies.map((r) => {
                    const Icon = r.icon;
                    const open = run.awaiting?.step === item.step;
                    const chosen = item.chosen === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={!open}
                        aria-pressed={chosen}
                        onClick={() => pick(item.step, r.id)}
                        className="demo-chat-button"
                      >
                        {Icon ? <Icon aria-hidden strokeWidth={2} /> : null}
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        {run.typing ? (
          <div className="demo-msg-wrap" data-from="bot">
            <div className="demo-msg demo-msg-typing" data-from="bot">
              <TypingDots label={t('typingLabel', { name: title })} />
            </div>
          </div>
        ) : null}
        {footer}
      </div>
      {layout === 'chips' && run.awaiting ? (
        <div className="demo-chat-chips" role="group" aria-label={t('replies')}>
          {run.awaiting.replies.map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.id} type="button" className="demo-chat-chip" onClick={() => pick(run.awaiting!.step, r.id)}>
                {Icon ? <Icon aria-hidden strokeWidth={2} /> : null}
                {r.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {placeholder ? (
        <div aria-hidden className="demo-chat-composer">
          <span className="demo-chat-input">{placeholder}</span>
          <span className="demo-chat-send">{variant === 'whatsapp' ? <Mic strokeWidth={1.8} /> : <SendHorizontal strokeWidth={1.8} />}</span>
        </div>
      ) : null}
    </section>
  );
}
