// Lote 1.5 matrix: case × width × preference for one build. Usage: node matrix15.mjs <base|cand> <port>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const [side, port] = process.argv.slice(2);
const B = `http://127.0.0.1:${port}/Eclipse-Web`;
const OUT = `/tmp/claude-0/-home-user/41d6ed66-7ba4-5ace-b9dd-e02c9e595316/scratchpad/q15/${side}`;
fs.mkdirSync(OUT, { recursive: true });
const widths = [360, 390, 768, 1024, 1440];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rows = [];
const only = process.argv[4] ? process.argv[4].split(',') : null;
for (const pref of ['normal', 'reduced']) for (const w of widths) {
  const h = w < 768 ? 780 : 900;
  const mobile = w < 768;
  const mkpage = async () => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, reducedMotion: pref === 'reduced' ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage(); page.errs = [];
    page.on('pageerror', (e) => page.errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/TUNNEL|Failed to load resource|frankfurter|dolarapi/.test(m.text()) && page.errs.push(m.text().slice(0, 140)));
    return { ctx, page };
  };
  const measure = (page) => page.evaluate(() => {
    const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden'; };
    const active = document.activeElement;
    return { overflowX: document.documentElement.scrollWidth - innerWidth, heroCta: vis(document.querySelector('[data-hero-cta] a, [data-hero-cta] button')), headerCta: vis(document.querySelector('.site-header .hdr-cta')), h1: document.querySelector('h1')?.textContent?.slice(0, 40) ?? '', dialogs: [...document.querySelectorAll('dialog[open]')].map((d) => d.className.split(' ')[0]), focus: active?.tagName + (active?.getAttribute('data-demo-opener') ? '[' + active.getAttribute('data-demo-opener') + ']' : '') };
  });
  const record = async (name, page, extra = {}) => {
    const m = await measure(page);
    const file = `${name}-${pref}-${w}.jpg`;
    await page.screenshot({ path: `${OUT}/${file}`, type: 'jpeg', quality: 70, fullPage: name === 'home-full' });
    rows.push({ side, name, pref, w, ...m, errors: page.errs.length, errText: page.errs.slice(0, 2).join(' | '), ...extra, file });
  };
  const run = async (name, fn) => {
    if (only && !only.includes(name)) return;
    const { ctx, page } = await mkpage();
    try { await fn(page); } catch (e) { rows.push({ side, name, pref, w, failed: String(e.message).slice(0, 160) }); }
    await ctx.close();
  };
  // home: fold, then full page walk (forces content-visibility sections like the 1.4 baseline)
  await run('home-fold', async (page) => { await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); await record('home-fold', page); });
  await run('home-full', async (page) => {
    await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200);
    await page.evaluate(() => document.documentElement.classList.add('cv-off'));
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(h * 0.6)) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(220); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1200);
    await record('home-full', page, { pageHeight: total });
  });
  await run('selector', async (page) => {
    if (side === 'base') return;
    await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200);
    await page.locator('[data-hero-cta] a').click(); await page.waitForSelector('dialog[data-selector-layer][open]'); await page.waitForTimeout(700);
    await record('selector', page);
  });
  await run('demo', async (page) => {
    await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200);
    if (side === 'base') await page.locator('[data-hero-chip="inmobiliarias"]').click();
    else { await page.locator('[data-hero-cta] a').click(); await page.waitForSelector('dialog[data-selector-layer][open]'); await page.locator('[data-sx-row="inmobiliarias"]').click(); }
    await page.waitForSelector('dialog[data-demo-layer][open]'); await page.waitForTimeout(3600);
    await record('demo', page);
  });
  await run('precios', async (page) => {
    await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('precios').scrollIntoView(); }); await page.waitForTimeout(2500);
    const txt = await page.locator('#precios').innerText();
    await record('precios', page, { priceText: /US\$|\$\s?\d/.test(txt), mantenimiento: /Esencial|mes/i.test(txt) });
  });
  await run('plan', async (page) => { await page.goto(B + '/es/plan/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); await record('plan', page); });
  await run('portal', async (page) => { await page.goto(B + '/es/portal/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); await record('portal', page); });
  await run('portal-proyectos', async (page) => { await page.goto(B + '/es/portal/proyectos/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); await record('portal-proyectos', page); });
  console.log(side, pref, w, 'done');
}
fs.writeFileSync(`${OUT}/matrix.json`, JSON.stringify(rows, null, 1));
await browser.close();
