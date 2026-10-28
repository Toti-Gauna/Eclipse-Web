'use client';

import { renderScore } from './score/orquesta';
import { FILM_END, VAMP_LOOP, filmNotes, vampNotes } from './score/jingle';

/** The film's tail: the last chord rings past the end of the film. */
const TAIL = 2.5;
/** 32 kHz is plenty for this mix and renders a third faster than 48 kHz. */
const SAMPLE_RATE = 32_000;

let rendered: Promise<{ film: AudioBuffer; vamp: AudioBuffer }> | null = null;

/** Renders the score once per page view (Web Audio, offline; nothing is downloaded). Needs no gesture. */
export function prepareMusic() {
  return renderMusic().then(() => undefined);
}

function renderMusic() {
  rendered ??= Promise.all([
    renderScore(filmNotes(), FILM_END + TAIL, { sampleRate: SAMPLE_RATE }),
    renderScore(vampNotes(), VAMP_LOOP.end, { sampleRate: SAMPLE_RATE }),
  ]).then(([film, vamp]) => ({ film, vamp }));
  return rendered;
}

/**
 * The intro's music: the 40-second score on the film's clock, then the vamp looping under «Activar Eclipse».
 * The AudioContext is created inside the visitor's gesture (the sound button), so browsers let it play. While it plays,
 * its clock IS the film's clock (`time()`), so every cut lands on the beat.
 */
export class IntroMusic {
  private ctx: AudioContext;
  private out: GainNode;
  private sources: AudioBufferSourceNode[] = [];
  /** The context's time at which the film's t = 0 was (or would have been). */
  private zero = 0;
  playing = false;

  constructor() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx({ latencyHint: 'playback' });
    this.out = this.ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(this.ctx.destination);
    // Inside the gesture: unlock right away, even though the music is still being rendered.
    void this.ctx.resume();
  }

  static supported(): boolean {
    return typeof window !== 'undefined' && (typeof window.AudioContext === 'function' || 'webkitAudioContext' in window) && typeof OfflineAudioContext === 'function';
  }

  /** Starts the music at film time `t` (seconds). Resolves once it sounds. */
  async start(getT: () => number): Promise<void> {
    const { film, vamp } = await renderMusic();
    if (this.ctx.state === 'closed') return;
    await this.ctx.resume();
    this.stopSources();
    const lead = 0.06;
    const t = getT() + lead;
    const now = this.ctx.currentTime + lead;
    this.zero = now - t;
    if (t < FILM_END) {
      const s = this.ctx.createBufferSource();
      s.buffer = film;
      s.connect(this.out);
      s.start(now, t);
      this.sources.push(s);
    }
    const v = this.ctx.createBufferSource();
    v.buffer = vamp;
    v.loop = true;
    v.loopStart = VAMP_LOOP.start;
    v.loopEnd = VAMP_LOOP.end;
    v.connect(this.out);
    const intoVamp = t - FILM_END;
    if (intoVamp < 0) v.start(this.zero + FILM_END, 0);
    else v.start(now, intoVamp < VAMP_LOOP.start ? intoVamp : VAMP_LOOP.start + ((intoVamp - VAMP_LOOP.start) % (VAMP_LOOP.end - VAMP_LOOP.start)));
    this.sources.push(v);
    this.out.gain.cancelScheduledValues(now);
    this.out.gain.setValueAtTime(0, now);
    this.out.gain.linearRampToValueAtTime(0.9, now + 0.25);
    this.playing = true;
  }

  /** The film's time on the music's clock (only meaningful while playing). */
  time(): number {
    return this.ctx.currentTime - this.zero;
  }

  /** Silences it (the sound button again): a short fade, then the sources stop. */
  mute() {
    this.fadeOut(0.25);
    this.playing = false;
  }

  /** The tab went to the background: the context sleeps, its clock stops with it. */
  suspend() {
    if (this.ctx.state === 'running') void this.ctx.suspend();
  }
  resume() {
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** The film is over: fade out and release the audio device. */
  close(fade = 0.9) {
    this.fadeOut(fade);
    this.playing = false;
    window.setTimeout(() => void this.ctx.close().catch(() => {}), fade * 1000 + 120);
  }

  private fadeOut(seconds: number) {
    const now = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(now);
    this.out.gain.setValueAtTime(this.out.gain.value, now);
    this.out.gain.linearRampToValueAtTime(0, now + seconds);
    const sources = this.sources;
    this.sources = [];
    sources.forEach((s) => {
      try {
        s.stop(now + seconds + 0.05);
      } catch {
        /* never started */
      }
    });
  }

  private stopSources() {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* never started */
      }
    });
    this.sources = [];
  }
}
