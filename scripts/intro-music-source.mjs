import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** How the intro's music file is rendered (scripts/render-intro-music.mjs). Changing any of it means rendering again. */
export const MUSIC = { file: 'audio/intro-score.m4a', sampleRate: 44_100, tail: 2.5, vampTail: 24, fade: 4, kbps: 72 };

/** The score's fingerprint: its two source files and the render settings. */
export function scoreHash(root) {
  const h = createHash('sha256');
  for (const f of ['components/intro/score/jingle.ts', 'components/intro/score/orquesta.ts']) h.update(readFileSync(path.join(root, f)));
  h.update(JSON.stringify(MUSIC));
  return h.digest('hex').slice(0, 16);
}
