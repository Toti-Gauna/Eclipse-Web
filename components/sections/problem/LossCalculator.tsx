'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ChevronDown, MessageCircle } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { Occult } from '@/components/motion/Occult';
import { useIsClient } from '@/components/motion/useIsClient';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useSound } from '@/components/sound/SoundContext';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { localeTags, type Locale } from '@/i18n/routing';
import { l, verticalById, verticals, type VerticalId } from '@/lib/content';
import {
  CALCULATOR_RANGES,
  COUNT_PRESETS,
  DEFAULT_HOURLY_USD,
  WEEKS_PER_MONTH,
  calculatorDefaults,
  clampToRange,
  displayTicket,
  hourlyRateIn,
  lossShares,
  monthlyLoss,
  perYear,
  rateOf,
  stepAmount,
  stepCount,
  ticketBounds,
  ticketPresets,
  ticketUsdFromLocal,
  type CalculatorField,
  type CalculatorValues,
  type CountField,
} from '@/lib/calculator';
import { isApproximate } from '@/lib/currency';
import { formatMoney } from '@/lib/pricing';
import { track } from '@/lib/analytics';
import { InlineSelect } from './InlineSelect';
import { ValueField } from './ValueField';
import { RollingNumber, useInViewOnce } from './RollingNumber';

/** Delay before the aria-live total is updated (announce the final value, not every step). */
const ANNOUNCE_DELAY_MS = 700;
/** Monthly loss (USD) at which the corona behind the reading is at full strength. Purely visual. */
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
  /** The visitor typed / stepped the ticket: show it exactly (defaults show rounded). */
  ticketEdited: boolean;
  /** Bumped when a vertical loads its defaults: the readings "flip". */
  load: number;
}

const fresh = (vertical: VerticalId, load = 0): CalcState => ({
  vertical,
  values: calculatorDefaults(vertical),
  ticketEdited: false,
  load,
});

/**
 * "¿Cuánto te cuesta no tener esto?" — the visitor completes a sentence with their
 * numbers ("Tengo [una clínica]. Cada semana pierdo [10] turnos…") and an instrument
 * readout shows the monthly loss in their currency. All maths in lib/calculator.ts.
 *
 * Layout: header + sentence | readout (lg+); on phones the readout follows the sentence
 * and a sticky mini reading keeps the number on screen while editing.
 */
