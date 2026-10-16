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

  it('each demo is contracted as the product adaptation; its simulated channels are add-ons, never preselected', () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      expect(s.plan?.id, v.id).toBe('adaptacion');
      expect(s.pieces.map((p) => p.id), v.id).toEqual(v.project!.items);
      // Only the channels a demo simulates, never modules sold as part of the product price.
      for (const p of s.pieces) expect(['voz', 'chatbot', 'whatsapp'], `${v.id}:${p.id}`).toContain(p.id);
      for (const p of s.pieces) expect(p.addonUsd, p.id).toBe(items.find((i) => i.id === p.id)!.addonUsd);
      expect(s.preset, v.id).toEqual({ planId: 'adaptacion', items: [] });
      expect(Object.keys(s)).not.toContain('totalUsd');
    }
  });

  it("suggested monthly plan is the offer's own (the channels are not added, so they do not raise it)", () => {
    for (const v of withDemo) {
      const s = projectSummary(v)!;
      expect(s.maintenance?.id, v.id).toBe(maintenanceSuggestion({ planId: 'adaptacion', itemIds: [] }));
      expect(s.maintenance).toBe(maintenanceById(planById('adaptacion')!.maintenance));
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
