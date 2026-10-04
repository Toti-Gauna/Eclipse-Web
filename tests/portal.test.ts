import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { deepMerge } from '@/i18n/messages';
import { itemById, maintenanceById } from '@/lib/content';
import { PEOPLE, PORTAL_COMPANY, PORTAL_PROJECTS, PORTAL_VIEWER } from '@/lib/portal/fixtures';
import { formatDate } from '@/lib/portal/format';
import {
  TOTAL_STAGES,
  changeGroups,
  isIsoDate,
  isMainStage,
  isStage,
  personById,
  projectById,
  stageNumber,
  stagePhase,
  stagePosition,
  summarize,
  timeline,
  tourHooks,
} from '@/lib/portal/project';
import { PORTAL_TOURS, PORTAL_TOUR_KEYS } from '@/lib/portal/tour';
import { CHANGE_FLOW, MAIN_STAGES } from '@/lib/portal/types';

const root = path.resolve(import.meta.dirname, '..');
const LOCALES = ['es', 'en', 'pt'] as const;
type Tree = { [key: string]: string | Tree };

/** Base messages + dev drafts, merged with the same rules as i18n/messages.ts. */
function messages(locale: string): Tree {
  const base = JSON.parse(readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8')) as Tree;
  const dir = path.join(root, 'messages', 'drafts');
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const draft = JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as Record<string, Record<string, Tree>>;
      for (const [ns, perLocale] of Object.entries(draft)) deepMerge(base, { [ns]: perLocale[locale] });
    }
  }
  return base;
}

const get = (tree: Tree, key: string): unknown =>
  key.split('.').reduce<unknown>((node, k) => (node && typeof node === 'object' ? (node as Tree)[k] : undefined), tree);

/** Every message key a project's screens read (`portal.demo.projects.<id>.…`). */
function projectKeys(id: string): string[] {
  const p = projectById(id)!;
  const base = `portal.demo.projects.${id}`;
  return [
    `${base}.name`,
    `${base}.summary`,
    `${base}.stageNote`,
    `${base}.milestone`,
    ...(p.action ? [`${base}.action.title`, `${base}.action.detail`] : []),
    ...(p.pause ? [`${base}.pause.reason`, `${base}.pause.next`] : []),
    ...p.updates.flatMap((u) => [`${base}.updates.${u.id}.title`, `${base}.updates.${u.id}.body`]),
    ...p.scope.items.map((s) => `${base}.scope.${s}`),
    ...p.changes.flatMap((c) => [
      `${base}.changes.${c.id}.title`,
      `${base}.changes.${c.id}.detail`,
      ...(c.status === 'accepted' ? [`${base}.changes.${c.id}.impact`] : []),
    ]),
    ...p.documents.map((d) => `${base}.docs.${d.id}`),
  ];
}

const unique = (list: string[]) => new Set(list).size === list.length;

