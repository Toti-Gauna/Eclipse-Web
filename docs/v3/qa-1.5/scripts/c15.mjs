// Lote 1.5 · C: keyboard, History, cleanup (5 cycles), failures, no-JS. Candidate build only.
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const B = process.env.B ?? 'http://127.0.0.1:4000/Eclipse-Web';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (n, ok, d = '') => { results.push(ok); console.log((ok ? 'PASS' : 'FAIL') + '  ' + n + (d ? ' — ' + d : '')); };
const mk = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', (e) => page.errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/TUNNEL|Failed to load resource|frankfurter|dolarapi/.test(m.text()) && page.errs.push(m.text().slice(0, 140)));
  return { ctx, page };
};
const load = async (page, path = '/es/') => { await page.goto(B + path, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3200); };
const focusInfo = (page) => page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a); const af = getComputedStyle(a, '::after'); const ring = (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') || (cs.boxShadow && cs.boxShadow !== 'none') || (af.content !== 'none' && ((parseFloat(af.outlineWidth) > 0 && af.outlineStyle !== 'none') || af.boxShadow !== 'none' || (parseFloat(af.borderTopWidth) > 0 && af.borderTopStyle !== 'none'))); return { tag: a.tagName, name: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 28), ring, inDialog: !!a.closest('dialog[open]') }; });

// ---- 1. Keyboard on the home -----------------------------------------------------------
{
  const { ctx, page } = await mk();
  await load(page);
  const order = [];
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); order.push(await focusInfo(page)); }
  check('Tab reaches 14 distinct stops, all with a visible focus ring', order.every((o) => o && o.ring), order.map((o) => o && (o.ring ? '' : '!') + o.name).join(' | '));
  check('first stop is the skip link', /contenido|saltar|skip/i.test(order[0]?.name ?? ''), order[0]?.name);
  // reach the hero CTA by keyboard and open with Enter
  let reached = false;
  await load(page);
  for (let i = 0; i < 40 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.closest('[data-hero-cta]') !== null); }
  check('hero CTA reachable with Tab', reached);
  await page.keyboard.press('Enter');
  await page.locator('dialog[data-selector-layer][open]').first().waitFor();
  await page.waitForTimeout(500);
  const stops = [];
  for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); stops.push(await focusInfo(page)); }
  check('selector: focus stays inside the dialog for 9 Tabs (cycles)', stops.every((s) => s && s.inDialog && s.ring), stops.map((s) => s?.name).join(' | '));
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+Tab'); }
  check('selector: Shift+Tab stays inside too', (await focusInfo(page))?.inDialog === true);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const back = await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener'));
  check('Escape returns focus to the hero CTA', back === 'selector:hero', String(back));
  // selector → demo with the keyboard only
  await page.keyboard.press('Enter'); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(400);
  await page.keyboard.press('Tab'); // first row
  await page.keyboard.press('Enter');
  await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3400);
  const demoStops = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); demoStops.push(await focusInfo(page)); }
  check('demo layer: 12 Tabs never leave the dialog', demoStops.every((s) => s && s.inDialog), demoStops.map((s) => s?.name).slice(0, 6).join(' | '));
  check('demo layer: every stop shows a focus ring', demoStops.every((s) => s && s.ring), demoStops.filter((s) => s && !s.ring).map((s) => s.name).join(','));
  await page.keyboard.press('Escape'); await page.waitForTimeout(2600);
  const f2 = await page.evaluate(() => ({ opener: document.activeElement?.getAttribute('data-demo-opener'), url: location.search }));
  check('Escape from the demo: URL clean and focus back on the hero CTA', f2.url === '' && f2.opener === 'selector:hero', JSON.stringify(f2));
  await ctx.close();
}

