'use client';

import { useEffect, useEffectEvent, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, RotateCcw, SendHorizontal } from 'lucide-react';
import { l, verticalById, verticals, type Vertical } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { MicButton } from './MicButton';
import {
  EMPTY_ANSWERS,
  MAX_ANSWER,
  MAX_NAME,
  NEED_IDS,
  buildAgentMessage,
  cleanAnswer,
  matchVertical,
  typingDelay,
  type AgentAnswers,
  type AgentStep,
} from './script';

type NewMessage = { from: 'bot' | 'user'; text: string } | { from: 'summary'; answers: AgentAnswers };
type Message = NewMessage & { id: number };

/** Steps where the visitor can answer. */
const ANSWERABLE: AgentStep[] = ['vertical', 'verticalOther', 'need', 'name'];

/**
 * Scripted agent preview ("Vista previa"): greets, asks rubro → need → name and
 * ends with the summary + "Seguir por WhatsApp". No network, no AI: a honest
 * sample of the agent we build in the demo. Starts when it scrolls into view.
 */
export function AgentChat() {
  const t = useTranslations('agent.chat');
  const tc = useTranslations('common');
  const tl = useTranslations('languages');
  const locale = useLocale() as Locale;
  const { vertical: pickedVertical } = useExperience();
  const uid = useId();
  const titleId = `${uid}-title`;
  const inputId = `${uid}-input`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<AgentStep>('idle');
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState<AgentAnswers>(EMPTY_ANSWERS);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nextId = useRef(0);
  const started = useRef(false);
  const focusCta = useRef(false);

  const accepting = !typing && ANSWERABLE.includes(step);
  const text = cleanAnswer(draft, step === 'name' ? MAX_NAME : MAX_ANSWER);
  const canSend = accepting && text.length > 0;

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function push(...items: NewMessage[]) {
    const withIds: Message[] = items.map((m) => ({ ...m, id: nextId.current++ }));
    setMessages((list) => [...list, ...withIds]);
  }

  /** The bot "types" each line, then the conversation moves to `next`. */
  function say(lines: string[], next: AgentStep, after?: () => void) {
    if (prefersReducedMotion()) {
      push(...lines.map((line) => ({ from: 'bot' as const, text: line })));
      setTyping(false);
      setStep(next);
      after?.();
      return;
    }
    setTyping(true);
    let at = 250;
    lines.forEach((line, i) => {
      at += typingDelay(line);
      const last = i === lines.length - 1;
      timers.current.push(
        window.setTimeout(() => {
          push({ from: 'bot', text: line });
          if (last) {
            setTyping(false);
            setStep(next);
            after?.();
          }
        }, at),
      );
      at += 300;
    });
  }

  /** Greeting. On the first run it reuses the rubro picked in the hero, if any. */
  function start(fresh: boolean) {
    if (started.current && !fresh) return;
    started.current = true;
    const v = fresh ? undefined : verticalById(pickedVertical);
    if (v && v.id !== 'otro') {
      const name = l(v.name, locale);
      setAnswers({ ...EMPTY_ANSWERS, verticalId: v.id, vertical: name });
      say([t('bot.hello'), t('bot.knownVertical', { vertical: name }), t('bot.askNeed')], 'need');
    } else {
      say([t('bot.hello'), t('bot.askVertical')], 'vertical');
    }
  }

  const onVisible = useEffectEvent(() => start(false));

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          onVisible();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pending "typing" timers die with the component.
  useEffect(() => {
    const pending = timers;
    return () => pending.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // Keep the newest message in view (scrolls the log only, never the page).
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [messages.length, typing, step]);

  // The input disappears at the end: hand keyboard focus to the WhatsApp button.
  useEffect(() => {
    if (step !== 'done' || !focusCta.current) return;
    focusCta.current = false;
    ctaRef.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  }, [step]);

  function chooseVertical(v: Vertical, e: MouseEvent<HTMLButtonElement>) {
    if (!accepting) return;
    const name = l(v.name, locale);
    push({ from: 'user', text: name });
    keepKeyboardFlow(e);
    if (v.id === 'otro') {
      say([t('bot.askOther')], 'verticalOther');
      return;
    }
    setAnswers((a) => ({ ...a, verticalId: v.id, vertical: name }));
    say([t('bot.askNeed')], 'need');
  }

  function chooseNeed(need: string, e: MouseEvent<HTMLButtonElement>) {
    if (!accepting) return;
    push({ from: 'user', text: need });
    keepKeyboardFlow(e);
    setAnswers((a) => ({ ...a, need }));
    say([t('bot.askName')], 'name');
  }

  /** Chips unmount after a pick: keyboard users continue in the input (taps don't pop the keyboard). */
  function keepKeyboardFlow(e: MouseEvent<HTMLButtonElement>) {
    if (e.detail === 0) inputRef.current?.focus({ preventScroll: true });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSend) return;
    setDraft('');
    push({ from: 'user', text });
    if (step === 'vertical' || step === 'verticalOther') {
      const matched = matchVertical(text);
      const v = matched ? verticalById(matched) : undefined;
      setAnswers((a) => ({ ...a, verticalId: matched ?? 'otro', vertical: v ? l(v.name, locale) : text }));
      say([t('bot.askNeed')], 'need');
    } else if (step === 'need') {
      setAnswers((a) => ({ ...a, need: text }));
      say([t('bot.askName')], 'name');
    } else if (step === 'name') {
      const final = { ...answers, name: text };
      setAnswers(final);
      focusCta.current = document.activeElement === inputRef.current;
      say([t('bot.done', { name: text })], 'done', () => push({ from: 'summary', answers: final }));
    }
  }

  function restart() {
    clearTimers();
    setMessages([]);
    setAnswers(EMPTY_ANSWERS);
    setDraft('');
    setTyping(false);
    setStep('idle');
    setStatus(t('restarted'));
    start(true);
  }

  const placeholder = typing
    ? t('placeholder.wait')
    : step === 'idle' || step === 'done'
      ? t('placeholder.idle')
      : t(`placeholder.${step}`);
  const whatsappMessage = buildAgentMessage(answers, tl(locale), (key, values) => t(key as 'message', values));

  return (
    <div
      ref={rootRef}
      role="region"
      aria-labelledby={titleId}
      className="agent-chat theme-light flex flex-col overflow-hidden rounded-card-lg text-fg"
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
        <span aria-hidden className="agent-avatar mt-0.5 size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span id={titleId} className="sr-only">
              {t('label')}
            </span>
            <span aria-hidden className="font-medium">
              {t('name')}
            </span>
            <span className="badge-demo">{tc('preview')}</span>
          </p>
          <p className="mt-1 text-xs leading-snug text-fg-muted">{t('status')}</p>
        </div>
        <button
          type="button"
          onClick={restart}
          aria-label={t('restartLabel')}
          className="-mr-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <RotateCcw aria-hidden className="size-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{t('restart')}</span>
        </button>
      </div>

      {/* Conversation */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={t('log')}
        tabIndex={0}
        className="agent-log min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-5 focus-visible:-outline-offset-2 sm:px-5"
      >
        {messages.map((m) =>
          m.from === 'summary' ? (
            <div key={m.id} className="agent-msg mr-6 rounded-2xl border border-line bg-white p-4 shadow-[0_14px_30px_-22px_rgb(17_17_20/0.5)]">
              <p className="eyebrow">{t('summary.title')}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-fg-muted">{t('summary.name')}</dt>
                <dd className="min-w-0 break-words font-medium">{m.answers.name}</dd>
                <dt className="text-fg-muted">{t('summary.vertical')}</dt>
                <dd className="min-w-0 break-words font-medium">{m.answers.vertical}</dd>
                <dt className="text-fg-muted">{t('summary.need')}</dt>
                <dd className="min-w-0 break-words font-medium">{m.answers.need}</dd>
              </dl>
            </div>
          ) : (
            <div key={m.id} className={`agent-msg flex ${m.from === 'user' ? 'justify-end pl-10' : 'pr-10'}`}>
              <p
                className={`max-w-full break-words rounded-2xl px-3.5 py-2.5 text-[0.9375rem] leading-snug ${
                  m.from === 'user' ? 'rounded-br-md bg-corona text-ink' : 'rounded-bl-md bg-dawn-soft text-ink'
                }`}
              >
                <span className="sr-only">{m.from === 'user' ? t('you') : t('name')}: </span>
                {m.text}
              </p>
            </div>
          ),
        )}
        {typing || step === 'idle' ? (
          <div aria-hidden className="agent-msg flex pr-10">
            <span className="agent-typing inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-dawn-soft px-3.5 py-3.5">
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}
      </div>

      {/* Suggested replies */}
      {accepting && (step === 'vertical' || step === 'need') ? (
        <div role="group" aria-label={t('suggestions')} className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
          {step === 'vertical'
            ? verticals.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={(e) => chooseVertical(v, e)}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-white/70 px-3.5 text-sm transition-[border-color,box-shadow] hover:border-[color:var(--accent)] hover:shadow-[0_0_20px_-8px_rgb(245_185_66/0.9)]"
                >
                  {v.id === 'otro' ? t('otherVertical') : l(v.name, locale)}
                </button>
              ))
            : NEED_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={(e) => chooseNeed(t(`needs.${id}`), e)}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-white/70 px-3.5 text-left text-sm leading-tight transition-[border-color,box-shadow] hover:border-[color:var(--accent)] hover:shadow-[0_0_20px_-8px_rgb(245_185_66/0.9)]"
                >
                  {t(`needs.${id}`)}
                </button>
              ))}
        </div>
      ) : null}

      {/* Composer, or the hand-off to WhatsApp at the end */}
      {step === 'done' && !typing ? (
        <div ref={ctaRef} className="border-t border-line p-4 sm:p-5">
          <WhatsAppLink
            origin="agent"
            message={whatsappMessage}
            extra={{ vertical: answers.verticalId ?? 'none' }}
            className="btn btn-primary w-full"
            data-page-cta
          >
            <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
            {t('whatsappCta')}
          </WhatsAppLink>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3 sm:p-4">
          <label htmlFor={inputId} className="sr-only">
            {t('inputLabel')}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => start(false)}
            readOnly={step === 'idle'}
            placeholder={placeholder}
            maxLength={step === 'name' ? MAX_NAME : MAX_ANSWER}
            autoComplete={step === 'name' ? 'given-name' : 'off'}
            enterKeyHint="send"
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white/80 px-4 text-[1rem] text-ink placeholder:text-fg-muted focus:border-[color:var(--accent)] focus-visible:outline-offset-1"
          />
          <MicButton label={t('mic')} tip={t('micTip')} />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t('send')}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-corona text-ink transition-[opacity,transform] active:scale-95 disabled:opacity-40"
          >
            <SendHorizontal aria-hidden className="size-[1.1rem]" strokeWidth={1.75} />
          </button>
        </form>
      )}

      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}
