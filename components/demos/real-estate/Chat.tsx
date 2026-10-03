'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarClock, CheckCheck, ChevronRight, EllipsisVertical, House, KeyRound, Phone, RotateCcw, UserCheck, Wallet, Zap, type LucideIcon } from 'lucide-react';
import { TypingDots } from '../kit';
import { ASK, BUDGETS, NOW_MIN, RESPONSE_SECONDS, VISIT_SLOTS, listingById, type Op } from './data';
import { chatAverageSeconds, type AgentKind, type ChatItem } from './sim';
import { useEstate, useFmt } from './context';
import { MiniListing } from './Listings';
import { Eyebrow, LumenLogo } from './ui';

const OP_ICON: Record<Op, LucideIcon> = { sale: House, rent: KeyRound };

/** Human text of a chat item (also used by the agency's inbox previews). */
export function useChatText() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  const { chat, business } = useEstate();
  return (item: ChatItem): string => {
    const name = t('people.liveFirst');
    const advisor = t('people.advisorFirst');
    const op = chat.op ?? 'sale';
    switch (item.kind) {
      case 'inquiry':
        return t('chat.inquiry', { beds: ASK.beds, zone: t(`zones.${ASK.zone}`) });
      case 'greet':
        return t('chat.greet', { name, business });
      case 'op':
        return t(`chat.ops.${op}`);
      case 'budgetAsk':
        return t(op === 'rent' ? 'chat.budgetAskRent' : 'chat.budgetAskSale');
      case 'budget':
        return t('chat.budgetReply', { price: fmt.price(op, BUDGETS[op][chat.budget ?? 0]) });
      case 'matches':
        return t('chat.matches', { count: chat.recommended?.length ?? 0 });
      case 'visitAsk':
        return t('chat.visitAsk', { advisor });
      case 'slot':
        return fmt.slot(VISIT_SLOTS[chat.slot ?? 0]);
      case 'booked':
        return t('chat.booked', { name, advisor, slot: fmt.slotLong(VISIT_SLOTS[chat.slot ?? 0]) });
      case 'crm':
        return t('chat.crm', { name: t('people.live') });
    }
  };
}

