/**
 * Test-only helpers to prepare fixtures on the e2e backend (Eclipse-be tests/e2e/server.ts).
 * They talk to the API like the browsers do (Origin + cookie jar + CSRF) and use the
 * /__e2e test routes (recorded mail, admin MFA code). Never imported by shipped code.
 */
const ADMIN = { email: 'admin@eclipse.test', password: 'E2e-Admin-Password-2026!' };

export const WEB_ORIGIN = process.env.E2E_WEB_ORIGIN ?? 'http://localhost:3001';
export const PORTAL_ORIGIN = process.env.E2E_PORTAL_ORIGIN ?? 'http://localhost:4173';

export function apiRoot() {
  return (process.env.E2E_API ?? '').replace(/\/$/, '');
}

/** Minimal cookie jar + JSON client bound to one Origin. */
export class Http {
  constructor(root, origin) {
    this.root = root;
    this.origin = origin;
    this.cookies = new Map();
    this.csrf = null;
  }

  #cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async request(method, path, { body, headers = {}, raw = false, csrf = true } = {}) {
    const h = { Origin: this.origin, ...headers };
    const cookie = this.#cookieHeader();
    if (cookie) h.Cookie = cookie;
    if (csrf && this.csrf && method !== 'GET') h['X-CSRF-Token'] = this.csrf;
    let payload;
    if (body !== undefined) {
      if (body instanceof Uint8Array) payload = body;
      else {
        h['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }
    const res = await fetch(`${this.root}${path}`, { method, headers: h, body: payload });
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair, ...attrs] = line.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0/i.test(a)) || value === '';
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    if (raw) return res;
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* not json */
    }
    return { status: res.status, json, text };
  }

  async preauth() {
    const r = await this.request('GET', '/api/v1/auth/csrf');
    this.csrf = r.json.csrfToken;
    return r.json.csrfToken;
  }
}

