/**
 * Step 1 of "Armá tu plan": "¿Qué querés resolver?". Each goal preselects the pieces
 * that solve it; the visitor adjusts them in step 2. Pure and unit-tested
 * (tests/builder.test.ts). Ids reference content/items.json; prices never live here.
 */
import type { ItemId, VerticalId } from '@/lib/content';
import { GOAL_IDS, sortGoals, type GoalId, type PlanState } from '@/lib/plan-url';
import { normalizeState, sortItemIds } from './rules';

export { GOAL_IDS, type GoalId };

/** Businesses that run on bookings vs. on orders: "ordenar turnos y pedidos" picks the right system. */
const BOOKING_VERTICALS: ReadonlySet<VerticalId> = new Set(['clinicas', 'gimnasios', 'inmobiliarias']);
const ORDER_VERTICALS: ReadonlySet<VerticalId> = new Set(['restaurantes', 'tiendas', 'servicios']);

/** Pieces that solve a goal (catalog order). The vertical only refines "ordenar". */
export function goalPieces(goal: GoalId, vertical: VerticalId | null = null): ItemId[] {
  switch (goal) {
    case 'encontrar':
      return ['landing', 'seo'];
    case 'atender':
      return ['voz', 'chatbot'];
    case 'ordenar':
      if (vertical && BOOKING_VERTICALS.has(vertical)) return ['turnos', 'automatizacion'];
      if (vertical && ORDER_VERTICALS.has(vertical)) return ['pedidos', 'automatizacion'];
      return ['turnos', 'pedidos', 'automatizacion'];
    case 'vender':
      return ['ecommerce'];
    case 'fidelizar':
      return ['automatizacion', 'gamificacion'];
    case 'app':
      return ['app-ondemand'];
    case 'diagnostico':
      return ['auditoria'];
  }
}

/** Every piece suggested by a set of goals, unique, in catalog order. */
export function piecesForGoals(goals: readonly GoalId[], vertical: VerticalId | null = null): ItemId[] {
  return sortItemIds(goals.flatMap((g) => goalPieces(g, vertical)));
}

/**
 * Turning a goal on adds its pieces (the package's own pieces are skipped by
 * normalizeState). Turning it off removes its pieces unless another chosen goal
 * still suggests them.
 */
export function toggleGoal(state: PlanState, goal: GoalId): PlanState {
  const on = state.goals.includes(goal);
  const goals = sortGoals(on ? state.goals.filter((g) => g !== goal) : [...state.goals, goal]);
  const own = goalPieces(goal, state.vertical);
  let items: ItemId[];
  if (on) {
    const stillWanted = new Set<string>(piecesForGoals(goals, state.vertical));
    items = state.items.filter((id) => !own.includes(id) || stillWanted.has(id));
  } else {
    items = [...state.items, ...own];
  }
  return normalizeState({ ...state, goals, items });
}

/**
 * A new vertical. When "ordenar" is chosen, its system follows the business
 * (bookings for a clinic, orders for a restaurant); everything else stays.
 */
export function setVertical(state: PlanState, vertical: VerticalId | null): PlanState {
  if (state.vertical === vertical) return state;
  if (!state.goals.includes('ordenar')) return { ...state, vertical };
  const before = goalPieces('ordenar', state.vertical);
  const after = goalPieces('ordenar', vertical);
  const others = new Set<string>(piecesForGoals(state.goals.filter((g) => g !== 'ordenar'), vertical));
  const items = [...state.items.filter((id) => !before.includes(id) || after.includes(id) || others.has(id)), ...after];
  return normalizeState({ ...state, vertical, items });
}

/** Pieces in the selection that a chosen goal suggested ("Sugerida" tag in step 2). */
export function suggestedIds(state: Pick<PlanState, 'goals' | 'vertical'>): Set<ItemId> {
  return new Set(piecesForGoals(state.goals, state.vertical));
}
