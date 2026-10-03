/**
 * "Armá tu plan" state <-> URL query, so a plan can be shared:
 *   /es/plan/?g=encontrar,atender&items=landing,turnos&m=crecimiento&b=annual&v=clinicas&plan=sistema&f=1
 * Unknown ids are dropped. `m` absent = automatic suggestion; `m=none` = no maintenance.
 * `g` (goals, v2) is optional: links made before it existed decode exactly as before.
 */
import { items, maintenancePlans, plans, verticals, type ItemId, type MaintenanceId, type PlanId, type VerticalId } from '@/lib/content';
import type { Billing } from '@/lib/pricing';

/** "¿Qué querés resolver?" — the goals of step 1 (ids are stable: they live in shared links). */
export const GOAL_IDS = ['encontrar', 'atender', 'ordenar', 'vender', 'fidelizar', 'app', 'diagnostico'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface PlanState {
  /** Goals picked in step 1, in GOAL_IDS order (context for the suggestions and the message). */
  goals: GoalId[];
  planId: PlanId | null;
  items: ItemId[];
  /** undefined = follow the automatic suggestion; null = explicitly none. */
  maintenance: MaintenanceId | null | undefined;
  billing: Billing;
  vertical: VerticalId | null;
  founder: boolean;
}

export const emptyPlanState: PlanState = {
  goals: [],
  planId: null,
  items: [],
  maintenance: undefined,
  billing: 'monthly',
  vertical: null,
  founder: false,
};

const goalIds = new Set<string>(GOAL_IDS);
const itemIds = new Set<string>(items.map((i) => i.id));
const planIds = new Set<string>(plans.map((p) => p.id));
const maintenanceIds = new Set<string>(maintenancePlans.map((m) => m.id));
const verticalIds = new Set<string>(verticals.map((v) => v.id));

/** Goals in their canonical order, unique, known ids only. */
export function sortGoals(list: readonly string[]): GoalId[] {
  const wanted = new Set(list);
  return GOAL_IDS.filter((g) => wanted.has(g));
}

export function encodePlanState(state: PlanState): string {
  const params = new URLSearchParams();
  if (state.goals?.length) params.set('g', sortGoals(state.goals).join(','));
  if (state.planId) params.set('plan', state.planId);
  if (state.items.length) params.set('items', state.items.join(','));
  if (state.maintenance === null) params.set('m', 'none');
  else if (state.maintenance) params.set('m', state.maintenance);
  if (state.billing === 'annual') params.set('b', 'annual');
  if (state.vertical) params.set('v', state.vertical);
  if (state.founder) params.set('f', '1');
  // Keep commas readable in shared links.
  return params.toString().replace(/%2C/g, ',');
}

export function decodePlanState(search: string | URLSearchParams): PlanState {
  const params = typeof search === 'string' ? new URLSearchParams(search.replace(/^\?/, '')) : search;
  const plan = params.get('plan');
  const m = params.get('m');
  const v = params.get('v');
  const list = (params.get('items') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s, i, arr) => itemIds.has(s) && arr.indexOf(s) === i) as ItemId[];
  const goals = sortGoals((params.get('g') ?? '').split(',').map((s) => s.trim()).filter((s) => goalIds.has(s)));
  return {
    goals,
    planId: plan && planIds.has(plan) ? (plan as PlanId) : null,
    items: list,
    maintenance: m === 'none' ? null : m && maintenanceIds.has(m) ? (m as MaintenanceId) : undefined,
    billing: params.get('b') === 'annual' ? 'annual' : 'monthly',
    vertical: v && verticalIds.has(v) ? (v as VerticalId) : null,
    founder: params.get('f') === '1',
  };
}
