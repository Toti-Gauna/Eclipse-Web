#!/usr/bin/env node
/**
 * Renders the intro film's music ONCE, at build time, to public/audio/intro-score.m4a (decision 28/10/2026: a
 * phone must never synthesize the score; on an iPhone the ~5,000 Web Audio nodes and the offline render kept the
 * page busy for seconds, unresponsive and unpainted). The score is the same code as before (components/intro/score:
 * jingle.ts on orquesta.ts), run in Chromium's OfflineAudioContext, then encoded to AAC with ffmpeg.
 *
 * The file is one track: the 40-second film, then the end card's vamp looped for VAMP_TAIL seconds and faded out
 * (one file, no loop seams: AAC's priming would make a sample-accurate loop click). It writes
 * content/intro-music.json with the sourceHash of the score files; tests/intro-music.test.ts fails when the score
 * changes and the file was not rendered again.
 *
 *   node scripts/render-intro-music.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { chromium } from 'playwright';
import { MUSIC, scoreHash } from './intro-music-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, '.next', 'intro-music');
mkdirSync(tmp, { recursive: true });

const js = (file) =>
  ts.transpileModule(readFileSync(path.join(root, 'components/intro/score', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const modules = { '/orquesta.js': js('orquesta.ts'), '/jingle.js': js('jingle.ts').replace(/from '\.\/orquesta'/g, "from '/orquesta.js'") };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.route('http://render.local/**', (route) => {
  const p = new URL(route.request().url()).pathname;
  if (p === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>render</title>' });
  if (modules[p]) return route.fulfill({ contentType: 'text/javascript', body: modules[p] });
  return route.fulfill({ status: 404, body: '' });
});
await page.goto('http://render.local/');
const pcm = await page.evaluate(async (M) => {
  const { renderScore } = await import('/orquesta.js');
  const { filmNotes, vampNotes, FILM_END, VAMP_LOOP } = await import('/jingle.js');
  const sr = M.sampleRate;
  const [film, vamp] = await Promise.all([
    renderScore(filmNotes(), FILM_END + M.tail, { sampleRate: sr }),
    renderScore(vampNotes(), VAMP_LOOP.end, { sampleRate: sr }),
  ]);
  // Mix: the film from 0, the vamp from FILM_END (its intro, then the loop), faded out at the end.
  const total = FILM_END + M.vampTail;
  const ac = new OfflineAudioContext(2, Math.ceil(total * sr), sr);
  const a = ac.createBufferSource();
  a.buffer = film;
  a.connect(ac.destination);
  a.start(0);
  const g = ac.createGain();
  g.connect(ac.destination);
  g.gain.setValueAtTime(1, total - M.fade);
  g.gain.linearRampToValueAtTime(0, total);
  const v = ac.createBufferSource();
  v.buffer = vamp;
  v.loop = true;
  v.loopStart = VAMP_LOOP.start;
  v.loopEnd = VAMP_LOOP.end;
  v.connect(g);
  v.start(FILM_END);
  const out = await ac.startRendering();
  return { sr, channels: [Array.from(out.getChannelData(0)), Array.from(out.getChannelData(1))] };
}, MUSIC);
await browser.close();

// 16-bit PCM WAV → AAC (m4a, faststart so it can start before the whole file is in).
const n = pcm.channels[0].length;
const wav = Buffer.alloc(44 + n * 4);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + n * 4, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(pcm.sr, 24);
wav.writeUInt32LE(pcm.sr * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++)
  for (let c = 0; c < 2; c++) wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm.channels[c][i] * 32767))), 44 + i * 4 + c * 2);
const wavPath = path.join(tmp, 'intro-score.wav');
writeFileSync(wavPath, wav);
const out = path.join(root, 'public', MUSIC.file);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-c:a', 'aac', '-b:a', `${MUSIC.kbps}k`, '-movflags', '+faststart', out]);

const manifest = { $comment: 'Written by scripts/render-intro-music.mjs. Re-render when the score changes (tests/intro-music.test.ts).', file: MUSIC.file, seconds: n / pcm.sr, kbps: MUSIC.kbps, bytes: statSync(out).size, sourceHash: scoreHash(root) };
writeFileSync(path.join(root, 'content', 'intro-music.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(manifest);
