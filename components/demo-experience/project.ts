import { itemById, maintenanceById, planById, type Item, type ItemId, type MaintenancePlan, type Plan, type PlanId, type Vertical } from '@/lib/content';
import { maintenanceSuggestion } from '@/lib/pricing';

/**
 * "The complete project under the demo", built only from /content (verticals.json `project`,
 * plans, items, maintenance). Pure.
 *
 * Offer of 16/10/2026: the demo is an existing product, so it is contracted as the offer in
 * `project.plan` (Adaptación de producto) — brand, content, agreed setup and the standard
 * gamification it already has. The channels the demo SIMULATES (voice, AI chatbot, standard
 * WhatsApp) are not part of it: they are listed as compatible add-ons at their add-on price,
 * subject to validating provider, scope and feasibility, and they are NEVER preselected
 * (`preset` carries the offer only). Nothing is summed here.
 */
export interface ProjectSummary {
  plan: Plan | null;
  /** Channels the demo simulates, contracted apart as add-ons (each with its add-on price). */
  pieces: Item[];
  maintenance: MaintenancePlan | null;
  /** What "Armá este proyecto" hands the builder: the offer alone, no extras. */
  preset: { planId: PlanId | null; items: ItemId[] };
}

export function projectSummary(vertical: Pick<Vertical, 'project'>): ProjectSummary | null {
  const project = vertical.project;
  if (!project) return null;
  const plan = project.plan ? (planById(project.plan) ?? null) : null;
  const pieces = [...new Set(project.items)].map((id) => itemById(id)).filter((i): i is Item => !!i);
  const maintenance = maintenanceById(maintenanceSuggestion({ planId: plan?.id ?? null, itemIds: plan ? [] : pieces.map((p) => p.id) })) ?? null;
  return { plan, pieces, maintenance, preset: { planId: plan?.id ?? null, items: [] } };
}
