'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SoundApi, SoundName } from '@/lib/sound/types';
import type { SoundEngine } from '@/lib/sound/engine';
import { SoundContext } from './SoundContext';

const FX_KEY = 'eclipse:sound';
const MUSIC_KEY = 'eclipse:music';
/** A play() asked for while the engine chunk is still loading is kept this long. */
const QUEUE_MS = 1500;

export interface SoundStatus {
  /** Web Audio exists in this browser. */
  supported: boolean;
  /** Audio is actually running (the context resumed after a gesture). */
  running: boolean;
  /** Starts audio that is on but still waiting for a gesture. Call it from a click / key handler. */
  start(): void;
}

const SoundStatusContext = createContext<SoundStatus>({ supported: true, running: false, start: () => {} });

/** UI state of the audio itself (for the toggle's equalizer), beyond the public SoundApi. */
export function useSoundStatus(): SoundStatus {
  return useContext(SoundStatusContext);
}

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext ?? null;
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    window.localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // Storage blocked: the choice lives for this page only.
  }
}

/** Keys that don't count as a user gesture for autoplay (or that mean "go away"). */
const NOT_A_GESTURE = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn']);

/**
 * Implements the sound contract (lib/sound/types.ts).
 *
 * - Off by default; `enabled` (UI effects) and `music` are persisted in localStorage.
 * - The AudioContext is created / resumed synchronously inside the gesture that turns
 *   sound on; the engine itself (lib/sound/engine.ts) is a separate chunk loaded with
 *   import() at that moment, so it never weighs on the initial page.
 * - A returning visitor who left sound on sees it on, but audio only starts on their
 *   first pointer / key gesture anywhere on the page (autoplay policies).
 * - Hidden tab → the context is suspended; visible again → resumed.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [music, setMusicState] = useState(false);
  const [supported, setSupported] = useState(true);
  const [running, setRunning] = useState(false);

  const want = useRef({ enabled: false, music: false });
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<SoundEngine | null>(null);
  const loading = useRef<Promise<SoundEngine | null> | null>(null);
  const queued = useRef<{ name: SoundName; at: number } | null>(null);
  const sleepTimer = useRef<number | undefined>(undefined);

  /** Creates / resumes the AudioContext. Call it synchronously inside a user gesture. */
  const unlock = useCallback((): AudioContext | null => {
    const Ctor = audioCtor();
    if (!Ctor) return null;
    let ctx = ctxRef.current;
    if (!ctx || ctx.state === 'closed') {
      try {
        ctx = new Ctor({ latencyHint: 'interactive' });
      } catch {
        return null;
      }
      const created = ctx;
      ctxRef.current = created;
      created.addEventListener('statechange', () => setRunning(created.state === 'running'));
      try {
        // iOS Safari only opens the output once something starts inside the gesture.
        const silence = created.createBufferSource();
        silence.buffer = created.createBuffer(1, 1, 22050);
        silence.connect(created.destination);
        silence.start(0);
      } catch {
        // not needed elsewhere
      }
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }, []);

  const loadEngine = useCallback((ctx: AudioContext) => {
    if (!loading.current) {
      loading.current = import('@/lib/sound/engine')
        .then(({ createSoundEngine }) => {
          engineRef.current = createSoundEngine(ctx);
          return engineRef.current;
        })
        .catch(() => {
          loading.current = null;
          return null;
        });
    }
    return loading.current;
  }, []);

  /** Brings the engine in line with what the visitor wants. */
  const sync = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    window.clearTimeout(sleepTimer.current);
    const { enabled: fx, music: mu } = want.current;
    if (fx || mu) {
      if (ctx.state === 'suspended' && document.visibilityState === 'visible') ctx.resume().catch(() => {});
      void loadEngine(ctx).then((engine) => {
        if (!engine) return;
        engine.setMusic(want.current.music);
        const q = queued.current;
        queued.current = null;
        if (q && want.current.enabled && performance.now() - q.at < QUEUE_MS) engine.play(q.name);
      });
    } else {
      engineRef.current?.setMusic(false);
      // Let the music fade out, then put the context to sleep (no CPU while silent).
      sleepTimer.current = window.setTimeout(() => {
        if (!want.current.enabled && !want.current.music && ctx.state === 'running') ctx.suspend().catch(() => {});
      }, 1500);
    }
  }, [loadEngine]);

  // Called from the controls' click handlers, so unlocking here happens inside the gesture.
  const setEnabled = useCallback(
    (on: boolean) => {
      want.current.enabled = on;
      setEnabledState(on);
      writeFlag(FX_KEY, on);
      if (want.current.enabled || want.current.music) unlock();
      sync();
    },
    [unlock, sync],
  );

  const setMusic = useCallback(
    (on: boolean) => {
      want.current.music = on;
      setMusicState(on);
      writeFlag(MUSIC_KEY, on);
      if (want.current.enabled || want.current.music) unlock();
      sync();
    },
    [unlock, sync],
  );

  const start = useCallback(() => {
    if (!want.current.enabled && !want.current.music) return;
    unlock();
    sync();
  }, [unlock, sync]);

  const play = useCallback<SoundApi['play']>((name, options) => {
    if (!want.current.enabled) return;
    const engine = engineRef.current;
    const ctx = ctxRef.current;
    if (engine && ctx) {
      if (ctx.state === 'running') engine.play(name, options);
      else if (ctx.state === 'suspended' && document.visibilityState === 'visible') {
        // Waking up from sleep (sound was just turned back on): play once it runs.
        const at = performance.now();
        ctx.resume().then(
          () => want.current.enabled && performance.now() - at < QUEUE_MS && engine.play(name, options),
          () => {},
        );
      }
      return;
    }
    // The chunk is on its way (sound was just turned on): keep the latest request.
    if (loading.current) queued.current = { name, at: performance.now() };
  }, []);

  // Restore a returning visitor's choice; audio waits for their first gesture.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check after hydration
    if (!audioCtor()) setSupported(false);
    const fx = readFlag(FX_KEY);
    const mu = readFlag(MUSIC_KEY);
    if (!audioCtor() || (!fx && !mu)) return;
    want.current = { enabled: fx, music: mu };
    setEnabledState(fx);
    setMusicState(mu);

    const events = ['pointerdown', 'keydown', 'touchend', 'click'] as const;
    const cleanup = () => events.forEach((type) => window.removeEventListener(type, onGesture, true));
    function onGesture(e: Event) {
      if (!want.current.enabled && !want.current.music) return cleanup();
      // A touch pointerdown isn't a gesture yet (touchend / click are); some keys never are.
      if (e.type === 'pointerdown' && (e as PointerEvent).pointerType !== 'mouse') return;
      if (e.type === 'keydown' && NOT_A_GESTURE.has((e as KeyboardEvent).key)) return;
      // The sound controls handle their own press (e.g. turning it off without a blip).
      if ((e.target as Element | null)?.closest?.('[data-sound-control]')) return cleanup();
      const ctx = unlock();
      if (!ctx) return cleanup();
      sync();
      if (ctx.state === 'running') cleanup();
      else ctx.resume().then(() => ctx.state === 'running' && cleanup(), () => {});
    }
    events.forEach((type) => window.addEventListener(type, onGesture, { capture: true, passive: true }));
    return cleanup;
  }, [unlock, sync]);

  // Silence while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      const ctx = ctxRef.current;
      if (!ctx || ctx.state === 'closed') return;
      if (document.visibilityState === 'hidden') {
        if (ctx.state === 'running') ctx.suspend().catch(() => {});
      } else if (want.current.enabled || want.current.music) {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(sleepTimer.current);
      engineRef.current?.dispose();
      ctxRef.current?.close().catch(() => {});
    },
    [],
  );

  const api = useMemo<SoundApi>(() => ({ enabled, music, setEnabled, setMusic, play }), [enabled, music, setEnabled, setMusic, play]);
  const status = useMemo<SoundStatus>(() => ({ supported, running, start }), [supported, running, start]);

  return (
    <SoundContext.Provider value={api}>
      <SoundStatusContext.Provider value={status}>{children}</SoundStatusContext.Provider>
    </SoundContext.Provider>
  );
}
