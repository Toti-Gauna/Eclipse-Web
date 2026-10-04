import type { DemoId } from '@/lib/content';
import type { DemoTourStep } from '@/components/demos/tourTypes';
import type { TourStep } from '@/components/ui/tour/types';

/**
 * The demo guide ("Ver con guía"): steps come from DEMO_TOURS[demo] (components/demos/tours.ts,
 * filled by each demo's owner), copy from the `demoTours` namespace
 * (`<demoId>.<stepId>.title|body`). A step whose copy is missing is left out, so a demo
 * agent can land steps and copy separately without breaking the guide.
 */
export type ViewTag = DemoTourStep['view'];

export interface GuideCopy {
  has: (key: string) => boolean;
  get: (key: string) => string;
  tag: (view: ViewTag) => string;
}

export function buildTourSteps(demo: DemoId, steps: readonly DemoTourStep[], copy: GuideCopy): (TourStep & { view: ViewTag })[] {
  return steps.flatMap((step) => {
    const base = `${demo}.${step.id}`;
    if (!copy.has(`${base}.title`) || !copy.has(`${base}.body`)) return [];
    return [
      {
        id: step.id,
        view: step.view,
        targets: [`[data-tour="${step.id}"]`],
        title: copy.get(`${base}.title`),
        body: copy.get(`${base}.body`),
        tag: copy.tag(step.view),
      },
    ];
  });
}

/** useTourSeen key: the visitor already answered "¿Cómo querés verla?" (any demo). */
export const GUIDE_CHOICE_KEY = 'demo-choice';
