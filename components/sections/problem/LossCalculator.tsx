'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useIsClient } from '@/components/motion/useIsClient';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { ContentIcon } from '@/components/ui/Icon';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { localeTags, type Locale } from '@/i18n/routing';
import { l, verticalById, verticals, type VerticalId } from '@/lib/content';
import {
  CALCULATOR_RANGES,
  WEEKS_PER_MONTH,
  calculatorDefaults,
  clampToRange,
  hourlyRateIn,
  lossShares,
  monthlyLoss,
  type CalculatorField,
  type CalculatorValues,
} from '@/lib/calculator';
import { isApproximate } from '@/lib/currency';
import { track } from '@/lib/analytics';
import { CalcSlider } from './CalcSlider';
import { RollingNumber, useInViewOnce } from './RollingNumber';

/** Delay before the aria-live total is updated (announce the final value, not every step). */
const ANNOUNCE_DELAY_MS = 700;
/** Monthly loss (USD) at which the glow behind the total reaches full strength. Purely visual. */
const GLOW_FULL_USD = 3000;
const USED_KEY = 'eclipse:calculator_used';

let usedThisPage = false;

/** `calculator_used`, once per browser session, on the first real interaction. */
function trackUsedOnce(props: { vertical: VerticalId; input: CalculatorField | 'vertical' }) {
  if (usedThisPage) return;
  usedThisPage = true;
  try {
    if (window.sessionStorage.getItem(USED_KEY)) return;
    window.sessionStorage.setItem(USED_KEY, '1');
  } catch {
    // Storage blocked: the in-memory flag still limits it to once per page.
  }
  track('calculator_used', props);
}

interface CalcState {
  vertical: VerticalId;
  values: CalculatorValues;
}

/**
 * "¿Cuánto te cuesta no tener esto?" — vertical + three sliders → estimated monthly loss
 * in the active currency. All amounts are USD internally (lib/calculator.ts).
 */
