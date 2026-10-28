import { levelById, type Product } from '@/lib/content';
import { localeTags, type Locale } from '@/i18n/routing';

/** How lit a product's status glyph is: ready = full sun, launching = a sliver left, in the works = mostly dark, coming = almost all dark. */
export const STATUS_PHASE: Record<Product['status'], number> = {
  available: 0,
  launch: 0.3,
  planned: 0.72,
  soon: 0.9,
};

/** A product's public launch date, written out for the locale ("10 de noviembre de 2026"). */
export function launchDate(product: Product, locale: Locale): string | null {
  if (!product.launchDate) return null;
  return new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${product.launchDate}T12:00:00Z`),
  );
}

/** The USD «desde» of an available product (its entry level in content/levels.json), or null. */
export function fromUsd(product: Product): number | null {
  if (product.status !== 'available') return null;
  return levelById(product.fromLevel)?.priceUsd ?? null;
}
