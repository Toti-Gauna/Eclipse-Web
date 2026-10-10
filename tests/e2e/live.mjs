// End-to-end run of the LIVE portal against the real backend (Eclipse-be tests/e2e/server.ts).
//
//   E2E_API=http://127.0.0.1:3000 BASE_URL=http://localhost:3001 node tests/e2e/live.mjs
//
// Needs: the backend e2e server (docs/e2e.md in Eclipse-be) and the web exported with
//   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 NEXT_PUBLIC_PORTAL_MODE=live npm run build
// served from out/ at BASE_URL (origin http://localhost:3001 is the one the backend allows).
// Skips (exit 0) when E2E_API is not set, so `npm test` / CI stay hermetic.
//
// What it proves, in a real Chromium: register → verification mail → verify (fragment token
// removed from the URL) → login → plan summary → "Enviar solicitud" → request history → team
// review (public reply only) → project + update + document → client sees them → file download →
// a second client can't see the first one's project → refresh after the access token is gone →
// logout. Screenshots at 360 and 1440 px, with a horizontal-overflow check on every screen.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

if (!process.env.E2E_API) {
  console.log('SKIP  tests/e2e/live.mjs — set E2E_API (backend e2e server, e.g. http://127.0.0.1:3000) to run it.');
  process.exit(0);
}
const backend = await import('./lib/backend.mjs');

