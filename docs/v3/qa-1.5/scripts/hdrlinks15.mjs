// Header nav links / utilities contrast against the real pixels under them, at every scroll position.
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
for (const [side, port] of [['cand', 4000]]) for (const w of [1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/Eclipse-Web/es/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200);
  await page.evaluate(() => document.documentElement.classList.add('cv-off'));
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const worst = [];
  for (let y = 0; y < total; y += 200) {
    await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(420);
    const info = await page.evaluate(() => [...document.querySelectorAll('.site-header .hdr-link, .site-header .hdr-login')].map((a) => { const r = a.getBoundingClientRect(); return { t: a.textContent.trim().slice(0, 16), color: getComputedStyle(a).color, r: [r.left, r.top, r.width, r.height] }; }));
    const light = await page.evaluate(() => document.querySelector('.site-header').classList.contains('theme-light'));
    for (const it of info.slice(0, 3)) {
      const buf = await page.screenshot({ clip: { x: it.r[0], y: it.r[1] + 8, width: it.r[2], height: it.r[3] - 16 } });
      const px = await page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data; const a = []; for (let i = 0; i < d.length; i += 4) a.push([d[i], d[i + 1], d[i + 2]]); return a; }, buf.toString('base64'));
      const fg = it.color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const bgs = px.filter((p) => Math.hypot(p[0] - fg[0], p[1] - fg[1], p[2] - fg[2]) > 40);
      if (!bgs.length) continue;
      const bg = bgs.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => v / bgs.length);
      worst.push({ y, t: it.t, cr: +CR(fg, bg).toFixed(2), light });
    }
  }
  const bad = worst.filter((x) => x.cr < 4.5);
  const byY = {}; bad.forEach((b) => { byY[b.y] = Math.min(byY[b.y] ?? 99, b.cr); });
  console.log(`${side} ${w}px: ${worst.length} samples · min ${Math.min(...worst.map((x) => x.cr))} · below 4.5 at ${Object.keys(byY).length} scroll positions:`, JSON.stringify(byY));
  await ctx.close();
}
await browser.close();
