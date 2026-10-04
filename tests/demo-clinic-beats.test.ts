import { describe, expect, it } from 'vitest';
import { BEATS, STORY, TODAY } from '@/components/demos/clinic/data';
import { createClinicStore, dayAppts, deriveClinic, freeTimes, martinaScript, scheduleFor } from '@/components/demos/clinic/story';

const martina = martinaScript(() => ({ text: '' }), (id) => id);
const voice = () => ({ texts: [] as string[] });
const fresh = () => createClinicStore(false).getSnapshot().state;

describe('Clínica Aurora beats (kit v3 reference)', () => {
  it('nothing has happened at rest (t = 0)', () => {
    const v = deriveClinic(fresh(), 0, false, martina, voice);
    expect(v.events.filter((e) => e.at >= 0)).toEqual([]);
    expect(v.call.phase).toBe('idle');
    expect(v.chat.items).toEqual([]);
  });

  it('every beat ends on a calm frame (no toast / "just now" window, no typing, no live call)', () => {
    for (const beat of BEATS) {
      const v = deriveClinic(fresh(), beat.at, false, martina, voice);
      const recent = v.events.filter((e) => e.at >= 0 && beat.at - e.at < 3400);
      expect(recent, beat.id).toEqual([]);
      expect(v.chat.typing, beat.id).toBe(false);
      expect(['idle', 'ended', 'missed'], beat.id).toContain(v.call.phase);
    }
  });

  it('the story reaches its end through the beats', () => {
    const end = deriveClinic(fresh(), BEATS[BEATS.length - 1].at, false, martina, voice);
    const ids = end.events.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['online', 'valentina', 'martina', 'nicolas', 'paula', 'julian']));
    expect(end.recovered.total).toBe(12);
    expect(end.chat.awaiting).toBeNull();
  });

  it('beats land in order: each segment contains its own events', () => {
    const at = (i: number) => deriveClinic(fresh(), BEATS[i].at, false, martina, voice).events.map((e) => e.id);
    expect(at(0)).toContain('online');
    expect(at(0)).not.toContain('valentina');
    expect(at(1)).toContain('martina');
    expect(at(1)).not.toContain('nicolas');
    expect(at(2)).toContain('paula');
    expect(at(2)).not.toContain('call');
    expect(STORY.callStart).toBeGreaterThan(BEATS[2].at);
  });

  it('other days: deterministic schedule, past days read-only, future days bookable', () => {
    expect(scheduleFor(5)).toEqual(scheduleFor(5));
    const state = fresh();
    const view = deriveClinic(state, 0, false, martina, voice);
    expect(freeTimes(TODAY - 1, 'lucia', 30, state, view)).toEqual([]);
    expect(freeTimes(TODAY + 4, 'lucia', 60, state, view).length).toBeGreaterThan(0);
    const booked = { ...state, mine: [{ pro: 'lucia' as const, day: 7, start: freeTimes(7, 'lucia', 30, state, view)[0], treatment: 'cleaning' as const, at: 0, via: 'site' as const }] };
    expect(dayAppts(7, booked, view).some((a) => a.status === 'you')).toBe(true);
  });
});