function Bubble({
  from,
  time,
  children,
  seconds,
}: {
  from: 'agent' | 'customer';
  time: string;
  children: ReactNode;
  /** Agent's answer time, shown under its bubble. */
  seconds?: number;
}) {
  const t = useTranslations('demoRealEstate.chat');
  const out = from === 'customer';
  return (
    <div
      data-from={from}
      className={`re-bubble max-w-[86%] rounded-[0.85em] px-[0.7em] pb-[0.35em] pt-[0.5em] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
        out ? 're-tail-out self-end bg-[#d9fdd3]' : 're-tail-in self-start bg-white'
      }`}
    >
      <div className="text-[0.8em] leading-[1.38]">{children}</div>
      <p className="mt-[0.2em] flex items-center justify-end gap-[0.3em] text-[0.58em] text-[var(--demo-muted)]">
        {seconds !== undefined ? (
          <span className="mr-auto inline-flex items-center gap-[0.25em] rounded-full bg-[var(--demo-accent-soft)] px-[0.5em] py-[0.1em] font-semibold text-[var(--re-accent-ink)]">
            <Zap aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
            {t('responded', { seconds })}
          </span>
        ) : null}
        <span className="tabular">{time}</span>
        {out ? (
          <>
            <CheckCheck aria-hidden className="size-[1.25em] text-[#1d8fd1]" strokeWidth={2.2} />
            <span className="sr-only">{t('read')}</span>
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
    <div className="re-bubble flex max-w-[86%] flex-col gap-[0.25em] self-start">
      {options.map(({ id, label, icon: Icon }) => {
        const on = chosen === id;
        return (
          <button
            key={String(id)}
            type="button"
            disabled={!enabled}
            aria-pressed={on}
            onClick={() => onPick(id)}
            className={`re-reply flex items-center justify-center gap-[0.45em] rounded-[0.7em] bg-white px-[0.9em] py-[0.55em] text-[0.78em] font-semibold shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
              on ? 'text-[var(--re-accent-ink)] ring-[0.12em] ring-[var(--demo-accent)]' : 'text-[#0b6a8a]'
            } ${!enabled && !on ? 'opacity-55' : ''}`}
          >
            <Icon aria-hidden className="size-[1.1em] shrink-0" strokeWidth={2.2} />
            <span className="tabular">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SystemNote({ children }: { children: ReactNode }) {
  const t = useTranslations('demoRealEstate.chat');
  return (
    <div
      data-from="system"
      className="re-bubble mx-auto flex max-w-[92%] items-start gap-[0.5em] rounded-[0.8em] border border-[var(--demo-accent)]/25 bg-[var(--demo-accent-soft)] px-[0.7em] py-[0.5em] text-[var(--re-accent-ink)] shadow-[0_0.3em_0.8em_-0.5em_rgb(47_69_144/0.5)]"
    >
      <UserCheck aria-hidden className="mt-[0.1em] size-[0.95em] shrink-0" strokeWidth={2.2} />
      <p className="text-[0.7em] leading-[1.35]">
        <span className="font-bold uppercase tracking-[0.08em]">{t('crmTag')}</span> · {children}
      </p>
    </div>
  );
}

export function ChatPanel({ className = '' }: { className?: string }) {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  const { chat, store, business, reduced, openListing } = useEstate();
  const text = useChatText();
  const body = useRef<HTMLDivElement>(null);
  const op = chat.op ?? 'sale';
  const stamp = (i: number) => fmt.time(NOW_MIN + Math.floor(i / 3));

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
    if (item.from === 'system') return <SystemNote key={item.id}>{text(item)}</SystemNote>;
    if (item.from === 'customer') {
      return (
        <Bubble key={item.id} from="customer" time={stamp(i)}>
          {text(item)}
        </Bubble>
      );
    }
    return (
      <div key={item.id} className="contents">
        <Bubble from="agent" time={stamp(i)} seconds={RESPONSE_SECONDS[item.kind as AgentKind]}>
          {text(item)}
        </Bubble>
        {item.kind === 'matches' && chat.recommended ? (
          <div className="re-bubble flex max-w-[86%] flex-col gap-[0.3em] self-start">
            {chat.recommended.map((id) => (
              <MiniListing
                key={id}
                listing={listingById(id)}
                className="rounded-[0.75em] bg-white p-[0.4em] pr-[0.3em] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]"
                action={
                  <button
                    type="button"
                    onClick={() => openListing(id)}
                    className="inline-flex shrink-0 items-center gap-[0.1em] rounded-full px-[0.5em] py-[0.35em] text-[0.66em] font-semibold text-[#0b6a8a] hover:bg-black/[0.04]"
                  >
                    {t('chat.viewListing')}
                    <ChevronRight aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
                  </button>
                }
              />
            ))}
          </div>
        ) : null}
        {item.options === 'op' ? (
          <ReplyButtons
            options={(['sale', 'rent'] as Op[]).map((o) => ({ id: o, label: t(`chat.ops.${o}`), icon: OP_ICON[o] }))}
            chosen={chat.op}
            enabled={chat.awaiting === 'op'}
            onPick={(o) => store.chooseOp(o)}
          />
        ) : null}
        {item.options === 'budget' ? (
          <ReplyButtons
            options={BUDGETS[op].map((amount, idx) => ({ id: idx, label: t('chat.budgetReply', { price: fmt.price(op, amount) }), icon: Wallet }))}
            chosen={chat.budget}
            enabled={chat.awaiting === 'budget'}
            onPick={(idx) => store.chooseBudget(idx)}
          />
        ) : null}
        {item.options === 'slot' ? (
          <ReplyButtons
            options={VISIT_SLOTS.map((s, idx) => ({ id: idx, label: fmt.slot(s), icon: CalendarClock }))}
            chosen={chat.slot}
            enabled={chat.awaiting === 'slot'}
            onPick={(idx) => store.chooseSlot(idx)}
          />
        ) : null}
      </div>
    );
  };

  return (
    <section className={`flex flex-col overflow-hidden rounded-[1.1em] border border-[var(--demo-line)] bg-white shadow-[0_0.8em_2em_-1.2em_rgb(21_21_27/0.35)] ${className}`}>
      <header className="flex items-center gap-[0.6em] border-b border-[var(--demo-line)] bg-[#f7f8fa] px-[0.75em] py-[0.55em]">
        <span aria-hidden className="grid size-[2.1em] shrink-0 place-items-center rounded-full bg-[var(--demo-accent)] text-white">
          <LumenLogo />
        </span>
        <span className="min-w-0 flex-1 leading-[1.2]">
          <span className="flex items-center gap-[0.35em]">
            <span className="truncate text-[0.86em] font-semibold">{business}</span>
            <span className="shrink-0 rounded-[0.35em] bg-[var(--demo-accent-soft)] px-[0.35em] text-[0.58em] font-bold tracking-[0.06em] text-[var(--re-accent-ink)]">
              {t('chat.aiTag')}
            </span>
          </span>
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
        tabIndex={-1}
        aria-label={t('chat.log', { business, name: t('people.liveFirst') })}
        className="re-wa flex min-h-0 flex-1 flex-col gap-[0.45em] overflow-y-auto overscroll-contain px-[0.65em] py-[0.75em]"
      >
        <p className="mx-auto rounded-[0.5em] bg-white/85 px-[0.6em] py-[0.15em] text-[0.62em] font-medium text-[var(--demo-muted)] shadow-[0_1px_0.5px_rgb(11_20_26/0.1)]">
          {fmt.long(0)}
        </p>
        <p className="mx-auto max-w-[88%] rounded-[0.6em] bg-[#fdf3d7] px-[0.7em] py-[0.35em] text-center text-[0.62em] leading-[1.35] text-[#6b4a00] shadow-[0_1px_0.5px_rgb(11_20_26/0.1)]">
          {t('chat.closed', { business })}
        </p>
        {chat.items.map(render)}
        {chat.typing ? (
          <div className="re-bubble self-start rounded-[0.85em] bg-white px-[0.8em] py-[0.6em] text-[var(--demo-muted)] shadow-[0_1px_0.5px_rgb(11_20_26/0.13)]">
            <TypingDots label={t('chat.typingLabel', { business })} />
          </div>
        ) : null}
        {chat.done ? (
          <button
            type="button"
            onClick={() => {
              store.replay();
              // The button goes away: keep keyboard focus inside the conversation.
              body.current?.focus({ preventScroll: true });
            }}
            className="re-bubble mx-auto mt-[0.3em] inline-flex items-center gap-[0.4em] rounded-full bg-[#15151b] px-[0.9em] py-[0.5em] text-[0.72em] font-semibold text-white transition-transform active:scale-[0.97]"
          >
            <RotateCcw aria-hidden className="size-[1.1em]" strokeWidth={2.2} />
            {t('chat.replay')}
          </button>
        ) : null}
      </div>
    </section>
  );
}

/** Response-time strip under the phone chat: this conversation + the weekend. */
function ResponseStats() {
  const t = useTranslations('demoRealEstate');
  const { chat, kpis, keyNumber, keySuffix } = useEstate();
  const avg = chatAverageSeconds(chat);
  const stats = [
    { label: t('stats.thisChat'), value: avg === null ? '—' : t('stats.seconds', { seconds: avg }) },
    { label: t('stats.avgWeekend'), value: t('stats.seconds', { seconds: kpis.avgSeconds }) },
    { label: t('stats.underMinute'), value: `${keyNumber}${keySuffix}` },
  ];
  return (
    <div className="grid grid-cols-3 gap-[0.45em]">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0 rounded-[0.9em] border border-[var(--demo-line)] bg-white px-[0.65em] py-[0.5em]">
          <p className="truncate text-[0.6em] font-medium text-[var(--demo-muted)]">{s.label}</p>
          <p key={s.value} className="re-pop tabular mt-[0.1em] text-[1.15em] font-semibold leading-none tracking-[-0.02em]">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function PhoneChat() {
  const t = useTranslations('demoRealEstate');
  const { chat, paired } = useEstate();
  return (
    <div className="flex flex-col gap-[0.7em]">
      <div>
        <Eyebrow>{t('chat.heading')}</Eyebrow>
        <p className={`mt-[0.15em] text-[0.74em] text-[var(--demo-muted)] transition-opacity ${chat.awaiting ? 'opacity-100' : 'opacity-0'}`}>
          {t('chat.hint', { name: t('people.liveFirst') })}
        </p>
      </div>
      <ChatPanel className={paired ? 'h-[40em]' : 'h-[36.5em]'} />
      <ResponseStats />
    </div>
  );
}
