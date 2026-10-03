import type { DemoId } from '@/lib/content';

/**
 * Brand palette of each demo business (the art direction's table in CLAUDE.md),
 * shown as a swatch in the "Sala de demos" selector. Design data, not copy.
 * A demo without an entry simply shows no swatch.
 */
export const DEMO_PALETTES: Partial<Record<DemoId, readonly string[]>> = {
  clinic: ['#F7F4EF', '#1D2A2B', '#127C74', '#F2C4B3'],
  realEstate: ['#ECE8E1', '#141414', '#2448C8', '#D9CBB3'],
  gym: ['#0B0C0F', '#CCFF33', '#FF3E8A'],
  shop: ['#FBF6EE', '#2B1B14', '#E4472B', '#EADFCB'],
  restaurant: ['#1A1113', '#F3E6D0', '#B23A52', '#8C9A4B'],
  academy: ['#172338', '#F3F0E6', '#7CC8F5', '#FF9F87'],
};
