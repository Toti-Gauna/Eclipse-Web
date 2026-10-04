import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEATS, BEAT_FOCUS, FOCUS_SPOTS, SCREEN_TABS, TODAY, WEB_BOOKING, type RestaurantTab } from '@/components/demos/restaurant/data';

const dir = path.resolve(import.meta.dirname, '../components/demos/restaurant');
/** The module that draws each section (both screens). */
const VIEW_FILE: Record<RestaurantTab, string> = {
  service: 'views/Service.tsx',
  phone: 'views/Calls.tsx',
  kitchen: 'views/Kitchen.tsx',
  floor: 'views/Floor.tsx',
  menu: 'views/Menu.tsx',
  qr: 'views/Qr.tsx',
  numbers: 'views/Numbers.tsx',
};
const source = (tab: RestaurantTab) => readFileSync(path.join(dir, VIEW_FILE[tab]), 'utf8');

describe('Bodegón Lucero: every beat takes each view to where it happens', () => {
  it('every beat has a target for the laptop, the phone app alone and the customer phone', () => {
    for (const beat of BEATS) {
      const f = BEAT_FOCUS[beat.id];
      expect(f, beat.id).toBeDefined();
      for (const screen of ['laptop', 'phone'] as const) {
        const target = f[screen];
        // A section this screen's navigation has, and a spot that section offers.
        expect(SCREEN_TABS[screen] as readonly string[], `${beat.id}/${screen}`).toContain(target.tab);
        expect(FOCUS_SPOTS[target.tab] as readonly string[], `${beat.id}/${screen}`).toContain(target.spot);
        if (target.line !== undefined) {
          expect(target.tab).toBe('phone');
          expect([1, 2, 3]).toContain(target.line);
        }
        if (target.day !== undefined) {
          expect(target.tab).toBe('floor');
          expect(target.day).toBeGreaterThanOrEqual(TODAY);
        }
      }
      expect(['order', 'book', 'stay']).toContain(f.customer);
    }
  });

  it('every spot a beat uses is marked (data-focus) in its section, on both screens', () => {
    for (const beat of BEATS) {
      for (const screen of ['laptop', 'phone'] as const) {
        const { tab, spot } = BEAT_FOCUS[beat.id][screen];
        if (spot === 'top') continue;
        const marks = source(tab).match(new RegExp(`data-focus="${spot}"`, 'g')) ?? [];
        // Each section module draws a laptop and a phone view: both carry the mark.
        expect(marks.length, `${beat.id}/${screen}: ${tab} → ${spot}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('the calls go to the AI phone; the web beat opens the reservations book on Julieta’s night', () => {
    expect(BEAT_FOCUS.order.laptop.tab).toBe('phone');
    expect(BEAT_FOCUS.rush.laptop.tab).toBe('phone');
    expect(BEAT_FOCUS.order.phone).toMatchObject({ tab: 'phone', line: 1 });
    expect(BEAT_FOCUS.web.laptop).toMatchObject({ tab: 'floor', day: WEB_BOOKING.day });
    expect(BEAT_FOCUS.web.phone).toMatchObject({ tab: 'floor', day: WEB_BOOKING.day });
  });
});
