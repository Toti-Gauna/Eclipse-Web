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
  const shortcutHrefs = await page.getByRole('navigation', { name: 'Atajos' }).locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  check('hero shortcuts to demos, soluciones and precios', ['#ejemplos', '#servicios', '#precios'].every((h) => shortcutHrefs.includes(h)), shortcutHrefs.join(' '));

  // Sections hydrate lazily: the calculator reacts once it is reached.
  await page.evaluate(() => document.getElementById('problema')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const calcBefore = await page.locator('#problema').innerText();
  await page.locator('#problema .vf').first().locator('button').last().click();
  await page.waitForTimeout(900);
  check('calculator +1 updates the sentence and the total', (await page.locator('#problema').innerText()) !== calcBefore);

  // Pricing: package rows open on phones after lazy hydration.
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const rows = page.locator('#precios .pr-plan');
  check('pricing package rows present', (await rows.count()) >= 7, `${await rows.count()}`);
  const toggle = rows.first().locator('.pr-plan-toggle').first();
  await toggle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await toggle.click();
  await page.waitForTimeout(800);
  check('package row opens after lazy hydration', (await toggle.getAttribute('aria-expanded')) === 'true');
  check('one monthly/annual switch on the page', (await page.locator('#precios [role="radiogroup"], #precios [data-billing-toggle]').count()) <= 1);

  // Header flips to the light theme over the dawn sections.
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

// 3. Desktop: nav link scrolls to section + focus moves, hero chip reveals a demo, builder opens.
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

  // "Ver demo" opens one light layer (the eclipse takes the center, the light floods it): the page never scrolls,
  // and closing restores the exact position and focus.
  // A wheel is user input: it ends the anchor re-aim from the jump above (it never fights the visitor).
  await page.mouse.wheel(0, -30000);
  await page.waitForTimeout(800);
  const chip = page.locator('#inicio [data-hero-chip="clinicas"]');
  await chip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const yBefore = await page.evaluate(() => window.scrollY);
  await chip.click();
  await page.waitForSelector('dialog[data-demo-layer][open]');
  check('hero chip opens the demo layer', await page.locator('dialog[data-demo-layer] h2', { hasText: 'Clínica Aurora' }).isVisible());
  check('opening a demo does not scroll the page', (await page.evaluate(() => window.scrollY)) === yBefore);
  await page.waitForTimeout(1200);
  check('demo layer shows the complete project with its price', (await page.locator('[data-dx-project] [data-dx-price]').count()) > 0);
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog[data-demo-layer]', { state: 'detached' });
  check('layer closes, scroll kept', (await page.evaluate(() => window.scrollY)) === yBefore);
  check('focus returns to the opener', await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener') === 'hero:clinic'));
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
  check('demo room lists every business', (await page.locator('#ejemplos [role="tab"]').count()) >= 6);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  await page.getByRole('banner').getByRole('button', { name: 'Armá tu plan' }).first().click();
  await page.waitForTimeout(1500);
  check('builder drawer opens from header', (await page.locator('dialog[open]').count()) === 1);
  const goal = page.locator('dialog[open] input[type="checkbox"]').first();
  await goal.check({ force: true });
  await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) {
    const next = page.locator('dialog[open] button', { hasText: /Siguiente/ }).first();
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(700);
  }
  const send = page.locator('dialog[open] a[href^="https://wa.me/"]').first();
  const href = (await send.count()) ? await send.getAttribute('href') : '';
  const msg = decodeURIComponent((href ?? '').split('text=')[1] ?? '');
  check('builder WhatsApp message has items, total, language and currency', /Armé mi plan/.test(msg) && /Total estimado/.test(msg) && /Idioma: Español/.test(msg) && /Moneda: ARS/.test(msg), msg.split('\n').slice(0, 3).join(' / '));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check('no page errors (desktop home)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 4. Shareable plan route reads the URL state.
{
  const { ctx, page, errors } = await newPage(1280, 900);
  await page.goto(`${BASE}/en/plan/?items=turnos,pedidos,automatizacion,dashboard,landing,voz&m=crecimiento`);
  await page.waitForTimeout(2500);
  const text = await page.locator('main').innerText();
  check('/plan detects the System package from the URL', /System (plan|package)/i.test(text), '');
  check('no page errors (/plan)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 5. Keyboard: tabbing into a dormant section keeps focus after it hydrates.
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/pt/`);
  await page.waitForTimeout(1500);
  const focusedInside = await page.evaluate(async () => {
    const section = document.getElementById('fundadores');
    const link = section?.querySelector('a[href], button');
    (link)?.focus();
    await new Promise((r) => setTimeout(r, 1200));
    const active = document.activeElement;
    // The section's DOM is re-created on hydration: query it again.
    const fresh = document.getElementById('fundadores');
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