const BASE = (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const SHOTS = process.env.E2E_SHOTS ?? '.live-shots';
mkdirSync(SHOTS, { recursive: true });
const PASSWORD = 'Client-Password-2026!';
const stamp = Date.now();
let emailA = `live.a.${stamp}@example.com`;
const emailB = `live.b.${stamp}@example.com`;

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium' });
const consoleErrors = [];

async function newSession(width = 1440, height = 900, storageState) {
  const context = await browser.newContext({
    storageState,
    viewport: { width, height },
    isMobile: width < 768,
    hasTouch: width < 768,
    locale: 'es-AR',
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`pageerror ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|\/_next\/image|fonts/.test(m.text())) consoleErrors.push(`console ${page.url()} ${m.text()}`);
  });
  return { context, page };
}

async function settle(page) {
  // The site shows a ~1.8 s loader on every full load.
  await page.waitForFunction(() => document.documentElement.dataset.loader !== 'on', null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(250);
}
async function open(page, p) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
}
async function noOverflow(page, label) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`no horizontal overflow — ${label}`, over <= 0, `${over}px`);
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}
const secrets = async (page) =>
  page.evaluate(() => {
    const dump = [];
    for (const store of [localStorage, sessionStorage]) for (let i = 0; i < store.length; i += 1) dump.push(`${store.key(i)}=${store.getItem(store.key(i))}`);
    return { dump: dump.join('\n'), cookie: document.cookie };
  });

// ----------------------------------------------------------------------------------------
// Client A
// ----------------------------------------------------------------------------------------
const a = await newSession();
const { page } = a;

// 1. Anonymous: private screens send you to sign-in and come back.
await open(page, '/es/portal/proyectos/');
await page.waitForURL(/\/es\/portal\/\?next=/, { timeout: 8000 }).catch(() => {});
check('anonymous /proyectos redirects to login with a safe ?next', /\/es\/portal\/\?next=%2Fportal%2Fproyectos%2F/.test(page.url()), page.url());
check('login form is the real one (no demo notice, no "Demo" badge)', (await page.locator('[data-portal-demo-notice]').count()) === 0 && (await page.getByText('datos ficticios').count()) === 0);
await noOverflow(page, 'login 1440');

// 2. Register (neutral answer).
// The e2e database can be shared by several test servers, each with its own mail recorder, so a
// verification mail may land in another server's list: retry the whole registration (new address).
let verifyToken = null;
for (let attempt = 0; attempt < 4 && !verifyToken; attempt += 1) {
  if (attempt > 0) emailA = `live.a.${stamp}+${attempt}@example.com`;
  await open(page, '/es/portal/registro/');
  await page.getByLabel('Nombre', { exact: false }).first().fill('Ana Prueba');
  await page.getByLabel('Email').fill(emailA);
  await page.getByLabel('Contraseña').fill('corta');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  if (attempt === 0) check('short password is explained before sending', (await page.getByText('al menos 12 caracteres').count()) > 0);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: 'Revisá tu correo' }).waitFor({ timeout: 8000 });
  if (attempt === 0) {
    check('register shows the neutral "if the address is valid" answer', (await page.getByText('Si ' + emailA + ' es una dirección válida').count()) === 1);
    await shot(page, 'register-done-1440');
  }
  verifyToken = await backend.latestToken(emailA, () => true, 12);
}

// 3. Verify: the token comes in the fragment, is removed at once and needs an explicit click.
check('verification mail was recorded with a token', !!verifyToken, verifyToken ? '' : JSON.stringify(await (await fetch(process.env.E2E_API + '/__e2e/mail?to=' + encodeURIComponent(emailA))).json()));
await open(page, `/es/portal/verificar-email/#token=${verifyToken}`);
await page.getByRole('button', { name: 'Confirmar mi email' }).waitFor({ timeout: 8000 });
check('the token is gone from the address bar', !page.url().includes('token') && !page.url().includes('#'), page.url());
const noPrefetchConsume = await page.getByRole('heading', { name: 'Email verificado' }).count();
check('opening the link does NOT consume the token by itself', noPrefetchConsume === 0);
await shot(page, 'verify-1440');
await page.getByRole('button', { name: 'Confirmar mi email' }).click();
await page.getByRole('heading', { name: 'Email verificado' }).waitFor({ timeout: 8000 });
check('explicit confirm verifies the email', true);
// The same link twice is refused (single use).
await open(page, `/es/portal/verificar-email/#token=${verifyToken}`);
await page.getByRole('button', { name: 'Confirmar mi email' }).click();
await page.getByText('Este enlace ya no sirve').first().waitFor({ timeout: 8000 });
check('a used link is rejected with a clear message', true);

// 4. Login: wrong password is generic, right one lands on the projects (empty).
await open(page, '/es/portal/');
await page.getByLabel('Email').fill(emailA);
await page.getByLabel('Contraseña').fill('Otra-Password-2026!');
await page.getByRole('button', { name: 'Ingresar' }).first().click();
await page.getByText('no coinciden').waitFor({ timeout: 8000 });
check('wrong password: one generic message', true);
await page.getByLabel('Contraseña').fill(PASSWORD);
await page.getByRole('button', { name: 'Ingresar' }).first().click();
await page.waitForURL(/\/es\/portal\/proyectos\//, { timeout: 10000 });
await page.getByText('Todavía no tenés proyectos asignados').waitFor({ timeout: 10000 });
check('login → projects, empty state is honest (no fixtures)', (await page.locator('main').getByText('Demo').count()) === 0 && (await page.locator('main .badge-demo').count()) === 0);
await noOverflow(page, 'projects empty 1440');
await shot(page, 'projects-empty-1440');

// 5. Plan summary → "Enviar solicitud".
await open(page, '/es/plan/?g=encontrar&plan=presencia&items=seo&m=esencial&v=clinicas');
await page.getByRole('heading', { name: 'Enviar solicitud' }).waitFor({ timeout: 10000 });
check('the WhatsApp action is still there', (await page.getByRole('link', { name: /Enviar mi plan por WhatsApp/ }).count()) > 0);
await page.getByLabel('Teléfono (con código de país)').fill('011 4000 1234');
await page.getByRole('button', { name: 'Enviar solicitud' }).click();
check('a phone without country code is explained', (await page.getByText('Escribilo con + y el código de país').count()) > 0);
await page.getByLabel('Teléfono (con código de país)').fill('+54 9 223 555 0000');
await page.getByLabel('Mensaje para el equipo').fill('Quiero empezar este mes. <b>negrita</b>');
await shot(page, 'plan-request-form-1440');
await page.getByRole('button', { name: 'Enviar solicitud' }).click();
await page.getByText('Solicitud enviada').waitFor({ timeout: 10000 });
check('success is shown only after the API answers (request saved)', true);
await shot(page, 'plan-request-sent-1440');
const sentLink = await page.getByRole('link', { name: 'Ver mi solicitud' }).getAttribute('href');
check('success links to the request detail with a UUID id', /\/portal\/solicitud\/\?id=[0-9a-f-]{36}/.test(sentLink ?? ''), sentLink ?? '');

// 6. History + the team's public reply (never the internal note).
await open(page, '/es/portal/solicitudes/');
await page.getByText('Paquete Presencia').first().waitFor({ timeout: 10000 });
check('history lists the request as "Enviada"', (await page.getByText('Enviada', { exact: true }).count()) > 0);
check('the message is shown as plain text (escaped)', (await page.getByText('<b>negrita</b>', { exact: false }).count()) > 0);
await noOverflow(page, 'requests 1440');
await shot(page, 'requests-1440');
const admin = await backend.adminSession();
const looked = await backend.lookupClient(admin, emailA);
const clientAId = looked.client.id;
const adminList = await admin.request('GET', '/api/v1/admin/plan-requests?limit=50');
const mine = adminList.json.requests.find((r) => r.clientId === clientAId);
check('the server stored a request for this client', !!mine && mine.selection.planId === 'presencia' && mine.selection.items.includes('seo') && mine.contact.phone === '+5492235550000', mine ? mine.estimate && `total ${mine.estimate.totalCents}` : 'none');
await backend.reviewPlanRequest(admin, mine.id, mine.version, 'Revisamos tu propuesta; coordinemos por WhatsApp.');
await open(page, '/es/portal/solicitudes/');
await page.getByText('Revisamos tu propuesta; coordinemos por WhatsApp.').waitFor({ timeout: 10000 });
check('the public reply shows up', true);
check('the internal note never reaches the browser', (await page.content()).includes('nota interna E2E') === false);

// 7. Project, update, document.
const fixture = await backend.createProjectFixture(admin, { clientId: clientAId, name: 'Landing de Ana', service: 'Landing premium' });
await open(page, '/es/portal/proyectos/');
await page.getByRole('link', { name: 'Landing de Ana' }).first().waitFor({ timeout: 10000 });
check('project list shows the real project', true);
await noOverflow(page, 'projects 1440');
await shot(page, 'projects-1440');
await open(page, `/es/portal/proyecto/?id=${fixture.projectId}`);
await page.getByRole('heading', { name: 'Landing de Ana' }).waitFor({ timeout: 10000 });
check('detail: stage is Preparación', (await page.locator('.pt-current-name').innerText()) === 'Preparación');
check('detail: required action shown with due date', (await page.getByText('Enviá tu logo').count()) > 0 && (await page.locator('.pt-box[data-turn]').count()) === 1);
check('detail: next milestone shown', (await page.getByText('Reunión de arranque').count()) > 0);
check('detail: no money anywhere', (await page.locator('main').innerText()).match(/USD|US\$|\$ ?\d/) === null);
await noOverflow(page, 'project detail 1440');
await shot(page, 'project-1440');
await page.getByRole('tab', { name: /Documentos/ }).click();
await page.locator('.pt-doc-title', { hasText: 'Propuesta firmada' }).waitFor({ timeout: 10000 });
const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Descargar/ }).click()]);
const stream = await download.createReadStream();
let bytes = '';
for await (const chunk of stream) bytes += chunk.toString('latin1');
check('document downloads through the session (Blob), file name kept', download.suggestedFilename() === 'propuesta.pdf' && bytes.startsWith('%PDF'), download.suggestedFilename());
check('the document is not exposed as a link', (await page.locator('a[href*="/client/documents/"]').count()) === 0);
await shot(page, 'project-docs-1440');
check('invalid id → the same not-found state', await (async () => {
  await open(page, '/es/portal/proyecto/?id=../../etc/passwd');
  return (await page.getByText('No encontramos este proyecto').count()) === 1;
})());

// 8. Access token gone (15 min later): the single refresh keeps the session alive.
await a.context.clearCookies({ name: 'eclipse-client-access' });
await open(page, '/es/portal/proyectos/');
await page.getByRole('link', { name: 'Landing de Ana' }).first().waitFor({ timeout: 10000 });
check('expired access token: one refresh, session continues', true);

// 9. Storage hygiene.
const s = await secrets(page);
check('no token/CSRF/refresh in web storage', !/csrf|token|refresh|eclipse-client|v1\./i.test(s.dump), s.dump.slice(0, 200));
check('no cookie readable by scripts (HttpOnly)', s.cookie === '' || !/eclipse-client|preauth/.test(s.cookie), s.cookie);

// ----------------------------------------------------------------------------------------
// Client B: cannot see A's project
// ----------------------------------------------------------------------------------------
const bClient = await backend.createVerifiedClient(emailB, PASSWORD, 'Beto Prueba');
const b = await newSession();
await open(b.page, '/es/portal/');
await b.page.getByLabel('Email').fill(bClient.client.email);
await b.page.getByLabel('Contraseña').fill(PASSWORD);
await b.page.getByRole('button', { name: 'Ingresar' }).first().click();
await b.page.waitForURL(/\/es\/portal\/proyectos\//, { timeout: 10000 });
await b.page.getByText('Todavía no tenés proyectos asignados').waitFor({ timeout: 10000 });
await open(b.page, `/es/portal/proyecto/?id=${fixture.projectId}`);
await b.page.getByText('No encontramos este proyecto').waitFor({ timeout: 10000 });
const unknownId = '00000000-0000-4000-8000-000000000000';
const foreignText = await b.page.locator('main').innerText();
await open(b.page, `/es/portal/proyecto/?id=${unknownId}`);
await b.page.getByText('No encontramos este proyecto').waitFor({ timeout: 10000 });
check('second client: another client’s project id = same not-found as an unknown id', foreignText === (await b.page.locator('main').innerText()));
await open(b.page, `/es/portal/solicitud/?id=${mine.id}`);
await b.page.getByText('No encontramos esta solicitud').waitFor({ timeout: 10000 });
check('second client cannot open the first client’s plan request', true);
await b.context.close();

// ----------------------------------------------------------------------------------------
// Client C: signed in but with an unverified email
// ----------------------------------------------------------------------------------------
const emailC = `live.c.${stamp}@example.com`;
await backend.registerUnverified(emailC, PASSWORD);
const c = await newSession(1440, 900);
await open(c.page, '/es/portal/');
await c.page.getByLabel('Email').fill(emailC);
await c.page.getByLabel('Contraseña').fill(PASSWORD);
await c.page.getByRole('button', { name: 'Ingresar' }).first().click();
await c.page.waitForURL(/\/es\/portal\/proyectos\//, { timeout: 10000 });
await c.page.getByRole('heading', { name: 'Verificá tu email para continuar' }).waitFor({ timeout: 10000 });
check('unverified account: projects show the "verify your email" state (not a raw error)', true);
await shot(c.page, 'unverified-1440');
await open(c.page, '/es/plan/?plan=presencia');
await c.page.getByText('todavía no tiene el email verificado').waitFor({ timeout: 10000 });
check('unverified account: the builder explains it instead of showing the form', (await c.page.getByLabel('Teléfono (con código de país)').count()) === 0);
await open(c.page, '/es/portal/solicitudes/');
await c.page.getByText('Todavía no enviaste ninguna solicitud').waitFor({ timeout: 10000 });
check('unverified account can still read its (empty) request history', true);
await c.context.close();

// ----------------------------------------------------------------------------------------
// Mobile screens (360 px)
// ----------------------------------------------------------------------------------------
// Same session as A (cookies copied): the credential limiter of the e2e backend is small.
const m = await newSession(360, 780, await a.context.storageState());
const m0 = await newSession(360, 780); // anonymous: the auth screens as a visitor sees them
const tooSmall = [];
for (const [label, p, who] of [
  ['login', '/es/portal/', m0],
  ['register', '/es/portal/registro/', m0],
  ['reset', '/es/portal/recuperar-contrasena/', m0],
  ['verify', '/es/portal/verificar-email/', m0],
  ['projects', '/es/portal/proyectos/', m],
  ['project', `/es/portal/proyecto/?id=${fixture.projectId}`, m],
  ['requests', '/es/portal/solicitudes/', m],
  ['plan-summary', '/es/plan/?g=encontrar&plan=presencia&items=seo', m],
]) {
  await open(who.page, p);
  await who.page.waitForTimeout(label === 'plan-summary' ? 1200 : 800);
  await noOverflow(who.page, `${label} 360`);
  await shot(who.page, `${label}-360`);
  const small = await who.page.evaluate(() =>
    [...document.querySelectorAll('main button, main a.btn, main input:not([type=radio]):not([type=checkbox]), main textarea, main .pt-link')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ h: el.getBoundingClientRect().height, t: (el.textContent || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 30) }))
      .filter((x) => x.h < 44),
  );
  for (const x of small) tooSmall.push(`${label}:${x.t}:${Math.round(x.h)}`);
}
check('main controls are ≥ 44px tall at 360', tooSmall.length === 0, tooSmall.join(', '));
await m0.context.close();

// 10. Anonymous builder keeps the selection through login.
const anon = await newSession(1440, 900);
await open(anon.page, '/es/plan/?g=atender&plan=voz&items=seo&m=esencial');
await anon.page.getByRole('heading', { name: 'Enviar solicitud' }).waitFor({ timeout: 10000 });
await anon.page.locator('.pb-request').getByRole('link', { name: 'Ingresar' }).click();
await anon.page.waitForURL(/\/es\/portal\/\?next=/, { timeout: 8000 });
await anon.page.getByLabel('Email').fill(emailA);
await anon.page.getByLabel('Contraseña').fill(PASSWORD);
await anon.page.getByRole('button', { name: 'Ingresar' }).first().click();
await anon.page.waitForURL(/\/es\/plan\//, { timeout: 10000 });
await anon.page.getByRole('heading', { name: 'Enviar solicitud' }).waitFor({ timeout: 10000 });
check('anonymous → login → back to /plan with the same selection', /plan=voz/.test(anon.page.url()) && /items=seo/.test(anon.page.url()), anon.page.url());
await anon.context.close();
await m.context.close();

// ----------------------------------------------------------------------------------------
// Logout (client A, first browser)
// ----------------------------------------------------------------------------------------
await open(page, '/es/portal/proyectos/');
await page.getByRole('button', { name: 'Salir' }).click();
await page.waitForURL(/\/es\/portal\/$/, { timeout: 10000 });
await open(page, '/es/portal/proyectos/');
await page.waitForURL(/\/es\/portal\/\?next=/, { timeout: 10000 }).catch(async () => {
  console.log(`DEBUG after logout the page stayed at ${page.url()}: ${(await page.locator('main').innerText()).slice(0, 300)}`);
});
check('after logout the private screens ask for sign-in again', /\/es\/portal\/\?next=/.test(page.url()), page.url());
const after = await a.context.cookies();
check('logout cleared the client cookies', !after.some((c) => c.name.startsWith('eclipse-client')), after.map((c) => c.name).join(','));
await a.context.close();


await browser.close();
const relevant = consoleErrors.filter((e) => !/401|403|404|409|Failed to load/.test(e));
check('no unexpected console/page errors', relevant.length === 0, relevant.slice(0, 5).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
