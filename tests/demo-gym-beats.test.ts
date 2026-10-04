import { describe, expect, it } from 'vitest';
import { AT, BEATS, sessionById, sessionsOn } from '@/components/demos/gym/model';
import { act, canBook, canCheckIn, createGymStore, deriveGym, freshGym, type GymState } from '@/components/demos/gym/story';

const at = (i: number) => BEATS[i].at;
const run = (state: GymState, t: number) => deriveGym(state, t, false);
const apply = (state: GymState, t: number, ...fns: ((s: GymState, t: number) => GymState)[]) => fns.reduce((s, f) => f(s, t), state);

describe('Órbita Fitness beats (no autoplay)', () => {
  it('the store starts at rest: nothing happened at t = 0', () => {
    const snap = createGymStore(false).getSnapshot();
    expect(snap.t).toBe(0);
    expect(snap.playing).toBe(false);
    const v = run(snap.state, 0);
    expect(v.events).toEqual([]);
    expect(v.sentAt).toBeNull();
    expect(v.lead.items).toEqual([]);
    expect(v.push).toBeNull();
  });

  it('every beat ends on a calm frame (no toast window, typing, push or time-lapse cut)', () => {
    for (const beat of BEATS) {
      const v = run(freshGym(), beat.at);
      const recent = v.events.filter((e) => !e.mine && beat.at - e.at < 3400);
      expect(recent, beat.id).toEqual([]);
      expect(v.lead.typing, beat.id).toBe(false);
      expect(v.wa.typing, beat.id).toBe(false);
      expect(v.push, beat.id).toBeNull();
      expect(v.dayCut, beat.id).toBeNull();
    }
  });

  it('beats land in order and the story reaches its end', () => {
    const ids = (i: number) => run(freshGym(), at(i)).events.map((e) => e.kind);
    expect(ids(0)).toContain('trial');
    expect(ids(0)).not.toContain('flag');
    expect(ids(1)).toEqual(expect.arrayContaining(['flag', 'sent']));
    expect(run(freshGym(), at(1)).wa.awaiting?.step).toBe('mission');
    expect(ids(1)).not.toContain('booked');
    expect(ids(2)).toEqual(expect.arrayContaining(['booked', 'back', 'book2']));
    expect(ids(2)).not.toContain('mission');
    const end = run(freshGym(), at(3));
    expect(end.events.map((e) => e.kind)).toEqual(expect.arrayContaining(['checkin2', 'mission', 'levelup', 'league', 'trialIn']));
    expect(end.level).toBe(7);
    expect(end.heroRank).toBe(3);
    expect(end.status).toBe('done');
  });

  it('automation off: no WhatsApp, and Lucía cancels on Tuesday', () => {
    const off = apply(freshGym(), 1000, act.toggleWin());
    expect(run(off, at(1)).sentAt).toBeNull();
    const tue = run(off, at(2));
    expect(tue.status).toBe('churned');
    expect(tue.churnAt).not.toBeNull();
  });

  it('the owner sends it by hand: the chat shows at once and the story answers it on Tuesday', () => {
    const off = apply(freshGym(), 1000, act.toggleWin());
    const sent = apply(off, at(1), act.sendNow('lucia'));
    const now = run(sent, at(1));
    expect(now.sentManual).toBe(true);
    expect(now.wa.awaiting?.step).toBe('mission');
    expect(run(sent, at(2)).status).toBe('back');
  });

  it('visitor actions show at once on the frozen clock', () => {
    const t = at(1);
    // Answer the WhatsApp as Lucía: book Tuesday 19:00.
    let s = apply(freshGym(), t, act.pickWa('mission', 'book', AT.win));
    s = apply(s, t, act.pickWa('slots', 'opt1', AT.win));
    let v = run(s, t);
    expect(v.book1?.session).toBe('1-1140');
    expect(v.missions.find((m) => m.id === 'comeback')?.shown).toBe(true);
    // Book a new kind of class today and check in: XP, mission and league move at once.
    const spin = sessionsOn(0).find((x) => x.kind === 'spinning')!;
    expect(canBook(v, spin)).toBe(true);
    s = apply(s, t, act.book(spin.id));
    v = run(s, t);
    expect(canCheckIn(v, spin.id)).toBe(true);
    const before = v.inLevel;
    s = apply(s, t, act.checkin(spin.id), act.friend());
    v = run(s, t);
    expect(v.missions.find((m) => m.id === 'newClass')?.doneAt).toBe(t);
    expect(v.missions.find((m) => m.id === 'friend')?.doneAt).toBe(t);
    expect(v.level * 10_000 + v.inLevel).toBeGreaterThan(6 * 10_000 + before);
    expect(v.status).toBe('back');
    // Nothing the visitor did shows a "just now" toast window.
    expect(v.events.filter((e) => e.at === t).every((e) => e.mine)).toBe(true);
  });

  it('the timetable repeats: past weeks are read-only, future weeks bookable', () => {
    const v = run(freshGym(), 0);
    expect(sessionById('-7-420')?.day).toBe(-7);
    expect(canBook(v, sessionById('-7-420')!)).toBe(false);
    expect(canBook(v, sessionById('9-1140')!)).toBe(true);
    expect(sessionsOn(6)).toEqual([]);
  });
});
