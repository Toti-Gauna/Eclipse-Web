import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEATS, BEAT_FOCUS, FOCUS_SPOTS, SCREEN_TABS, STORY, TODAY, type ClinicTab } from '@/components/demos/clinic/data';
import { act, createClinicStore, deriveClinic, martinaScript, type ClinicState } from '@/components/demos/clinic/story';

const dir = path.resolve(import.meta.dirname, '../components/demos/clinic');
const VIEW_FILE: Record<ClinicTab, string> = {
  today: 'views/Today.tsx',
  agenda: 'views/Agenda.tsx',
  calls: 'views/Calls.tsx',
  whatsapp: 'views/WhatsApp.tsx',
  site: 'views/Site.tsx',
  recovered: 'views/Recovered.tsx',
};
const source = (tab: ClinicTab) => readFileSync(path.join(dir, VIEW_FILE[tab]), 'utf8');

describe('Clínica Aurora: every beat takes each view to where it happens', () => {
  it('every beat has a target for the laptop, the phone app alone and the patient phone', () => {
    for (const beat of BEATS) {
      const f = BEAT_FOCUS[beat.id];
      expect(f, beat.id).toBeDefined();
      for (const screen of ['laptop', 'phone'] as const) {
        const target = f[screen];
        expect(SCREEN_TABS[screen] as readonly string[], `${beat.id}/${screen}`).toContain(target.tab);
        expect(FOCUS_SPOTS[target.tab] as readonly string[], `${beat.id}/${screen}`).toContain(target.spot);
      }
      expect(['site', 'stay']).toContain(f.patient);
    }
  });

  it('every spot a beat uses is marked (data-focus) in its section, on both screens', () => {
    for (const beat of BEATS) {
      for (const screen of ['laptop', 'phone'] as const) {
        const { tab, spot } = BEAT_FOCUS[beat.id][screen];
        if (spot === 'top') continue;
        const marks = source(tab).match(new RegExp(`data-focus="${spot}"`, 'g')) ?? [];
        expect(marks.length, `${beat.id}/${screen}: ${tab} → ${spot}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('the call goes to the AI receptionist, the reminder to WhatsApp', () => {
    expect(BEAT_FOCUS.call.laptop.tab).toBe('calls');
    expect(BEAT_FOCUS.call.phone.tab).toBe('calls');
    expect(BEAT_FOCUS.reminder.laptop.tab).toBe('whatsapp');
  });
});

describe('Clínica Aurora: Camila and the visitor never share a slot', () => {
  const script = martinaScript(() => ({ text: '' }), (id) => id);
  const voice = () => ({ texts: [] as string[] });
  const fresh = (): ClinicState => createClinicStore(false).getSnapshot().state;
  const derive = (s: ClinicState, t: number) => deriveClinic(s, t, false, script, voice);

  it('Camila books her 10:30 with Sofía when it is free', () => {
    const v = derive(fresh(), BEATS[0].at);
    expect(v.camilaStart).toBe(STORY.camila.start);
    expect(v.appts.some((a) => a.patient === 'camila' && a.start === STORY.camila.start)).toBe(true);
  });

  it('when the visitor took her hour first, she looks for the next one that fits — never the visitor’s', () => {
    // A 30-minute visit at 11:00 leaves 10:30 too short for her 60-minute facial.
    const s = act.book({ pro: STORY.camila.pro, day: TODAY, start: STORY.camila.start + 30, treatment: 'aestheticConsult', via: 'agenda' })(fresh(), 0);
    const v = derive(s, BEATS[0].at);
    const camila = v.appts.find((a) => a.patient === 'camila');
    expect(v.camilaStart).not.toBe(STORY.camila.start);
    expect(camila?.start ?? null).toBe(v.camilaStart);
    expect(v.events.find((e) => e.kind === 'online')?.start ?? null).toBe(v.camilaStart);
    const mine = v.appts.find((a) => a.patient === 'you')!;
    if (camila) expect(camila.start >= mine.end || camila.end <= mine.start).toBe(true);
  });

  it('when Sofía has no free hour left, Camila doesn’t book (and the patient phone doesn’t replay it)', () => {
    const s = act.book({ pro: STORY.camila.pro, day: TODAY, start: STORY.camila.start, treatment: STORY.camila.treatment, via: 'agenda' })(fresh(), 0);
    const v = derive(s, BEATS[0].at);
    expect(v.camilaStart).toBeNull();
    expect(v.appts.some((a) => a.patient === 'camila')).toBe(false);
    expect(v.events.some((e) => e.kind === 'online')).toBe(false);
    expect(v.appts.filter((a) => a.patient === 'you')).toHaveLength(1);
  });
});
