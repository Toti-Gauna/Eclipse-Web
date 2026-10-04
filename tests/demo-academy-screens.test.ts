import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEATS, BEAT_MARKS, BEAT_MARK_SELECTOR, BEAT_SCREENS, SCHOOL_TABS, STORY, STUDENT_TAB_IDS } from '@/components/demos/academy/data';
import { TIMING_SCRIPTS, act, deriveAcademy, freshAcademy, type AcademyState } from '@/components/demos/academy/story';

const DIR = join(process.cwd(), 'components/demos/academy');
const sources = () =>
  [...readdirSync(DIR), ...readdirSync(join(DIR, 'views')).map((f) => `views/${f}`)]
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(join(DIR, f), 'utf8'))
    .join('\n');
const run = (state: AcademyState, t: number) => deriveAcademy(state, t, false, TIMING_SCRIPTS);
const apply = (state: AcademyState, t: number, ...fns: ((s: AcademyState, t: number) => AcademyState)[]) => fns.reduce((s, f) => f(s, t), state);
const TEST: [string, string][] = [
  ['hi', 'start'],
  ['q1', 'goes'],
  ['q2', 'saw'],
  ['q3', 'have'],
  ['result', 'enroll'],
  ['pay', 'card'],
];

describe('Atrio Idiomas: each beat takes each view to where it happens', () => {
  it('maps exactly the story beats', () => {
    expect(Object.keys(BEAT_SCREENS).sort()).toEqual(BEATS.map((b) => b.id).sort());
  });

  it('every beat has a valid target for the laptop, the lone phone and the paired phone', () => {
    const marks: readonly string[] = BEAT_MARKS;
    for (const b of BEATS) {
      const { laptop, phone, paired } = BEAT_SCREENS[b.id];
      expect(laptop.side, b.id).toBe('school');
      expect(SCHOOL_TABS, b.id).toContain(laptop.tab);
      if (phone.side === 'school') expect(SCHOOL_TABS, b.id).toContain(phone.tab);
      else {
        expect(phone.side, b.id).toBe('student');
        expect(STUDENT_TAB_IDS, b.id).toContain(phone.tab);
      }
      // Paired phone: only Valentina's app exists there.
      expect(['student', 'stay'], b.id).toContain(paired.side);
      if (paired.side === 'student') expect(STUDENT_TAB_IDS, b.id).toContain(paired.tab);
      for (const target of [laptop, phone, paired]) if ('reveal' in target && target.reveal) expect(marks, b.id).toContain(target.reveal);
    }
  });

  it('the speaking and writing beats open those screens on her phone', () => {
    expect(BEAT_SCREENS.speak.paired).toMatchObject({ side: 'student', tab: 'speak' });
    expect(BEAT_SCREENS.writing.phone).toMatchObject({ side: 'student', tab: 'tutor' });
    expect(BEAT_SCREENS.lead.laptop).toMatchObject({ side: 'school', tab: 'site' });
    expect(BEAT_SCREENS.nudge.laptop).toMatchObject({ side: 'school', tab: 'students' });
  });

  it('every mark a beat reveals points at something the views render', () => {
    const src = sources();
    for (const m of BEAT_MARKS) {
      const sel = BEAT_MARK_SELECTOR[m];
      const attr = /data-beat="([^"]+)"/.exec(sel)?.[1];
      if (attr) expect(src, m).toContain(`data-beat="${attr}"`);
      for (const cls of sel.match(/\.[\w-]+/g) ?? []) expect(src, m).toContain(cls.slice(1));
    }
  });
});

describe('Atrio Idiomas: site chat and repeated actions', () => {
  it('the latest level test started wins: the lead beat shows Julieta after the visitor tried it', () => {
    const mineFirst = apply(freshAcademy(), 0, act.startSite(null));
    expect(run(mineFirst, 0).siteShowMine).toBe(true);
    expect(run(mineFirst, STORY.lead + 1000).siteShowMine).toBe(false);
    const during = apply(freshAcademy(), STORY.lead + 2000, act.startSite(null));
    expect(run(during, BEATS[3].at).siteShowMine).toBe(true);
  });

  it('taking the test twice at rest (same frozen time) keeps enrollment ids unique', () => {
    const t = BEATS[2].at;
    let s = apply(freshAcademy(), t, act.startSite(null));
    for (const [step, reply] of TEST) s = apply(s, t, act.pickSite(step, reply));
    s = apply(s, t, act.startSite(run(s, t).mineEnrollment));
    for (const [step, reply] of TEST) s = apply(s, t, act.pickSite(step, reply));
    const v = run(s, t);
    expect(v.enrollments.filter((e) => e.who === 'you')).toHaveLength(2);
    expect(new Set(v.enrollments.map((e) => e.id)).size).toBe(v.enrollments.length);
    const ids = v.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
