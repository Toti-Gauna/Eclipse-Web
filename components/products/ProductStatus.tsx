'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { productById, type ProductId } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { STATUS_PHASE, fromUsd, launchDate } from '@/components/sections/products/products';

/** «Disponible · desde USD 30/mes» / «En preparación · sin precio publicado» / «Lanza el …»: the price in the visitor's currency. */
export function ProductStatus({ id, className = 'pd-status' }: { id: ProductId; className?: string }) {
  const t = useTranslations('products');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const product = productById(id);
  if (!product) return null;
  const usd = fromUsd(product);
  const text =
    product.status === 'available'
      ? `${t('status.available')}${usd !== null ? ` · ${t('fromPrice', { price: format(usd) })}` : ''}`
      : product.status === 'launch'
        ? t('status.launch', { date: launchDate(product, locale) ?? '' })
        : product.status === 'soon'
          ? t('status.soon')
          : `${t('status.planned')} · ${t('noPrice')}`;
  return (
    <p className={className} data-status={product.status}>
      <PhaseGlyph phase={STATUS_PHASE[product.status]} size={15} className="pd-status-glyph" />
      <span>{text}</span>
    </p>
  );
}
