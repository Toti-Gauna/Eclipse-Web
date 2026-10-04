/**
 * "Precarga explicada y editable": what came preselected in "Armá tu plan", and why.
 * Goals preselect pieces (derived from the state), a "Sumala a tu plan" preset adds
 * pieces and a "Personalizar" preset starts from a package (both remembered for the
 * session, not in the URL: they explain the state, they are not part of it). Pure and
 * unit-tested (tests/builder.test.ts).
 */
import type { ItemId, PlanId } from '@/lib/content';
import type { PlanState } from '@/lib/plan-url';
import { piecesForGoals } from './goals';
import { addedByPreset, sortItemIds, type CategoryGroup, type Preset } from './rules';

export interface Preload {
  /** Pieces a preset added one by one ("Sumala a tu plan"). */
  items: ItemId[];
  /** Package a preset started from ("Personalizar" on a pricing card). */
  planId: PlanId | null;
}

export const noPreload: Preload = { items: [], planId: null };

/** What a preset leaves preloaded, measured against the state it is applied to. */
export function presetPreload(state: PlanState, preset: Preset): Preload {
  if (preset.planId) return { items: [], planId: preset.planId };
  return { items: addedByPreset(state, preset), planId: null };
}

/**
 * The session's preload after one more preset: a package starts over (its own note);
 * pieces add up ("Sumaste el chatbot y el dashboard") and keep the package's note.
 */
export function mergePreload(previous: Preload, next: Preload): Preload {
  if (next.planId) return next;
  return { items: sortItemIds([...previous.items, ...next.items]), planId: previous.planId };
}

export interface PreloadNotes {
  /** Extras still selected that a chosen goal suggested (catalog order). */
  fromGoals: ItemId[];
  /** Extras still selected that a preset added (catalog order). */
  added: ItemId[];
  /** The selected package is the one a preset started from. */
  packageFromPreset: boolean;
}

/**
 * Why each preselected piece is there. A piece is explained once: by the preset that
 * added it, otherwise by the goals. Pieces inside the package are explained by the package.
 */
export function preloadNotes(state: PlanState, preload: Preload): PreloadNotes {
  const extras = new Set<string>(state.items);
  const added = sortItemIds(preload.items.filter((id) => extras.has(id)));
  const explained = new Set<string>(added);
  const fromGoals = piecesForGoals(state.goals, state.vertical).filter((id) => extras.has(id) && !explained.has(id));
  return { fromGoals, added, packageFromPreset: !!preload.planId && preload.planId === state.planId };
}

/** "Deshacer": takes out the pieces a preset added; the package and everything else stay. */
export function undoAdded(state: PlanState, ids: readonly ItemId[]): PlanState {
  const drop = new Set<string>(ids);
  return { ...state, items: state.items.filter((id) => !drop.has(id)) };
}

/**
 * Categories open when the pieces step opens: the ones holding extras the visitor has
 * (or a preset just added); with none, the first one, so the list shows how it works.
 */
export function openCategories(
  groups: readonly CategoryGroup[],
  state: Pick<PlanState, 'items'>,
  highlight: readonly string[] = [],
): string[] {
  const wanted = new Set<string>([...state.items, ...highlight]);
  const open = groups.filter((g) => g.items.some((item) => wanted.has(item.id))).map((g) => g.category.id);
  return open.length ? open : groups.slice(0, 1).map((g) => g.category.id);
}