export function LossCalculator({ header }: { header?: ReactNode }) {
  const t = useTranslations('problem');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { vertical, selectVertical } = useExperience();
  const { play } = useSound();
  const isClient = useIsClient();
  const uid = useId();

  // The calculator follows the vertical chosen anywhere (hero or here).
  const verticalId: VerticalId = vertical ?? 'otro';
  const [state, setState] = useState<CalcState>(() => fresh(verticalId));
  let current = state;
  if (state.vertical !== verticalId) {
    // Adjust state while rendering (React's recommended alternative to an effect).
    current = fresh(verticalId, state.load + 1);
    setState(current);
  }
  const { values } = current;
  const v = verticalById(verticalId) ?? verticals[0];

  // ---- Numbers in the display currency
  const rate = rateOf(currency, rates);
  const ticket = displayTicket(values.ticketUsd, current.ticketEdited, currency, rates);
  const bounds = ticketBounds(currency, rates);
  const hourlyLocal = hourlyRateIn(currency, rates);
  const loss = monthlyLoss({ ...values, ticketUsd: ticket.usd, hourlyUsd: hourlyLocal / rate });
  const shares = lossShares(loss);
  const approx = isApproximate(currency);

  const tag = localeTags[locale];
  const intFmt = useMemo(() => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }), [tag]);
  const decFmt = useMemo(() => new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }), [tag]);
  const pctFmt = useMemo(() => new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 }), [tag]);
  const plural = useMemo(() => new Intl.PluralRules(tag), [tag]);
  const localFmt = useMemo(() => {
    const f = new Intl.NumberFormat(tag, { style: 'currency', currency, currencyDisplay: 'symbol', maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return (n: number) =>
      f
        .formatToParts(n)
        .map((p) => (p.type === 'currency' && currency === 'BRL' ? 'R$' : p.value))
        .join('');
  }, [tag, currency]);
  const symbol = useMemo(
    () =>
      currency === 'BRL'
        ? 'R$'
        : (new Intl.NumberFormat(tag, { style: 'currency', currency, currencyDisplay: 'symbol' }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? '$'),
    [tag, currency],
  );
  const one = (n: number) => (plural.select(n) === 'one' ? 'one' : 'other');
  const unit = (n: number) => t(`unit.${verticalId}.${one(n)}`);
  const hoursUnit = (n: number) => t(`hoursUnit.${one(n)}`);

  const moneyPlain = useCallback((usd: number) => format(usd, { approx: false }), [format]);
  const money = useCallback((usd: number) => format(usd), [format]);

  // ---- Readout motion: count up when it enters the viewport.
  const readoutRef = useRef<HTMLElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  const started = useInViewOnce(readoutRef);
  const miniStarted = useInViewOnce(inputsRef);

  // ---- aria-live: the final total once the visitor stops editing. Silent until the
  // calculator is touched, so load-time changes (stored currency, live rates) aren't read.
  const [live, setLive] = useState(false);
  const announceText = t('resultAnnounce', { amount: moneyPlain(loss.totalUsd) });
  const [announced, setAnnounced] = useState(announceText);
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(announceText), ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [announceText]);

  // ---- Editing
  const [activeField, setActiveField] = useState<CalculatorField>('lostPerWeek');
  // A held −/+ repeats every 75 ms: tick on every other step.
  const tick = (direction: 1 | -1, repeat: number) => {
    if (repeat % 2 === 0) play('tick', { pitch: direction });
  };
  const touch = (input: CalculatorField | 'vertical') => {
    setLive(true);
    trackUsedOnce({ vertical: verticalId, input });
  };

  const setCount = (field: CountField, next: (n: number) => number) => {
    touch(field);
    setState((s) => ({ ...s, values: { ...s.values, [field]: clampToRange(next(s.values[field]), CALCULATOR_RANGES[field]) } }));
  };
  const setTicketLocal = (local: number) => {
    touch('ticketUsd');
    setState((s) => ({ ...s, ticketEdited: true, values: { ...s.values, ticketUsd: ticketUsdFromLocal(local, currency, rates) } }));
  };
  const stepTicket = (direction: 1 | -1, times: number) => {
    touch('ticketUsd');
    setState((s) => {
      let local = displayTicket(s.values.ticketUsd, s.ticketEdited, currency, rates).local;
      for (let i = 0; i < times; i++) local = stepAmount(local, direction);
      return { ...s, ticketEdited: true, values: { ...s.values, ticketUsd: ticketUsdFromLocal(local, currency, rates) } };
    });
  };

  const pickVertical = (id: VerticalId) => {
    touch('vertical');
    play('select');
    setState((s) => fresh(id, s.load + 1));
    selectVertical(id, 'calculator');
  };

  // ---- Presets for the field being edited
  const presetField = activeField;
  const presetValues: number[] =
    presetField === 'ticketUsd' ? ticketPresets(currency, rates).filter((n) => n >= bounds.min && n <= bounds.max) : [...COUNT_PRESETS[presetField]];
  const presetCurrent = presetField === 'ticketUsd' ? ticket.local : values[presetField];
  const presetText = (n: number) =>
    presetField === 'ticketUsd' ? localFmt(n) : presetField === 'hoursPerWeek' ? t('hoursValue', { count: n }) : intFmt.format(n);
  const applyPreset = (n: number) => {
    play('select');
    if (presetField === 'ticketUsd') setTicketLocal(n);
    else setCount(presetField, () => n);
  };

  const lostLabel = l(v.calculator.lostLabel, locale);
  const ticketLabel = l(v.calculator.ticketLabel, locale);
  const hoursLabel = t('hoursLabel');
  const fieldLabel: Record<CalculatorField, string> = { lostPerWeek: lostLabel, ticketUsd: ticketLabel, hoursPerWeek: hoursLabel };

  const ids = {
    inputs: `${uid}-inputs`,
    lost: `${uid}-lost`,
    ticket: `${uid}-ticket`,
    hours: `${uid}-hours`,
    readout: `${uid}-readout`,
    math: `${uid}-math`,
  };
  const flashKey = current.load ? String(current.load) : undefined;

  const verticalOptions = verticals.map((x) => ({ value: x.id, label: t(`verticalOption.${x.id}`) }));
  const sentence = {
    vertical: () => <InlineSelect value={verticalId} options={verticalOptions} onChange={pickVertical} label={t('verticalLegend')} />,
    lost: () => (
      <ValueField
        id={ids.lost}
        label={lostLabel}
        value={values.lostPerWeek}
        display={intFmt.format(values.lostPerWeek)}
        min={CALCULATOR_RANGES.lostPerWeek.min}
        max={CALCULATOR_RANGES.lostPerWeek.max}
        valueText={t('lostValueText', { count: values.lostPerWeek })}
        suffix={unit(values.lostPerWeek)}
        decreaseLabel={t('decrease', { label: lostLabel })}
        increaseLabel={t('increase', { label: lostLabel })}
        onStep={(d, n, repeat) => {
          tick(d, repeat);
          setCount('lostPerWeek', (x) => stepCount(x, d, CALCULATOR_RANGES.lostPerWeek, n));
        }}
        onType={(n) => setCount('lostPerWeek', () => n)}
        onEdge={(edge) => setCount('lostPerWeek', () => CALCULATOR_RANGES.lostPerWeek[edge])}
        onFocusField={() => setActiveField('lostPerWeek')}
        active={activeField === 'lostPerWeek'}
        flashKey={flashKey}
      />
    ),
    ticket: () => (
      <ValueField
        id={ids.ticket}
        label={ticketLabel}
        value={ticket.local}
        display={intFmt.format(ticket.local)}
        min={bounds.min}
        max={bounds.max}
        valueText={t('ticketValueText', { amount: localFmt(ticket.local) })}
        prefix={symbol}
        decreaseLabel={t('decrease', { label: ticketLabel })}
        increaseLabel={t('increase', { label: ticketLabel })}
        onStep={(d, n, repeat) => {
          tick(d, repeat);
          stepTicket(d, n);
        }}
        onType={setTicketLocal}
        onEdge={(edge) => setTicketLocal(bounds[edge])}
        onFocusField={() => setActiveField('ticketUsd')}
        active={activeField === 'ticketUsd'}
        flashKey={flashKey}
      />
    ),
    hours: () => (
      <ValueField
        id={ids.hours}
        label={hoursLabel}
        value={values.hoursPerWeek}
        display={intFmt.format(values.hoursPerWeek)}
        min={CALCULATOR_RANGES.hoursPerWeek.min}
        max={CALCULATOR_RANGES.hoursPerWeek.max}
        valueText={t('hoursValueText', { count: values.hoursPerWeek })}
        suffix={hoursUnit(values.hoursPerWeek)}
        decreaseLabel={t('decrease', { label: hoursLabel })}
        increaseLabel={t('increase', { label: hoursLabel })}
        onStep={(d, n, repeat) => {
          tick(d, repeat);
          setCount('hoursPerWeek', (x) => stepCount(x, d, CALCULATOR_RANGES.hoursPerWeek, n));
        }}
        onType={(n) => setCount('hoursPerWeek', () => n)}
        onEdge={(edge) => setCount('hoursPerWeek', () => CALCULATOR_RANGES.hoursPerWeek[edge])}
        onFocusField={() => setActiveField('hoursPerWeek')}
        active={activeField === 'hoursPerWeek'}
        flashKey={flashKey}
      />
    ),
  };

  // ---- Readout strings
  const verticalName = verticalId === 'otro' ? null : l(v.name, locale);
  const waValues = {
    amount: moneyPlain(loss.totalUsd),
    lost: intFmt.format(values.lostPerWeek),
    unit: unit(values.lostPerWeek),
    hours: intFmt.format(values.hoursPerWeek),
  };
  const waMessage = verticalName ? t('whatsapp', { ...waValues, vertical: verticalName }) : t('whatsappNoVertical', waValues);
  const rateText = currency === 'USD' ? localFmt(hourlyLocal) : `${formatMoney(DEFAULT_HOURLY_USD, 'USD', rates, locale)} ${tc('approxPrefix')} ${localFmt(hourlyLocal)}`;
  const totalText = moneyPlain(loss.totalUsd);
  const glow = 0.3 + 0.7 * Math.min(1, loss.totalUsd / GLOW_FULL_USD);
  const barsArmed = isClient && !started;
  const [mathOpen, setMathOpen] = useState(false);

  const scrollToReadout = () => {
    const el = readoutRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    el.querySelector<HTMLElement>('[data-readout-title]')?.focus({ preventScroll: true });
  };

  return (
    <div className="calc">
      <div className="calc-main">
        {header}
        <div ref={inputsRef} className="calc-inputs" role="group" aria-labelledby={ids.inputs}>
          <h3 id={ids.inputs} className="sr-only">
            {t('inputsTitle')}
          </h3>

          {/* Phones: the reading stays on screen (under the header) while the sentence is edited. */}
          <button type="button" className="calc-mini" onClick={scrollToReadout} aria-label={t('miniJump')}>
            <span className="label calc-mini-label">{t('miniLabel')}</span>
            <span className="calc-mini-value readout">
              {approx ? <span className="calc-approx">{tc('approxPrefix')} </span> : null}
              <RollingNumber value={loss.totalUsd} format={moneyPlain} started={miniStarted} srOnly={false} />
            </span>
            <ArrowDown aria-hidden className="calc-mini-icon" strokeWidth={1.5} />
          </button>

          <p data-reveal className="calc-sentence">
            {t.rich('lead', sentence)} {t.rich(`lost.${verticalId}`, sentence)} {t.rich('hours', sentence)}
          </p>

          <div data-reveal className="calc-presets" role="group" aria-label={t('presetsFor', { label: fieldLabel[presetField] })}>
            <p aria-hidden className="calc-presets-label label">
              <span className="text-accent">{t('presets')}</span>
              <span className="calc-presets-rule" />
              <span key={presetField} className="calc-presets-field">
                {fieldLabel[presetField]}
              </span>
            </p>
            <div key={`${presetField}-${currency}`} className="calc-presets-list">
              {presetValues.map((n) => (
                <button key={n} type="button" aria-pressed={presetCurrent === n} className="calc-chip readout" onClick={() => applyPreset(n)}>
                  {presetText(n)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Occult from="right" start="top 85%" className="calc-readout-frame">
      <aside ref={readoutRef} className="calc-readout ticks" aria-labelledby={ids.readout} style={{ '--glow': glow } as CSSProperties}>
        <div aria-hidden className="calc-glow" />
        <header className="calc-readout-head">
          <h3 id={ids.readout} data-readout-title tabIndex={-1} className="label calc-readout-title">
            <span aria-hidden className="calc-dot" />
            {t('readoutTitle')}
          </h3>
          <p className="label calc-honest">{t('honest')}</p>
        </header>

        <div className="calc-reading">
          <p className="label calc-reading-unit">{t('perMonth')}</p>
          <p aria-hidden className="calc-total readout" style={{ '--chars': (approx ? 1 : 0) + totalText.length } as CSSProperties}>
            {approx ? <span className="calc-approx">{tc('approxPrefix')}</span> : null}
            <RollingNumber value={loss.totalUsd} format={moneyPlain} started={started} srOnly={false} introDuration={1.8} />
          </p>
          <p className="calc-reading-sub readout">
            <span>{t('perYear', { amount: money(perYear(loss.totalUsd)) })}</span>
            {currency !== 'USD' ? <span className="calc-usd">{t('usdRef', { amount: formatMoney(loss.totalUsd, 'USD', rates, locale) })}</span> : null}
          </p>
          <p className="sr-only" aria-live={live ? 'polite' : 'off'} aria-atomic="true">
            {announced}
          </p>
        </div>

        <div className="calc-split" data-armed={barsArmed || undefined}>
          <div aria-hidden className="calc-bar" style={{ '--a': shares.revenue, '--b': shares.time } as CSSProperties}>
            <span className="calc-bar-a" />
            <span className="calc-bar-b" />
          </div>
          <div aria-hidden className="calc-ruler" />
          <dl className="calc-legend">
            <div className="calc-legend-row">
              <dt>
                <span aria-hidden className="calc-swatch calc-swatch--a" />
                {t('lostRevenue')}
              </dt>
              <dd className="readout calc-legend-pct">{pctFmt.format(shares.revenue)}</dd>
              <dd className="readout calc-legend-amount">{money(loss.lostRevenueUsd)}</dd>
            </div>
            <div className="calc-legend-row">
              <dt>
                <span aria-hidden className="calc-swatch calc-swatch--b" />
                {t('timeCost')}
              </dt>
              <dd className="readout calc-legend-pct">{pctFmt.format(shares.time)}</dd>
              <dd className="readout calc-legend-amount">{money(loss.timeCostUsd)}</dd>
            </div>
          </dl>
        </div>

        <div className="calc-math-block">
          <button type="button" className="calc-math-toggle" aria-expanded={mathOpen} aria-controls={ids.math} onClick={() => setMathOpen((o) => !o)}>
            <span>{mathOpen ? t('hideMath') : t('showMath')}</span>
            <ChevronDown aria-hidden className="calc-math-caret" strokeWidth={1.5} />
          </button>
          <div id={ids.math} className="calc-math" hidden={!mathOpen}>
            <p className="calc-math-row readout">
              <span>{t('mathLost', { count: decFmt.format(loss.lostPerMonth), unit: unit(loss.lostPerMonth), ticket: localFmt(ticket.local) })}</span>
              <span aria-hidden className="leader" />
              <span>{money(loss.lostRevenueUsd)}</span>
            </p>
            <p className="calc-math-row readout">
              <span>{t('mathTime', { count: decFmt.format(loss.hoursPerMonth), rate: localFmt(hourlyLocal) })}</span>
              <span aria-hidden className="leader" />
              <span>{money(loss.timeCostUsd)}</span>
            </p>
            <p className="calc-math-row calc-math-total readout">
              <span>{t('mathTotal')}</span>
              <span aria-hidden className="leader" />
              <span>{money(loss.totalUsd)}</span>
            </p>
          </div>
          <p className="calc-assumptions">{t('assumptions', { weeks: decFmt.format(WEEKS_PER_MONTH), rate: rateText })}</p>
        </div>

        <div className="calc-ctas">
          <WhatsAppLink
            message={waMessage}
            origin="calculator"
            extra={{ vertical: verticalId, monthly_loss_usd: Math.round(loss.totalUsd) }}
            className="btn btn-primary calc-cta"
          >
            <MessageCircle aria-hidden className="size-[1.1em] shrink-0" strokeWidth={1.8} />
            {t('cta')}
          </WhatsAppLink>
          <BuildPlanButton source="calculator" className="btn btn-ghost calc-cta">
            {t('ctaPlan')}
          </BuildPlanButton>
        </div>
      </aside>
      </Occult>
    </div>
  );
}
