/**
 * Builds the WhatsApp message for a plan card ("Lo quiero") or the plan builder
 * ("Enviar mi plan por WhatsApp"). Pure: the caller passes a translator for the
 * `planMessage` namespace, so the same function is unit-tested and used in every locale.
 *
 * Example (es, ARS):
 *   Hola Eclipse. Armé mi plan en la web:
 *   • Pack lanzamiento — desde ≈ $ 1.015.000 (USD 700)
 *   • Chatbot IA (WhatsApp o web) (complemento) — ≈ $ 363.000 (USD 250)
 *   Implementación estimada: ≈ $ 1.378.000 (USD 950)
 *   Anticipo 50%: … · Saldo: …
 *   Plan mensual Automatización e IA: ≈ $ 218.000/mes (USD 150)
 *   Meses 1 a 3 desde la publicación: USD 120/mes; desde el mes 4: USD 150/mes
 *   Rubro: Clínicas
 *   Idioma: Español · Moneda: ARS
 */
import { annualMonthsCharged, type Rates } from '@/lib/content';
import type { Currency } from '@/lib/currency';
import { formatMoney, type Billing, type Quote } from '@/lib/pricing';
import type { Locale } from '@/i18n/routing';

export type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface PlanMessageInput {
  source: 'card' | 'builder';
  locale: Locale;
  currency: Currency;
  rates: Pick<Rates, 'ARS' | 'BRL'>;
  quote: Quote;
  /** Localized names, keyed by line id (plan id or item id). */
  names: Record<string, string>;
  /** Localized maintenance plan name, if any. */
  maintenanceName?: string | null;
  /** Localized labels of the offers applied (or opted into). */
  offers?: string[];
  /** Localized vertical name, if the visitor chose one. */
  verticalName?: string | null;
  /** Localized language name (e.g. "Español"). */
  languageName: string;
}

export function buildPlanMessage(input: PlanMessageInput, t: Translate): string {
  const { locale, currency, rates, quote, names } = input;
  const money = (usd: number) => {
    const local = formatMoney(usd, currency, rates, locale);
    if (currency === 'USD') return local;
    return `${local} ${t('usdRef', { amount: formatMoney(usd, 'USD', rates, locale) })}`;
  };
  const period = (billing: Billing) => (billing === 'annual' ? t('perYear') : t('perMonth'));

  const lines: string[] = [t(input.source === 'card' ? 'introCard' : 'introBuilder')];

  for (const line of quote.lines) {
    const name = names[line.id] ?? line.id;
    if (line.kind === 'plan') {
      lines.push(`• ${t('planLine', { name, price: money(line.priceUsd) })}`);
    } else {
      const tag = line.addon ? ` ${t('addonTag')}` : '';
      lines.push(`• ${t('itemLine', { name: `${name}${tag}`, price: money(line.priceUsd) })}`);
    }
  }

  if (quote.plan && quote.rangeUsd && quote.rangeUsd.to > quote.rangeUsd.from) {
    lines.push(t('totalRange', { from: money(quote.rangeUsd.from), to: money(quote.rangeUsd.to) }));
  } else {
    lines.push(t('total', { price: money(quote.subtotalUsd) }));
  }
  if (quote.totalUsd < quote.subtotalUsd) {
    lines.push(t('totalWithOffers', { price: money(quote.totalUsd) }));
  }
  if (quote.totalUsd > 0) {
    lines.push(t('split', { deposit: money(quote.depositUsd), balance: money(quote.balanceUsd) }));
  }
  for (const p of quote.pending) {
    lines.push(`• ${t('pendingLine', { name: names[p.id] ?? p.id, from: money(p.fromUsd), to: money(p.toUsd) })}`);
  }

  const m = quote.maintenance;
  if (m.plan && input.maintenanceName) {
    lines.push(
      t(m.billing === 'annual' ? 'maintenanceAnnual' : 'maintenance', {
        name: input.maintenanceName,
        price: `${money(m.periodUsd)}`,
        period: period(m.billing),
        months: 12 - annualMonthsCharged,
      }),
    );
  } else {
    lines.push(t('maintenanceNone'));
  }
  if (m.plan && m.intro) {
    lines.push(t('careIntro', { months: m.intro.months, intro: money(m.intro.monthlyUsd), regular: money(m.monthlyUsd), next: m.intro.months + 1 }));
  }
  lines.push(t('proposal'));

  if (input.offers?.length) lines.push(t('offers', { list: input.offers.join(', ') }));
  if (input.verticalName) lines.push(t('vertical', { name: input.verticalName }));
  lines.push(t('localeCurrency', { language: input.languageName, currency }));

  return lines.join('\n');
}
