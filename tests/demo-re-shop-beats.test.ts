import { describe, expect, it } from 'vitest';
import { BEATS as RE_BEATS, STORY as RE_STORY } from '@/components/demos/real-estate/data';
import { act as reAct, createEstateStore, dayVisits, deriveEstate, freeSiteSlots, generatedVisits, isVisitFree } from '@/components/demos/real-estate/story';
import { BEATS as SHOP_BEATS } from '@/components/demos/shop/data';
import { BOT_FLOW, WA_FLOW, act as shopAct, botGoto, buildScript, createShopStore, deriveShop, waGoto } from '@/components/demos/shop/story';

/** Calm frame: no toast / "just now" window (3.4 s), no typing. */
const CALM = 3400;

describe('Lumen Propiedades beats', () => {
  const fresh = () => createEstateStore(false).getSnapshot().state;

  it('nothing has happened at rest (t = 0)', () => {
    const v = deriveEstate(fresh(), 0);
    expect(v.events.filter((e) => e.at >= 0)).toEqual([]);
    expect(v.chat.items).toEqual([]);
    expect(v.stage).toBeNull();
  });

  for (const botOff of [false, true]) {
    it(`every beat ends on a calm frame (assistant ${botOff ? 'off' : 'on'})`, () => {
      const state = { ...fresh(), botOff };
      for (const beat of RE_BEATS) {
        const v = deriveEstate(state, beat.at);
        expect(v.events.filter((e) => e.at >= 0 && beat.at - e.at < CALM), beat.id).toEqual([]);
        expect(v.chat.typing, beat.id).toBe(false);
        expect(v.follow?.typing ?? false, beat.id).toBe(false);
      }
    });
  }

  it('each beat lands its own step: answer → qualified → visit → follow-up → reserve', () => {
    const at = (i: number) => deriveEstate(fresh(), RE_BEATS[i].at);
    expect(at(0).stage).toBe('new');
    expect(at(0).chat.awaiting?.step).toBe('pay');
    expect(at(1).stage).toBe('qualified');
    expect(at(1).chat.awaiting?.step).toBe('slots');
    expect(at(2).stage).toBe('visit');
    expect(at(2).visits.some((v) => v.who === 'carolina')).toBe(true);
    expect(at(3).follow?.awaiting?.step).toBe('how');
    expect(at(4).stage).toBe('reserve');
  });

  it('assistant off: the lead is lost by the last beat', () => {
    const v = deriveEstate({ ...fresh(), botOff: true }, RE_BEATS[RE_BEATS.length - 1].at);
    expect(v.cards.find((c) => c.id === 'carolina')?.note).toBe('lost');
  });

  it('the visitor answers for Carolina at rest: the reply shows at once, the rest keeps its beats', () => {
    const s0 = fresh();
    const t = RE_BEATS[0].at;
    const s1 = reAct.pick('pay', 'cash')(s0, t);
    const v = deriveEstate(s1, t);
    expect(v.pay).toBe('cash');
    expect(v.chat.awaiting?.step).toBe('budget');
    expect(v.chat.typing).toBe(false);
    // Budget still gets answered inside beat 2.
    expect(deriveEstate(s1, RE_BEATS[1].at).stage).toBe('qualified');
  });

  it('visits: any day, past days done, a booking lands where it was made', () => {
    const v = deriveEstate(fresh(), 0);
    expect(generatedVisits(10)).toEqual(generatedVisits(10));
    expect(dayVisits(1, v).every((x) => x.state === 'done')).toBe(true);
    expect(isVisitFree(v, 1, 600)).toBe(false);
    const slot = freeSiteSlots(v, 1)[0];
    const booked = reAct.book({ ...slot, listing: 'olmos', advisor: 'marcos', via: 'site' })(fresh(), 0);
    const v2 = deriveEstate(booked, 0);
    expect(dayVisits(slot.day, v2).some((x) => x.who === 'you')).toBe(true);
    expect(v2.cards.find((c) => c.id === 'you')?.column).toBe('visit');
  });

  it('pipeline: a card the visitor moved stays until the story changes it', () => {
    const moved = reAct.moveCard('valeria', 'qualified')(fresh(), 0);
    expect(deriveEstate(moved, RE_STORY.chatStart).cards.find((c) => c.id === 'valeria')?.column).toBe('qualified');
  });
});

describe('Bruma Tostadores beats', () => {
  const bot = buildScript(BOT_FLOW, botGoto, () => ({ text: '' }), (_s, id) => id);
  const wa = buildScript(WA_FLOW, waGoto, () => ({ text: '' }), (_s, id) => id);
  const fresh = () => createShopStore(false).getSnapshot().state;
  const derive = (state = fresh(), t = 0) => deriveShop(state, t, bot, wa);

  it('nothing has happened at rest (t = 0)', () => {
    const v = derive();
    expect(v.events.filter((e) => e.at >= 0)).toEqual([]);
    expect(v.ines.phase).toBe('catalog');
  });

  for (const off of [false, true]) {
    it(`every beat ends on a calm frame (recovery ${off ? 'off' : 'on'})`, () => {
      const state = { ...fresh(), off: off ? [{ from: -1, to: null }] : [] };
      for (const beat of SHOP_BEATS) {
        const v = derive(state, beat.at);
        expect(v.events.filter((e) => e.at >= 0 && beat.at - e.at < CALM), beat.id).toEqual([]);
        expect(v.ines.chat.typing, beat.id).toBe(false);
        expect(v.ines.wa?.typing ?? false, beat.id).toBe(false);
      }
    });
  }

  it('each beat lands its own step: pick → abandoned → message → paid → level up', () => {
    const at = (i: number) => derive(fresh(), SHOP_BEATS[i].at);
    expect(at(0).ines.pick).not.toBeNull();
    expect(at(0).ines.addAt).toBeNull();
    expect(at(1).ines.status).toBe('abandoned');
    expect(at(2).ines.status).toBe('read');
    expect(at(2).ines.phase).toBe('whatsapp');
    expect(at(3).ines.status).toBe('recovered');
    expect(at(4).club.levelUpAt).not.toBeNull();
    expect(at(4).week.paid).toBe(at(0).week.paid + 1);
  });

  it('recovery off: no message, the cart is lost', () => {
    const v = derive({ ...fresh(), off: [{ from: -1, to: null }] }, SHOP_BEATS[3].at);
    expect(v.ines.sent).toBe(false);
    expect(v.ines.status).toBe('lost');
  });

  it("the visitor's own cart: checkout → leave → simulate 30 min → coupon → pay, all at once", () => {
    const t = 1234;
    let s = shopAct.mineAdd({ product: 'huila', size: 's250', grind: 'filter', qty: 2 })(fresh());
    s = shopAct.mineLeave()(s, t);
    expect(s.mine.abandoned).not.toBeNull();
    expect(s.mine.recovery).toBeNull();
    s = shopAct.mineRecover()(s, t);
    expect(s.mine.recovery?.sent).toBe(true);
    s = shopAct.mineWaPick('msg', 'back')(s);
    expect(s.mine.coupon).toBe(true);
    s = shopAct.minePay('card')(s, t);
    const v = derive(s, t);
    const order = v.orders.find((o) => o.customer === 'you');
    expect(order?.coupon).toBe(true);
    expect(v.week.paid).toBe(derive().week.paid + 1);
  });

  it('orders: the visitor advances one, and it stays', () => {
    const s = shopAct.advance('o1045', 'roasting')(fresh(), 0);
    expect(derive(s, 0).orders.find((o) => o.key === 'o1045')?.stage).toBe('roasting');
  });
});
