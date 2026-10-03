'use client';

import { useMemo, type ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { runChat, type ChatRun } from '../kit';
import { ALTERNATIVE, ASKED, BOT_SECONDS, CHAT_SLOTS, SIMILAR, STORY, VISIT_MIN, dayDate, listingById, type ListingId } from './data';
import { FOLLOW, INQUIRY, UNANSWERED, clockAt, toScript, type EstateView } from './story';
import { Facade } from './facade';
import { useEstateText } from './ui';
import { useEstate } from './context';

/** Default runs (auto replies, real timing): their times label messages under reduced motion. */
const NOMINAL = {
  inquiry: runChat(toScript(INQUIRY), 1e9, {}),
  unanswered: runChat(toScript(UNANSWERED), 1e9, {}),
  follow: runChat(toScript(FOLLOW), 1e9, {}),
};

/** A listing inside a chat bubble: façade, title, price. */
export function ListingChip({ id }: { id: ListingId }) {
  const x = useEstateText();
  const l = listingById(id);
  return (
    <span className="re-chip-listing">
      <Facade listing={l} className="re-chip-listing-img" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{l.street}</span>
        <span className="block truncate opacity-80">
          {x.rooms(id)} · {x.t('listing.area', { count: l.area })}
        </span>
        <span className="re-chip-price demo-num">{x.price(l.price)}</span>
      </span>
    </span>
  );
}

/** A booked visit inside a chat bubble: date tile + time, address, advisor. */
export function VisitChip({ day, start, listing }: { day: number; start: number; listing: ListingId }) {
  const x = useEstateText();
  const date = dayDate(day);
  return (
    <span className="re-chip-visit">
      <span className="re-chip-visit-date" aria-hidden>
        <span>{x.fmt.date(date, { weekday: 'short' }).replace('.', '')}</span>
        <b>{x.fmt.date(date, { day: 'numeric' })}</b>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold demo-num">
          {x.fmt.time(start)}–{x.fmt.time(start + VISIT_MIN)}
        </span>
        <span className="block truncate">{listingById(listing).street}</span>
        <span className="block truncate opacity-80">{x.t('visits.withAdvisor', { advisor: x.t('people.julia') })}</span>
      </span>
    </span>
  );
}

function localize(
  run: ChatRun,
  text: (step: string) => ReactNode,
  card: (step: string) => ReactNode | undefined,
  label: (reply: string) => string,
  nominal: ChatRun | null,
): ChatRun {
  const atOf = (id: string, at: number) => (nominal ? (nominal.items.find((i) => i.id === id)?.at ?? at) : at);
  return {
    ...run,
    items: run.items.map((it) =>
      it.id.endsWith(':reply')
        ? { ...it, text: label(run.chosen[it.step] ?? ''), at: atOf(it.id, it.at) }
        : { ...it, text: text(it.step), card: card(it.step), at: atOf(it.id, it.at), replies: it.replies?.map((r) => ({ ...r, label: label(r.id) })) },
    ),
    awaiting: run.awaiting ? { ...run.awaiting, replies: run.awaiting.replies.map((r) => ({ ...r, label: label(r.id) })) } : null,
  };
}

/** The conversations of the story, in the current locale. */
export function useEstateChats() {
  const x = useEstateText();
  return useMemo(() => {
    const { t, fmt } = x;
    const name = t('people.carolinaFirst');
    const advisor = t('people.juliaFirst');
    const asked = listingById(ASKED);

    /** `plain`: texts only (previews), without the "AI · 4 s" tags. */
    const inquiry = (view: EstateView, reduced: boolean, plain = false): ChatRun => {
      const botTag = (step: string, s: string): ReactNode => plain ? s : (
        <>
          {s}
          {view.botOff ? null : (
            <span className="re-ai-tag" aria-hidden>
              {t('chat.ai')} · {t('chat.answeredIn', { seconds: BOT_SECONDS[step] ?? 3 })}
            </span>
          )}
        </>
      );
      const text = (step: string): ReactNode => {
        switch (step) {
          case 'ask':
            return t('chat.steps.ask', { street: asked.street });
          case 'hi':
            return botTag(step, t('chat.steps.hi', { name }));
          case 'fits':
            return botTag(step, t(`chat.steps.fits_${view.pay ?? 'credit'}`, { price: fmt.num(asked.price) }));
          case 'alt':
            return botTag(step, t('chat.steps.alt', { price: fmt.num(asked.price), altPrice: fmt.num(listingById(ALTERNATIVE).price) }));
          case 'slots':
            return botTag(step, t('chat.steps.slots', { advisor }));
          case 'booked':
            return botTag(step, t('chat.steps.booked', { name, advisor, slot: view.slot ? x.slotLong(CHAT_SLOTS[view.slot]) : '' }));
          case 'pay':
          case 'budget':
            return botTag(step, t(`chat.steps.${step}`));
          case 'human':
            return t('chat.steps.human', { name });
          case 'lostNote':
            return t('chat.steps.lostNote', { late: x.late });
          default:
            return t(`chat.steps.${step}`);
        }
      };
      const card = (step: string) =>
        step === 'alt' ? <ListingChip id={ALTERNATIVE} /> : step === 'booked' && view.slot ? <VisitChip {...CHAT_SLOTS[view.slot]} listing={view.listing} /> : undefined;
      const label = (id: string) => (id === 'fri' || id === 'sat' ? x.slot(CHAT_SLOTS[id]) : id ? t(`chat.replies.${id}`) : '');
      return localize(view.chat, text, card, label, reduced ? (view.botOff ? NOMINAL.unanswered : NOMINAL.inquiry) : null);
    };

    const follow = (view: EstateView, reduced: boolean): ChatRun | null => {
      if (!view.follow) return null;
      const l = listingById(view.listing);
      const text = (step: string): ReactNode => t(`follow.steps.${step}`, { name, street: l.street, advisor });
      const card = (step: string) =>
        step === 'similarList' ? (
          <span className="flex flex-col gap-[0.4em]">
            {SIMILAR.filter((id) => id !== view.listing)
              .concat(view.listing === ASKED ? [] : [ASKED])
              .slice(0, 2)
              .map((id) => (
                <ListingChip key={id} id={id} />
              ))}
          </span>
        ) : step === 'reserved' ? (
          <span className="re-chip-reserved">
            <KeyRound aria-hidden strokeWidth={1.8} />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{l.street}</span>
              <span className="block truncate opacity-80">{t('listing.reserved')} · 72 h</span>
            </span>
          </span>
        ) : undefined;
      const label = (id: string) => (id ? t(`follow.replies.${id}`) : '');
      return localize(view.follow, text, card, label, reduced ? NOMINAL.follow : null);
    };

    return { inquiry, follow };
  }, [x]);
}

/** Clock label for a story time (follows the night's jumps). */
export function useStamp() {
  const { view } = useEstate();
  const x = useEstateText();
  const slot = view.slot ? CHAT_SLOTS[view.slot] : null;
  const tl = view.timelapseAt !== null && slot ? { at: view.timelapseAt, day: slot.day, end: slot.start + VISIT_MIN } : null;
  return (storyAt: number) => x.clock(clockAt(storyAt, view.botOff, tl));
}

/** Chat time → clock label of the 23:40 conversation. */
export const chatStoryAt = (at: number) => STORY.chatStart + at;
