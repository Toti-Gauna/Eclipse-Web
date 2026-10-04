import { describe, expect, it, vi } from 'vitest';
import { beatFocusStep, type BeatFocus } from '@/components/demos/kit/store';
import { BEATS, BEAT_FOCUS, type EstateBeatId } from '@/components/demos/real-estate/data';
import { SPOTS } from '@/components/demos/real-estate/focus';
import { buyerStory, createEstateStore, deriveEstate } from '@/components/demos/real-estate/story';

const fresh = (botOff = false) => ({ ...createEstateStore(false).getSnapshot().state, botOff });
/** Sections each screen has (RealEstateDemo ORDER: on the phone "Sitio web" is the buyer button). */
const TABS = {
  laptop: ['today', 'inbox', 'pipeline', 'visits', 'followups', 'listings', 'site'],
  phone: ['inbox', 'pipeline', 'visits', 'today', 'followups', 'listings'],
};

describe('Lumen Propiedades: every beat takes each view where it happens', () => {
  it('maps exactly the SimBar beats', () => {
    expect(Object.keys(BEAT_FOCUS).sort()).toEqual(BEATS.map((b) => b.id).sort());
  });

  for (const variant of ['on', 'off'] as const) {
    it(`workspace and app: a real section and element for every beat (assistant ${variant})`, () => {
      for (const beat of BEATS) {
        const f = BEAT_FOCUS[beat.id][variant];
        for (const screen of ['laptop', 'phone'] as const) {
          expect(TABS[screen], `${beat.id} ${screen}`).toContain(f[screen].tab);
          expect(SPOTS[f[screen].spot], `${beat.id} ${screen}`).toBeTruthy();
        }
      }
    });

    it(`Carolina's phone: the story shows the target when the beat lands (assistant ${variant})`, () => {
      for (const beat of BEATS) {
        const story = buyerStory(deriveEstate(fresh(variant === 'off'), beat.at));
        const shown = story.screen === 'whatsapp' ? 'whatsapp' : story.chat ? 'chat' : 'site';
        expect(shown, beat.id).toBe(BEAT_FOCUS[beat.id][variant].buyer);
      }
    });
  }

  it('the target matches what happens there when the beat lands', () => {
    const at = (id: EstateBeatId, off = false) => deriveEstate(fresh(off), BEATS.find((b) => b.id === id)!.at);
    // The visit lands in the calendar; the follow-up exists; the card reaches Reserve / is lost.
    expect(at('visit').visits.some((v) => v.who === 'carolina')).toBe(true);
    expect(at('followup').follow).not.toBeNull();
    expect(at('reply').cards.find((c) => c.id === 'carolina')?.column).toBe('reserve');
    expect(at('reply', true).cards.find((c) => c.id === 'carolina')?.note).toBe('lost');
  });

  it('a jump to the last beat visits each section in turn', () => {
    const store = createEstateStore(false);
    const visits: string[] = [];
    let last: BeatFocus = { loop: 0, beat: -1 };
    store.subscribe(() => {
      const snap = store.getSnapshot();
      const step = beatFocusStep(BEATS, snap, last);
      last = step.last;
      if (step.go >= 0) visits.push(BEAT_FOCUS[BEATS[step.go].id].on.laptop.tab);
    });
    vi.useFakeTimers();
    try {
      store.acquire({});
      store.play!('reply');
      vi.advanceTimersByTime(BEATS[BEATS.length - 1].at + 1000);
    } finally {
      vi.useRealTimers();
    }
    expect(visits).toEqual(['inbox', 'inbox', 'visits', 'followups', 'pipeline']);
  });
});
