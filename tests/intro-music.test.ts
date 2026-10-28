import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import music from '@/content/intro-music.json';
import { MUSIC, scoreHash } from '../scripts/intro-music-source.mjs';

/**
 * The intro's music is rendered at build time (scripts/render-intro-music.mjs), never on the phone. The file must
 * exist, be what the manifest says, and come from the current score: change jingle.ts or orquesta.ts and this fails
 * until the file is rendered again.
 */
describe('intro music file', () => {
  const root = path.resolve(__dirname, '..');
  const file = path.join(root, 'public', music.file);

  it('exists where the manifest says, with its size', () => {
    expect(music.file).toBe(MUSIC.file);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBe(music.bytes);
  });

  it('was rendered from the current score and settings', () => {
    expect(music.sourceHash).toBe(scoreHash(root));
  });

  it('stays light for phones (under 700 KB) and covers the film plus the end card', () => {
    expect(music.bytes).toBeLessThan(700 * 1024);
    expect(music.seconds).toBeGreaterThanOrEqual(40 + MUSIC.vampTail - 0.5);
  });
});
