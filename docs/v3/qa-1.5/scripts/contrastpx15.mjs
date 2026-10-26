// Pixel-sampled contrast for text over gradients/images (the elements contrast15.mjs cannot decide).
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const B = process.env.B ?? 'http://127.0.0.1:4000/Eclipse-Web';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pick = () => {
  const out = []; const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('[aria-hidden="true"], script, style, noscript, [inert]')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 6 || r.height < 6) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1; for (let n = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity); if (op < 0.3) continue;
    let blocked = false; for (let n = el; n; n = n.parentElement) { const s = getComputedStyle(n); if (s.backgroundImage !== 'none') { blocked = true; break; } if (parseFloat((s.backgroundColor.match(/[\d.]+/g) ?? [0, 0, 0, 0])[3] ?? 1) >= 0.98) break; }
    if (!blocked) continue;
    el.setAttribute('data-px', String(out.length));
    out.push({ i: out.length, text: t.textContent.trim().slice(0, 30), cls: (el.className?.toString?.() || el.tagName).slice(0, 40), color: cs.color, size: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight) >= 700 });
  }
  return out;
};
const lum = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
const run = async (label, w, setup) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 780 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage(); await setup(page);
  const items = await page.evaluate(pick);
  const fails = []; let checked = 0;
  for (const it of items) {
    const box = await page.evaluate(({ i }) => { const el = document.querySelector(`[data-px="${i}"]`); el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, it).catch(() => null);
    if (!box || box.w < 4 || box.y < 0 || box.y + box.h > (w < 768 ? 780 : 900) || box.x < 0 || box.x + box.w > w) continue;
    await page.waitForTimeout(60);
    const buf = await page.screenshot({ clip: { x: box.x, y: box.y, width: Math.min(box.w, 400), height: Math.min(box.h, 120) } }).catch(() => null); if (!buf) continue;
    const px = await page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data; const a = []; for (let i = 0; i < d.length; i += 4) a.push([d[i], d[i + 1], d[i + 2]]); return a; }, buf.toString('base64'));
    const fg = it.color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const bgs = px.filter((p) => Math.hypot(p[0] - fg[0], p[1] - fg[1], p[2] - fg[2]) > 130);
    if (bgs.length < px.length * 0.3) continue;
    // the worst case under the text: the background colour closest in luminance to the text's
    const lf = lum(fg); bgs.sort((a, b) => Math.abs(lum(a) - lf) - Math.abs(lum(b) - lf));
    const near = bgs[Math.floor(bgs.length * 0.25)];
    const a = lf, b = lum(near); const cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const large = it.size >= 24 || (it.size >= 18.66 && it.bold); checked++;
    if (cr < (large ? 3 : 4.5)) fails.push({ cr: +cr.toFixed(2), need: large ? 3 : 4.5, size: Math.round(it.size), text: it.text, cls: it.cls });
  }
  console.log(`\n== ${label} (${w}px): ${checked}/${items.length} sampled · ${fails.length} below AA (worst 10% background under the text)`);
  fails.slice(0, 12).forEach((f) => console.log('  ', f.cr, '/', f.need, f.size + 'px', f.cls, '«' + f.text + '»'));
  await ctx.close();
};
const home = async (page) => { await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); await page.evaluate(() => document.documentElement.classList.add('cv-off')); const t = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < t; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(150); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600); };
for (const w of [360, 1440]) await run('home', w, home);

await browser.close();