export async function mailFor(email, tries = 30) {
  for (let i = 0; i < tries; i += 1) {
    const res = await fetch(`${apiRoot()}/__e2e/mail?to=${encodeURIComponent(email)}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.messages ?? json.mail ?? []);
    if (list.length) return list;
    await new Promise((r) => setTimeout(r, 400));
  }
  return [];
}

/** Latest action token mailed to an address (verification or reset). */
export async function latestToken(email, matcher = () => true) {
  const list = (await mailFor(email)).filter(matcher);
  const last = list[list.length - 1];
  return last?.token ?? null;
}

/** Registers + verifies a client through the public API; returns a logged-in http client and its profile. */
export async function createVerifiedClient(email, password = 'Client-Password-2026!', displayName = 'Cliente de prueba') {
  const http = new Http(apiRoot(), WEB_ORIGIN);
  await http.preauth();
  const reg = await http.request('POST', '/api/v1/auth/client/register', { body: { email, password, displayName } });
  if (reg.status !== 202) throw new Error(`register ${reg.status} ${reg.text}`);
  const token = await latestToken(email);
  if (!token) throw new Error('no verification mail');
  await http.preauth();
  const conf = await http.request('POST', '/api/v1/auth/client/email-verification/confirm', { body: { token } });
  if (conf.status !== 204) throw new Error(`verify ${conf.status} ${conf.text}`);
  await http.preauth();
  const login = await http.request('POST', '/api/v1/auth/client/login', { body: { email, password } });
  if (login.status !== 200) throw new Error(`login ${login.status} ${login.text}`);
  http.csrf = login.json.csrfToken;
  return { http, client: login.json.client, password };
}

/** Admin session (password + MFA). */
export async function adminSession() {
  const http = new Http(apiRoot(), PORTAL_ORIGIN);
  await http.preauth();
  const login = await http.request('POST', '/api/v1/auth/admin/login', { body: ADMIN });
  if (login.status !== 200) throw new Error(`admin login ${login.status} ${login.text}`);
  const codes = await (await fetch(`${apiRoot()}/__e2e/admin-code`)).json();
  await http.preauth();
  let mfa = await http.request('POST', '/api/v1/auth/admin/login/mfa', { body: { code: codes.code } });
  if (mfa.status !== 200 && codes.next) {
    await http.preauth();
    mfa = await http.request('POST', '/api/v1/auth/admin/login/mfa', { body: { code: codes.next } });
  }
  if (mfa.status !== 200) throw new Error(`admin mfa ${mfa.status} ${mfa.text}`);
  http.csrf = mfa.json.csrfToken;
  return http;
}

const uuid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function must(res, ok, what) {
  if (!ok.includes(res.status)) throw new Error(`${what}: ${res.status} ${res.text}`);
  return res.json;
}

/** A tiny but valid one-page PDF. */
export function samplePdf() {
  const text = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
  return new TextEncoder().encode(text);
}

/**
 * Creates a project with `clientId` as member, a visible milestone, a published
 * client update, an action_required update (due in 7 days) and a client-visible PDF.
 */
export async function createProjectFixture(admin, { clientId, name = 'Proyecto de prueba E2E', service = 'Landing premium' }) {
  const created = must(
    await admin.request('POST', '/api/v1/admin/projects', {
      headers: { 'Idempotency-Key': uuid() },
      body: {
        organization: { name: `Org ${name}` },
        name,
        service,
        currency: 'USD',
        startedOn: today(),
        plannedEndOn: inDays(30),
        agreement: { reference: 'ACUERDO-E2E', acceptedOn: today(), priceCents: 100000, scopeItems: ['Landing de una página', 'Formulario de contacto'] },
        deposit: { amountCents: 30000, receivedOn: today(), reference: 'SENIA-E2E' },
        members: [{ clientId, role: 'client_admin' }],
      },
    }),
    [200, 201],
    'create project',
  );
  const project = created.project ?? created;
  const id = project.id;

  const ms = must(
    await admin.request('POST', `/api/v1/admin/projects/${id}/milestones`, {
      body: { stage: 'preparation', title: 'Reunión de arranque', ownerParty: 'eclipse', plannedOn: inDays(3) },
    }),
    [200, 201],
    'milestone',
  );
  const milestone = ms.milestone ?? ms;
  must(
    await admin.request('POST', `/api/v1/admin/projects/${id}/milestones/${milestone.id}/visibility`, {
      body: { version: milestone.version, visible: true, confirm: true },
    }),
    [200],
    'milestone visibility',
  );

  const publish = async (body) => {
    const u = must(await admin.request('POST', `/api/v1/admin/projects/${id}/updates`, { body }), [200, 201], 'update');
    const upd = u.update ?? u;
    must(
      await admin.request('POST', `/api/v1/admin/projects/${id}/updates/${upd.id}/publish`, { body: { version: upd.version, confirm: true } }),
      [200],
      'publish',
    );
    return upd.id;
  };
  await publish({ kind: 'client_update', title: 'Arrancamos', body: 'Ya tenemos el brief. Empezamos la preparación.' });
  const actionId = await publish({
    kind: 'action_required',
    title: 'Enviá tu logo',
    body: 'Necesitamos el logo en alta resolución.',
    dueOn: inDays(7),
  });

  const doc = must(
    await admin.request('POST', `/api/v1/admin/projects/${id}/documents`, {
      body: { title: 'Propuesta firmada', kind: 'contract', fileName: 'propuesta.pdf', mediaType: 'application/pdf' },
    }),
    [200, 201],
    'document',
  );
  const document = doc.document ?? doc;
  must(
    await admin.request('POST', `/api/v1/admin/documents/${document.id}/content`, {
      headers: { 'Content-Type': 'application/pdf' },
      body: samplePdf(),
    }),
    [200, 201, 204],
    'upload',
  ).valueOf?.();
  const current = await admin.request('GET', `/api/v1/admin/documents/${document.id}`);
  const dv = (current.json?.document ?? current.json ?? document).version ?? document.version;
  must(
    await admin.request('PATCH', `/api/v1/admin/documents/${document.id}`, { body: { version: dv, visibility: 'client' } }),
    [200],
    'document publish',
  );
  return { projectId: id, milestoneId: milestone.id, actionId, documentId: document.id };
}

/** Admin: review a plan request with a public response. */
export async function reviewPlanRequest(admin, requestId, version, publicResponse = 'Revisamos tu propuesta; coordinemos por WhatsApp.') {
  return must(
    await admin.request('PATCH', `/api/v1/admin/plan-requests/${requestId}/review`, {
      body: { version, status: 'reviewed', publicResponse, internalNote: 'nota interna E2E' },
    }),
    [200],
    'review',
  );
}

/** Looks a client up by exact email (needs clients:read). */
export async function lookupClient(admin, email) {
  return must(await admin.request('POST', '/api/v1/admin/clients/lookup', { body: { email } }), [200], 'lookup');
}
