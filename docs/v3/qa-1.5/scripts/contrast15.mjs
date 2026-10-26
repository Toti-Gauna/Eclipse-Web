// Lote 1.5: approximate WCAG contrast of every visible text element (flat backgrounds only; gradients/images → "indeterminate").
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const B = process.env.B ?? 'http://127.0.0.1:4000/Eclipse-Web';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const audit = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; } const o = c.match(/oklab\(([^)]+)\)|color\(srgb ([^)]+)\)/); if (c.startsWith('color(srgb')) { const p = c.replace('color(srgb', '').replace(')', '').split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; } return null; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const out = [], indet = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('[aria-hidden="true"], script, style, noscript, [inert]')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1; for (let n = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    if (op < 0.05) continue;
    let fg = parse(cs.color); if (!fg) continue;
    // background: walk up to the first element with an opaque-ish background colour; give up on images/gradients
    let bg = null, blocked = false; const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') { blocked = true; break; }
      const c = parse(s.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.98) { bg = c; break; } }
    }
    if (blocked || !bg) { indet.push((el.className?.toString?.() || el.tagName).slice(0, 40) + ' «' + t.textContent.trim().slice(0, 24) + '»'); continue; }
    let base = bg; for (let i = layers.length - 2; i >= 0; i--) base = over(layers[i], base);
    let f = over([fg[0], fg[1], fg[2], fg[3] * op], base);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const cr = ratio(f, base);
    const need = large ? 3 : 4.5;
    if (cr < need) out.push({ cr: +cr.toFixed(2), need, size: Math.round(size), text: t.textContent.trim().slice(0, 36), cls: (el.className?.toString?.() || el.tagName).slice(0, 48) });
  }
  return { fails: out, indeterminate: indet.length, indetSample: indet.slice(0, 6) };
};
const run = async (label, setup, w = 1440, h = 900) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage();
  await setup(page);
  const r = await page.evaluate(audit);
  console.log(`\n== ${label} (${w}px): ${r.fails.length} below AA · ${r.indeterminate} indeterminate (gradient/image background)`);
  const grouped = new Map(); for (const f of r.fails) { const k = f.cls + '|' + f.cr; if (!grouped.has(k)) grouped.set(k, f); }
  [...grouped.values()].slice(0, 14).forEach((f) => console.log('  ', f.cr, '/', f.need, f.size + 'px', f.cls, '«' + f.text + '»'));
  await ctx.close();
  return r;
};
const home = (w) => async (page) => { await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); await page.evaluate(() => document.documentElement.classList.add('cv-off')); const t = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < t; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(180); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800); };
for (const w of [360, 1440]) await run('home', home(w), w, w < 768 ? 780 : 900);
for (const w of [360, 1440]) await run('selector', async (page) => { await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); await page.locator('[data-hero-cta] a').click(); await page.waitForSelector('dialog[data-selector-layer][open]'); await page.waitForTimeout(700); }, w, w < 768 ? 780 : 900);
for (const w of [360, 1440]) await run('demo layer', async (page) => { await page.goto(B + '/es/?rubro=inmobiliarias&vista=guia', { waitUntil: 'domcontentloaded' }); await page.waitForSelector('dialog[data-demo-layer][open]'); await page.waitForTimeout(1500); }, w, w < 768 ? 780 : 900);
await run('portal login', async (page) => { await page.goto(B + '/es/portal/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); });
await run('/plan builder', async (page) => { await page.goto(B + '/es/plan/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000); });
// the floating header over every scroll position: text vs the real pixels under it
for (const w of [360, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 780 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage(); await home(w)(page);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const worst = [];
  for (let y = 0; y < total; y += 250) {
    await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(450);
    const info = await page.evaluate(() => { const h = document.querySelector('.site-header'); const logo = h.querySelector('a[aria-label] span'); const r = (logo ?? h).getBoundingClientRect(); return { color: getComputedStyle(logo ?? h).color, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], light: h.classList.contains('theme-light') }; });
    const buf = await page.screenshot({ clip: { x: Math.max(0, info.rect[0] - 4), y: Math.max(0, info.rect[1] - 3), width: Math.min(120, info.rect[2] + 8), height: info.rect[3] + 6 } });
    const px = await page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data; return [...Array(d.length / 4)].map((_, i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]); }, buf.toString('base64'));
    const fg = info.color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const L = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
    // background = the most frequent pixel colour that is not close to the text colour
    const bgs = px.filter((p) => Math.hypot(p[0] - fg[0], p[1] - fg[1], p[2] - fg[2]) > 60);
    if (!bgs.length) continue;
    const avg = bgs.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => v / bgs.length);
    const a = L(fg), b = L(avg); const cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    worst.push({ y, cr: +cr.toFixed(2), light: info.light });
  }
  const bad = worst.filter((x) => x.cr < 4.5);
  console.log(`\n== floating header logo text vs real pixels (${w}px), ${worst.length} scroll positions: min ${Math.min(...worst.map((x) => x.cr))} · below 4.5: ${bad.length}`, JSON.stringify(bad.slice(0, 8)));
  await ctx.close();
}
await browser.close();
