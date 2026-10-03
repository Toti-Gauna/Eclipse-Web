'use client';

import { useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, CalendarClock, Check, CheckCheck, EllipsisVertical, Phone, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { TypingDots } from '../kit';
import { CHAT, NOW_MIN, TIMES, TODAY, parseSlotKey } from './data';
import { deriveReminders, waitlistOnAt, type ChatChoice, type ChatItem, type RuleId } from './sim';
import { useClinic, useFmt } from './context';
import { AuroraLogo, Card, Eyebrow } from './ui';

const CHOICES: { id: ChatChoice; icon: LucideIcon }[] = [
  { id: 'confirm', icon: Check },
  { id: 'reschedule', icon: CalendarClock },
  { id: 'cancel', icon: X },
];
const RULES: RuleId[] = ['day', 'hours', 'waitlist'];

/* ------------------------------------------------------------------ */
/* WhatsApp-like conversation (the patient's phone)                     */
/* ------------------------------------------------------------------ */
function Bubble({ from, time, children, read }: { from: 'clinic' | 'patient'; time: string; children: React.ReactNode; read?: string }) {
  const out = from === 'patient';
  return (
    <div
      data-from={from}
      className={`clinic-bubble max-w-[86%] rounded-[0.85em] px-[0.7em] pb-[0.35em] pt-[0.5em] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
        out ? 'clinic-bubble-tail-out self-end bg-[#d9fdd3]' : 'clinic-bubble-tail-in self-start bg-white'
      }`}
    >
      <div className="text-[0.8em] leading-[1.38]">{children}</div>
      <p className="mt-[0.15em] flex items-center justify-end gap-[0.25em] text-[0.58em] text-[var(--demo-muted)]">
        <span className="tabular">{time}</span>
        {out ? (
          <>
            <CheckCheck aria-hidden className="size-[1.25em] text-[#1d8fd1]" strokeWidth={2.2} />
            <span className="sr-only">{read}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

function ReplyButtons<T extends string | number>({
  options,
  chosen,
  enabled,
  onPick,
}: {
  options: { id: T; label: string; icon: LucideIcon }[];
  chosen: T | null;
  enabled: boolean;
  onPick: (id: T) => void;
}) {
  return (
    <div className="clinic-bubble flex max-w-[86%] flex-col gap-[0.25em] self-start">
      {options.map(({ id, label, icon: Icon }) => {
        const on = chosen === id;
        return (
          <button
            key={String(id)}
            type="button"
            disabled={!enabled}
            aria-pressed={on}
            onClick={() => onPick(id)}
            className={`clinic-reply flex items-center justify-center gap-[0.45em] rounded-[0.7em] bg-white px-[0.9em] py-[0.55em] text-[0.78em] font-semibold shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
              on ? 'text-[var(--clinic-accent-ink)] ring-[0.12em] ring-[var(--demo-accent)]' : 'text-[#0b6a8a]'
            } ${!enabled && !on ? 'opacity-55' : ''}`}
          >
            <Icon aria-hidden className="size-[1.1em] shrink-0" strokeWidth={2.2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function AgendaNote({ children }: { children: React.ReactNode }) {
  const t = useTranslations('demoClinic.chat');
  return (
    <div
      data-from="agenda"
      className="clinic-bubble mx-auto flex max-w-[92%] items-start gap-[0.5em] rounded-[0.8em] border border-[var(--demo-accent)]/25 bg-[var(--demo-accent-soft)] px-[0.7em] py-[0.5em] text-[var(--clinic-accent-ink)] shadow-[0_0.3em_0.8em_-0.5em_rgb(13_107_116/0.5)]"
    >
      <CalendarCheck aria-hidden className="mt-[0.1em] size-[0.95em] shrink-0" strokeWidth={2.2} />
      <p className="text-[0.7em] leading-[1.35]">
        <span className="font-bold uppercase tracking-[0.08em]">{t('agenda')}</span> · {children}
      </p>
    </div>
  );
}

export function ChatPanel({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { chat, store, business, reduced, state } = useClinic();
  const body = useRef<HTMLDivElement>(null);

  const name = t(`firstNames.${CHAT.patient}`);
  const slotTime = fmt.time(TIMES[Number(CHAT.slot.split(':')[1])]);
  const pro = t(`pros.${parseSlotKey(CHAT.options[0]).pro}.name`);
  const stamp = (i: number) => fmt.time(NOW_MIN + Math.max(0, i - 1));

  // The conversation starts the first time someone looks at it.
  useEffect(() => {
    store.startChat();
  }, [store]);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [chat.items.length, chat.typing, chat.done, reduced]);

  const render = (item: ChatItem, i: number) => {
    if (item.from === 'agenda') {
      const values = { name, time: slotTime };
      const key =
        item.kind === 'confirmed'
          ? 'sysConfirmed'
          : item.kind === 'refilled'
            ? 'sysRefilled'
            : chat.freedAt !== null && !waitlistOnAt(state, chat.freedAt)
              ? 'sysFreedOff'
              : 'sysFreed';
      return (
        <AgendaNote key={item.id}>
          {t(`chat.${key}`, item.kind === 'refilled' ? { ...values, name: t(`patients.${CHAT.waitlistPatient}`) } : values)}
        </AgendaNote>
      );
    }
    if (item.from === 'patient') {
      const label = item.kind === 'choice' ? t(`chat.choices.${item.choice}`) : fmt.slot(CHAT.options[item.option]);
      return (
        <Bubble key={item.id} from="patient" time={stamp(i)} read={t('chat.read')}>
          {label}
        </Bubble>
      );
    }
    const values = {
      name,
      business,
      time: slotTime,
      pro,
      treatment: t(`treatments.${CHAT.treatment}`),
      slot: chat.pick !== null ? fmt.slot(CHAT.options[chat.pick]) : '',
    };
    return (
      <div key={item.id} className="contents">
        <Bubble from="clinic" time={stamp(i)}>
          {item.kind === 'reminder' ? (
            <span className="mb-[0.2em] block text-[0.82em] font-semibold text-[var(--clinic-accent-ink)]">{t('chat.auto')}</span>
          ) : null}
          {t(`chat.${item.kind}`, values)}
        </Bubble>
        {item.options === 'choice' ? (
          <ReplyButtons
            options={CHOICES.map((c) => ({ id: c.id, label: t(`chat.choices.${c.id}`), icon: c.icon }))}
            chosen={chat.choice}
            enabled={chat.awaiting === 'choice'}
            onPick={(id) => store.choose(id)}
          />
        ) : null}
        {item.options === 'pick' ? (
          <ReplyButtons
            options={CHAT.options.map((key, idx) => ({ id: idx, label: fmt.slot(key), icon: CalendarClock }))}
            chosen={chat.pick}
            enabled={chat.awaiting === 'pick'}
            onPick={(idx) => store.pick(idx)}
          />
        ) : null}
      </div>
    );
  };

  return (
    <section className={`flex flex-col overflow-hidden rounded-[1.1em] border border-[var(--demo-line)] bg-white shadow-[0_0.8em_2em_-1.2em_rgb(21_21_27/0.35)] ${className}`}>
      <header className="flex items-center gap-[0.6em] border-b border-[var(--demo-line)] bg-[#f7f8fa] px-[0.75em] py-[0.55em]">
        <span aria-hidden className="grid size-[2.1em] shrink-0 place-items-center rounded-full bg-[var(--demo-accent)] text-white">
          <AuroraLogo />
        </span>
        <span className="min-w-0 flex-1 leading-[1.2]">
          <span className="block truncate text-[0.86em] font-semibold">{business}</span>
          <span className={`block truncate text-[0.68em] ${chat.typing ? 'text-[#14804a]' : 'text-[var(--demo-muted)]'}`}>
            {chat.typing ? t('chat.typing') : t('chat.online')}
          </span>
        </span>
        <span aria-hidden className="flex items-center gap-[0.7em] text-[var(--demo-muted)]">
          <Phone className="size-[1.05em]" strokeWidth={1.8} />
          <EllipsisVertical className="size-[1.05em]" strokeWidth={1.8} />
        </span>
      </header>
      <div
        ref={body}
        role="log"
        aria-label={t('chat.log', { business, name })}
        className="clinic-wa flex min-h-0 flex-1 flex-col gap-[0.45em] overflow-y-auto overscroll-contain px-[0.65em] py-[0.75em]"
      >
        <p className="mx-auto rounded-[0.5em] bg-white/85 px-[0.6em] py-[0.15em] text-[0.62em] font-medium text-[var(--demo-muted)] shadow-[0_1px_0.5px_rgb(11_20_26/0.1)]">
          {fmt.long(TODAY)}
        </p>
        {chat.items.map(render)}
        {chat.typing ? (
          <div className="clinic-bubble self-start rounded-[0.85em] bg-white px-[0.8em] py-[0.6em] text-[var(--demo-muted)] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]">
            <TypingDots label={t('chat.typingLabel', { business })} />
          </div>
        ) : null}
        {chat.done ? (
          <button
            type="button"
            onClick={() => store.replay()}
            className="clinic-bubble mx-auto mt-[0.3em] inline-flex items-center gap-[0.4em] rounded-full bg-[#15151b] px-[0.9em] py-[0.5em] text-[0.72em] font-semibold text-white transition-transform active:scale-[0.97]"
          >
            <RotateCcw aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
            {t('chat.replay')}
          </button>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Clinic side: stats, today's patients, automations                    */
/* ------------------------------------------------------------------ */
function useReminders() {
  const { agenda } = useClinic();
  return deriveReminders(agenda);
}

const STATE_CLS = {
  waiting: 'bg-[var(--clinic-warn-bg)] text-[var(--clinic-warn)]',
  confirmed: 'bg-[var(--clinic-ok-bg)] text-[var(--clinic-ok)]',
  rescheduled: 'bg-[var(--clinic-wait-bg)] text-[var(--clinic-wait)]',
  cancelled: 'bg-[var(--clinic-bad-bg)] text-[var(--clinic-bad)]',
} as const;

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="min-w-0 rounded-[0.9em] border border-[var(--demo-line)] bg-white px-[0.7em] py-[0.55em]">
      <p className="flex items-center gap-[0.35em] truncate text-[0.64em] font-medium text-[var(--demo-muted)]">
        <span aria-hidden className={`size-[0.6em] shrink-0 rounded-full ${dot}`} />
        {label}
      </p>
      <p key={value} className="clinic-pop tabular mt-[0.1em] text-[1.35em] font-semibold leading-none tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
}

export function ReminderStats({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoClinic.reminders.stats');
  const r = useReminders();
  return (
    <div className={`grid gap-[0.5em] ${compact ? 'grid-cols-3' : 'grid-cols-4'}`}>
      {compact ? null : <Stat label={t('sent')} value={r.sent} dot="bg-[var(--demo-muted)]" />}
      <Stat label={t('confirmed')} value={r.confirmed} dot="bg-[var(--clinic-ok)]" />
      <Stat label={t('pending')} value={r.pending} dot="bg-[var(--clinic-warn)]" />
      <Stat label={t('changed')} value={r.changed} dot="bg-[var(--clinic-wait)]" />
    </div>
  );
}

function PatientList() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const r = useReminders();
  const rows = [...r.rows].sort((a, b) => parseSlotKey(a.key).idx - parseSlotKey(b.key).idx);
  return (
    <Card className="p-[0.85em]">
      <h3 className="text-[0.86em] font-semibold">{t('reminders.patients')}</h3>
      <ul className="mt-[0.45em] divide-y divide-[var(--demo-line)]">
        {rows.map((row) => {
          const { pro, idx } = parseSlotKey(row.key);
          const isChat = row.patient === CHAT.patient;
          return (
            <li key={row.key} className={`flex items-center gap-[0.6em] py-[0.38em] ${isChat ? '-mx-[0.4em] rounded-[0.6em] bg-[var(--demo-accent-soft)]/60 px-[0.4em]' : ''}`}>
              <span className="tabular w-[3.4em] shrink-0 text-[0.7em] font-semibold text-[var(--demo-muted)]">{fmt.time(TIMES[idx])}</span>
              <span className="min-w-0 flex-1 leading-[1.2]">
                <span className="block truncate text-[0.78em] font-semibold">{t(`patients.${row.patient}`)}</span>
                <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">
                  {t(`pros.${pro}.name`)}
                  {isChat ? ` · ${t('reminders.patientView')}` : ''}
                </span>
              </span>
              <span key={row.state} className={`clinic-pop shrink-0 rounded-full px-[0.55em] py-[0.2em] text-[0.64em] font-semibold ${STATE_CLS[row.state]}`}>
                {t(`reminders.state.${row.state}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function RulesCard() {
  const t = useTranslations('demoClinic.reminders');
  const { state, store } = useClinic();
  const uid = useId();
  return (
    <Card className="p-[0.85em]">
      <h3 className="text-[0.86em] font-semibold">{t('rulesTitle')}</h3>
      <ul className="mt-[0.3em] divide-y divide-[var(--demo-line)]">
        {RULES.map((id) => {
          const on = state.rules[id];
          return (
            <li key={id} className="flex items-center gap-[0.7em] py-[0.5em]">
              <span className="min-w-0 flex-1 leading-[1.25]">
                <span id={`${uid}-${id}`} className="block text-[0.76em] font-semibold">
                  {t(`rules.${id}.title`)}
                </span>
                <span id={`${uid}-${id}-d`} className="block text-[0.66em] text-[var(--demo-muted)]">
                  {t(`rules.${id}.body`)}
                </span>
              </span>
              <span className={`w-[3.6em] shrink-0 text-right text-[0.62em] font-semibold ${on ? 'text-[var(--clinic-ok)]' : 'text-[var(--demo-muted)]'}`}>
                {on ? t('on') : t('off')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-labelledby={`${uid}-${id}`}
                aria-describedby={`${uid}-${id}-d`}
                onClick={() => store.toggleRule(id)}
                className="clinic-switch"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Views                                                                */
/* ------------------------------------------------------------------ */
export function PhoneReminders() {
  const t = useTranslations('demoClinic');
  const { chat, paired } = useClinic();
  return (
    <div className="flex flex-col gap-[0.7em]">
      <div>
        <Eyebrow>{t('chat.heading')}</Eyebrow>
        <p className={`mt-[0.15em] text-[0.74em] text-[var(--demo-muted)] transition-opacity ${chat.awaiting ? 'opacity-100' : 'opacity-0'}`}>
          {t('chat.hint', { name: t(`firstNames.${CHAT.patient}`) })}
        </p>
      </div>
      <ChatPanel className={paired ? 'h-[37em]' : 'h-[33.5em]'} />
      <ReminderStats compact />
      <RulesCard />
    </div>
  );
}

export function LaptopReminders() {
  const t = useTranslations('demoClinic');
  const { paired } = useClinic();
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div>
        <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('reminders.title')}</h2>
        <p className="text-[0.78em] text-[var(--demo-muted)]">{t('reminders.subtitle')}</p>
      </div>
      <div className="mr-[var(--clinic-safe,0em)] flex flex-col gap-[0.8em]">
        <ReminderStats />
        <div className={`grid items-start gap-[0.8em] ${paired ? 'grid-cols-[minmax(0,1fr)_17em]' : 'grid-cols-[minmax(0,1fr)_15em_18em]'}`}>
          <PatientList />
          <RulesCard />
          {/* Next to the laptop, the phone already shows the patient's side. */}
          {paired ? null : (
            <div className="flex flex-col gap-[0.45em]">
              <Eyebrow>{t('reminders.patientView')}</Eyebrow>
              <ChatPanel className="h-[30em]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
