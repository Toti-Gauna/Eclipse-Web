import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AT, BEATS, BEAT_MARKS, BEAT_SCREENS, MEMBER_TAB_IDS, OWNER_TABS, PHONE_OVERLAYS } from '@/components/demos/gym/model';
import { act, deriveGym, freshGym, type GymState } from '@/components/demos/gym/story';

const DIR = join(process.cwd(), 'components/demos/gym');
const sources = () =>
  [...readdirSync(DIR), ...readdirSync(join(DIR, 'views')).map((f) => `views/${f}`)]
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(join(DIR, f), 'utf8'))
    .join('\n');
const apply = (state: GymState, t: number, ...fns: ((s: GymState, t: number) => GymState)[]) => fns.reduce((s, f) => f(s, t), state);

describe('Órbita Fitness: each beat takes each view to where it happens', () => {
  it('maps exactly the story beats', () => {
    expect(Object.keys(BEAT_SCREENS).sort()).toEqual(BEATS.map((b) => b.id).sort());
  });

  it('every beat has a valid target for the laptop, the lone phone and the paired phone', () => {
    const marks: readonly string[] = BEAT_MARKS;
    for (const b of BEATS) {
      const { laptop, phone, paired } = BEAT_SCREENS[b.id];
      // Laptop: always the owner's panel, a section its dock has.
      expect(laptop.side, b.id).toBe('owner');
      expect(OWNER_TABS.laptop, b.id).toContain(laptop.tab);
      // Lone phone: the owner's panel (its own, shorter nav) or Lucía's app.
      if (phone.side === 'owner') expect(OWNER_TABS.phone, b.id).toContain(phone.tab);
      else {
        expect(phone.side, b.id).toBe('member');
        expect(MEMBER_TAB_IDS, b.id).toContain(phone.tab);
        if (phone.overlay) expect(PHONE_OVERLAYS, b.id).toContain(phone.overlay);
      }
      // Paired phone: only Lucía's app exists there.
      expect(['member', 'stay'], b.id).toContain(paired.side);
      if (paired.side === 'member') {
        expect(MEMBER_TAB_IDS, b.id).toContain(paired.tab);
        if (paired.overlay) expect(PHONE_OVERLAYS, b.id).toContain(paired.overlay);
      }
      for (const target of [laptop, phone, paired]) if ('reveal' in target && target.reveal) expect(marks, b.id).toContain(target.reveal);
    }
  });

  it('the lead beat shows the site chat; the win-back opens her WhatsApp', () => {
    expect(BEAT_SCREENS.lead.laptop).toEqual({ side: 'owner', tab: 'site', reveal: 'chat' });
    expect(BEAT_SCREENS.lead.paired.side).toBe('stay');
    expect(BEAT_SCREENS.winback.paired).toMatchObject({ side: 'member', overlay: 'wa' });
  });

  it('every mark a beat reveals exists in the views', () => {
    const src = sources();
    for (const m of BEAT_MARKS) expect(src, m).toContain(`data-beat="${m}"`);
  });
});

describe('Órbita Fitness: site chat and repeated actions', () => {
  it('the latest chat started wins: the lead beat shows Tomás after the visitor tried it', () => {
    const mineFirst = apply(freshGym(), 0, act.startLead());
    expect(deriveGym(mineFirst, 0, false).leadShowMine).toBe(true);
    expect(deriveGym(mineFirst, AT.lead + 1000, false).leadShowMine).toBe(false);
    // Started during or after the beat: theirs.
    const during = apply(freshGym(), AT.lead + 2000, act.startLead());
    expect(deriveGym(during, BEATS[0].at, false).leadShowMine).toBe(true);
    expect(deriveGym(freshGym(), BEATS[0].at, false).leadShowMine).toBe(false);
  });

  it('switching the automation off and on at rest (same frozen time) keeps event ids unique', () => {
    const t = BEATS[0].at;
    const s = apply(freshGym(), t, act.toggleWin(), act.toggleWin(), act.toggleWin(), act.toggleWin());
    const ids = deriveGym(s, t, false).events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
