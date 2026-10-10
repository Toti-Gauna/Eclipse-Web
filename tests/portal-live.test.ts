import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ApiMilestone, ApiUpdate } from '@/lib/api/types';
import { idFromSearch, isE164, loginHref, normalizePhone, passwordProblem, safeNext, tokenFromHash } from '@/lib/portal/live';
import { bucketOf, changeGroups, countBuckets, displayStage, nextMilestone, openActions, phase, position, rail, stageKey } from '@/lib/portal/live-model';
import { formatTimestamp } from '@/lib/portal/format';

const ID = '3931ac6f-f567-48a5-8561-604f9b909108';

describe('live portal — redirect target', () => {
  it('accepts internal portal and plan paths with their query', () => {
    expect(safeNext('/portal/proyectos/')).toBe('/portal/proyectos/');
    expect(safeNext(`/portal/proyecto/?id=${ID}`)).toBe(`/portal/proyecto/?id=${ID}`);
    expect(safeNext('/plan/?g=encontrar&items=landing')).toBe('/plan/?g=encontrar&items=landing');
  });
  it('rejects anything that could leave the site or loop into auth', () => {
    for (const bad of [
      '//evil.example/portal/',
      'https://evil.example/portal/',
      '/\\evil.example',
      'javascript:alert(1)',
      '/portal/../admin',
      '/es/portal/',
      '/',
      '/#servicios',
      '/portal/\u0000x',
      '/portal/',
      '/portal/registro/',
      '/portal/verificar-email/',
      '',
      null,
      undefined,
      `/portal/${'a'.repeat(800)}`,
    ]) {
      expect(safeNext(bad as string | null), String(bad)).toBeNull();
    }
  });
  it('builds a login href that carries only a safe target', () => {
    expect(loginHref('/plan/?items=seo')).toBe('/portal/?next=%2Fplan%2F%3Fitems%3Dseo');
    expect(loginHref('https://evil.example')).toBe('/portal/');
  });
});

describe('live portal — ids from the URL', () => {
  it('takes a UUID from ?id= and nothing else', () => {
    expect(idFromSearch(`?id=${ID}`)).toBe(ID);
    expect(idFromSearch('?id=1')).toBeNull();
    expect(idFromSearch('?id=../../etc/passwd')).toBeNull();
    expect(idFromSearch('')).toBeNull();
    expect(idFromSearch(new URLSearchParams({ id: ID }))).toBe(ID);
  });
});

describe('live portal — fragment tokens', () => {
  it('reads the token from the hash and ignores malformed ones', () => {
    const token = 'abcDEF0123456789_-abcDEF0123456789_-abcDEF0123456';
    expect(tokenFromHash(`#token=${token}`)).toBe(token);
    expect(tokenFromHash(`token=${token}`)).toBe(token);
    expect(tokenFromHash('')).toBeNull();
    expect(tokenFromHash('#token=short')).toBeNull();
    expect(tokenFromHash('#token=<script>alert(1)</script>aaaaaaaaaaaaaaaaaaaaaaaa')).toBeNull();
    expect(tokenFromHash('#other=1')).toBeNull();
  });
});

describe('live portal — forms', () => {
  it('password rules: 12–128 code points, no trimming', () => {
    expect(passwordProblem('x'.repeat(11))).toBe('short');
    expect(passwordProblem('x'.repeat(12))).toBeNull();
    expect(passwordProblem('x'.repeat(129))).toBe('long');
    expect(passwordProblem(' '.repeat(12))).toBeNull(); // spaces count: the API keeps the password exactly
    expect(passwordProblem('🌘'.repeat(12))).toBeNull(); // code points, not UTF-16 units
  });
  it('phone: strips separators, keeps the country the person typed', () => {
    expect(normalizePhone('+54 (9) 223-555 0000')).toBe('+5492235550000');
    expect(normalizePhone('00 54 9 223')).toBe('+54' + '9223');
    expect(isE164('+5492235550000')).toBe(true);
    expect(isE164('5492235550000')).toBe(false);
    expect(isE164('+0123456789')).toBe(false);
  });
});