export function LossCalculator() {
  const t = useTranslations('problem');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { vertical, selectVertical } = useExperience();
  const isClient = useIsClient();
  const uid = useId();

  // The calculator follows the vertical chosen anywhere (hero or here). Without a
  // choice it shows the generic "Otro" defaults and labels.
  const verticalId: VerticalId = vertical ?? 'otro';
  const [state, setState] = useState<CalcState>(() => ({ vertical: verticalId, values: calculatorDefaults(verticalId) }));
  let current = state;
  if (state.vertical !== verticalId) {
    // Adjust state while rendering (React's recommended alternative to an effect):
    // a new vertical loads its defaults.
    current = { vertical: verticalId, values: calculatorDefaults(verticalId) };
    setState(current);
  }
  const { values } = current;
  const v = verticalById(verticalId) ?? verticals[0];

  const loss = monthlyLoss(values);
  const shares = lossShares(loss);

  // Formatters (stable: RollingNumber formats every frame).
  const intFmt = useMemo(() => new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 0 }), [locale]);
  const decFmt = useMemo(() => new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 1 }), [locale]);
  const weeks = decFmt.format(WEEKS_PER_MONTH);
  const count = useCallback((n: number) => intFmt.format(Math.round(n)), [intFmt]);
  /** Monthly volumes keep one decimal (21,5 × ticket) so the breakdown adds up. */
  const countMonthly = useCallback((n: number) => decFmt.format(n), [decFmt]);
  const money = useCallback((usd: number) => format(usd), [format]);
  const moneyPlain = useCallback((usd: number) => format(usd, { approx: false }), [format]);
  const spoken = useCallback(
    (usd: number) => (isApproximate(currency) ? t('approxValueText', { amount: moneyPlain(usd) }) : moneyPlain(usd)),
    [currency, moneyPlain, t],
  );

  // Count-up when the result / breakdown enter the viewport.
  const totalRef = useRef<HTMLDivElement>(null);
  const breakdownRef = useRef<HTMLDListElement>(null);
  const totalIn = useInViewOnce(totalRef);
  const breakdownIn = useInViewOnce(breakdownRef);

  // Hourly value in the active currency, rounded finer than prices so "h × rate" adds up
  // (5 USD = R$ 27; the price rounding would say R$ 30).
  const rate = useMemo(
    () =>
      new Intl.NumberFormat(localeTags[locale], {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(hourlyRateIn(currency, rates)),
    [locale, currency, rates],
  );
  const rateApprox = isApproximate(currency) ? `${tc('approxPrefix')} ${rate}` : rate;

  // aria-live: announce the final total once the visitor stops moving the slider. The region
  // stays silent ("off") until the visitor touches the calculator, so changes on load (stored
  // currency, live exchange rates) or from the hero aren't announced out of context.
  const [live, setLive] = useState(false);
  const announceText = t('resultAnnounce', { amount: moneyPlain(loss.totalUsd) });
  const [announced, setAnnounced] = useState(announceText);
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(announceText), ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [announceText]);

  const pickVertical = (id: VerticalId) => {
    setLive(true);
    setState({ vertical: id, values: calculatorDefaults(id) });
    selectVertical(id, 'calculator');
    trackUsedOnce({ vertical: id, input: 'vertical' });
  };

  const setField = (field: CalculatorField, raw: number) => {
    const next = clampToRange(raw, CALCULATOR_RANGES[field]);
    setLive(true);
    setState((s) => ({ ...s, values: { ...s.values, [field]: next } }));
    trackUsedOnce({ vertical: verticalId, input: field });
  };

  const verticalName = verticalId === 'otro' ? null : l(v.name, locale);
  const waMessage = verticalName
    ? t('whatsapp', { amount: moneyPlain(loss.totalUsd), vertical: verticalName })
    : t('whatsappNoVertical', { amount: moneyPlain(loss.totalUsd) });
  const pain = l(v.pain, locale) ?? t('painFallback');
  const glow = 0.35 + 0.65 * Math.min(1, loss.totalUsd / GLOW_FULL_USD);
  // Bars snap to 0 after hydration and grow when the breakdown enters (SSR/no-JS: full).
  const barsArmed = isClient && !breakdownIn;

  const ids = {
    lost: `${uid}-lost`,
    ticket: `${uid}-ticket`,
    hours: `${uid}-hours`,
    inputs: `${uid}-inputs`,
    result: `${uid}-result`,
  };

  return (
    <div data-reveal className="calc glass relative overflow-hidden rounded-card-lg p-5 sm:p-8 lg:p-10">
      <div aria-hidden className="calc-sheen pointer-events-none absolute inset-x-0 top-0 h-px" />

      {/* Mobile: one column (chips → total → sliders → breakdown → CTA) via display:contents + order.
          Desktop: inputs | result. */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
        {/* ---------------------------------------------------------------- inputs */}
        <div className="contents lg:flex lg:flex-col lg:gap-8 lg:py-2">
          <div data-reveal className="order-1">
            <h3 id={ids.inputs} className="sr-only">
              {t('inputsTitle')}
            </h3>
            <fieldset>
              <legend className="eyebrow mb-3">{t('verticalLegend')}</legend>
              <div className="flex flex-wrap gap-2">
                {verticals.map((option) => {
                  const checked = option.id === verticalId;
                  return (
                    <label
                      key={option.id}
                      className={`inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border px-4 text-sm transition-[background-color,border-color,color,box-shadow] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)] ${
                        checked
                          ? 'border-corona bg-corona text-void shadow-[0_0_30px_-6px_rgb(245_185_66/0.8)]'
                          : 'border-line-strong bg-surface text-fg hover:border-corona hover:shadow-[0_0_24px_-8px_rgb(245_185_66/0.7)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${uid}-vertical`}
                        value={option.id}
                        checked={checked}
                        onChange={() => pickVertical(option.id)}
                        className="sr-only"
                      />
                      <ContentIcon name={option.icon} className={`size-4 ${checked ? '' : 'text-corona'}`} />
                      {l(option.name, locale)}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-6 flex items-baseline gap-3">
              <span aria-hidden className="h-px w-6 shrink-0 translate-y-[-0.3em] bg-corona" />
              <span>
                <span className="eyebrow block">{t('painLabel')}</span>
                <span key={verticalId} className="calc-swap mt-1.5 block font-serif text-[1.45rem] italic leading-tight text-fg sm:text-2xl">
                  {pain}
                </span>
              </span>
            </p>
          </div>

          <div data-reveal className="order-3 flex flex-col gap-7 lg:flex-1 lg:justify-evenly" role="group" aria-labelledby={ids.inputs}>
            <CalcSlider
              id={ids.lost}
              label={l(v.calculator.lostLabel, locale)}
              value={values.lostPerWeek}
              range={CALCULATOR_RANGES.lostPerWeek}
              display={count(values.lostPerWeek)}
              valueText={t('lostValueText', { count: values.lostPerWeek })}
              minLabel={count(CALCULATOR_RANGES.lostPerWeek.min)}
              maxLabel={count(CALCULATOR_RANGES.lostPerWeek.max)}
              onChange={(n) => setField('lostPerWeek', n)}
            />
            <CalcSlider
              id={ids.ticket}
              label={l(v.calculator.ticketLabel, locale)}
              value={values.ticketUsd}
              range={CALCULATOR_RANGES.ticketUsd}
              display={money(values.ticketUsd)}
              valueText={spoken(values.ticketUsd)}
              minLabel={money(CALCULATOR_RANGES.ticketUsd.min)}
              maxLabel={money(CALCULATOR_RANGES.ticketUsd.max)}
              onChange={(n) => setField('ticketUsd', n)}
            />
            <CalcSlider
              id={ids.hours}
              label={t('hoursLabel')}
              value={values.hoursPerWeek}
              range={CALCULATOR_RANGES.hoursPerWeek}
              display={t('hoursValue', { count: values.hoursPerWeek })}
              valueText={t('hoursValueText', { count: values.hoursPerWeek })}
              minLabel={t('hoursValue', { count: CALCULATOR_RANGES.hoursPerWeek.min })}
              maxLabel={t('hoursValue', { count: CALCULATOR_RANGES.hoursPerWeek.max })}
              onChange={(n) => setField('hoursPerWeek', n)}
            />
          </div>
        </div>

        {/* ---------------------------------------------------------------- result */}
        <div className="contents lg:flex lg:flex-col lg:gap-8 lg:rounded-card lg:border lg:border-line lg:bg-void/45 lg:p-8 xl:p-10">
          <div
            ref={totalRef}
            data-reveal
            className="calc-total relative order-2 isolate overflow-hidden rounded-card border border-line bg-void/45 px-5 py-7 @container sm:px-7 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
          >
            <div aria-hidden className="calc-glow" style={{ opacity: glow }} />
            <h3 id={ids.result} className="eyebrow flex items-center gap-2">
              <span aria-hidden className="calc-dot" />
              {t('resultTitle')}
            </h3>
            <div aria-hidden className="mt-5">
              <p className="text-base text-fg-muted sm:text-lg">{t('resultLead')}</p>
              <p className="display calc-total-number mt-1 whitespace-nowrap">
                <span className="calc-approx">{tc('approxPrefix')}</span>{' '}
                <RollingNumber value={loss.totalUsd} format={moneyPlain} started={totalIn} srOnly={false} introDuration={1.8} />
              </p>
              <p className="mt-1 font-serif text-2xl italic text-fg-muted">{t('resultTail')}</p>
            </div>
            <p className="sr-only" aria-live={live ? 'polite' : 'off'} aria-atomic="true">
              {announced}
            </p>
          </div>

          <div data-reveal className="order-4">
            <h4 className="sr-only">{t('breakdown')}</h4>
            <dl ref={breakdownRef} data-armed={barsArmed ? '' : undefined} className="calc-breakdown grid gap-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
                <dt className="text-[0.95rem] text-fg">{t('lostRevenue')}</dt>
                <dd className="font-serif text-2xl leading-none text-fg sm:text-[1.75rem]">
                  <RollingNumber value={loss.lostRevenueUsd} format={money} started={breakdownIn} />
                </dd>
                <dd className="col-span-2 mt-1.5 text-sm text-fg-muted">
                  {t.rich('lostDetail', {
                    count: loss.lostPerMonth,
                    ticket: moneyPlain(values.ticketUsd),
                    n: () => <RollingNumber value={loss.lostPerMonth} format={countMonthly} started={breakdownIn} className="text-fg" />,
                  })}
                </dd>
                <dd aria-hidden className="col-span-2 mt-3">
                  <span className="calc-bar-track">
                    <span className="calc-bar" style={{ '--share': shares.revenue } as CSSProperties} />
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
                <dt className="text-[0.95rem] text-fg">{t('timeCost')}</dt>
                <dd className="font-serif text-2xl leading-none text-fg sm:text-[1.75rem]">
                  <RollingNumber value={loss.timeCostUsd} format={money} started={breakdownIn} />
                </dd>
                <dd className="col-span-2 mt-1.5 text-sm text-fg-muted">
                  {t.rich('timeDetail', {
                    count: loss.hoursPerMonth,
                    rate,
                    n: () => <RollingNumber value={loss.hoursPerMonth} format={countMonthly} started={breakdownIn} className="text-fg" />,
                  })}
                </dd>
                <dd aria-hidden className="col-span-2 mt-3">
                  <span className="calc-bar-track">
                    <span className="calc-bar calc-bar--soft" style={{ '--share': shares.time } as CSSProperties} />
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div data-reveal className="order-5 lg:mt-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WhatsAppLink
                message={waMessage}
                origin="calculator"
                extra={{ vertical: verticalId, monthly_loss_usd: Math.round(loss.totalUsd) }}
                className="btn btn-primary calc-cta sm:flex-auto"
              >
                <MessageCircle aria-hidden className="size-[1.1em] shrink-0" strokeWidth={1.8} />
                {t('cta')}
              </WhatsAppLink>
              <BuildPlanButton source="calculator" className="btn btn-ghost calc-cta sm:flex-auto">
                {t('ctaPlan')}
              </BuildPlanButton>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">{t('note', { weeks, rate: rateApprox })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
