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

// 2. Home (mobile): loader only on first visit, no horizontal overflow, H1 present in HTML.
{
  const { ctx, page, errors } = await newPage(360, 780);
  await page.goto(`${BASE}/es/`);
  check('loader shown on first visit', (await page.getAttribute('html', 'data-loader')) === 'on');
  await page.waitForTimeout(1800);
  await page.reload();
  check('loader skipped on second visit', (await page.getAttribute('html', 'data-loader')) === null);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal overflow at 360px', overflow <= 0, `${overflow}px`);
  check('hero H1 rendered', (await page.locator('h1#hero-title').count()) === 1);

  // Sections hydrate lazily: pricing becomes interactive after scrolling to it.
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const card = page.locator('#precios .plan-card').first();
  check('pricing cards present', (await card.count()) > 0);
  const firstCard = page.locator('#precios .plan-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const addBtn = firstCard.locator('button[aria-pressed]').first();
  const before = await firstCard.innerText();
  await addBtn.click();
  await page.waitForTimeout(1200);
  const after = await firstCard.innerText();
  check('pricing add-on toggles after lazy hydration', before !== after && (await addBtn.getAttribute('aria-pressed')) === 'true');

  // Header flips to the light theme over the dawn sections.
  const headerLight = await page.evaluate(() => document.querySelector('header.site-header')?.classList.contains('theme-light'));
  check('header light over pricing', !!headerLight);

  // Currency switch updates hydrated prices.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.locator('button[aria-label="Abrir menú"]').click();
  await page.waitForTimeout(900);
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
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Precios' }).first().click();
  await page.waitForTimeout(1500);
  const top = await page.evaluate(() => document.getElementById('precios')?.getBoundingClientRect().top ?? 9999);
  check('nav link scrolls to #precios', Math.abs(top) < 200, `${Math.round(top)}px`);
  check('hash updated', page.url().endsWith('#precios'));

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.locator('#inicio button', { hasText: 'Clínicas' }).first().click();
  await page.waitForTimeout(3500);
  const region = page.locator('[role="region"]', { hasText: 'Clínica Aurora' }).first();
  check('hero chip reveals the clinic demo', (await region.count()) > 0 && (await region.isVisible()));
  const back = page.locator('button', { hasText: 'Ver otro rubro' }).first();
  if (await back.count()) {
    await back.click();
    await page.waitForTimeout(1800);
  }
  await page.getByRole('banner').getByRole('button', { name: 'Armá tu plan' }).first().click();
  await page.waitForTimeout(1500);
  check('builder drawer opens from header', (await page.locator('dialog[open]').count()) === 1);
  const item = page.locator('dialog[open] input[type="checkbox"]').first();
  await item.check({ force: true });
  await page.waitForTimeout(800);
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
  check('/plan detects the System plan from the URL', /System plan/i.test(text), '');
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
  const en = page.getByRole('navigation', { name: 'Idioma' }).first().getByRole('link', { name: 'English' });
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

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
