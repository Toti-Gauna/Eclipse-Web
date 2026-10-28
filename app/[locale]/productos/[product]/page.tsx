import type { Metadata } from 'next';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { baseMetadata } from '@/lib/seo';
import { pagedProducts, productById, productHasPage, type ProductId } from '@/lib/content';
import { ProductPage } from '@/components/products/ProductPage';

export const dynamicParams = false;

/** One page per product and locale (static export); the «Próximamente» ones have none yet. */
export function generateStaticParams() {
  return pagedProducts.map((p) => ({ product: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; product: string }> }): Promise<Metadata> {
  const { locale, product } = await params;
  const p = productById(product);
  if (!hasLocale(routing.locales, locale) || !p || !productHasPage(p)) return {};
  const meta = await getTranslations({ locale, namespace: 'meta' });
  const t = await getTranslations({ locale, namespace: 'products' });
  return baseMetadata({
    locale,
    title: meta('pages.product.title', { name: t(`items.${product}.name`), rubro: t(`items.${product}.rubro`) }),
    description: t(`items.${product}.line`),
    ogAlt: meta('ogAlt'),
    path: `/productos/${product}/`,
  });
}

/** /[locale]/productos/<id>/ — where «Conocer <producto>» leads (components/products/ProductPage). */
export default function ProductRoute({ params }: { params: Promise<{ locale: string; product: string }> }) {
  const { locale, product } = use(params);
  setRequestLocale(locale);
  const p = productById(product);
  if (!p || !productHasPage(p)) notFound();
  return <ProductPage id={product as ProductId} locale={locale as Locale} />;
}
