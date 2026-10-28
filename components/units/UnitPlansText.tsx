'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { l, levelById, type LevelId } from '@/lib/content';
import type { Locale } from '@/i18n/routing';

/**
 * «En Roofy, <unit> llega con <level>, desde <price>/mes»: the level's name and price come from
 * content/levels.json (never written in a component), the price in the visitor's currency.
 */
export function UnitPlansText({ unit, level }: { unit: 'academy' | 'intelligence'; level: LevelId }) {
  const t = useTranslations(`units.${unit}`);
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const lv = levelById(level);
  if (!lv) return null;
  return <p>{t('plans', { level: l(lv.name, locale), price: format(lv.priceUsd) })}</p>;
}
