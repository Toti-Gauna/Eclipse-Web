'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ChevronDown, MessageCircle } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { Occult } from '@/components/motion/Occult';
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
  outOfRange,
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
  type RangeEdge,
} from '@/lib/calculator';
import { isApproximate } from '@/lib/currency';
import { formatMoney } from '@/lib/pricing';
import { track } from '@/lib/analytics';
import { InlineSelect } from './InlineSelect';
import { ValueField } from './ValueField';
import { RollingNumber, useInView, useInViewOnce, useScrolledPast } from './RollingNumber';

/** Delay before the aria-live total is updated (announce the final value, not every step). */
const ANNOUNCE_DELAY_MS = 700;
/** Monthly loss (USD) at which the warm light behind the reading is at full strength. Purely visual. */
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
 * numbers ("Tengo [✎ una clínica ⌄]. Cada semana pierdo [10] turnos…") and the readout
 * shows the estimated loss per month and per year, both as large readings in their
 * currency (the USD reference smaller). Right under them, "De dónde sale" compares lost
 * revenue vs. team time to scale (bar + amounts + shares); "Ver la cuenta" unfolds each
 * part's exact arithmetic, the totals and the assumptions. All maths in lib/calculator.ts;
 * the result is labelled as an estimate with the visitor's numbers — no invented figure.
 *
 * The business is a native <select> styled as an editable field (InlineSelect "field"):
 * every vertical in content/verticals.json, "Otro" included with its own generic
 * defaults. No free text: a typed business would only relabel "Otro" and could read as
 * tailored assumptions we don't have. Changing it loads that business's defaults and the
 * rest of the sentence ("lost.{vertical}") — the formula never changes.
 *
 * Layout: header + sentence | readout (lg+); on phones the readout follows the sentence
 * and a light sticky mini reading keeps the number on screen while the full one is out
 * of view (typing with the keyboard open, mostly).
 */