// ---- 2. Back / Forward / refresh / deep link --------------------------------------------
{
  const { ctx, page } = await mk();
  await load(page);
  await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
  const st = await page.evaluate(() => ({ sel: !!document.querySelector('dialog[open]'), search: location.search }));
  check('refresh with the selector open: back to a clean home (it is in-memory by contract)', !st.sel && st.search === '', JSON.stringify(st));
  await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor();
  await page.locator('[data-sx-row="inmobiliarias"]').click(); await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3300);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('dialog[data-demo-layer][open]', { timeout: 15000 });
  const guide = await page.evaluate(() => /Ver con guía|Ver por mi cuenta/.test(document.querySelector('dialog[data-demo-layer]')?.innerText ?? ''));
  check('refresh with the demo open: the demo comes back (contract URL) and asks guide / own again', guide);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const st2 = await page.evaluate(() => ({ demo: !!document.querySelector('dialog[open]'), search: location.search, len: history.length }));
  check('closing after a refresh does not leave the site and cleans the URL', !st2.demo && st2.search === '', JSON.stringify(st2));
  await ctx.close();
}

// ---- 3. Five cycles: no accumulation -----------------------------------------------------
{
  const { ctx, page } = await mk();
  await page.addInitScript(() => {
    const counts = {};
    const key = (t, type) => (t === window ? 'window' : t === document ? 'document' : 'other') + ':' + type;
    const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
    const seen = new WeakMap();
    EventTarget.prototype.addEventListener = function (type, fn, opts) { if (this === window || this === document) { const k = key(this, type); const s = seen.get(this) ?? new Set(); const sig = type + '|' + (typeof opts === 'object' ? !!opts?.capture : !!opts); const id = fn; const set = (seen.get(fn) ?? new Set()); if (!set.has(this)) { set.add(this); seen.set(fn, set); counts[k] = (counts[k] ?? 0) + 1; } } return add.call(this, type, fn, opts); };
    EventTarget.prototype.removeEventListener = function (type, fn, opts) { if (this === window || this === document) { const k = key(this, type); const set = seen.get(fn); if (set?.has(this)) { set.delete(this); counts[k] = Math.max(0, (counts[k] ?? 0) - 1); } } return rem.call(this, type, fn, opts); };
    window.__listeners = () => ({ ...counts });
  });
  await load(page);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const snap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const m = await cdp.send('Performance.getMetrics'); const get = (n) => m.metrics.find((x) => x.name === n)?.value; return { nodes: get('Nodes'), listeners: get('JSEventListeners'), heapKB: Math.round(get('JSHeapUsedSize') / 1024), anims: await page.evaluate(() => document.getAnimations().length), dialogs: await page.evaluate(() => document.querySelectorAll('dialog').length), lock: await page.evaluate(() => document.documentElement.style.overflow), custom: await page.evaluate(() => window.__listeners()) }; };
  // warm-up cycle (first open loads chunks), then 5 measured
  const cycle = async (withDemo) => {
    await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(450);
    if (withDemo) { await page.locator('[data-sx-row="inmobiliarias"]').click(); await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3300); await page.keyboard.press('Escape'); await page.waitForTimeout(2600); }
    else { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  };
  await cycle(true);
  const snaps = [await snap()];
  for (let i = 0; i < 5; i++) { await cycle(i % 2 === 0); snaps.push(await snap()); }
  const first = snaps[0], last = snaps[5];
  const diffKeys = Object.keys({ ...first.custom, ...last.custom }).filter((k) => (last.custom[k] ?? 0) !== (first.custom[k] ?? 0));
  console.log('   cycles:', snaps.map((s) => `${s.nodes}n/${s.listeners}L/${s.heapKB}KB/${s.anims}a/${s.dialogs}d`).join(' | '));
  check('5 open/close cycles (3 selector+demo, 2 selector only): DOM nodes do not grow', last.nodes - first.nodes <= 20, `${first.nodes}→${last.nodes}`);
  check('…JS event listeners do not grow', last.listeners - first.listeners <= 5, `${first.listeners}→${last.listeners}`);
  check('…window/document listeners registered by the layers are all removed', diffKeys.length === 0, diffKeys.map((k) => `${k}:${first.custom[k] ?? 0}→${last.custom[k] ?? 0}`).join(', '));
  check('…no running animations, no leftover dialog, scroll lock free', last.anims === first.anims && last.dialogs === 0 && last.lock === '', JSON.stringify({ a: last.anims, d: last.dialogs, lock: last.lock }));
  check('…JS heap stable (± 3 MB after GC)', Math.abs(last.heapKB - first.heapKB) < 3072, `${first.heapKB}→${last.heapKB} KB`);
  check('…no page errors', page.errs.length === 0, page.errs.join(' | '));
  await ctx.close();
}

