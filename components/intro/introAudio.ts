'use client';

import { asset } from '@/lib/env';
import music from '@/content/intro-music.json';

let loaded: Promise<AudioBuffer> | null = null;

/**
 * Fetches and decodes the score (public/audio/intro-score.m4a, rendered at build time by scripts/render-intro-music.mjs:
 * the film, then the end card's vamp, faded). Nothing is synthesized on the phone: the old offline render built ~5,000
 * Web Audio nodes and kept an iPhone busy for seconds. Called while the start screen is up; needs no gesture. A
 * throwaway context decodes it (decoding runs off the main thread); the playing context is made inside the tap.
 */
export function prepareMusic(): Promise<void> {
  return loadMusic().then(() => undefined);
}

function loadMusic(): Promise<AudioBuffer> {
  loaded ??= fetch(asset(`/${music.file}`))
    .then((r) => {
      if (!r.ok) throw new Error(`intro music: ${r.status}`);
      return r.arrayBuffer();
    })
    .then((data) => {
      const Ctx = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      return new Ctx(2, 1, 44_100).decodeAudioData(data);
    });
  loaded.catch(() => {
    loaded = null;
  });
  return loaded;
}

/**
 * The intro's music: the 40-second score on the film's clock, then the vamp under «Entrar» (one rendered track).
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
    return typeof window !== 'undefined' && (typeof window.AudioContext === 'function' || 'webkitAudioContext' in window) && typeof fetch === 'function';
  }

  /** Starts the music at film time `t` (seconds). Resolves once it sounds. */
  async start(getT: () => number): Promise<void> {
    const track = await loadMusic();
    if (this.ctx.state === 'closed') return;
    await this.ctx.resume();
    this.stopSources();
    const lead = 0.06;
    const t = getT() + lead;
    const now = this.ctx.currentTime + lead;
    this.zero = now - t;
    if (t < track.duration) {
      const s = this.ctx.createBufferSource();
      s.buffer = track;
      s.connect(this.out);
      s.start(now, t);
      this.sources.push(s);
    }
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
