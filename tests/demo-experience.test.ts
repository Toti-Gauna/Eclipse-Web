import { describe, expect, it } from 'vitest';
import { items, maintenanceById, offers, planById, verticals, type Offer, type Vertical } from '@/lib/content';
import { maintenanceSuggestion } from '@/lib/pricing';
import { projectSummary } from '@/components/demo-experience/project';
import { buildTourSteps } from '@/components/demo-experience/guide';

const withDemo = verticals.filter((v) => v.demo);

describe('projectSummary (the complete project under each demo)', () => {
  it('every vertical with a demo declares its project, with known pieces', () => {
    for (const v of withDemo) {
      expect(v.project, v.id).toBeTruthy();
      for (const id of v.project!.items) expect(items.some((i) => i.id === id), `${v.id}:${id}`).toBe(true);
    }
  });

  it('with a package: covered + extras = the demo pieces, extras are exactly the ones the package lacks', () => {
    for (const v of withDemo.filter((x) => x.project?.plan)) {
      const s = projectSummary(v)!;
      const plan = planById(v.project!.plan!)!;
      expect(s.plan?.id).toBe(plan.id);
      const inPlan = (id: string) => plan.items.includes(id as never) || plan.bonus?.itemId === id;
      expect(s.pieces.map((p) => p.id)).toEqual(v.project!.items.filter((id) => !inPlan(id)));
      expect(s.covered.map((p) => p.id)).toEqual(v.project!.items.filter(inPlan));
      // Prices are the catalog's, untouched.
      for (const p of s.pieces) expect(p.priceUsd).toBe(items.find((i) => i.id === p.id)!.priceUsd);
      expect(s.preset).toEqual({ planId: plan.id, items: s.pieces.map((p) => p.id) });
      expect(s.bonus).toBe(plan.bonus ?? null);
    }
  });

  it('without a package: every piece at its published price, no plan, no project price', () => {
    for (const v of withDemo.filter((x) => x.project && !x.project.plan)) {
      const s = projectSummary(v)!;
      expect(s.plan).toBeNull();
      expect(s.covered).toEqual([]);
      expect(s.pieces.map((p) => p.id)).toEqual(v.project!.items);
      expect(s.preset).toEqual({ planId: null, items: v.project!.items });
      expect(Object.keys(s)).not.toContain('totalUsd');
    }
  });

  it('suggested maintenance is the pricing rule (package floor, raised only by its extras)', () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      const p = v.project!;
      const expected = maintenanceSuggestion({ planId: p.plan, itemIds: p.plan ? s.pieces.map((x) => x.id) : p.items });
      expect(s.maintenance?.id ?? null, v.id).toBe(expected);
      if (p.plan) expect(s.maintenance).toBe(maintenanceById(planById(p.plan)!.maintenance));
    }
  });

  it('voice usage shows only when the project has the voice agent', () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      const plan = v.project!.plan ? planById(v.project!.plan) : undefined;
      const hasVoice = v.project!.items.includes('voz') || !!plan?.items.includes('voz');
      expect(!!s.voiceUsage, v.id).toBe(hasVoice);
    }
  });

  it('voice combo: only for a voice agent bought as a piece, and only when the offer applies', () => {
    const restaurant = verticals.find((v) => v.id === 'restaurantes')!;
    const s = projectSummary(restaurant)!;
    // pedidos 400 + turnos 400 + dashboard 400 = 1200 ≥ minSubtotal → the combo applies.
    expect(s.voiceCombo?.id).toBe('combo-voz');
    // A package that already includes the voice agent never shows it.
    const clinic = projectSummary(verticals.find((v) => v.id === 'clinicas')!)!;
    expect(clinic.voiceCombo).toBeNull();
    // Below the minimum and no package: no combo.
    const small: Pick<Vertical, 'project'> = { project: { plan: null, items: ['voz', 'landing'] } };
    expect(projectSummary(small)!.voiceCombo).toBeNull();
    // Offer switched off: no combo.
    const off = offers.map((o) => (o.kind === 'voiceCombo' ? { ...o, active: false } : o)) as Offer[];
    expect(projectSummary(restaurant, { offers: off })!.voiceCombo).toBeNull();
  });

  it('annual months appear only while the annual offer is active', () => {
    const clinic = verticals.find((v) => v.id === 'clinicas')!;
    expect(projectSummary(clinic)!.annualFreeMonths).toBe(2);
    const off = offers.map((o) => (o.kind === 'annualMaintenance' ? { ...o, active: false } : o)) as Offer[];
    expect(projectSummary(clinic, { offers: off })!.annualFreeMonths).toBeNull();
  });

  it('a package bonus is reported as such and the bonus piece is never an extra', () => {
    const fake: Pick<Vertical, 'project'> = { project: { plan: 'voz', items: ['voz', 'landing'] } };
    const plan = planById('voz')!;
    const s = projectSummary(fake)!;
    if (plan.bonus?.itemId === 'landing') {
      expect(s.pieces.map((p) => p.id)).toEqual([]);
      expect(s.bonus?.itemId).toBe('landing');
    } else {
      expect(s.pieces.map((p) => p.id)).toEqual(['landing']);
    }
  });

  it('no project → null', () => {
    expect(projectSummary({ project: undefined })).toBeNull();
  });
});

describe('buildTourSteps', () => {
  const copy = {
    has: (key: string) => !key.startsWith('clinic.missing'),
    get: (key: string) => `T:${key}`,
    tag: (view: string) => `tag:${view}`,
  };
  it('targets [data-tour], tags by view and drops steps without copy', () => {
    const steps = buildTourSteps(
      'clinic',
      [
        { id: 'agenda', view: 'laptop' },
        { id: 'missing', view: 'phone' },
        { id: 'voice', view: 'both' },
      ],
      copy,
    );
    expect(steps.map((s) => s.id)).toEqual(['agenda', 'voice']);
    expect(steps[0]).toMatchObject({
      targets: ['[data-tour="agenda"]'],
      title: 'T:clinic.agenda.title',
      body: 'T:clinic.agenda.body',
      tag: 'tag:laptop',
      view: 'laptop',
    });
  });
});