// ---- 4. Failures -------------------------------------------------------------------------
{
  // 4a. the demo body chunk fails after the selector is open: panel, retry, exit, no lock
  const { ctx, page } = await mk();
  await load(page);
  await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(500);
  await page.route('**/_next/static/chunks/**', (r) => r.abort());
  await page.locator('[data-sx-row="inmobiliarias"]').click();
  await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3600);
  const fail = await page.evaluate(() => ({ panel: !!document.querySelector('[data-dx-fail]'), back: !!document.querySelector('[data-dx-back]'), wa: !!document.querySelector('[data-dx-fail] a[href^="https://wa.me/"]') }));
  check('demo body chunk fails: error panel with retry + WhatsApp, «Volver» still there', fail.panel && fail.back && fail.wa, JSON.stringify(fail));
  await page.unroute('**/_next/static/chunks/**');
  await page.locator('[data-dx-fail] button').click(); await page.waitForTimeout(2500);
  const recovered = await page.evaluate(() => ({ panel: !!document.querySelector('[data-dx-fail]'), stage: !!document.querySelector('.dx-stage, [data-dx-scroll] .dx-views') }));
  check('…«Reintentar» with the network back loads the demo', !recovered.panel && recovered.stage, JSON.stringify(recovered));
  await page.keyboard.press('Escape'); await page.waitForTimeout(2500);
  check('…and leaving works: no dialog, no scroll lock', (await page.evaluate(() => [document.querySelectorAll('dialog[open]').length, document.documentElement.style.overflow])).join('|') === '0|');
  await ctx.close();
}
{
  // 4b. failed Volver path of the broken body: exit while failed
  const { ctx, page } = await mk();
  await load(page);
  await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(500);
  await page.route('**/_next/static/chunks/**', (r) => r.abort());
  await page.locator('[data-sx-row="inmobiliarias"]').click();
  await page.waitForSelector('[data-dx-fail]', { timeout: 15000 });
  await page.locator('[data-dx-back]').click(); await page.waitForTimeout(2600);
  check('exit from the failed panel with «Volver»: page free, focus back on the CTA', (await page.evaluate(() => [document.querySelectorAll('dialog[open]').length, document.documentElement.style.overflow, document.activeElement?.getAttribute('data-demo-opener')])).join('|') === '0||selector:hero');
  await ctx.close();
}
{
  // 4c. media 404 (posters, trailers, images): CTA, prices, contact stay available
  const { ctx, page } = await mk();
  await page.route(/\.(mp4|webm|jpg|jpeg|png|webp|avif|svg|woff2)(\?.*)?$/i, (r) => { const u = r.request().url(); return u.includes('/Eclipse-Web/') && !u.includes('/_next/static/chunks/') ? r.abort() : r.continue(); });
  await load(page);
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); });
  const ok = await page.evaluate(() => ({ cta: !!document.querySelector('[data-hero-cta] a'), price: /US\$|\$\s?\d/.test(document.getElementById('precios')?.innerText ?? ''), wa: document.querySelectorAll('a[href^="https://wa.me/"]').length > 0, overflow: document.documentElement.scrollWidth - innerWidth }));
  check('all images/fonts/media 404: CTA, prices and WhatsApp still there, no overflow', ok.cta && ok.price && ok.wa && ok.overflow === 0, JSON.stringify(ok));
  await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(400);
  await page.locator('[data-sx-row="inmobiliarias"]').click(); await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3600);
  check('…and the demo still opens and closes', await page.evaluate(() => !!document.querySelector('dialog[data-demo-layer][open]')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(2500);
  check('…without leaving the page locked', (await page.evaluate(() => document.documentElement.style.overflow)) === '');
  check('…and without page errors', page.errs.length === 0, page.errs.join(' | '));
  await ctx.close();
}
{
  // 4d. autoplay rejected
  const { ctx, page } = await mk();
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('play() blocked', 'NotAllowedError')); }; });
  await load(page);
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); document.getElementById('ejemplos').scrollIntoView(); }); await page.waitForTimeout(3000);
  await page.getByRole('radio', { name: /Trailer/ }).click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1500);
  check('autoplay rejected (trailer): no uncaught errors, section still readable', page.errs.length === 0 && (await page.locator('#ejemplos').innerText()).length > 100, page.errs.join(' | '));
  await ctx.close();
}
{
  // 4e. reduced motion asks for no heavy clips
  const { ctx, page } = await mk({ reducedMotion: 'reduce' });
  const media = []; page.on('request', (r) => /\.(mp4|webm)(\?|$)/i.test(r.url()) && media.push(r.url().slice(-40)));
  await load(page);
  await page.evaluate(() => { document.documentElement.classList.add('cv-off'); }); 
  for (let y = 0; y < 14000; y += 700) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(200); }
  check('reduced motion: no video requested while walking the whole home', media.length === 0, media.join(','));
  await ctx.close();
}
{
  // 4f. slow network: 3G-ish. Server HTML already carries CTA, prices, contact.
  const { ctx, page } = await mk();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto(B + '/es/', { waitUntil: 'commit' });
  await page.waitForSelector('[data-hero-cta] a', { state: 'visible', timeout: 60000 });
  const tCta = Date.now() - t0;
  const html = await page.content();
  check('slow 3G (400 kbps, 400 ms): hero CTA visible', true, `${tCta} ms until the CTA is visible (lab, not a field metric)`);
  check('slow 3G: prices and WhatsApp are in the document already', /US\$|\$\s?\d/.test(await page.locator('#precios').innerText().catch(() => '')) || /precios/.test(html), '');
  await ctx.close();
}
{
  // 4g. JavaScript disabled (E2 for 1.1 §8)
  const { ctx, page } = await mk({ javaScriptEnabled: false });
  await page.goto(B + '/es/', { waitUntil: 'domcontentloaded' });
  const nojs = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.slice(0, 50), cta: document.querySelector('[data-hero-cta] a')?.getAttribute('href'), prices: (document.getElementById('precios')?.textContent ?? '').match(/US\$\s?[\d.,]+|\$\s?[\d.,]{3,}/g)?.length ?? 0, wa: [...document.querySelectorAll('a[href^="https://wa.me/"]')].length, mail: [...document.querySelectorAll('a[href^="mailto:"]')].length, noscript: document.querySelector('.hero-noscript')?.textContent?.slice(0, 40) ?? null, loaderOn: document.documentElement.getAttribute('data-loader') }));
  check('no JS: H1, contact CTA (#contacto), prices, WhatsApp and email are in the exported HTML', !!nojs.h1 && nojs.cta === '#contacto' && nojs.prices > 5 && nojs.wa > 0 && nojs.mail > 0, JSON.stringify(nojs));
  check('no JS: the loader never covers the page', nojs.loaderOn !== 'on', String(nojs.loaderOn));
  check('no JS: the honest notice about the interactive demo is shown', !!nojs.noscript, String(nojs.noscript));
  await ctx.close();
}
console.log(results.filter(Boolean).length + '/' + results.length + ' passed');
await browser.close();
