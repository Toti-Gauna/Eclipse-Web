import { describe, expect, it } from 'vitest';
import { items, maintenanceById, planById, verticals } from '@/lib/content';
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

  it('with the 16/10 offers hidden (lote 2.2b) no demo is contracted as an offer: its pieces keep their own price, never preselected', () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      expect(planById('adaptacion')?.hidden).toBe(true);
      expect(s.plan, v.id).toBeNull();
      expect(s.pieces.map((p) => p.id), v.id).toEqual(v.project!.items);
      // Only the channels a demo simulates, never modules sold as part of the product price.
      for (const p of s.pieces) expect(['voz', 'chatbot', 'whatsapp'], `${v.id}:${p.id}`).toContain(p.id);
      expect(s.preset, v.id).toEqual({ planId: null, items: [] });
      expect(Object.keys(s)).not.toContain('totalUsd');
    }
  });

  it('suggested monthly plan follows the pieces (no offer): WhatsApp → Conectado, chatbot or voice → Automatización e IA', () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      const ids = s.pieces.map((p) => p.id);
      expect(s.maintenance?.id, v.id).toBe(maintenanceSuggestion({ planId: null, itemIds: ids }));
      expect(s.maintenance, v.id).toBe(maintenanceById(maintenanceSuggestion({ planId: null, itemIds: ids })));
    }
    expect(projectSummary({ project: { plan: null, items: ['whatsapp'] } })!.maintenance?.id).toBe('conectado');
    expect(projectSummary({ project: { plan: null, items: ['chatbot', 'whatsapp'] } })!.maintenance?.id).toBe('ia');
  });

  it('a project that names a retired offer still resolves the offer for history but does not sell it', () => {
    expect(planById('pack')).toBeTruthy();
    expect(projectSummary({ project: { plan: 'pack', items: [] } })!.plan).toBeNull();
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