describe('portal fixtures', () => {
  it('project ids and codes are unique, and ids are URL-safe', () => {
    expect(unique(PORTAL_PROJECTS.map((p) => p.id))).toBe(true);
    expect(unique(PORTAL_PROJECTS.map((p) => p.code))).toBe(true);
    for (const p of PORTAL_PROJECTS) expect(p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('ids inside each project are unique (updates, scope, changes, documents)', () => {
    for (const p of PORTAL_PROJECTS) {
      expect(unique(p.updates.map((u) => u.id)), `${p.id} updates`).toBe(true);
      expect(unique(p.scope.items), `${p.id} scope`).toBe(true);
      expect(unique(p.changes.map((c) => c.id)), `${p.id} changes`).toBe(true);
      expect(unique(p.documents.map((d) => d.id)), `${p.id} documents`).toBe(true);
    }
  });

  it('every project has a valid stage, consistent with its history', () => {
    for (const p of PORTAL_PROJECTS) {
      expect(isStage(p.stage), p.id).toBe(true);
      expect(p.history.length, p.id).toBeGreaterThan(0);
      expect(p.history[0].stage, `${p.id} starts in Preparación`).toBe('preparation');
      expect(p.history[0].start, `${p.id} starts with the deposit`).toBe(p.startedOn);
      // Chronological, one span per stage, in stage order; only the last one may be open.
      p.history.forEach((span, i) => {
        expect(isIsoDate(span.start), `${p.id} ${span.stage} start`).toBe(true);
        if (span.end) {
          expect(isIsoDate(span.end)).toBe(true);
          expect(span.end >= span.start, `${p.id} ${span.stage}`).toBe(true);
        }
        if (i > 0) {
          const prev = p.history[i - 1];
          expect(prev.end, `${p.id}: only the last span may be open`).toBeDefined();
          expect(span.start > prev.end!, `${p.id} ${span.stage} after ${prev.stage}`).toBe(true);
        }
      });
      const order = p.history.map((h) => (h.stage === 'support' ? TOTAL_STAGES + 1 : stageNumber(h.stage)));
      expect(order, `${p.id} stage order`).toEqual([...order].sort((a, b) => a - b));
      expect(unique(p.history.map((h) => h.stage)), `${p.id} one span per stage`).toBe(true);

      const last = p.history[p.history.length - 1];
      if (isMainStage(p.stage) || p.stage === 'support') {
        expect(last.stage, `${p.id} current span`).toBe(p.stage);
        expect(last.end, `${p.id} current span is open`).toBeUndefined();
      }
      if (p.stage === 'paused') {
        expect(p.pausedIn && p.pause, `${p.id} paused needs where + reason`).toBeTruthy();
        expect(last.stage).toBe(p.pausedIn);
        expect(last.end).toBeUndefined();
        expect(isIsoDate(p.pause!.since)).toBe(true);
        expect(personById(p.pause!.owner), `${p.id} pause owner`).toBeDefined();
      } else {
        expect(p.pausedIn, `${p.id} pausedIn only when paused`).toBeUndefined();
        expect(p.pause).toBeUndefined();
      }
      if (p.stage === 'support') {
        expect(maintenanceById(p.maintenance), `${p.id}: Soporte only with a maintenance plan`).toBeDefined();
        expect(p.history.some((h) => h.stage === 'delivery' && h.end), `${p.id} delivered before Soporte`).toBe(true);
      }
    }
  });

  it('updates are ordered by date, newest first, with valid authors and stage changes', () => {
    for (const p of PORTAL_PROJECTS) {
      expect(p.updates.length, p.id).toBeGreaterThan(0);
      const dates = p.updates.map((u) => u.date);
      for (const d of dates) expect(isIsoDate(d), `${p.id} ${d}`).toBe(true);
      expect(dates, `${p.id} updates newest first`).toEqual([...dates].sort().reverse());
      for (const u of p.updates) {
        expect(personById(u.author)?.side, `${p.id}/${u.id}: updates are written by Eclipse`).toBe('eclipse');
        if (u.stageChange) {
          expect(isStage(u.stageChange.to)).toBe(true);
          if (u.stageChange.from !== null) expect(isStage(u.stageChange.from)).toBe(true);
        }
      }
      // The newest stage change lands on the current stage.
      const lastChange = p.updates.find((u) => u.stageChange)?.stageChange;
      expect(lastChange?.to, `${p.id} last stage change`).toBe(p.stage);
    }
  });

  it('the generic website project is "2 de 5 · Construcción"', () => {
    const web = projectById('sitio-web');
    expect(web).toBeDefined();
    expect(web!.stage).toBe('build');
    expect(web!.items).toContain('web-multi');
    expect(stagePosition(web!)).toBe(2);
    expect(TOTAL_STAGES).toBe(5);
    expect(timeline(web!).map((s) => s.status)).toEqual(['done', 'current', 'next', 'pending', 'pending']);
    expect(isIsoDate(web!.deliveryEstimate)).toBe(true);
  });

  it('covers other public stages: client review with an action, Soporte and En pausa', () => {
    const stages = PORTAL_PROJECTS.map((p) => p.stage);
    expect(stages).toEqual(expect.arrayContaining(['build', 'clientReview', 'support', 'paused']));
    for (const p of PORTAL_PROJECTS.filter((x) => x.stage === 'clientReview')) expect(p.action, p.id).toBeDefined();
    const paused = PORTAL_PROJECTS.find((p) => p.stage === 'paused')!;
    expect(timeline(paused).find((s) => s.stage === paused.pausedIn)?.status).toBe('paused');
    const support = PORTAL_PROJECTS.find((p) => p.stage === 'support')!;
    expect(timeline(support).every((s) => s.status === 'done')).toBe(true);
    expect(stagePhase(support)).toBe(1);
  });

  it('every project has a next milestone with an owner and an estimated date', () => {
    for (const p of PORTAL_PROJECTS) {
      expect(p.nextMilestone, p.id).toBeDefined();
      expect(personById(p.nextMilestone.owner), `${p.id} milestone owner`).toBeDefined();
      expect(isIsoDate(p.nextMilestone.due), `${p.id} milestone date`).toBe(true);
      expect(p.nextMilestone.due >= p.updates[0].date, `${p.id} milestone after the last update`).toBe(true);
    }
  });

  it('people, services, scope, changes and documents are well formed', () => {
    expect(PEOPLE[PORTAL_VIEWER].side).toBe('client');
    expect(PORTAL_COMPANY.length).toBeGreaterThan(0);
    for (const p of PORTAL_PROJECTS) {
      expect(p.items.length, p.id).toBeGreaterThan(0);
      for (const item of p.items) expect(itemById(item), `${p.id} item ${item}`).toBeDefined();
      expect(personById(p.lead)?.role, `${p.id} lead`).toBe('projectLead');
      expect(isIsoDate(p.scope.approvedOn) && p.scope.items.length > 0, `${p.id} scope`).toBe(true);
      for (const c of p.changes) {
        expect(CHANGE_FLOW, `${p.id}/${c.id}`).toContain(c.status);
        expect(personById(c.requestedBy), `${p.id}/${c.id} requester`).toBeDefined();
        expect(isIsoDate(c.requestedOn)).toBe(true);
        if (c.status === 'accepted' || c.status === 'rejected') {
          expect(isIsoDate(c.decidedOn), `${p.id}/${c.id}: a decision is recorded with its date`).toBe(true);
          expect(c.decidedOn! >= c.requestedOn).toBe(true);
        } else {
          expect(c.decidedOn, `${p.id}/${c.id}: undecided`).toBeUndefined();
        }
      }
      const groups = changeGroups(p);
      expect(groups.accepted.length + groups.open.length + groups.closed.length).toBe(p.changes.length);
      for (const d of p.documents) {
        expect(personById(d.author), `${p.id}/${d.id} author`).toBeDefined();
        expect(isIsoDate(d.date) && d.version.length > 0, `${p.id}/${d.id}`).toBe(true);
      }
      if (p.action) expect(isIsoDate(p.action.requestedOn)).toBe(true);
    }
  });

  it('holds no links, emails, endpoints or credential-looking values', () => {
    const dump = JSON.stringify({ PORTAL_PROJECTS, PEOPLE, PORTAL_COMPANY });
    expect(dump).not.toMatch(/https?:|www\.|\/\/|@|\.(pdf|docx?|zip|png|jpe?g)\b/i);
    expect(dump).not.toMatch(/token|secret|password|api[-_]?key|bearer/i);
    expect(dump).not.toMatch(/[A-Za-z0-9+/_-]{24,}/);
  });
});

describe('portal copy', () => {
  const trees = Object.fromEntries(LOCALES.map((l) => [l, messages(l)])) as Record<string, Tree>;

  it('every fixture text exists in es, en and pt', () => {
    for (const p of PORTAL_PROJECTS) {
      for (const key of projectKeys(p.id)) {
        for (const l of LOCALES) {
          const value = get(trees[l], key);
          expect(typeof value === 'string' && value.trim().length > 0, `${l}: ${key}`).toBe(true);
        }
      }
    }
  });

  it('every stage has a name, meaning, definition, exit criterion and owner', () => {
    for (const l of LOCALES) {
      for (const stage of [...MAIN_STAGES, 'support', 'paused', 'closed']) {
        for (const field of ['name', 'short', 'definition', 'exit', 'owner']) {
          expect(typeof get(trees[l], `portal.stages.${stage}.${field}`), `${l}: ${stage}.${field}`).toBe('string');
        }
      }
    }
  });

  it('shows the demo notice and the change rule word for word in Spanish', () => {
    expect(get(trees.es, 'portal.notice.text')).toBe(
      'Vista de demostración — datos ficticios; acceso real disponible cuando se implemente el backend.',
    );
    expect(String(get(trees.es, 'portal.detail.scope.rule'))).toMatch(/^Ningún cambio modifica alcance, costo o plazo/);
  });

  it('portal copy carries no links or email addresses', () => {
    for (const l of LOCALES) {
      const dump = JSON.stringify(get(trees[l], 'portal'));
      expect(dump, l).not.toMatch(/https?:|www\.|[\w.+-]+@[\w-]+\.\w+/i);
    }
  });
});

describe('portal helpers', () => {
  it('formats dates as the same mono readout in every locale', () => {
    expect(formatDate('2026-10-02', 'es')).toBe('02 oct 2026');
    expect(formatDate('2026-10-02', 'en')).toBe('02 Oct 2026');
    expect(formatDate('2026-10-02', 'pt')).toBe('02 out 2026');
  });

  it('summarizes the dashboard: waiting on the client, last update and next step', () => {
    const s = summarize();
    expect(s.total).toBe(PORTAL_PROJECTS.length);
    expect(s.buckets).toEqual({ active: 2, support: 1, paused: 1, closed: 0 });
    expect(s.waiting.map((p) => p.id).sort()).toEqual(['agente-voz', 'chatbot']);
    expect(s.last?.project.id).toBe('sitio-web');
    expect(s.next?.id).toBe('chatbot');
    expect(summarize([]).next).toBeNull();
  });

  it('maps stages to the 1–5 scale and to the eclipse phase', () => {
    expect(PORTAL_PROJECTS.map((p) => [p.id, stagePosition(p)])).toEqual([
      ['sitio-web', 2],
      ['chatbot', 4],
      ['recordatorios', 5],
      ['agente-voz', 2],
    ]);
    expect(stagePhase(projectById('sitio-web')!)).toBeCloseTo(0.4);
  });
});

describe('portal guide and "Más información"', () => {
  const trees = Object.fromEntries(LOCALES.map((l) => [l, messages(l)])) as Record<string, Tree>;
  const str = (l: string, key: string) => {
    const value = get(trees[l], key);
    return typeof value === 'string' && value.trim().length > 0;
  };

  it('every guide step has a title and a body in es, en and pt (controls come from `tour`)', () => {
    for (const l of LOCALES) {
      for (const key of ['help', 'replay', 'next', 'prev', 'done', 'skip', 'close', 'progress'])
        expect(str(l, `tour.${key}`), `${l}: tour.${key}`).toBe(true);
      for (const [tour, steps] of Object.entries(PORTAL_TOURS)) {
        expect(str(l, `portal.guide.${tour}.label`), `${l}: ${tour}.label`).toBe(true);
        for (const step of steps) {
          expect(str(l, `portal.guide.${tour}.${step.id}.title`), `${l}: ${tour}.${step.id}.title`).toBe(true);
          expect(str(l, `portal.guide.${tour}.${step.id}.body`), `${l}: ${tour}.${step.id}.body`).toBe(true);
        }
      }
    }
  });

  it('guides are short, have unique steps and targets, and are remembered under separate keys', () => {
    for (const steps of Object.values(PORTAL_TOURS)) {
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(6);
      expect(unique(steps.map((s) => s.id))).toBe(true);
      for (const step of steps) for (const target of step.targets) expect(target).toMatch(/^\[data-tour="pt-[a-z-]+"\]$/);
    }
    expect(unique(Object.values(PORTAL_TOUR_KEYS))).toBe(true);
    // The guide says it is remembered only in this browser (no account in the mockup).
    expect(String(get(trees.es, 'portal.guide.projects.help.body'))).toMatch(/navegador/);
  });

  it('the list guide points at a project with a stage and one waiting on the client', () => {
    const hooks = PORTAL_PROJECTS.map((p) => tourHooks(p));
    expect(hooks.filter((h) => h.stage).length).toBe(1);
    expect(hooks.filter((h) => h.open).length).toBe(1);
    const waiting = PORTAL_PROJECTS.filter((p, i) => hooks[i].turn);
    expect(waiting.length).toBe(1);
    expect(waiting[0].action).toBeDefined();
  });

  it('every "Más información" card has a title and a body (and a chip label in the legend)', () => {
    for (const l of LOCALES) {
      for (const key of ['more', 'close', 'legend']) expect(str(l, `portal.info.${key}`), `${l}: info.${key}`).toBe(true);
      expect(String(get(trees[l], 'portal.info.more'))).toContain('{topic}');
      for (const topic of ['stages', 'estimate', 'action', 'clientReview', 'support', 'changes']) {
        expect(str(l, `portal.info.${topic}.title`), `${l}: ${topic}.title`).toBe(true);
        expect(str(l, `portal.info.${topic}.body`), `${l}: ${topic}.body`).toBe(true);
      }
      for (const topic of ['stages', 'estimate', 'action']) expect(str(l, `portal.info.${topic}.chip`), `${l}: ${topic}.chip`).toBe(true);
    }
  });
});
