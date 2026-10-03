'use client';

import { useTranslations } from 'next-intl';
import { useSound } from './SoundContext';
import { useSoundStatus } from './SoundProvider';
import './sound.css';

/** [height on, height at rest] per bar (scaleY of a 16px bar). */
const BARS = [
  [0.42, 0.26],
  [0.78, 0.46],
  [1, 0.66],
  [0.66, 0.46],
  [0.5, 0.26],
] as const;

/**
 * Sound on/off (effects + music) for the header. 44px target.
 * Off: a low, muted wave at rest. On: amber bars stand; while music plays they move
 * like an equalizer (transform: scaleY only; static with reduced motion).
 * The first press turns both on and plays the diamond-ring glint. If sound was left
 * on in a previous visit, a press starts the waiting audio instead of muting it.
 * `className` sets its display (default `grid`), e.g. `hidden sm:grid`.
 */
export function SoundToggle({ className = 'grid' }: { className?: string }) {
  const t = useTranslations('sound');
  const { enabled, music, setEnabled, setMusic, play } = useSound();
  const { supported, running, start } = useSoundStatus();
  const on = enabled || music;
  const state = !on ? 'off' : music && running ? 'playing' : 'on';

  if (!supported) return null;

  return (
    <button
      type="button"
      data-sound-control
      data-state={state}
      aria-pressed={on}
      aria-label={t('toggle')}
      title={on ? t('turnOff') : t('turnOn')}
      onClick={() => {
        if (on && !running) {
          start();
          play('glint');
        } else if (on) {
          play('toggle');
          setEnabled(false);
          setMusic(false);
        } else {
          setEnabled(true);
          setMusic(true);
          play('glint');
        }
      }}
      className={`sound-toggle ${className}`}
    >
      <span aria-hidden className="sound-bars">
        {BARS.map(([h, rest], i) => (
          <i key={i} style={{ ['--h' as string]: h, ['--rest' as string]: rest, ['--i' as string]: i }} />
        ))}
      </span>
    </button>
  );
}

/**
 * A tiny equalizer for the corner of another control (the phone menu button) while
 * sound is on. Decorative; renders nothing when sound is off.
 */
export function SoundBadge() {
  const { enabled, music } = useSound();
  const { running } = useSoundStatus();
  if (!enabled && !music) return null;
  return (
    <span aria-hidden className="sound-badge" data-state={music && running ? 'playing' : 'on'}>
      {[0.55, 1, 0.75].map((h, i) => (
        <i key={i} style={{ ['--h' as string]: h, ['--i' as string]: i }} />
      ))}
    </span>
  );
}
