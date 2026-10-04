'use client';

import { useMemo } from 'react';
import { BookOpenText, CalendarCheck, ChefHat, LayoutGrid, Wheat, type LucideIcon } from 'lucide-react';
import { runVoice, type VoiceState } from '../kit';
import { AI_BOOKING, tableById, type Items } from './data';
import { callScript, totalUsd, type CallPlan } from './story';
import { useRestaurantText } from './text';

/** Every call's transcript in the current locale (the timing lives in story.ts FLOWS). */
export function useCallScripts() {
  const x = useRestaurantText();
  return useMemo(() => {
    const { t, fmt } = x;
    const total = (items: Items | undefined) => x.cash(x.sum(items ?? {}));

    const texts = (c: CallPlan): { texts: string[]; icons: (LucideIcon | undefined)[] } => {
      const ticket = c.ticket ? String(c.ticket) : '';
      switch (c.kind) {
        case 'order': {
          const items = c.items ?? {};
          const empty = !Object.keys(items).length;
          const subs = c.subs ?? [];
          const values = {
            items: x.spoken(items),
            total: total(items),
            address: t('people.marta.address'),
            missing: x.names(subs.map(([from]) => from)),
            alts: x.names(subs.flatMap(([, to]) => (to ? [to] : []))),
            num: ticket,
            first: x.first('marta'),
          };
          return {
            texts: [
              t('calls.order.hello'),
              t('calls.order.ask'),
              subs.length ? t('calls.order.checkSub', values) : t('calls.order.check', { items: values.items }),
              empty ? t('calls.none.offer') : subs.length ? t('calls.order.offerSub', values) : t('calls.order.offer', values),
              empty ? t('calls.none.yes') : t('calls.order.yes'),
              empty ? t('calls.none.ticket') : t('calls.order.ticket', values),
              empty ? t('calls.none.bye') : t('calls.order.bye', values),
            ],
            icons: [undefined, undefined, BookOpenText, undefined, undefined, ChefHat, undefined],
          };
        }
        case 'booking': {
          const table = c.table ?? null;
          const values = { time: fmt.time(AI_BOOKING.time), table: table ?? '', name: x.person('ramiro'), first: x.first('ramiro') };
          return {
            texts: [
              t('calls.booking.hello'),
              t('calls.booking.ask', values),
              table === null ? t('calls.booking.checkNone', values) : t('calls.booking.check', values),
              table === null ? t('calls.booking.offerNone', values) : tableById(table).window ? t('calls.booking.offerWindow', values) : t('calls.booking.offer', values),
              t('calls.booking.name', values),
              table === null ? t('calls.booking.waitlist') : t('calls.booking.book', values),
              table === null ? t('calls.booking.byeNone', values) : t('calls.booking.bye', values),
            ],
            icons: [undefined, undefined, LayoutGrid, undefined, undefined, CalendarCheck, undefined],
          };
        }
        case 'gf': {
          const items = c.items ?? {};
          const pick = Object.keys(items)[0] as keyof Items | undefined;
          const ready = c.eta !== undefined ? fmt.time(c.eta) : '';
          const values = {
            count: c.gfList?.length ?? 0,
            list: x.names(c.gfList ?? []),
            dish: pick ? x.dishA(pick) : '',
            num: ticket,
            time: ready,
          };
          return {
            texts: [
              t('calls.gf.hello'),
              t('calls.gf.ask'),
              t('calls.gf.check', values),
              values.count ? t('calls.gf.offer', values) : t('calls.gf.offerNone'),
              pick ? t('calls.gf.order', values) : t('calls.none.yes'),
              pick ? t('calls.gf.ticket', values) : t('calls.none.ticket'),
              pick ? t('calls.gf.bye', values) : t('calls.none.bye'),
            ],
            icons: [undefined, undefined, Wheat, undefined, undefined, ChefHat, undefined],
          };
        }
        case 'alt':
        default: {
          const asked = c.dish ?? 'napolitana';
          const sub = c.subs?.[0];
          const alt = sub ? sub[1] : asked;
          const values = { dish: x.dish(asked), dishA: x.dishA(asked), alt: alt ? x.dish(alt) : '', altA: alt ? x.dishA(alt) : '', num: ticket };
          return {
            texts: [
              t('calls.alt.hello'),
              t('calls.alt.ask', values),
              sub ? (alt ? t('calls.alt.checkSub', values) : t('calls.alt.checkNone', values)) : t('calls.alt.check', values),
              sub ? (alt ? t('calls.alt.offerSub', values) : t('calls.none.offer')) : t('calls.alt.offer', values),
              alt ? t('calls.alt.yes') : t('calls.none.yes'),
              alt ? t('calls.alt.ticket', values) : t('calls.none.ticket'),
              alt ? t('calls.alt.bye') : t('calls.none.bye'),
            ],
            icons: [undefined, undefined, BookOpenText, undefined, undefined, ChefHat, undefined],
          };
        }
      }
    };

    /** The call as the VoiceCall card shows it at story time `now`. */
    const display = (c: CallPlan, now: number, instant: boolean): VoiceState => {
      const { texts: lines, icons } = texts(c);
      return runVoice(callScript(c.kind, c.missed, lines, icons), now - c.start, { instant: instant && now >= c.start });
    };

    /** Who's calling, as the card's header says it at this point of the call. */
    const caller = (c: CallPlan, state: VoiceState): { name: string; sub: string } => {
      const said = state.phase === 'ended' ? 99 : state.lines.length;
      switch (c.kind) {
        case 'order':
          return { name: x.person('marta'), sub: t('calls.frequent') };
        case 'booking':
          return said >= 5 && !c.missed ? { name: x.person('ramiro'), sub: t('calls.topic.booking') } : { name: t('people.ramiro.phone'), sub: t('calls.newCaller') };
        case 'gf':
          return { name: t('people.lucia.phone'), sub: t('calls.newCaller') };
        default:
          return { name: t('calls.unknownNumber'), sub: t('calls.newCaller') };
      }
    };

    const usd = (c: CallPlan) => totalUsd(c.items ?? {});
    return { texts, display, caller, usd, total };
  }, [x]);
}

export type CallScripts = ReturnType<typeof useCallScripts>;
