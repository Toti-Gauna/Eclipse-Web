import { describe, expect, it } from 'vitest';
import { BEATS, STORY, TODAY, WEB_BOOKING } from '@/components/demos/restaurant/data';
import { act, createRestaurantStore, dayBookings, dayTables, deriveRestaurant, isMine, seededBookings, type RestaurantState } from '@/components/demos/restaurant/story';

const fresh = () => createRestaurantStore(false).getSnapshot().state;
const at = (i: number, state: RestaurantState = fresh()) => deriveRestaurant(state, BEATS[i].at, false);
const ids = (i: number) => at(i).events.map((e) => e.id);

describe('Bodegón Lucero beats (no autoplay)', () => {
  it('nothing has happened at rest (t = 0)', () => {
    const v = deriveRestaurant(fresh(), 0, false);
    expect(v.events.filter((e) => e.at >= 0)).toEqual([]);
    expect(v.liveCount).toBe(0);
    expect(v.tickets.every((tk) => tk.placed < 0)).toBe(true);
  });

  it('the store never ticks at rest and plays one beat at a time', () => {
    const store = createRestaurantStore(false);
    store.acquire({});
    expect(store.getSnapshot().playing).toBe(false);
    store.play?.();
    expect(store.getSnapshot().segment?.to).toBe(BEATS[0].at);
    store.finish?.();
    expect(store.getSnapshot()).toMatchObject({ t: BEATS[0].at, beat: 0, playing: false });
  });

  it('every beat ends on a calm frame (no live call, no toast window, nothing "just printed")', () => {
    for (const [i, beat] of BEATS.entries()) {
      const v = at(i);
      expect(v.liveCount, beat.id).toBe(0);
      expect(v.calls.filter((c) => c.start <= beat.at).every((c) => c.voice.phase === 'ended' || c.voice.phase === 'missed'), beat.id).toBe(true);
      const recent = v.events.filter((e) => e.at >= 0 && beat.at - e.at < 3400);
      expect(recent, beat.id).toEqual([]);
      expect(v.tickets.filter((tk) => tk.stageAt >= 0 && beat.at - tk.stageAt < 3400), beat.id).toEqual([]);
      expect(v.bookings.some((b) => b.pending), beat.id).toBe(false);
    }
  });

  it('beats land in order: each segment contains its own events', () => {
    expect(ids(0)).toContain('ai-order');
    expect(ids(0)).not.toContain('ai-booking');
    expect(ids(1)).toEqual(expect.arrayContaining(['ai-alt', 'ai-booking', 'ai-gf']));
    expect(ids(1)).not.toContain('walk-in');
    expect(ids(2)).toEqual(expect.arrayContaining(['walk-in', 'qr-walkin', 'bill', 'qr-dessert']));
    expect(ids(2)).not.toContain('web');
    expect(ids(3)).toEqual(expect.arrayContaining(['web', 'web-booking']));
  });

  it('the rush beat has three calls live at once', () => {
    const v = deriveRestaurant(fresh(), STORY.rush.gf + 3000, false);
    expect(v.liveCount).toBe(3);
    expect(at(1).stats.peak).toBe(3);
  });

  it("the visitor's order lands in the kitchen at once and only moves when they move it", () => {
    const store = createRestaurantStore(false);
    store.update(act.order({ napolitana: 1, flan: 1 }, 'table', 'sin sal'));
    let v = deriveRestaurant(store.getSnapshot().state, store.getSnapshot().t, false);
    const mine = v.board.find((tk) => tk.mine)!;
    expect(mine).toMatchObject({ stage: 'new', channel: 'salon', note: 'sin sal' });
    expect(v.events.filter(isMine).length).toBe(1);
    store.update(act.move(mine.id, 'ready'));
    v = deriveRestaurant(store.getSnapshot().state, BEATS[3].at, false);
    expect(v.tickets.find((tk) => tk.id === mine.id)).toMatchObject({ stage: 'ready', movedByYou: true });
  });

  it('a dish marked out of stock makes the AI offer the alternative in a later call', () => {
    const state = act.toggleStock('napolitana')(fresh(), 0);
    const call = at(0, state).calls.find((c) => c.id === 'order')!;
    expect(call.subs?.[0]).toEqual(['napolitana', 'suprema']);
    expect(call.items?.napolitana).toBeUndefined();
  });

  it('with the AI phone off the calls of a beat are missed', () => {
    const state = act.toggleAi()(fresh(), 0);
    const v = at(0, state);
    expect(v.calls[0].missed).toBe(true);
    expect(v.stats.missed).toBe(1);
  });

  it('reservations: any day, past nights read-only, booking a future night', () => {
    expect(seededBookings(TODAY + 3)).toEqual(seededBookings(TODAY + 3));
    const state = fresh();
    const v = deriveRestaurant(state, 0, false);
    expect(dayTables(TODAY - 1, state, v).some((tb) => tb.status === 'done')).toBe(true);
    const free = dayTables(TODAY + 2, state, v).find((tb) => tb.status === 'free')!;
    const booked = act.book({ day: TODAY + 2, table: free.id, time: 21 * 60, people: 2, via: 'you' })(state, 0);
    expect(dayBookings(TODAY + 2, booked, v).some((b) => b.mine && b.table === free.id)).toBe(true);
    const end = at(3);
    expect(dayBookings(WEB_BOOKING.day, state, end).some((b) => b.key === 'web-julieta')).toBe(true);
  });
});
