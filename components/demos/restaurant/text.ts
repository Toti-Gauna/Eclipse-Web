'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useDemoFormat, upperFirst } from '../kit';
import { TONIGHT, dayDate, dishById, itemList, type DishId, type Items, type PersonId } from './data';

/**
 * Names, dishes and money in the current locale (stable per locale + currency).
 * Menu prices are fictional USD amounts shown in the visitor's currency: each dish is
 * converted and rounded once, and totals add the rounded prices, so a ticket always adds up.
 */
export function useRestaurantText() {
  const t = useTranslations('demoRestaurant');
  const fmt = useDemoFormat();
  const { currency, convert } = useCurrency();
  return useMemo(() => {
    const money = new Intl.NumberFormat(fmt.tag, { style: 'currency', currency, currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const cash = (amount: number) =>
      money
        .formatToParts(amount)
        .map((p) => (p.type === 'currency' && currency === 'BRL' ? 'R$' : p.value))
        .join('');
    const list = new Intl.ListFormat(fmt.tag, { type: 'conjunction', style: 'long' });

    /** Price of one dish in the visitor's currency (rounded). */
    const price = (dish: DishId) => convert(dishById(dish).usd);
    /** Sum of the rounded prices. */
    const sum = (items: Items) => itemList(items).reduce((s, [d, n]) => s + price(d) * n, 0);
    const dish = (id: DishId) => t(`dishes.${id}.name`);
    /** Kitchen-ticket name ("Napolitana", "Bife chorizo"). */
    const dishShort = (id: DishId) => t(`dishes.${id}.short`);
    const dishA = (id: DishId) => t(`dishes.${id}.a`);
    const dishN = (id: DishId, count: number) => t(`dishes.${id}.n`, { count });
    const person = (id: PersonId | 'you') => (id === 'you' ? t('people.you') : t(`people.${id}.name`));
    const first = (id: PersonId) => t(`people.${id}.first`);
    /** "2 napolitanas y 1 flan mixto". */
    const spoken = (items: Items) => list.format(itemList(items).map(([d, n]) => dishN(d, n)));
    const names = (ids: DishId[]) => list.format(ids.map(dish));
    const day = (style: 'short' | 'long' = 'long') =>
      upperFirst(fmt.date(new Date(TONIGHT), style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric' }).replace('.', ''));
    const weekday = () => upperFirst(fmt.date(new Date(TONIGHT), { weekday: 'long' }));
    /** Any day of the reservations book: "Sábado 10 de octubre" (long) · "Sáb 10" (short). */
    const dayOf = (d: number, style: 'short' | 'long' = 'long') =>
      upperFirst(fmt.date(dayDate(d), style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric' }).replace('.', ''));
    return { t, fmt, price, sum, cash, money: (usd: number) => cash(convert(usd)), dish, dishShort, dishA, dishN, person, first, spoken, names, day, weekday, dayOf, list };
  }, [t, fmt, currency, convert]);
}

export type RestaurantText = ReturnType<typeof useRestaurantText>;
