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
  // The intro film plays on every load of the home (28/10/2026): the checks that are not about it switch it off.
  const { intro = false, ...rest } = opts;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768, ...rest });
  if (!intro) await ctx.addInitScript(() => localStorage.setItem('eclipse:intro', 'off'));
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
  // 28/10/2026: one action (a REAL link to the products banner right below) plus the direct key of
  // the only demo on show (the others are in standby); no "Otro", no "Armá tu plan".
  check(
    'hero: one action (a real link) and the one demo key',
    (await page.locator('#inicio .hero-ctas a, #inicio .hero-ctas button').count()) === 1 &&
      (await page.locator('#inicio .hero-ctas a[href="#productos"]').count()) === 1 &&
      (await page.locator('#inicio [data-hero-chip]').count()) === 1 &&
      (await page.locator('#inicio a[data-hero-chip][href="#productos"]').count()) === 1,
  );
  check('hero H1 is the marketing line', /Potenciá y visibilizá/.test(await page.locator('h1#hero-title').innerText()));

  // The home is the hero, the four products, Eclipse Media and Equipamiento — nothing else.
  check(
    'home sections: hero · productos · media · equipamiento',
    JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map((s) => s.id))) ===
      JSON.stringify(['inicio', 'productos', 'media', 'equipamiento']),
  );
  const screens = page.locator('#productos [data-pd-screen]');
  check('products banner: Eclipse para inmobiliarias / locales de comida / ecommerce, Handy, then gimnasios, DentalOS, clínicas and VetOS', (await screens.count()) === 8 && /Inmobiliarias[\s\S]*Locales de comida[\s\S]*Ecommerce[\s\S]*Handy[\s\S]*Gimnasios[\s\S]*DentalOS[\s\S]*Clínicas[\s\S]*VetOS/.test(await page.locator('#productos').innerText()));
  check(
    'the coming ones say «Próximamente», with no price and no page, and offer a heads-up on WhatsApp',
    (await page.locator('#productos [data-soon] .pd-soon', { hasText: 'Próximamente' }).count()) === 4 &&
      (await page.locator('#productos [data-soon] .pd-notify[href*="wa.me"]').count()) === 4 &&
      !/US\$|\$\s?\d/.test(await page.locator('#pd-gym, #pd-dental, #pd-clinic, #pd-vet').allInnerTexts().then((x) => x.join(' '))),
  );
  check(
    'each product says «Conocer <producto>» and leads to its page',
    (await page.locator('#productos .pd-know', { hasText: /^Conocer (más|Handy)/ }).count()) === 4 &&
      (await page.locator('#productos .pd-know').first().getAttribute('href')) === '/Eclipse-Web/es/productos/roofy/',
  );
  check(
    'floating «Contactanos» bottom left: WhatsApp, named in full, ≥ 44 px',
    await (async () => {
      const a = page.locator('.fcontact-btn');
      const box = await a.boundingBox();
      return /wa\.me/.test((await a.getAttribute('href')) ?? '') && /Contactanos por WhatsApp/.test((await a.getAttribute('aria-label')) ?? '') && !!box && box.height >= 44 && box.x < 100;
    })(),
  );
  check('only Roofy carries a price; Foody/Markyt in preparation; Handy with its launch date', /Disponible · desde/.test(await page.locator('#pd-roofy').innerText()) && /En preparación/.test(await page.locator('#pd-foody').innerText()) && /Lanza el 10 de noviembre de 2026/.test(await page.locator('#pd-handy').innerText()));
  check('phones: the products stack (no pinned track)', (await page.locator('#productos[data-mode]').count()) === 0);
  check('no sales sections of v3 on the home', (await page.locator('#precios, #ejemplos, #servicios, #contacto').count()) === 0);

  // The v3 landing lives on /agency/ now, with its ids.
  await page.goto(`${BASE}/es/agency/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  // Sections hydrate lazily: the calculator reacts once it is reached.
  await page.evaluate(() => document.getElementById('problema')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const calcBefore = await page.locator('#problema').innerText();
  await page.locator('#problema .vf').first().locator('button').last().click();
  await page.waitForTimeout(900);
  check('calculator +1 updates the sentence and the total', (await page.locator('#problema').innerText()) !== calcBefore);

  // Pricing (lote 2.3b): the ladder of six monthly levels; demo first, then ask for the plan.
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1500);
  const levelRows = page.locator('#precios .pr-lv-row');
  check('pricing shows the six levels (30 / 75 / 100 / 150 / 200 / 500)', (await levelRows.count()) === 6, `${await levelRows.count()}`);
  check('no retired offer or old monthly plan on the page', !/Pack lanzamiento|Adaptación de producto|Esencial|Conectado|Automatización e IA/.test(await page.locator('#precios').innerText()));
  check('Partner is marked as a proposal', /propuesta/i.test(await levelRows.last().innerText()));
  check('every level offers the demo first and then asks for the plan', (await page.locator('#precios .pr-lv-demo').count()) === 6 && (await page.locator('#precios .pr-lv-ask').count()) === 6);
  check('asking for a plan opens WhatsApp with the plan in the message', /wa\.me/.test((await page.locator('#precios .pr-lv-ask').first().getAttribute('href')) ?? '') && /Contact/.test(decodeURIComponent((await page.locator('#precios .pr-lv-ask').first().getAttribute('href')) ?? '')));
  check('one monthly/annual switch on the page', (await page.locator('#precios [role="radiogroup"], #precios [data-billing-toggle]').count()) <= 1);

  // Header flips to the light theme over the dawn sections.
  await levelRows.first().scrollIntoViewIfNeeded();
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
  check('no page errors (mobile home + agency)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 2b. The intro film «Eclipse en 40 segundos»: after the loader on every load of the home, «Saltar», Escape,
// «Activar Eclipse»; never over a shared link to a section; a still card with reduced motion.
{
  const { ctx, page, errors } = await newPage(1440, 900, { intro: true });
  await page.goto(`${BASE}/es/`, { waitUntil: 'domcontentloaded' });
  check('intro: the veil covers the home from the first paint', (await page.getAttribute('html', 'data-intro')) === 'on');
  await page.locator('dialog.it[open]').waitFor({ timeout: 15000 });
  check('intro: the film opens once the loader is over', (await page.getAttribute('html', 'data-loader')) === 'done');
  check(
    'intro: it waits on a centred «Activar Eclipse»; nothing plays and «Saltar» is there',
    (await page.locator('dialog.it [data-start]').isVisible()) && (await page.locator('dialog.it [data-sound]').count()) === 0 && (await page.getByRole('button', { name: 'Saltar' }).count()) === 1,
  );
  await page.locator('dialog.it [data-start]').click();
  await page.waitForTimeout(600);
  check('intro: «Activar Eclipse» starts the film (sound control and progress appear, the start screen is gone)', (await page.locator('dialog.it [data-start]').count()) === 0 && (await page.locator('dialog.it [data-sound]').count()) === 1 && (await page.locator('dialog.it .it-ruler').count()) === 1);
  const wipeVisible = await page.locator('dialog.it [data-wipe]').evaluate((el) => getComputedStyle(el).visibility);
  check('intro: no stray light bar at the edge before a scene change', wipeVisible === 'hidden', wipeVisible);
  // textContent: the scenes still to come are hidden (autoAlpha), but they are all in the film from the start.
  const film = (await page.locator('dialog.it').textContent()) ?? '';
  check(
    'intro: the four products, the four coming, the units and the six plans priced from the catalog',
    (await page.locator('dialog.it [data-panel]').count()) === 4 &&
      (await page.locator('dialog.it [data-soon-card]').count()) === 4 &&
      (await page.locator('dialog.it [data-unit]').count()) === 5 &&
      (await page.locator('dialog.it [data-plan] [data-price]').count()) === 6 &&
      /Inmobiliarias[\s\S]*Handy[\s\S]*VetOS[\s\S]*Partner/.test(film),
  );
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Saltar' }).click();
  await page.waitForTimeout(1700);
  const after = await page.evaluate(() => ({ open: !!document.querySelector('dialog.it[open]'), intro: document.documentElement.dataset.intro, focus: document.activeElement?.id, y: scrollY }));
  check('«Saltar» hands over to the home: film closed, page free, focus on the H1', !after.open && after.intro === 'done' && after.focus === 'hero-title' && after.y === 0, JSON.stringify(after));
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('intro: plays again on refresh (nothing is remembered)', (await page.getAttribute('html', 'data-intro')) === 'on');
  await page.locator('dialog.it[open]').waitFor({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1700);
  check('intro: Escape skips it', (await page.locator('dialog.it[open]').count()) === 0);
  await page.goto(`${BASE}/es/media/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  check('intro: only on the home', (await page.locator('dialog.it').count()) === 0);
  // A fresh load (from another page, not a same-document hash change).
  await page.goto(`${BASE}/es/#productos`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  check('intro: never over a shared link to a section', (await page.locator('dialog.it[open]').count()) === 0 && (await page.getAttribute('html', 'data-intro')) === null);
  check('no page errors (intro)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
{
  const { ctx, page, errors } = await newPage(390, 844, { intro: true, reducedMotion: 'reduce' });
  await page.goto(`${BASE}/es/`, { waitUntil: 'domcontentloaded' });
  await page.locator('dialog.it[open]').waitFor({ timeout: 15000 });
  const still = page.locator('dialog.it .it-still');
  check(
    'intro with reduced motion: a still card (products, units, six plans priced) and «Activar Eclipse»',
    (await still.count()) === 1 && (await page.locator('dialog.it .it-stage').count()) === 0 && /Contact[\s\S]*Partner/.test(await still.innerText()) && (await page.getByRole('button', { name: 'Activar Eclipse' }).isVisible()),
  );
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.getByRole('button', { name: 'Activar Eclipse' }).click();
  await page.waitForTimeout(700);
  check('«Activar Eclipse» opens the home (phone, reduced motion), no horizontal scroll', (await page.locator('dialog.it[open]').count()) === 0 && fits);
  check('no page errors (intro, reduced)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 2c. Loading screens between pages, «Conocer X» into the light, plates that keep moving.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2200);
  await page.getByRole('banner').getByRole('link', { name: 'Media', exact: true }).click();
  await page.waitForTimeout(350);
  check('page change: a loading screen covers the page and names the destination', (await page.locator('.pt[data-state="on"][data-tone="night"]').count()) === 1 && /Media/.test((await page.locator('.pt-name').textContent()) ?? ''));
  await page.waitForURL(/\/es\/media\/$/, { timeout: 8000 });
  await page.locator('.pt[data-state="off"]').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  check('… and opens onto the new page', (await page.locator('.pt[data-state="off"]').count()) === 1 && /Media/.test((await page.locator('h1').textContent()) ?? ''));
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2200);
  await page.locator('#pd-roofy .pd-know').click();
  await page.waitForTimeout(500);
  check('«Conocer Roofy»: the screen goes to light (the demo\'s opening)', (await page.locator('.pt[data-state="on"][data-tone="light"]').count()) === 1);
  await page.waitForURL(/\/es\/productos\/roofy\/$/, { timeout: 8000 });
  await page.locator('.pt[data-state="off"]').waitFor({ state: 'attached', timeout: 6000 }).catch(() => {});
  check(
    '… and the product page is all in daylight',
    (await page.locator('.pt[data-state="off"]').count()) === 1 && (await page.locator('main .pp-hero.theme-light').count()) === 1 && (await page.locator('main .bg-void, main .theme-dark').count()) === 0,
  );
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2000);
  await page.locator('#pd-roofy').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3200);
  const walker = page.locator('#pd-roofy [data-i="visitor"]');
  const t1 = await walker.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(700);
  const t2 = await walker.evaluate((el) => getComputedStyle(el).transform);
  check('plates keep moving: Roofy\'s visitor walks to the door', t1 !== t2, `${t1} → ${t2}`);
  check('no page errors (transitions)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 2d. Hero «Descubrí los productos»: the automatic tour, and «Seguir con el tour automático» once the visitor takes over.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(2400);
  const startBtn = page.locator('#inicio a[data-tour-start]');
  const box = await startBtn.boundingBox();
  check('«Descubrí los productos» is as big as the primary action (a full button)', !!box && box.height >= 48 && box.width >= 220, JSON.stringify(box));
  check(
    'products lead with who they are for: Inmobiliarias · Locales de comida · Ecommerce',
    /Inmobiliarias/.test(await page.locator('#pd-roofy h3').innerText()) && /Locales de comida/.test(await page.locator('#pd-foody h3').innerText()) && /Ecommerce/.test(await page.locator('#pd-markyt h3').innerText()),
  );
  await startBtn.click();
  await page.waitForTimeout(4500);
  const y1 = await page.evaluate(() => scrollY);
  await page.waitForTimeout(4200);
  const y2 = await page.evaluate(() => scrollY);
  check('the tour scrolls the page by itself through the products', y1 > 600 && y2 > y1, `${y1} → ${y2}`);
  check('… with no resume button while it runs', (await page.locator('.atb[data-shown]').count()) === 0);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(500);
  const y3 = await page.evaluate(() => scrollY);
  check('taking over (wheel) pauses it and shows «Seguir con el tour automático»', (await page.locator('.atb[data-shown]').count()) === 1 && (await page.getByRole('button', { name: 'Seguir con el tour automático' }).isVisible()));
  await page.waitForTimeout(3000);
  check('paused: the page stays where the visitor left it', Math.abs((await page.evaluate(() => scrollY)) - y3) < 5);
  await page.getByRole('button', { name: 'Seguir con el tour automático' }).click();
  await page.waitForTimeout(5200);
  check('resuming continues the tour and hides the button', (await page.evaluate(() => scrollY)) > y3 + 100 && (await page.locator('.atb[data-shown]').count()) === 0);
  check('no page errors (tour)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 3. Desktop: the floating «Potenciar mi negocio», the products track, the unit pages, the selector on /agency/.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  await page.goto(`${BASE}/es/`);
  await page.waitForTimeout(1800);
  // «Potenciar mi negocio» floats bottom right (28/10/2026); one solid amber per viewport: it steps aside
  // while the hero's CTA, the banner it leads to or another page-level solid CTA is on screen.
  const floating = page.locator('.fcta');
  // (The closed phone menu inside the header keeps its own link: only what is visible counts.)
  check('no «Potenciar» in the header any more', (await page.getByRole('banner').locator('a[href$="#productos"]:visible').count()) === 0);
  check('floating CTA hidden next to the hero CTA', (await floating.getAttribute('data-off')) !== null);
  await page.evaluate(() => document.getElementById('equipamiento')?.scrollIntoView());
  await page.waitForTimeout(1200);
  const fbox = await floating.locator('a').boundingBox();
  check(
    'floating CTA shows bottom right where no other CTA is, and leads to the products banner',
    (await floating.getAttribute('data-off')) === null && !!fbox && fbox.x + fbox.width > 1300 && fbox.y + fbox.height > 820 && (await floating.locator('a').getAttribute('href')) === '/Eclipse-Web/es/#productos',
    `${fbox && Math.round(fbox.x)},${fbox && Math.round(fbox.y)}`,
  );
  await page.evaluate(() => document.getElementById('productos')?.scrollIntoView());
  await page.waitForTimeout(1200);
  check('floating CTA steps aside over the banner it leads to', (await floating.getAttribute('data-off')) !== null);
  // Wide screen with a mouse: the four products are a pinned horizontal track; the rail jumps.
  check('desktop: the products are a pinned track', (await page.locator('#productos[data-mode="track"]').count()) === 1);
  await page.locator('.pd-rail-btn', { hasText: 'Handy' }).click();
  await page.waitForTimeout(2500);
  check('the rail jumps to Handy', /Handy/i.test(await page.locator('.pd-rail-btn[aria-current="true"]').innerText()));
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  check('header: Media · Academy · Intelligence · Agency', (await nav.getByRole('link').allInnerTexts()).join(' · ') === 'Media · Academy · Intelligence · Agency');
  await nav.getByRole('link', { name: 'Agency' }).click();
  await page.waitForURL(/\/es\/agency\/$/);
  await page.waitForTimeout(1800);
  check('Agency link marks the current page', (await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Agency' }).getAttribute('aria-current')) === 'page');
  await page.getByRole('navigation', { name: 'En esta página' }).getByRole('link', { name: 'Precios' }).click();
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
  await page.goto(`${BASE}/es/agency/`);
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
  // (The hero's second key now leads to the products; the demo opens from Roofy's page.)
  await page.goto(`${BASE}/es/productos/roofy/`);
  await page.waitForTimeout(1800);
  const chip = page.locator('main button[data-demo-opener="product:realEstate"]').first();
  await chip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const yBefore = await page.evaluate(() => window.scrollY);
  await chip.click();
  await page.waitForSelector('dialog[data-demo-layer][open]');
  check('Roofy\'s «Ver la demo» opens the demo layer', await page.locator('dialog[data-demo-layer] h2', { hasText: 'Lumen Propiedades' }).isVisible());
  check('opening a demo does not scroll the page', (await page.evaluate(() => window.scrollY)) === yBefore);
  await page.waitForTimeout(1200);
  // Lote 2.2b: no offer is on sale, so the demo's simulated channels show at their own price.
  check('demo layer shows the complete project with its pieces and prices', (await page.locator('[data-dx-project] [data-dx-extras] .dx-piece-price').count()) > 0 && (await page.locator('[data-dx-project] [data-dx-price]').count()) === 0);
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog[data-demo-layer]', { state: 'detached' });
  check('layer closes, scroll kept', (await page.evaluate(() => window.scrollY)) === yBefore);
  check('focus returns to the opener', await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener') === 'product:realEstate'));
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
  await page.goto(`${BASE}/es/agency/`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('ejemplos')?.scrollIntoView());
  await page.waitForTimeout(1500);
  check('demo room lists the demo on show (the other five are in standby)', (await page.locator('#ejemplos [role="tab"]').count()) === 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // No "Armá tu plan" anywhere (the builder is dormant). On /agency/ the levels' «Ver la demo» opens
  // the rubro selector (lote 1.3); Escape hands focus back to it.
  check('no «Armá tu plan» entry point', (await page.getByRole('button', { name: /Armá tu plan/ }).count()) === 0 && (await page.getByRole('link', { name: /Armá tu plan/ }).count()) === 0);
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(1500);
  await page.locator('#precios .pr-lv-demo').first().click();
  await page.locator('dialog[data-selector-layer][open]').waitFor();
  await page.waitForTimeout(500);
  check('a level\'s «Ver la demo» opens the selector with exactly two rows', (await page.locator('dialog[data-selector-layer] [data-sx-row]').count()) === 2 && (await page.locator('dialog[data-selector-layer] h2').innerText()) === '¿Qué negocio querés potenciar?');
  check('Ecommerce row is aria-disabled and says «Próximamente»', (await page.locator('[data-sx-row="ecommerce"]').getAttribute('aria-disabled')) === 'true' && /próximamente/i.test(await page.locator('[data-sx-row="ecommerce"]').innerText()));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check('Escape closes the selector and focus returns to its opener', (await page.locator('dialog[data-selector-layer]').count()) === 0 && (await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener'))) === 'selector:plan_card');
  check('no page errors (desktop home)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// 3b. Showroom (lote 1.3): selector → demo, History, direct entries, fallbacks.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  // The selector lives on /agency/ now (the levels, the calculator and the closing block open it).
  await page.goto(`${BASE}/es/agency/`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(2000);
  const opener = page.locator('#precios .pr-lv-demo').first();
  const state = () => page.evaluate(() => ({ path: location.pathname + location.search, len: history.length, sel: !!document.querySelector('dialog[data-selector-layer][open]'), demo: !!document.querySelector('dialog[data-demo-layer][open]'), lock: document.documentElement.style.overflow }));
  const start = await state();
  await opener.click();
  await page.locator('dialog[data-selector-layer][open]').waitFor();
  let st = await state();
  check('«Ver la demo» opens the selector, one history entry, same URL', st.sel && st.len === start.len + 1 && st.path === start.path, `${start.len}→${st.len}`);
  await page.goBack();
  await page.waitForTimeout(500);
  st = await state();
  check('browser Back closes the selector (no stuck scroll lock)', !st.sel && st.lock === '' && st.path === start.path);
  await page.goForward();
  await page.waitForTimeout(800);
  check('Forward brings the selector back', (await state()).sel);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await opener.click();
  await page.locator('dialog[data-selector-layer][open]').waitFor();
  await page.locator('[data-sx-row="inmobiliarias"]').click();
  await page.waitForSelector('dialog[data-demo-layer][open]');
  await page.waitForTimeout(3200);
  st = await state();
  check('choosing Inmobiliarias hands off to the demo: URL contract, no second entry, selector gone', st.demo && !st.sel && /rubro=inmobiliarias&vista=guia/.test(st.path) && st.len === start.len + 1, st.path);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2600);
  st = await state();
  check('closing the demo cleans the URL and restores the opener\'s focus', !st.demo && st.path === start.path && (await page.evaluate(() => document.activeElement?.getAttribute('data-demo-opener'))) === 'selector:plan_card');

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
  await page.goto(`${BASE}/es/agency/`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('precios')?.scrollIntoView());
  await page.waitForTimeout(2500);
  await page.route('**/_next/static/chunks/**', (r) => r.abort());
  await page.locator('#precios .pr-lv-demo').first().click();
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
  await page.goto(`${BASE}/pt/agency/`);
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

// 6b. The units' and products' pages (28/10/2026), and the old home anchors.
{
  const { ctx, page, errors } = await newPage(1440, 900);
  for (const [path, name] of [['media', 'Eclipse Media'], ['academy', 'Eclipse Academy'], ['intelligence', 'Eclipse Intelligence'], ['agency', 'Eclipse Agency']]) {
    await page.goto(`${BASE}/es/${path}/`);
    await page.waitForTimeout(900);
    check(`/${path}/: one h1, «${name}»`, (await page.locator('h1').count()) === 1 && ((await page.locator('h1').textContent()) ?? '').replace(/\s+/g, ' ').trim() === name);
  }
  await page.goto(`${BASE}/es/productos/roofy/`);
  await page.waitForTimeout(1200);
  check('Roofy page: price from the levels and the six levels', /desde/.test(await page.locator('main').innerText()) && (await page.locator('.pr-lv-row').count()) === 6);
  await page.locator('main .u-cta button').first().click();
  await page.locator('dialog[data-demo-layer][open]').waitFor();
  check('Roofy page: «Ver la demo» opens Lumen', await page.locator('dialog[data-demo-layer] h2', { hasText: 'Lumen Propiedades' }).isVisible());
  await page.waitForTimeout(2800);
  await page.keyboard.press('Escape');
  await page.locator('dialog[data-demo-layer]').waitFor({ state: 'detached' });
  for (const id of ['foody', 'markyt']) {
    await page.goto(`${BASE}/es/productos/${id}/`);
    await page.waitForTimeout(900);
    const text = await page.locator('main').innerText();
    check(`/productos/${id}/: in preparation, no price, «En diseño» never as included`, /En preparación/.test(text) && !/US\$|USD\s?\d|\$\s?\d/.test(text) && /En diseño/.test(text));
  }
  await page.goto(`${BASE}/es/productos/handy/`);
  await page.waitForTimeout(900);
  check('/productos/handy/: launch date', /Lanza el 10 de noviembre de 2026/.test(await page.locator('main').innerText()));
  // A link shared before 28/10 (`/es/#precios`) lands on the same section, now on /agency/.
  await page.goto(`${BASE}/es/#precios`);
  await page.waitForURL(/\/es\/agency\/#precios$/);
  await page.waitForTimeout(3000);
  const top = await page.evaluate(() => document.getElementById('precios')?.getBoundingClientRect().top ?? 9999);
  check('old /es/#precios → /es/agency/#precios, on target', Math.abs(top) < 200, `${Math.round(top)}px`);
  check('no page errors (units and products)', errors.length === 0, errors.slice(0, 3).join(' | '));
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