export function LossCalculator({ header }: { header?: ReactNode }) {
  const t = useTranslations('problem');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { vertical, selectVertical } = useExperience();
  const { play } = useSound();
  const uid = useId();

  // The calculator follows the vertical chosen anywhere (hero, demos or here).
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
  const totalRef = useRef<HTMLParagraphElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const started = useInViewOnce(readoutRef);
  const miniStarted = useInViewOnce(inputsRef);
  // Phones: the mini reading only shows while the sentence is being read (its top has
  // scrolled away) and the full reading is off screen — never the same number twice.
  const totalOnScreen = useInView(totalRef);
  const intoSentence = useScrolledPast(sentinelRef);

  // ---- aria-live: the final total once the visitor stops editing. Silent until the
  // calculator is touched, so load-time changes (stored currency, live rates) aren't read.
  const [live, setLive] = useState(false);
  const yearUsd = perYear(loss.totalUsd);
  const announceText = t('resultAnnounceYear', { amount: moneyPlain(loss.totalUsd), year: moneyPlain(yearUsd) });
  const [announced, setAnnounced] = useState(announceText);
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(announceText), ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [announceText]);

  // ---- Editing
  const [activeField, setActiveField] = useState<CalculatorField>('lostPerWeek');
  /** A typed value outside the accepted range: said right under the sentence, next to the presets. */
  const [rangeNote, setRangeNote] = useState<{ field: CalculatorField; edge: RangeEdge } | null>(null);
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
  const noteRange = (field: CalculatorField, edge: RangeEdge | null) => {
    if (edge && !rangeNote) play('error');
    setRangeNote(edge ? { field, edge } : null);
  };
  const typeCount = (field: CountField, n: number) => {
    noteRange(field, outOfRange(n, CALCULATOR_RANGES[field]));
    setCount(field, () => n);
  };
  const typeTicket = (n: number) => {
    noteRange('ticketUsd', outOfRange(n, bounds));
    setTicketLocal(n);
  };
  const focusField = (field: CalculatorField) => {
    setActiveField(field);
    setRangeNote((r) => (r && r.field !== field ? null : r));
  };

  const pickVertical = (id: VerticalId) => {
    touch('vertical');
    play('select');
    setRangeNote(null);
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
    setRangeNote(null);
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
    range: `${uid}-range`,
    verticalHint: `${uid}-vertical-hint`,
    split: `${uid}-split`,
  };
  const flashKey = current.load ? String(current.load) : undefined;
  const describedBy = (field: CalculatorField) => (rangeNote?.field === field ? ids.range : undefined);

  // The limit, as the visitor typed it: a count, or an amount in the display currency.
  const rangeText = (() => {
    if (!rangeNote) return '';
    const limit =
      rangeNote.field === 'ticketUsd'
        ? localFmt(bounds[rangeNote.edge])
        : intFmt.format(CALCULATOR_RANGES[rangeNote.field][rangeNote.edge]);
    return t(rangeNote.edge === 'max' ? 'rangeMax' : 'rangeMin', { value: limit });
  })();

  const verticalOptions = verticals.map((x) => ({ value: x.id, label: t(`verticalOption.${x.id}`) }));
  const sentence = {
    vertical: () => (
      <InlineSelect
        value={verticalId}
        options={verticalOptions}
        onChange={pickVertical}
        label={t('verticalLegend')}
        describedBy={ids.verticalHint}
        className="calc-isel"
      />
    ),
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
          setRangeNote(null);
          setCount('lostPerWeek', (x) => stepCount(x, d, CALCULATOR_RANGES.lostPerWeek, n));
        }}
        onType={(n) => typeCount('lostPerWeek', n)}
        onEdge={(edge) => setCount('lostPerWeek', () => CALCULATOR_RANGES.lostPerWeek[edge])}
        onFocusField={() => focusField('lostPerWeek')}
        active={activeField === 'lostPerWeek'}
        flashKey={flashKey}
        describedBy={describedBy('lostPerWeek')}
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
          setRangeNote(null);
          stepTicket(d, n);
        }}
        onType={typeTicket}
        onEdge={(edge) => setTicketLocal(bounds[edge])}
        onFocusField={() => focusField('ticketUsd')}
        active={activeField === 'ticketUsd'}
        flashKey={flashKey}
        describedBy={describedBy('ticketUsd')}
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
          setRangeNote(null);
          setCount('hoursPerWeek', (x) => stepCount(x, d, CALCULATOR_RANGES.hoursPerWeek, n));
        }}
        onType={(n) => typeCount('hoursPerWeek', n)}
        onEdge={(edge) => setCount('hoursPerWeek', () => CALCULATOR_RANGES.hoursPerWeek[edge])}
        onFocusField={() => focusField('hoursPerWeek')}
        active={activeField === 'hoursPerWeek'}
        flashKey={flashKey}
        describedBy={describedBy('hoursPerWeek')}
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
  const yearText = moneyPlain(yearUsd);
  const glow = 0.35 + 0.65 * Math.min(1, loss.totalUsd / GLOW_FULL_USD);
  const [mathOpen, setMathOpen] = useState(false);
  const miniIdle = totalOnScreen || !intoSentence;

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

          {/* Phones: a zero-height sticky rail under the header carries the reading while the
              full one is out of view; it takes no room in the sentence. */}
          <span ref={sentinelRef} aria-hidden className="calc-mini-sentinel" />
          <div className="calc-mini-rail">
            <button
              type="button"
              className="calc-mini"
              onClick={scrollToReadout}
              aria-label={t('miniJump')}
              data-idle={miniIdle || undefined}
              aria-hidden={miniIdle || undefined}
              tabIndex={miniIdle ? -1 : undefined}
            >
              <span className="label calc-mini-label">{t('miniLabel')}</span>
              <span className="calc-mini-value readout">
                {approx ? <span className="calc-approx">{tc('approxPrefix')} </span> : null}
                <RollingNumber value={loss.totalUsd} format={moneyPlain} started={miniStarted} srOnly={false} />
              </span>
              <ArrowDown aria-hidden className="calc-mini-icon" strokeWidth={1.5} />
            </button>
          </div>

          <p data-reveal className="calc-sentence">
            {t.rich('lead', sentence)} {t.rich(`lost.${verticalId}`, sentence)} {t.rich('hours', sentence)}
          </p>
          <p id={ids.verticalHint} className="sr-only">
            {t('verticalHint')}
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
          <p id={ids.range} role="status" className="calc-range">
            {rangeText}
          </p>
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
            <p className="calc-honest">{t('honest')}</p>
          </header>

          {/* The two readings that matter, both large: per month, then per year (× 12). */}
          <div className="calc-reading">
            <div className="calc-reading-row">
              <p className="label calc-reading-unit">{t('perMonth')}</p>
              <p ref={totalRef} aria-hidden className="calc-total readout" style={{ '--chars': (approx ? 1 : 0) + totalText.length } as CSSProperties}>
                {approx ? <span className="calc-approx">{tc('approxPrefix')}</span> : null}
                <RollingNumber value={loss.totalUsd} format={moneyPlain} started={started} srOnly={false} introDuration={1.8} />
              </p>
            </div>
            <div className="calc-reading-row calc-reading-row--year">
              <p className="label calc-reading-unit">{t('perYearLabel')}</p>
              <p aria-hidden className="calc-year readout" style={{ '--chars': (approx ? 1 : 0) + yearText.length } as CSSProperties}>
                {approx ? <span className="calc-approx">{tc('approxPrefix')}</span> : null}
                <RollingNumber value={yearUsd} format={moneyPlain} started={started} srOnly={false} introDuration={2.1} />
              </p>
            </div>
            {currency !== 'USD' ? (
              <p className="calc-reading-sub readout">
                <span className="calc-usd">{t('usdRef', { amount: formatMoney(loss.totalUsd, 'USD', rates, locale) })}</span>
              </p>
            ) : null}
            <p className="sr-only" aria-live={live ? 'polite' : 'off'} aria-atomic="true">
              {announced}
            </p>
          </div>

          {/* Where it comes from: lost revenue (solid) vs. team time (hatched), to scale. */}
          <div className="calc-split" role="group" aria-labelledby={ids.split} data-on={started || undefined}>
            <p id={ids.split} className="label calc-split-title">
              {t('splitTitle')}
            </p>
            <div aria-hidden className="calc-bar" style={{ '--a': shares.revenue, '--b': shares.time } as CSSProperties}>
              <span className="calc-bar-a" />
              <span className="calc-bar-b" />
            </div>
            <div aria-hidden className="calc-ruler" />
            <dl className="calc-break">
              <div className="calc-break-row">
                <dt className="calc-break-name">
                  <span aria-hidden className="calc-swatch calc-swatch--a" />
                  <span>{t('lostRevenue')}</span>
                  <span aria-hidden className="leader" />
                </dt>
                <dd className="calc-break-amount readout">
                  {money(loss.lostRevenueUsd)}
                  <span className="calc-break-pct"> · {pctFmt.format(shares.revenue)}</span>
                </dd>
              </div>
              <div className="calc-break-row">
                <dt className="calc-break-name">
                  <span aria-hidden className="calc-swatch calc-swatch--b" />
                  <span>{t('timeCost')}</span>
                  <span aria-hidden className="leader" />
                </dt>
                <dd className="calc-break-amount readout">
                  {money(loss.timeCostUsd)}
                  <span className="calc-break-pct"> · {pctFmt.format(shares.time)}</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="calc-math-block">
            <button
              type="button"
              className="calc-math-toggle"
              aria-expanded={mathOpen}
              aria-controls={ids.math}
              onClick={() => {
                play('toggle');
                setMathOpen((o) => !o);
              }}
            >
              <span>{mathOpen ? t('hideMath') : t('showMath')}</span>
              <ChevronDown aria-hidden className="calc-math-caret" strokeWidth={1.5} />
            </button>
            {/* The exact arithmetic of each part, the totals and the assumptions. */}
            <div id={ids.math} className="calc-math" hidden={!mathOpen}>
              <dl className="calc-math-lines">
                <div className="calc-math-line">
                  <dt>{t('lostRevenue')}</dt>
                  <dd className="readout">
                    {t('mathLost', { count: decFmt.format(loss.lostPerMonth), unit: unit(loss.lostPerMonth), ticket: localFmt(ticket.local) })}
                    {' = '}
                    <span className="calc-math-result">{money(loss.lostRevenueUsd)}</span>
                  </dd>
                </div>
                <div className="calc-math-line">
                  <dt>{t('timeCost')}</dt>
                  <dd className="readout">
                    {t('mathTime', { count: decFmt.format(loss.hoursPerMonth), rate: localFmt(hourlyLocal) })}
                    {' = '}
                    <span className="calc-math-result">{money(loss.timeCostUsd)}</span>
                  </dd>
                </div>
              </dl>
              <p className="calc-math-total">
                <span>{t('mathTotal')}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{money(loss.totalUsd)}</span>
              </p>
              <p className="calc-math-total calc-math-total--year">
                <span>{t('mathYear')}</span>
                <span aria-hidden className="leader" />
                <span className="readout">{money(yearUsd)}</span>
              </p>
              <p className="calc-assumptions">{t('assumptions', { weeks: decFmt.format(WEEKS_PER_MONTH), rate: rateText })}</p>
            </div>
          </div>

          <div className="calc-ctas">
            <WhatsAppLink
              message={waMessage}
              origin="calculator"
              extra={{ vertical: verticalId, monthly_loss_usd: Math.round(loss.totalUsd) }}
              className="btn btn-primary calc-cta"
              data-page-cta
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
