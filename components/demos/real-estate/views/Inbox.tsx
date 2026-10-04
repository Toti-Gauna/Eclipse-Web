'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSound } from '@/components/sound/SoundContext';
import { ChatWidget, Readout, Switch, TypingDots, type ChatRun } from '../../kit';
import { ASKED, BASE_LEADS, CHAT_SLOTS, STORY, listingById } from '../data';
import { act } from '../story';
import { useEstate } from '../context';
import { chatStoryAt, useEstateChats, useStamp } from '../scripts';
import { Field, LumenMark, SOURCE_ICON, StageTrack, useEstateText, ViewHead } from '../ui';
import { FollowThread, useFollow } from './Followups';

/** Hook: the localized 23:40 conversation + a pick handler (as the buyer). */
export function useInquiry(): { run: ChatRun; pick: (step: string, reply: string) => void } {
  const { view, store, active } = useEstate();
  const chats = useEstateChats();
  const { play } = useSound();
  return {
    run: chats.inquiry(view),
    pick: (step, reply) => {
      store.update(act.pick(step, reply));
      if (active) play('select');
    },
  };
}

/** The site's chat as the buyer sees it (phone views, the public site). */
export function LiveChat({ className = '', header = true, announce: announceProp }: { className?: string; header?: boolean; announce?: boolean }) {
  const t = useTranslations('demoRealEstate');
  const { view, business, announce: announceCtx } = useEstate();
  const announce = announceProp ?? announceCtx;
  const { run, pick } = useInquiry();
  const stamp = useStamp();
  return (
    <ChatWidget
      variant="widget"
      run={run}
      header={header}
      title={business}
      subtitle={view.botOff ? t('chat.subtitleOff') : t('chat.subtitle')}
      avatar={<LumenMark />}
      label={t('chat.label', { business, name: t('people.carolina') })}
      announce={announce}
      stamp={(at) => stamp(chatStoryAt(at))}
      onPick={pick}
      composer={t('chat.composer')}
      className={`re-chat ${className}`}
    />
  );
}

/** The 24/7 switch (restarts the story so the 23:40 inquiry plays with the new setting). */
export function BotSwitch({ withHint = false, className = '' }: { withHint?: boolean; className?: string }) {
  const t = useTranslations('demoRealEstate.bot');
  const { view, toggleBot } = useEstate();
  const id = useId();
  return (
    <div className={`re-botswitch ${className}`} data-off={view.botOff ? '' : undefined}>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span id={`${id}-l`} className="block truncate text-[0.74em] font-semibold">
          {t('switch')}
        </span>
        {withHint ? (
          <span id={`${id}-d`} className="block text-[0.64em] text-[var(--demo-muted)]">
            {view.botOff ? t('hintOff') : t('hint')}
          </span>
        ) : null}
      </span>
      <Switch checked={!view.botOff} onChange={toggleBot} labelledBy={`${id}-l`} describedBy={withHint ? `${id}-d` : undefined} />
    </div>
  );
}

/** Extracted field shown next to a transcript line (what the assistant learned). */
function useAnnotation() {
  const x = useEstateText();
  const { view } = useEstate();
  return (id: string): string | null => {
    if (id === 'pay:reply' && view.pay) return x.t('inbox.extract.pay', { value: x.t(`pay.${view.pay}`) });
    if (id === 'budget:reply' && view.budget) return x.t('inbox.extract.budget', { value: x.t(`budget.${view.budget}`) });
    if (id === 'slots:reply' && view.slot) return x.t('inbox.extract.visit', { value: x.slot(CHAT_SLOTS[view.slot]) });
    if (id === 'crm') return x.t('inbox.extract.crm', { value: x.t('stages.visit') });
    return null;
  };
}

