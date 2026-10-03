import type { PlanId } from '@/lib/content';

/** In-page anchors inside 06 · Precios (the ledger links to them, services links to the packages). */
export const PRICING_ANCHORS = {
  packages: 'paquetes',
  offers: 'ofertas',
  care: 'mantenimiento',
} as const;

/** Anchor of a package row: "Incluida en: Sistema" in 03 · Qué construimos jumps here. */
export const planAnchor = (id: PlanId) => `plan-${id}`;
