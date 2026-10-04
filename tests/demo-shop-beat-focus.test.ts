import { describe, expect, it, vi } from 'vitest';
import { beatFocusStep, type BeatFocus } from '@/components/demos/kit/store';
import { BEATS, BEAT_FOCUS, type ShopBeatId } from '@/components/demos/shop/data';
import { SPOTS } from '@/components/demos/shop/focus';
import { BOT_FLOW, PHASE_SCREEN, WA_FLOW, act, beatVariant, botGoto, buildScript, createShopStore, deriveShop, waGoto } from '@/components/demos/shop/story';

const bot = buildScript(BOT_FLOW, botGoto, () => ({ text: '' }), (_s, id) => id);
const wa = buildScript(WA_FLOW, waGoto, () => ({ text: '' }), (_s, id) => id);
const fresh = () => createShopStore(false).getSnapshot().state;
const OFF = { from: -1, to: null };
/** Sections each screen has (ShopDemo: the phone app has no "site" tab; the store is a sheet there). */
const TABS = { laptop: ['today', 'orders', 'carts', 'chat', 'club', 'site'], phone: ['today', 'orders', 'carts', 'chat', 'club'] };

describe('Bruma Tostadores: every beat takes each view where it happens', () => {
  it('maps exactly the SimBar beats', () => {
    expect(Object.keys(BEAT_FOCUS).sort()).toEqual(BEATS.map((b) => b.id).sort());
  });

  for (const variant of ['on', 'off'] as const) {
    it(`panel and owner app: a real section and element for every beat (recovery ${variant})`, () => {
      for (const beat of BEATS) {
        const f = BEAT_FOCUS[beat.id][variant];
        for (const screen of ['laptop', 'phone'] as const) {
          expect(TABS[screen], `${beat.id} ${screen}`).toContain(f[screen].tab);
          expect(SPOTS[f[screen].spot], `${beat.id} ${screen}`).toBeTruthy();
        }
      }
    });

    it(`customer's phone: the story shows the target when the beat lands (recovery ${variant})`, () => {
      const state = { ...fresh(), off: variant === 'off' ? [OFF] : [] };
      for (const beat of BEATS) {
        const v = deriveShop(state, beat.at, bot, wa);
        expect(PHASE_SCREEN[v.ines.phase], beat.id).toEqual(BEAT_FOCUS[beat.id][variant].customer);
      }
    });
  }

  it('a jump to the last beat visits each section in turn', () => {
    const store = createShopStore(false);
    const visits: string[] = [];
    let last: BeatFocus = { loop: 0, beat: -1 };
    store.subscribe(() => {
      const snap = store.getSnapshot();
      const step = beatFocusStep(BEATS, snap, last);
      last = step.last;
      if (step.go < 0) return;
      const id = BEATS[step.go].id as ShopBeatId;
      visits.push(BEAT_FOCUS[id][beatVariant(id, deriveShop(snap.state, snap.t, bot, wa))].laptop.tab);
    });
    vi.useFakeTimers();
    try {
      store.acquire({});
      store.play!('club');
      vi.advanceTimersByTime(BEATS[BEATS.length - 1].at + 1000);
    } finally {
      vi.useRealTimers();
    }
    expect(store.getSnapshot().playing).toBe(false);
    expect(visits).toEqual(['chat', 'carts', 'carts', 'carts', 'club']);
  });

  it('the variant is what happened: once the message went out, switching the automation off does not change it', () => {
    const recovery = BEATS.find((b) => b.id === 'recovery')!.at;
    const sent = deriveShop(fresh(), recovery, bot, wa);
    expect(beatVariant('paid', sent)).toBe('on');
    const offAfter = act.toggleRecovery()(fresh(), recovery + 10);
    expect(beatVariant('paid', deriveShop(offAfter, recovery + 10, bot, wa))).toBe('on');
    // Before the half-hour jump, the switch decides.
    const offBefore = act.toggleRecovery()(fresh(), 0);
    expect(beatVariant('recovery', deriveShop(offBefore, 0, bot, wa))).toBe('off');
  });

  it("a beat gives the customer's phone back to Inés (the visitor's cart stays theirs)", () => {
    const line = { product: 'huila', size: 's250', grind: 'filter', qty: 1 } as const;
    let s = act.takeOver([line])(fresh(), 1000);
    expect(s.manual).toBe(1000);
    s = act.resume()(s);
    expect(s.manual).toBeNull();
    expect(s.mine.lines).toEqual([line]);
  });
});
