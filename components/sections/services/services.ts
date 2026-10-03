import { itemCategories, items, type Item, type ItemCategory } from '@/lib/content';
import { lowestItemPrice } from '@/lib/pricing';

export type FamilyId = 'web' | 'ai' | 'ops' | 'sales' | 'apps' | 'strategy';

export interface Family {
  id: FamilyId;
  /** The category of content/items.json whose pieces this family lists (same groups as the builder's catalog). */
  category: string;
}

/**
 * "Qué construimos": the six families of pieces. Each one is an item category of
 * content/items.json, in the same order, so the section, the builder's catalog and
 * the packages number and name the same pieces with the same prices (tests/pricing
 * checks it). Copy lives in messages (`services.families.<id>`); names and prices
 * come from content.
 */
export const FAMILIES: readonly Family[] = [
  { id: 'web', category: 'presencia' },
  { id: 'ops', category: 'sistemas' },
  { id: 'sales', category: 'comercio' },
  { id: 'apps', category: 'plataformas' },
  { id: 'ai', category: 'ia' },
  { id: 'strategy', category: 'estrategia' },
];

export function familyCategory(family: Family): ItemCategory | undefined {
  return itemCategories.find((c) => c.id === family.category);
}

/** The pieces of a family, in catalog order. */
export function familyItems(family: Family, catalog: readonly Item[] = items): Item[] {
  return catalog.filter((item) => item.category === family.category);
}

/** "Pieza suelta desde": the cheapest piece of the family, in USD. */
export function familyFromUsd(family: Family, catalog: readonly Item[] = items): number | null {
  return lowestItemPrice(
    familyItems(family, catalog).map((i) => i.id),
    catalog,
  );
}
