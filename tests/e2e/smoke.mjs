// End-to-end smoke test against the static export served under the basePath.
// Usage: BASE_URL=http://localhost:4000/Eclipse-Web node tests/e2e/smoke.mjs
import { chromium } from '@playwright/test';

const BASE = (process.env.BASE_URL ?? 'http://localhost:4000/Eclipse-Web').replace(/\/$/, '');
const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium' });

async function newPage(width = 390, height = 844, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text()) && errors.push(m.text()));
  return { ctx, page, errors };
}

// 1. Root redirect respects the browser language and the basePath.
for (const [lang, expected] of [['pt-BR', '/pt/'], ['en-US', '/en/'], ['es-AR', '/es/'], ['fr-FR', '/en/']]) {
  const { ctx, page } = await newPage(390, 844, { locale: lang });
  await page.goto(`${BASE}/`);
  await page.waitForURL((u) => u.pathname.endsWith(expected), { timeout: 5000 }).catch(() => {});
  check(`root redirect ${lang} → ${expected}`, new URL(page.url()).pathname === `/Eclipse-Web${expected}`, page.url());
  await ctx.close();
}

// 2. Home (mobile): loader on every load, no horizontal overflow, H1 present in HTML.
{
  const { ctx, page, errors } = await newPage(360, 780);
  await page.goto(`${BASE}/es/`, { waitUntil: 'domcontentloaded' });
  check('loader shown on load', (await page.getAttribute('html', 'data-loader')) === 'on');
  await page.waitForTimeout(2400);
  check('loader done after ~1.8 s', (await page.getAttribute('html', 'data-loader')) === 'done');
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('loader shown again on refresh', (await page.getAttribute('html', 'data-loader')) === 'on');
  await page.waitForTimeout(2400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal overflow at 360px', overflow <= 0, `${overflow}px`);
  check('hero H1 rendered', (await page.locator('h1#hero-title').count()) === 1);
  const ctaBox = await page.locator('[data-hero-cta]').first().boundingBox();
  const ctaBottom = ctaBox ? Math.round(ctaBox.y + ctaBox.height) : NaN;
  check('hero CTAs on the first screen at 360×780', ctaBottom <= 780, `${ctaBottom}px`);
  // v3e: one action (a REAL link to the contact block until lote 1.3 opens the selector) plus the
  // direct key of the only demo on show (the others are in standby); no "Otro", no "Armá tu plan".
  check(
    'hero: one action (a real link) and the one demo key',
    (await page.locator('#inicio .hero-ctas a, #inicio .hero-ctas button').count()) === 1 &&
      (await page.locator('#inicio .hero-ctas a[href="#contacto"]').count()) === 1 &&
      (await page.locator('#inicio [data-hero-chip]').count()) === 1 &&
      (await page.locator('#inicio [data-hero-chip="inmobiliarias"]').count()) === 1,
  );
  check('hero H1 is the marketing line', /Potenciá y visibilizá/.test(await page.locator('h1#hero-title').innerText()));

  // Sections hydrate lazily: the calculator reacts once it is reached.
  await page.evaluate(() => document.getElementById('problema')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const calcBefore = await page.locator('#problema').innerText();
  await page.locator('#problema .vf').first().locator('button').last().click();
  await page.waitForTimeout(900);
  check('calculator +1 updates the sentence and the total', (await page.locator('#problema').innerText()) !== calcBefore);

  // Pricing (lote 2.2b): three monthly plans in a ledger, same fields in the same place, hours before the action.
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const plansLedger = page.locator('#precios .pr-mp-plan');
  check('pricing shows the three monthly plans (30 / 75 / 150)', (await plansLedger.count()) === 3, `${await plansLedger.count()}`);
  check('no retired offer on the page (Adaptación / Pack lanzamiento)', !/Pack lanzamiento|Adaptación de producto/.test(await page.locator('#precios').innerText()));
  check('each plan states its human hours', (await plansLedger.locator('.pr-mp-row', { hasText: '2 h' }).count()) === 3);
  check('Esencial brings no Studio/Academy and says so', (await plansLedger.first().locator('.pr-mp-row[data-empty]').count()) === 2);
  check('Conectado brings Academy inicial', /Academy inicial/.test(await plansLedger.nth(1).innerText()));
  check('one monthly/annual switch on the page', (await page.locator('#precios [role="radiogroup"], #precios [data-billing-toggle]').count()) <= 1);

  // Header flips to the light theme over the dawn sections.
  await plansLedger.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  const headerLight = await page.evaluate(() => document.querySelector('header.site-header')?.classList.contains('theme-light'));
  check('header light over pricing', !!headerLight);

  // Currency switch updates hydrated prices.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.locator('button[aria-label="Abrir menú"]').click();
  await page.waitForTimeout(900);
  await page.locator('dialog[open] summary', { hasText: 'Idioma, moneda' }).click();
  await page.locator('dialog[open] label', { hasText: 'USD' }).first().click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1200);
  const usdText = await page.locator('#precios').innerText();
  check('prices in USD after switching currency', /US\$|\$\s?1[.,]000/.test(usdText) && !/≈ \$ 1\.450\.000/.test(usdText));
  check('no page errors (mobile home)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 3. Desktop: nav link scrolls to section + focus moves, the header CTA opens the rubro selector.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(1800);
  // One solid amber button per viewport: the header's CTA is quiet while the hero's is on screen.
  const hdrCta = page.getByRole('banner').locator('.hdr-cta').first();
  check('header CTA quiet next to the hero CTA', /hdr-cta-quiet/.test((await hdrCta.getAttribute('class')) ?? ''));
  await page.evaluate(() => document.getElementById('servicios')?.scrollIntoView());
  await page.waitForTimeout(1200);
  check('header CTA solid when no page CTA is on screen', /btn-primary/.test((await hdrCta.getAttribute('class')) ?? ''));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Precios' }).first().click();
  // Smooth scroll: wait until the position settles (up to 6 s) before measuring.
  let top = 9999;
  for (let i = 0, last = NaN; i < 30; i++) {
    await page.waitForTimeout(200);
    top = await page.evaluate(() => document.getElementById('precios')?.getBoundingClientRect().top ?? 9999);
    if (Math.abs(top - last) < 1) break;
    last = top;
  }
  check('nav link scrolls to #precios', Math.abs(top) < 200, `${Math.round(top)}px`);
  check('hash updated', page.url().endsWith('#precios'));

  // Soluciones has no prices (v3d): each family links to Precios → Pieza por pieza, also
  // when Precios hasn't hydrated yet.
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(1800);
  check('Soluciones lists no prices', (await page.locator('#servicios .svc-piece .readout, #servicios .svc-add').count()) === 0);
  await page.evaluate(() => document.getElementById('servicios')?.scrollIntoView());
  await page.waitForTimeout(1200);
  // «Qué ofrecemos»: five lines, SaaS open by default; the six families and 20 pieces are folded below.
  check('Qué ofrecemos: five lines, SaaS open', (await page.locator('#servicios .off-row').count()) === 5 && (await page.locator('#servicios .off-row[data-open] .off-name').innerText()) === 'SaaS');
  check('pieces index starts folded', (await page.locator('#servicios details.off-pieces').evaluate((d) => d.open)) === false);
  await page.locator('#servicios details.off-pieces summary').click();
  await page.waitForTimeout(1200);
  await page.locator('#servicios .svc-prices-link').first().click();
  await page.waitForTimeout(2500);
  check('family link opens Precios → Pieza por pieza', (await page.locator('#pr-tab-pieces').getAttribute('aria-selected')) === 'true' && (await page.locator('#pr-panel-pieces').isVisible()));
  const tabTop = await page.evaluate(() => document.getElementById('pr-tab-pieces')?.getBoundingClientRect().top ?? 9999);
  check('…and lands on it', tabTop > 0 && tabTop < 400, `${Math.round(tabTop)}px`);

  // "Ver demo" opens one light layer (the eclipse takes the center, the light floods it): the page never scrolls,
  // and closing restores the exact position and focus.
  // A wheel is user input: it ends the anchor re-aim from the jump above (it never fights the visitor).
  await page.mouse.wheel(0, -30000);
  await page.waitForTimeout(800);
  const chip = page.locator('#inicio [data-hero-chip="inmobiliarias"]');
  await chip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const yBefore = await page.evaluate(() => window.scrollY);
  await chip.click();
  await page.waitForSelector('dialog[data-demo-layer][open]');
  check('hero chip opens the demo layer', await page.locator('dialog[data-demo-layer] h2', { hasText: 'Lumen Propiedades' }).isVisible());
  check('opening a demo does not scroll the page', (await page.evaluate(() => window.scrollY)) === yBefore);
  await page.waitForTimeout(1200);
  // Lote 2.2b: no offer is on sale, so the demo's simulated channels show at their own price.
  check('demo layer shows the complete project with its pieces and prices', (await page.locator('[data-dx-project] [data-dx-extras] .dx-piece-price').count()) > 0 && (await page.locator('[data-dx-project] [data-dx-price]').count()) === 0);
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog[data-demo-layer]', { state: 'detached' });
  check('layer closes, scroll kept', (await page.evaluate(() => window.scrollY)) === yBefore);
  check('focus returns to the opener', await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener') === 'hero:realEstate'));
  // Sound is opt-in; the preferences popover explains the currency.
  await page.getByRole('banner').getByRole('button', { name: /Idioma, moneda/ }).first().click();
  await page.waitForTimeout(600);
  const sound = page.getByRole('banner').getByRole('button', { name: /Sonido/ }).first();
  check('sound is off by default', (await sound.getAttribute('aria-pressed')) === 'false');
  const prefs = page.getByRole('dialog', { name: /Idioma, moneda/ }).first();
  check('preferences popover shows the rate used', /1 USD ≈/.test(await prefs.innerText()));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Sala de demos: one tab per business with a demo.
  await page.evaluate(() => document.getElementById('ejemplos')?.scrollIntoView());
  await page.waitForTimeout(1500);
  check('demo room lists the demo on show (the other five are in standby)', (await page.locator('#ejemplos [role="tab"]').count()) === 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // v3e (lote 1.3): no "Armá tu plan" anywhere on the home (the builder is dormant); the header's
  // CTA is «Potenciar mi negocio» and opens the rubro selector; Escape hands focus back to it.
  check('no «Armá tu plan» entry point on the home', (await page.getByRole('button', { name: /Armá tu plan/ }).count()) === 0 && (await page.getByRole('link', { name: /Armá tu plan/ }).count()) === 0);
  await hdrCta.click();
  await page.waitForSelector('dialog[data-selector-layer][open]');
  await page.waitForTimeout(500);
  check('header CTA opens the selector with exactly two rows', (await page.locator('dialog[data-selector-layer] [data-sx-row]').count()) === 2 && (await page.locator('dialog[data-selector-layer] h2').innerText()) === '¿Qué negocio querés potenciar?');
  check('Ecommerce row is aria-disabled and says «Próximamente»', (await page.locator('[data-sx-row="ecommerce"]').getAttribute('aria-disabled')) === 'true' && /próximamente/i.test(await page.locator('[data-sx-row="ecommerce"]').innerText()));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check('Escape closes the selector and focus returns to the header CTA', (await page.locator('dialog[data-selector-layer]').count()) === 0 && (await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener'))) === 'selector:header');
  check('no page errors (desktop home)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 3b. Showroom (lote 1.3): selector → demo, History, direct entries, fallbacks.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2500);
  const state = () => page.evaluate(() => ({ path: location.pathname + location.search, len: history.length, sel: !!document.querySelector('dialog[data-selector-layer][open]'), demo: !!document.querySelector('dialog[data-demo-layer][open]'), lock: document.documentElement.style.overflow }));
  const start = await state();
  await page.locator('[data-hero-cta] a').click();
  await page.waitForSelector('dialog[data-selector-layer][open]');
  let st = await state();
  check('hero CTA opens the selector, one history entry, same URL', st.sel && st.len === start.len + 1 && st.path === start.path, `${start.len}→${st.len}`);
  await page.goBack();
  await page.waitForTimeout(500);
  st = await state();
  check('browser Back closes the selector (no stuck scroll lock)', !st.sel && st.lock === '' && st.path === start.path);
  await page.goForward();
  await page.waitForTimeout(800);
  check('Forward brings the selector back', (await state()).sel);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.locator('[data-hero-cta] a').click();
  await page.waitForSelector('dialog[data-selector-layer][open]');
  await page.locator('[data-sx-row="inmobiliarias"]').click();
  await page.waitForSelector('dialog[data-demo-layer][open]');
  await page.waitForTimeout(3200);
  st = await state();
  check('choosing Inmobiliarias hands off to the demo: URL contract, no second entry, selector gone', st.demo && !st.sel && /rubro=inmobiliarias&vista=guia/.test(st.path) && st.len === start.len + 1, st.path);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2600);
  st = await state();
  check('closing the demo cleans the URL and restores the hero CTA focus', !st.demo && st.path === start.path && (await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener'))) === 'selector:hero');

  // Direct entry: opens without the film, keeps foreign params, closing never leaves the site.
  await page.goto(`${BASE}/es/?rubro=inmobiliarias&vista=guia&utm_source=ad`);
  await page.waitForSelector('dialog[data-demo-layer][open]', { timeout: 15000 });
  const entries = (await state()).len;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  st = await state();
  check('direct entry: Escape cleans the contract, keeps utm_source, stays on the site, focus on the H1', !st.demo && !/rubro/.test(st.path) && /utm_source=ad/.test(st.path) && st.len === entries && (await page.evaluate(() => document.activeElement?.tagName)) === 'H1', st.path);

  // Anything off the allow-list is dropped.
  await page.goto(`${BASE}/es/?rubro=clinicas&vista=guia`);
  await page.waitForTimeout(2500);
  st = await state();
  check('invalid rubro: nothing opens and the params are cleaned', !st.demo && !st.sel && !/rubro|vista/.test(st.path), st.path);
  await page.goto(`${BASE}/es/portal/?rubro=inmobiliarias`);
  await page.waitForTimeout(2500);
  st = await state();
  check('portal never opens the showroom', !st.demo && !st.sel);
  check('no page errors (showroom)', errors.length === 0, errors.slice(0, 3).join(' | '));

  // The selector's chunk can't be fetched: the CTA does what the link says (goes to the contact).
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2500);
  await page.route('**/_next/static/chunks/**', (r) => r.abort());
  await page.locator('[data-hero-cta] a').click();
  await page.waitForTimeout(1500);
  st = await state();
  check('selector chunk fails: no dialog, page not locked, falls to #contacto', !st.sel && st.lock === '' && page.url().endsWith('#contacto'));
  await ctx.close();
}

// 4. Shareable plan route reads the URL state.
{
  const { ctx, page, errors } = await newPage(1280, 900);
  // A link made while the Launch pack existed: the retired offer is dropped, the rest is kept (lote 2.2b).
  await page.goto(`${BASE}/en/plan/?plan=pack&items=chatbot&m=ia`);
  await page.waitForTimeout(2500);
  const text = await page.locator('main').innerText();
  // The chatbot is its own project now: 750, half upfront.
  check('/plan drops the retired pack from an old link and prices the chatbot alone, 50/50', !/Launch pack/.test(text) && /\$750/.test(text) && /\$375/.test(text), '');
  check('no page errors (/plan)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 5. Keyboard: tabbing into a dormant section keeps focus after it hydrates.
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/pt/`);
  await page.waitForTimeout(1500);
  const focusedInside = await page.evaluate(async () => {
    const section = document.getElementById('contacto');
    const link = section?.querySelector('a[href], button');
    (link)?.focus();
    await new Promise((r) => setTimeout(r, 1200));
    const active = document.activeElement;
    // The section's DOM is re-created on hydration: query it again.
    const fresh = document.getElementById('contacto');
    return !!fresh && !!active && fresh.contains(active) && active !== document.body;
  });
  check('focus survives lazy hydration', focusedInside);
  await ctx.close();
}

// 5b. Language switch: full navigation to /en/ keeping the path, no React script warning.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/plan/?items=landing`);
  await page.waitForTimeout(1500);
  await page.getByRole('banner').getByRole('button', { name: /Idioma, moneda/ }).first().click();
  await page.waitForTimeout(600);
  const en = page.getByRole('group', { name: /Idioma/ }).first().getByRole('link', { name: /English/ });
  const href = await en.getAttribute('href');
  check('locale link keeps path + query under the basePath', href === '/Eclipse-Web/en/plan/?items=landing', href ?? '');
  await en.click();
  await page.waitForURL(/\/en\/plan\//);
  await page.waitForTimeout(1200);
  check('html lang switches to en', (await page.getAttribute('html', 'lang')) === 'en');
  check('no errors after language switch', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// 6. Reduced motion: no pin spacer, page usable.
{
  const { ctx, page, errors } = await newPage(1440, 900, { reducedMotion: 'reduce' });
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(1500);
  check('reduced motion: no pin spacer', (await page.locator('.pin-spacer').count()) === 0);
  check('no page errors (reduced motion)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 7. 404 page under the basePath.
{
  const { ctx, page } = await newPage(390, 844);
  const res = await page.goto(`${BASE}/no-existe/`);
  check('404 served with links back', res?.status() === 404 && (await page.locator(`a[href="/Eclipse-Web/es/"]`).count()) > 0);
  await ctx.close();
}

// 8. Client portal mockup: "Ingresar" → demo login (no auth, nothing sent or stored),
//    Mis proyectos (table on desktop, cards on phones) and a project's detail.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  const sent = [];
  // Anything that could carry data (a form post, a beacon): GET/HEAD are navigation and prefetch.
  page.on('request', (r) => !['GET', 'HEAD'].includes(r.method()) && sent.push(`${r.method()} ${r.url()}`));
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(1500);
  const login = page.getByRole('banner').getByRole('link', { name: /Ingresar/ }).first();
  check('header "Ingresar" points to the portal', /\/Eclipse-Web\/es\/portal\/$/.test((await login.getAttribute('href')) ?? ''));
  await login.click();
  await page.waitForURL(/\/es\/portal\/$/);
  await page.waitForTimeout(800);
  check('portal login shows the demo notice', (await page.locator('[data-portal-demo-notice]').count()) > 0);
  // The form is only layout: submitting it sends and stores nothing, and clears the password.
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Contraseña').fill('no-es-real');
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(600);
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
  check('demo login sends and stores nothing', sent.length === 0 && !/no-es-real|demo@example/.test(stored), sent.join(' | '));
  check('demo login clears the password', (await page.getByLabel('Contraseña').inputValue()) === '');
  await page.getByRole('link', { name: /Ver portal de ejemplo/ }).first().click();
  await page.waitForURL(/\/es\/portal\/proyectos\/$/);
  // First visit: the onboarding opens by itself; Escape closes it and it's remembered (localStorage only).
  const guide = await page.waitForSelector('.tour', { timeout: 4000 }).then(() => true, () => false);
  check('Mis proyectos: first visit opens the guide', guide);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check(
    'portal guide closes and is remembered',
    (await page.locator('.tour').count()) === 0 &&
      (await page.evaluate(() => localStorage.getItem('eclipse:tour:portal-projects-v1'))) === '1',
  );
  const row = page.locator('table[data-portal-projects-table] tr[data-portal-project="sitio-web"]');
  const rowText = await row.evaluate((el) => el.textContent?.replace(/\s+/g, ' ') ?? '');
  check('Mis proyectos: example site in 2 de 5 · Construcción', /2 de 5 · Construcción/.test(rowText));
  await row.getByRole('link').first().click();
  await page.waitForURL(/\/es\/portal\/proyectos\/sitio-web\/$/);
  await page.waitForTimeout(800);
  const h1 = page.locator('h1');
  check('project detail: one h1, the project name', (await h1.count()) === 1 && /Sitio web de ejemplo/.test(await h1.innerText()));
  check('no page errors (portal)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await newPage(360, 780);
  await page.goto(`${BASE}/es/portal/proyectos/`);
  await page.waitForTimeout(800);
  check('portal loads without the loader', (await page.evaluate(() => document.documentElement.getAttribute('data-loader'))) !== 'on');
  const cards = await page.locator('ul[data-portal-projects-cards] > li').count();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  check('portal on phones: project cards, no horizontal scroll', cards >= 1 && fits, `${cards} cards`);
  const res = await page.goto(`${BASE}/es/portal/proyectos/no-existe/`);
  check('unknown portal project is a 404', res?.status() === 404);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
