// Lote 1.5 · D: A/B with the method of docs/v3/rendimiento.md (CPU 4x, wheel gestures, interleaved rounds, medians of 3).
// base = 4001 (main before lote 1.2, 6e34310), cand = 4000 (main with 1.2–1.4, 8a6d75a).
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const T = { base: 'http://127.0.0.1:4001/Eclipse-Web/es/', cand: 'http://127.0.0.1:4000/Eclipse-Web/es/' };
const configs = [{ name: 'celular 390x844@2x', w: 390, h: 844, mobile: true, dpr: 2 }, { name: 'escritorio 1440x900', w: 1440, h: 900, mobile: false, dpr: 1 }];
const ROUNDS = Number(process.env.ROUNDS ?? 3);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const res = {};
for (const cfg of configs) for (let round = 0; round < ROUNDS; round++) for (const side of round % 2 ? ['cand', 'base'] : ['base', 'cand']) {
  const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, isMobile: cfg.mobile, hasTouch: cfg.mobile, deviceScaleFactor: cfg.dpr });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const m = (window.__m = { cls: 0, lcp: 0, lcpEl: '', frames: [], phase: 'load', long: {}, shifts: [] });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { m.cls += e.value; m.shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources?.[0]?.node?.className || e.sources?.[0]?.node?.nodeName || '').toString().slice(0, 40)]); } }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { m.lcp = e.startTime; m.lcpEl = e.element ? e.element.tagName + (e.element.id ? '#' + e.element.id : '') : ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { const p = m.phase; (m.long[p] ??= { ms: 0, n: 0 }); m.long[p].ms += Math.max(0, e.duration - 50); m.long[p].n++; } }).observe({ type: 'longtask', buffered: true });
    let last = 0;
    const tick = (t) => { if (last) m.frames.push([m.phase, t - last]); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.goto(T[side], { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(9000); // loader + entrance, as the doc: loader wait + 10 s
  const setPhase = (p) => page.evaluate((x) => { window.__m.phase = x; }, p);
  const wheel = async (total, perSec, dir = 1) => { const step = 100; const n = Math.round(total / step); const gap = Math.round((step / perSec) * 1000); await page.mouse.move(cfg.w / 2, cfg.h / 2); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, step * dir); await page.waitForTimeout(gap); } };
  await setPhase('idle'); await page.waitForTimeout(5000);
  await setPhase('hero'); await wheel(cfg.h, 600); await page.waitForTimeout(800); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
  await setPhase('down');
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await wheel(total, 1500); await page.waitForTimeout(1200);
  await setPhase('up'); await wheel(total, 1500, -1); await page.waitForTimeout(1000);
  await setPhase('end');
  const m = await page.evaluate(() => window.__m);
  const phases = {};
  for (const p of ['idle', 'hero', 'down', 'up']) {
    const fr = m.frames.filter((f) => f[0] === p).map((f) => f[1]);
    const dur = fr.reduce((a, b) => a + b, 0);
    phases[p] = { fps: fr.length / (dur / 1000), slow: (fr.filter((d) => d > 33.4).length / Math.max(1, fr.length)) * 100, p95: [...fr].sort((a, b) => a - b)[Math.floor(fr.length * 0.95)] ?? 0, long: m.long[p]?.ms ?? 0, longN: m.long[p]?.n ?? 0 };
  }
  (res[`${cfg.name}|${side}`] ??= []).push({ cls: m.cls, lcp: m.lcp, lcpEl: m.lcpEl, phases, shifts: m.shifts, height: total });
  await ctx.close();
}
await browser.close();
const fmt = (n, d = 1) => Number(n).toFixed(d);
for (const cfg of configs) {
  console.log('\n== ' + cfg.name);
  for (const side of ['base', 'cand']) {
    const r = res[`${cfg.name}|${side}`];
    const g = (f) => med(r.map(f));
    console.log(side.padEnd(5), `CLS ${fmt(g((x) => x.cls), 4)} (raw ${r.map((x) => x.cls.toFixed(3)).join(',')}) | LCP ${Math.round(g((x) => x.lcp))} ms ${r[0].lcpEl} | page ${Math.round(g((x) => x.height))} px`);
    for (const p of ['idle', 'hero', 'down', 'up']) console.log('      ', p.padEnd(5), `fps ${fmt(g((x) => x.phases[p].fps))} | frames>33ms ${fmt(g((x) => x.phases[p].slow))}% | p95 ${fmt(g((x) => x.phases[p].p95))} ms | long tasks ${Math.round(g((x) => x.phases[p].long))} ms (${g((x) => x.phases[p].longN)})`);
    console.log('       raw long tasks (ms) down:', r.map((x) => Math.round(x.phases.down.long)).join(','), '| hero:', r.map((x) => Math.round(x.phases.hero.long)).join(','), '| raw fps down:', r.map((x) => x.phases.down.fps.toFixed(1)).join(','));
    const sh = r.flatMap((x) => x.shifts).sort((a, b) => b[1] - a[1]).slice(0, 3); console.log('       top shifts', JSON.stringify(sh));
  }
}
