import { describe, expect, it } from 'vitest';
import { BEATS, STORY } from '@/components/demos/academy/data';
import { TIMING_SCRIPTS, act, createAcademyStore, deriveAcademy, freshAcademy, type AcademyState } from '@/components/demos/academy/story';

const at = (i: number) => BEATS[i].at;
const run = (state: AcademyState, t: number) => deriveAcademy(state, t, false, TIMING_SCRIPTS);
const apply = (state: AcademyState, t: number, ...fns: ((s: AcademyState, t: number) => AcademyState)[]) => fns.reduce((s, f) => f(s, t), state);

describe('Atrio Idiomas beats (no autoplay)', () => {
  it('the store starts at rest: nothing happened at t = 0', () => {
    const snap = createAcademyStore(false).getSnapshot();
    expect(snap.t).toBe(0);
    expect(snap.playing).toBe(false);
    const v = run(snap.state, 0);
    expect(v.events.filter((e) => e.at >= 0)).toEqual([]);
    expect(v.speak.state.phase).toBe('idle');
    expect(v.tutor.items).toEqual([]);
    expect(v.lead.items).toEqual([]);
    expect(v.martin.status).toBe('idle');
  });

  it('every beat ends on a calm frame (no toast window, typing or live session)', () => {
    for (const beat of BEATS) {
      const v = run(freshAcademy(), beat.at);
      const recent = v.events.filter((e) => e.at >= 0 && !e.mine && beat.at - e.at < 3400);
      expect(recent, beat.id).toEqual([]);
      expect(v.tutor.typing, beat.id).toBe(false);
      expect(v.lead.typing, beat.id).toBe(false);
      expect(v.martin.wa?.typing ?? false, beat.id).toBe(false);
      expect(['idle', 'ended'], beat.id).toContain(v.speak.state.phase);
      expect(v.cards.some((c) => c.fresh), beat.id).toBe(false);
    }
  });

  it('beats land in order and the story reaches its end', () => {
    const kinds = (i: number) => run(freshAcademy(), at(i)).events.map((e) => e.kind);
    expect(kinds(0)).toContain('speaking');
    expect(kinds(0)).not.toContain('complete');
    const w = run(freshAcademy(), at(1));
    expect(w.tutor.awaiting?.step).toBe('quiz');
    expect(kinds(2)).toEqual(expect.arrayContaining(['complete', 'levelUp', 'booked']));
    expect(kinds(2)).not.toContain('test');
    expect(kinds(3)).toEqual(expect.arrayContaining(['test', 'level', 'enrolled', 'paid']));
    expect(kinds(3)).not.toContain('flagged');
    const end = run(freshAcademy(), at(4));
    expect(end.events.map((e) => e.kind)).toEqual(expect.arrayContaining(['flagged', 'nudge', 'replied', 'back']));
    expect(end.level).toBe('B1');
    expect(end.martin.status).toBe('back');
    expect(Math.round(end.kpi.completion * 100)).toBe(82);
    expect(end.cards.find((c) => c.id === 'martin')?.column).toBe('back');
  });

  it('nudges off: Martín drops out and completion falls to 80 %', () => {
    const off = apply(freshAcademy(), 0, act.toggleNudge());
    const end = run(off, at(4));
    expect(end.martin.status).toBe('dropped');
    expect(Math.round(end.kpi.completion * 100)).toBe(80);
  });

  it('visitor actions show at once on the frozen clock', () => {
    // A wrong answer at rest after beat 2: the lesson completes now, B1 waits.
    let s = apply(freshAcademy(), at(1), act.pickTutor('quiz', 'buyed'));
    let v = run(s, at(1));
    expect(v.answer).toBe('wrong');
    expect(v.completeAt).toBe(at(1));
    expect(v.level).toBe('A2');
    expect(v.events.filter((e) => e.at === at(1)).every((e) => e.mine)).toBe(true);
    // The right one instead: B1 at once, then the club.
    s = apply(freshAcademy(), at(1), act.pickTutor('quiz', 'bought'));
    v = run(s, at(1));
    expect(v.level).toBe('B1');
    s = apply(s, at(1), act.book());
    expect(run(s, at(1)).booked).toBe(at(1));
    // The level test, taken by the visitor: enrolled and paid at once.
    s = apply(freshAcademy(), 0, act.startSite(null));
    for (const [step, reply] of [['hi', 'start'], ['q1', 'goes'], ['q2', 'saw'], ['q3', 'have'], ['result', 'enroll'], ['pay', 'transfer']]) s = apply(s, 0, act.pickSite(step, reply));
    v = run(s, 0);
    expect(v.mineEnrollment).toMatchObject({ who: 'you', level: 'B1', course: 'B2', pay: 'transfer', at: 0 });
    expect(v.kpi.enrollments).toBeGreaterThan(run(freshAcademy(), 0).kpi.enrollments);
    // Move a card on the follow-up board.
    s = apply(freshAcademy(), 0, act.moveCard('tomas', 'nudged'));
    expect(run(s, 0).cards.find((c) => c.id === 'tomas')?.column).toBe('nudged');
  });

  it('the visitor can answer as Martín before the story does', () => {
    const t = STORY.nudge + 800;
    const s = apply(freshAcademy(), t, act.pickWa('nudge', 'later', STORY.nudge));
    const v = run(s, at(4));
    expect(v.martin.status).toBe('later');
  });
});