describe('live portal — project model', () => {
  const p = (stage: Parameters<typeof position>[0]['stage'], status: 'active' | 'paused' | 'closed' = 'active') => ({ stage, status });

  it('maps API stages to the existing stage names and positions', () => {
    expect(stageKey('eclipse_review')).toBe('eclipseReview');
    expect(stageKey('client_review')).toBe('clientReview');
    expect([p('preparation'), p('build'), p('eclipse_review'), p('client_review'), p('delivery'), p('support')].map(position)).toEqual([1, 2, 3, 4, 5, 5]);
    expect(phase(p('build'))).toBeCloseTo(0.4);
    expect(displayStage(p('build'))).toBe('build');
    expect(displayStage(p('build', 'paused'))).toBe('paused');
    expect(displayStage(p('delivery', 'closed'))).toBe('closed');
    expect(displayStage(p('support'))).toBe('support');
  });

  it('draws the five-step rail from the single current stage', () => {
    const status = (x: ReturnType<typeof p>) => rail(x).map((s) => s.status);
    expect(status(p('preparation'))).toEqual(['current', 'next', 'pending', 'pending', 'pending']);
    expect(status(p('client_review'))).toEqual(['done', 'done', 'done', 'current', 'next']);
    expect(status(p('delivery'))).toEqual(['done', 'done', 'done', 'done', 'current']);
    expect(status(p('support'))).toEqual(['done', 'done', 'done', 'done', 'done']);
    expect(status(p('build', 'paused'))).toEqual(['done', 'paused', 'pending', 'pending', 'pending']);
    expect(status(p('build', 'closed'))).toEqual(['done', 'pending', 'pending', 'pending', 'pending']);
  });

  it('picks the next milestone: current first, then the earliest planned one; never a finished one', () => {
    const m = (id: string, status: ApiMilestone['status'], plannedOn: string | null): ApiMilestone => ({
      id, stage: 'build', title: id, description: null, status, ownerParty: 'eclipse', plannedOn, actualOn: null,
    });
    expect(nextMilestone([m('a', 'done', '2026-01-01'), m('b', 'upcoming', '2026-03-01'), m('c', 'upcoming', '2026-02-01')])?.id).toBe('c');
    expect(nextMilestone([m('b', 'upcoming', '2026-03-01'), m('x', 'current', null)])?.id).toBe('x');
    expect(nextMilestone([m('u', 'upcoming', null), m('d', 'upcoming', '2026-05-01')])?.id).toBe('d');
    expect(nextMilestone([m('a', 'done', null)])).toBeNull();
    expect(nextMilestone([])).toBeNull();
  });

  it('required actions are the published action_required updates still open, most urgent first', () => {
    const u = (id: string, kind: ApiUpdate['kind'], dueOn: string | null, resolved = false): ApiUpdate => ({
      id, kind, title: id, body: 'b', dueOn, resolved, publishedAt: '2026-10-10T10:00:00.000Z', author: 'Eclipse',
    });
    const list = openActions([u('late', 'action_required', '2026-11-30'), u('soon', 'action_required', '2026-10-20'), u('done', 'action_required', '2026-10-01', true), u('info', 'client_update', null), u('nodate', 'action_required', null)]);
    expect(list.map((x) => x.id)).toEqual(['soon', 'late', 'nodate']);
  });

  it('groups change requests without ever treating an open one as part of the scope', () => {
    const c = (status: Parameters<typeof changeGroups>[0][number]['status'], number: number) => ({
      number, title: 't', description: null, status, scheduleImpactDays: null, requestedAt: '2026-10-01T00:00:00Z', decidedAt: null,
    });
    const g = changeGroups([c('accepted', 1), c('received', 2), c('estimated', 3), c('rejected', 4), c('closed', 5)]);
    expect([g.accepted.length, g.open.length, g.closed.length]).toEqual([1, 2, 2]);
  });

  it('buckets projects for the overview', () => {
    const list = [p('build'), p('support'), p('build', 'paused'), p('delivery', 'closed'), p('preparation')];
    expect(list.map(bucketOf)).toEqual(['active', 'support', 'paused', 'closed', 'active']);
    expect(countBuckets(list)).toEqual({ active: 2, support: 1, paused: 1, closed: 1 });
  });

  it('formats API timestamps in the local zone as the portal readout', () => {
    expect(formatTimestamp('2026-10-10T16:26:21.500Z', 'es')).toMatch(/^\d{2} oct 2026$/);
    expect(formatTimestamp('not a date', 'es')).toBe('not a date');
  });
});

describe('live portal — nothing private in shipped code', () => {
  it('the live components never import the demo fixtures', () => {
    const roots = ['components/portal/live', 'components/plan-builder', 'components/providers', 'lib/api'];
    const base = path.resolve(import.meta.dirname, '..');
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
    for (const root of roots) {
      let files: string[] = [];
      try {
        files = walk(path.join(base, root)).filter((f) => /\.(ts|tsx)$/.test(f));
      } catch {
        continue; // directory not created yet
      }
      for (const file of files) {
        expect(readFileSync(file, 'utf8'), file).not.toMatch(/lib\/portal\/(fixtures|project)'/);
      }
    }
  });
});
