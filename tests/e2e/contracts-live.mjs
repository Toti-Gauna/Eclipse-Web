// Local real API + PostgreSQL + real cookies/CSRF/auth. Signature and verification delivery are TEST ONLY.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as backend from './lib/backend.mjs';
if (!process.env.E2E_API) throw new Error('Set E2E_API to the guarded local test server');
const base = process.env.BASE_URL ?? 'http://localhost:3001';
const shots = 'test-results/contracts-live';
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const errors = [];
let checks = 0;
const must = (r) => {
  assert.ok([200, 201].includes(r.status), `${r.status} ${r.text}`);
  return r.json;
};
const password = 'Client-Password-2026!';
const email = `contract-${Date.now()}@example.test`;
let fixture;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/es/portal/registro/`);
  await page.getByLabel(/^Nombre/).fill('Cliente ficticio de contratación');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await page.locator('.lv-done-title').waitFor();
  checks++;
  const token = await backend.latestToken(email);
  assert.ok(token);
  await page.goto(`${base}/es/portal/verificar-email/#token=${token}`);
  await page.getByRole('button', { name: 'Confirmar mi email', exact: true }).click();
  await page.locator('.lv-done-title').waitFor();
  checks++;
  await page.goto(`${base}/es/portal/?next=%2Fportal%2Fproyectos%2F`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await page.waitForURL('**/portal/bienvenida/');
  await page.getByText('Todavía no tenés un acuerdo para revisar', { exact: true }).waitFor();
  checks++;
  const admin = await backend.adminSession();
  const found = must(await admin.request('POST', '/api/v1/admin/clients/lookup', { body: { email } }));
  const client = found.client;
  const input = {
    clientId: client.id,
    name: 'Volta ficticia E2E',
    organizationName: 'Comercio ficticio E2E',
    selection: {
      goals: [],
      planId: 'volta',
      items: ['landing-extra', 'whatsapp-extra'],
      maintenance: 'esencial',
      billing: 'monthly',
      vertical: null,
      founder: false,
    },
    scope: ['Una marca ficticia, hasta 25 productos', 'Consulta manual WhatsApp, una revisión y extras compatibles'],
    externals: 'Dominio y servicios externos a validar por separado',
    details: 'Esquema interno ficticio; no contrato aprobado.',
    isExample: true,
  };
  const created = must(
    await admin.request('POST', '/api/v1/admin/engagements', { body: input, headers: { 'Idempotency-Key': randomUUID() } }),
  ).engagement;
  const issue = created.issues[0];
  must(await admin.request('POST', `/api/v1/admin/contracts/${issue.id}/publish`, { body: { confirm: true } }));
  await page.goto(`${base}/es/portal/proyectos/`);
  await page.waitForURL('**/portal/bienvenida/');
  await page.locator('.ct-readable').waitFor();
  assert.ok((await page.locator('.ct-readable').textContent()).includes('No aprobado para contratación'));
  assert.equal(await page.locator('.ct-consents input:checked').count(), 0);
  checks += 3;
  await page.reload();
  await page.locator('.ct-readable').waitFor();
  assert.equal(await page.locator('.ct-consents input:checked').count(), 0);
  checks++;
  const second = await browser.newContext({
    storageState: await context.storageState(),
    viewport: { width: 360, height: 800 },
    reducedMotion: 'reduce',
  });
  const mobile = await second.newPage();
  await mobile.goto(`${base}/es/portal/bienvenida/`);
  await mobile.locator('.ct-readable').waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: `${shots}/agreement-360.png`, fullPage: true });
  checks++;
  await page.locator('.ct-consents input').first().check();
  await page.getByRole('button', { name: 'Completar prueba sandbox', exact: true }).click();
  await page.getByText('Prueba del acuerdo completada; anticipo pendiente de verificación', { exact: true }).waitFor();
  assert.equal(await page.locator('.ct-consents').count(), 0);
  checks += 2;
  await mobile.reload();
  await mobile.getByText('Prueba del acuerdo completada; anticipo pendiente de verificación', { exact: true }).waitFor();
  checks++;
  const deposit = {
    amountCents: 32500,
    currency: 'USD',
    state: 'available',
    reference: 'e2e-ficticia-001',
    receivedOn: new Date().toISOString().slice(0, 10),
    confirm: true,
  };
  must(await admin.request('POST', `/api/v1/admin/engagements/${created.id}/deposit`, { body: deposit }));
  const [one, two] = await Promise.all([
    admin.request('POST', `/api/v1/admin/engagements/${created.id}/convert`, { body: { confirm: true } }),
    admin.request('POST', `/api/v1/admin/engagements/${created.id}/convert`, { body: { confirm: true } }),
  ]);
  const projectId = must(one).projectId;
  assert.equal(projectId, must(two).projectId);
  checks++;
  await page.reload();
  await page.getByRole('link', { name: 'Ver proyecto y tour del portal', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Ver proyecto y tour del portal', exact: true }).click();
  await page.waitForURL(`**/portal/proyecto/?id=${projectId}`);
  await page.getByRole('heading', { name: 'Volta ficticia E2E', exact: true }).waitFor();
  checks++;
  let project = must(await admin.request('GET', `/api/v1/admin/projects/${projectId}`)).project;
  must(
    await admin.request('POST', `/api/v1/admin/projects/${projectId}/transition`, {
      body: { version: project.version, stage: 'client_review' },
    }),
  );
  const prepare = must(
    await admin.request('POST', `/api/v1/admin/engagements/${created.id}/issues`, {
      body: { kind: 'delivery', details: 'QA ficticia: móvil, total y recorrido verificados; observaciones abiertas.' },
    }),
  );
  must(await admin.request('POST', `/api/v1/admin/contracts/${prepare.issue.id}/publish`, { body: { confirm: true } }));
  await page.goto(`${base}/es/portal/contratos/?id=${created.id}`);
  await page.getByRole('button', { name: /Acta de entrega.*v1/ }).click();
  await page.locator('.ct-readable').waitFor();
  await page.locator('.ct-consents input').first().check();
  await page.getByRole('button', { name: 'Completar prueba sandbox', exact: true }).click();
  await page.getByRole('button', { name: /Acta de entrega.*Prueba completada/ }).click();
  await page.getByLabel('Observaciones sobre la entrega').fill('Observación ficticia: revisar una etiqueta móvil');
  await page.getByRole('button', { name: 'Registrar observación', exact: true }).click();
  await page.getByText('Observación registrada; no cambia aceptación, precio ni saldo.', { exact: true }).waitFor();
  checks++;
  const finance = must(await admin.request('GET', `/api/v1/admin/projects/${projectId}/finance`)).finance;
  assert.equal(finance.price.balanceCents, 32500);
  checks++;
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar evidencia', exact: true }).click();
  await downloaded;
  checks++;
  // Reconcile final through existing payment module; delivery acceptance has not done it.
  must(
    await admin.request('POST', `/api/v1/admin/projects/${projectId}/payments`, {
      headers: { 'Idempotency-Key': randomUUID() },
      body: {
        kind: 'final',
        amountCents: 32500,
        currency: 'USD',
        status: 'collected',
        receivedOn: new Date().toISOString().slice(0, 10),
        reference: 'e2e-final-ficticia',
      },
    }),
  );
  const finalFinance = must(await admin.request('GET', `/api/v1/admin/projects/${projectId}/finance`)).finance;
  assert.equal(finalFinance.price.balanceCents, 0);
  checks++;
  await page.reload();
  await page.locator('.ct-panel').waitFor();
  await page.screenshot({ path: `${shots}/history-1440.png`, fullPage: true });
  const stores = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  assert.ok(stores.every((k) => !/(token|contract|engagement)/i.test(k)));
  checks++;
  fixture = { email, password, clientId: client.id, engagementId: created.id, projectId, issueId: issue.id, deliveryId: prepare.issue.id };
  writeFileSync(process.env.E2E_FIXTURE_FILE ?? '/tmp/eclipse-contract-e2e-fixture.json', JSON.stringify(fixture));
  assert.deepEqual(errors, []);
  checks++;
  console.log(
    `PASS ${checks} live browser checks: real registration/verification/login, empty welcome, server-required agreement before projects, reload/second device, sandbox completion, deposit, concurrent conversion, project/tour, delivery/observations, evidence and separate final payment. SMTP recorder and signature sandbox only; local PostgreSQL. Screenshots ${shots}`,
  );
  await second.close();
  await context.close();
} finally {
  await browser.close();
}