/** The conversation as the agency reads it: a timed transcript with what the assistant extracted. */
function Transcript() {
  const t = useTranslations('demoRealEstate');
  const { view, reduced } = useEstate();
  const { run, pick } = useInquiry();
  const follow = useFollow();
  const stamp = useStamp();
  const note = useAnnotation();
  const x = useEstateText();
  const list = useRef<HTMLOListElement>(null);
  const count = run.items.length + (follow.run?.items.length ?? 0);
  const typing = run.typing || !!follow.run?.typing;
  // Keep the newest line in view (inside the device, never the page).
  useLayoutEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [count, typing, reduced]);
  const awaiting = follow.run?.awaiting ? { ...follow.run.awaiting, pick: follow.pick } : run.awaiting ? { ...run.awaiting, pick } : null;
  const who = (from: string) =>
    from === 'user' ? t('people.carolinaFirst') : from === 'bot' ? (view.botOff ? t('inbox.humanLabel', { name: t('people.juliaFirst') }) : t('inbox.botLabel')) : '';
  return (
    <section className="re-transcript" aria-label={t('inbox.transcript')}>
      <ol ref={list} className="re-lines">
        {run.items.map((it) => {
          const tag = note(it.id);
          return (
            <li key={it.id} className="re-line" data-from={it.from}>
              <span className="re-line-time demo-num">{stamp(chatStoryAt(it.at))}</span>
              <span className="re-line-who">{who(it.from)}</span>
              <div className="re-line-text">
                {it.text}
                {it.card ? <div className="re-line-card">{it.card}</div> : null}
                {tag ? <p className="re-line-tag">{tag}</p> : null}
              </div>
            </li>
          );
        })}
        {follow.run && view.followStart !== null ? (
          <>
            <li className="re-line re-line-sep" data-from="note">
              <span className="re-line-time demo-num">{stamp(view.followStart)}</span>
              <div className="re-line-text">
                {t('sources.whatsapp')} · {t('buyer.jump', { date: x.day(view.clock.day) })}
              </div>
            </li>
            {follow.run.items.map((it) => (
              <li key={`wa-${it.id}`} className="re-line" data-from={it.from}>
                <span className="re-line-time demo-num">{stamp(view.followStart! + it.at)}</span>
                <span className="re-line-who">{who(it.from)}</span>
                <div className="re-line-text">
                  {it.text}
                  {it.card ? <div className="re-line-card">{it.card}</div> : null}
                </div>
              </li>
            ))}
          </>
        ) : null}
        {typing ? (
          <li className="re-line" data-from="bot">
            <span className="re-line-time demo-num">{stamp(view.t)}</span>
            <span className="re-line-who">{who('bot')}</span>
            <div className="re-line-text">
              <TypingDots label={t('chat.subtitle')} />
            </div>
          </li>
        ) : null}
      </ol>
      {awaiting ? (
        <div className="re-simulate" role="group" aria-label={t('inbox.simulate', { name: t('people.carolinaFirst') })}>
          <p className="re-label">{t('inbox.simulate', { name: t('people.carolinaFirst') })}</p>
          <div className="flex flex-wrap gap-[0.4em]">
            {awaiting.replies.map((r) => (
              <button key={r.id} type="button" className="re-chip" onClick={() => awaiting.pick(awaiting.step, r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Conversations of the night: the live one first. */
function ConvoList() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const chats = useEstateChats();
  const x = useEstateText();
  const last = [...chats.inquiry(view, true).items].reverse().find((i) => i.from !== 'note');
  const lastText = typeof last?.text === 'string' ? last.text : '';
  const rows = BASE_LEADS.filter((l) => ['andres', 'valeria', 'lucia', 'diego'].includes(l.id))
    .sort((a, b) => b.day * 1440 + b.min - (a.day * 1440 + a.min))
    .map((l) => ({ id: l.id, name: x.person(l.id), preview: t(`inbox.previews.${l.id}`), time: x.fmt.time(l.min), secs: l.responseSec, Icon: SOURCE_ICON[l.source] }));
  const LiveIcon = SOURCE_ICON.web;
  return (
    <nav className="re-convos" aria-label={t('inbox.list')}>
      <p className="re-label px-[0.8em] pb-[0.5em]">{t('inbox.list')}</p>
      <ul>
        {view.t >= STORY.chatStart ? (
          <li className="re-convo" data-on="" data-late={view.botOff ? '' : undefined}>
            <LiveIcon aria-hidden strokeWidth={1.6} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-[0.5em]">
                <span className="truncate text-[0.76em] font-semibold">{t('people.carolina')}</span>
                <span className="demo-num shrink-0 text-[0.6em] text-[var(--demo-muted)]">{x.clock({ day: 3, min: 1420 })}</span>
              </span>
              <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{lastText}</span>
              <span className="re-convo-meta">{view.botOff ? t('inbox.noReply') : `${t('chat.ai')} · ${t('chat.answeredIn', { seconds: 4 })}`}</span>
            </span>
          </li>
        ) : null}
        {rows.map((r) => (
          <li key={r.id} className="re-convo">
            <r.Icon aria-hidden strokeWidth={1.6} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-[0.5em]">
                <span className="truncate text-[0.76em] font-semibold">{r.name}</span>
                <span className="demo-num shrink-0 text-[0.6em] text-[var(--demo-muted)]">{r.time}</span>
              </span>
              <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{r.preview}</span>
              <span className="re-convo-meta">
                {t('chat.ai')} · {t('chat.answeredIn', { seconds: r.secs })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** What the assistant knows about Carolina so far. */
export function LeadFile({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoRealEstate');
  const { view, recent } = useEstate();
  const x = useEstateText();
  const l = listingById(view.listing);
  const fresh = (at: number | null) => recent(at, 2200);
  const lost = view.lostAt !== null && view.t >= view.lostAt;
  const next = lost
    ? 'lost'
    : view.botOff
      ? 'call'
      : view.outcome
        ? view.outcome
        : view.timelapseAt !== null && view.t >= view.timelapseAt
          ? 'follow'
          : view.bookedAt !== null
            ? 'visit'
            : view.qualifiedAt !== null
              ? 'book'
              : 'qualify';
  return (
    <section className="re-file" data-compact={compact ? '' : undefined} aria-label={t('lead.title')}>
      <div className="re-file-score">
        <p className="re-label">{t('lead.score')}</p>
        <p className="re-file-num demo-display">
          <Readout value={view.score} />
          <span>{t('lead.scoreOf')}</span>
        </p>
        <StageTrack stage={view.stage} lost={lost} />
      </div>
      <dl className="re-fields">
        <Field label={t('lead.seeks')} value={t('lead.seeksValue', { kind: x.kind(ASKED), rooms: x.rooms(ASKED, true), zone: x.zone(listingById(ASKED).zone) })} />
        <Field label={t('lead.pay')} value={view.pay ? t(`pay.${view.pay}`) : null} fresh={fresh(view.payAt)} />
        <Field label={t('lead.budget')} value={view.budget ? t(`budget.${view.budget}`) : null} fresh={fresh(view.qualifiedAt)} />
        <Field
          label={t('lead.visit')}
          value={view.slot && view.bookedAt !== null ? `${x.slot(CHAT_SLOTS[view.slot])} · ${l.street}` : null}
          fresh={fresh(view.bookedAt)}
          accent
        />
        {compact ? null : <Field label={t('lead.source')} value={t('sources.web')} />}
        <Field label={t('lead.next')} value={t(`lead.nextSteps.${next}`, { advisor: t('people.juliaFirst') })} />
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Phone: the live conversation (the visitor plays the buyer)           */
/* ------------------------------------------------------------------ */
export function PhoneInbox() {
  const t = useTranslations('demoRealEstate');
  const { view, go, loop, focus } = useEstate();
  const x = useEstateText();
  const stamp = useStamp();
  // After the visit the conversation continues on WhatsApp (shown on its own unless the visitor picks,
  // per loop; a beat drops the pick so the story shows where it happens).
  const [picked, setPicked] = useState<{ loop: number; channel: 'site' | 'wa' } | null>(null);
  const [seen, setSeen] = useState(focus.n);
  if (seen !== focus.n) {
    setSeen(focus.n);
    setPicked(null);
  }
  const channel = picked?.loop === loop ? picked.channel : view.follow ? 'wa' : 'site';
  const setChannel = (c: 'site' | 'wa') => setPicked({ loop, channel: c });
  const lost = view.lostAt !== null && view.t >= view.lostAt;
  return (
    <div className="re-live">
      <div className="re-live-bar">
        <p className="re-label min-w-0 flex-1 truncate">{t('top.date', { date: x.day(view.clock.day), time: x.clock(view.clock) })}</p>
        <BotSwitch />
      </div>
      {view.follow ? (
        <div className="re-channels" role="group" aria-label={t('inbox.channel')}>
          {(['site', 'wa'] as const).map((c) => (
            <button key={c} type="button" className="re-channel" aria-pressed={channel === c} onClick={() => setChannel(c)}>
              {c === 'site' ? t('sources.web') : t('sources.whatsapp')}
              <span className="demo-num">{c === 'site' ? x.clock({ day: 3, min: 1420 }) : stamp(view.followStart ?? view.t)}</span>
            </button>
          ))}
        </div>
      ) : view.t >= view.inquiryAt ? (
        <p className="re-live-hint">{t('chat.as', { name: t('people.carolinaFirst') })}</p>
      ) : null}
      {channel === 'wa' && view.follow ? (
        <FollowThread className="re-live-chat" />
      ) : view.t < view.inquiryAt ? (
        <div className="re-live-empty" data-tour="chat">
          <p className="re-title demo-display">{t('inbox.emptyTitle')}</p>
          <p className="re-sub">{t('inbox.emptyBody')}</p>
        </div>
      ) : (
        <div className="re-live-chat" data-tour="chat">
          <LiveChat className="h-full" />
        </div>
      )}
      <button type="button" className="re-live-dock" onClick={() => go('pipeline')}>
        <span className="flex items-baseline justify-between gap-[0.6em]">
          <span className="truncate text-[0.72em] font-semibold">{t('people.carolina')}</span>
          <span className="demo-num shrink-0 text-[0.66em] text-[var(--demo-muted)]">
            {t('lead.score')} {view.score}
          </span>
        </span>
        <StageTrack stage={view.stage} lost={lost} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop: list · transcript · lead file                                */
/* ------------------------------------------------------------------ */
export function LaptopInbox() {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  return (
    <div className="flex h-full min-h-0 flex-col gap-[0.8em]">
      <ViewHead
        kicker={t('top.date', { date: x.day(view.clock.day, 'long'), time: x.clock(view.clock) })}
        title={t('people.carolina')}
        sub={`${t('sources.web')} · ${listingById(ASKED).street}`}
        aside={<BotSwitch withHint className="w-[17em]" />}
      />
      <div className="re-inbox">
        <ConvoList />
        <Transcript />
        <LeadFile />
      </div>
    </div>
  );
}
