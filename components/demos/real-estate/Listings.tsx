'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, RotateCcw, Sparkles } from 'lucide-react';
import {
  BED_FILTERS,
  DEFAULT_FILTERS,
  LISTINGS,
  PRICE_STOPS,
  TYPE_FILTERS,
  filterListings,
  listingById,
  type Filters,
  type Listing,
  type Op,
} from './data';
import { useEstate, useFmt } from './context';
import { Thumb } from './Thumb';
import { Card, RollingNumber, Specs } from './ui';

const OPS: Op[] = ['sale', 'rent'];

/* ------------------------------------------------------------------ */
/* Filter controls                                                      */
/* ------------------------------------------------------------------ */
function OpSwitch({ filters, onChange, className = '' }: { filters: Filters; onChange: (f: Filters) => void; className?: string }) {
  const t = useTranslations('demoRealEstate');
  return (
    <div role="group" aria-label={t('filters.op')} className={`re-seg grid grid-cols-2 gap-[0.25em] rounded-full bg-black/[0.05] p-[0.25em] ${className}`}>
      {OPS.map((op) => {
        const on = filters.op === op;
        const count = LISTINGS.filter((l) => l.op === op).length;
        return (
          <button
            key={op}
            type="button"
            aria-pressed={on}
            onClick={() => onChange({ ...filters, op })}
            className={`flex items-center justify-center gap-[0.4em] rounded-full px-[0.8em] py-[0.45em] text-[0.78em] font-semibold ${
              on ? 'bg-white text-[var(--demo-ink)] shadow-[0_0.1em_0.4em_rgb(21_21_27/0.12)]' : 'text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
            }`}
          >
            {t(`ops.${op}`)}
            <span className={`tabular text-[0.85em] font-medium ${on ? 'text-[var(--re-accent-ink)]' : ''}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function Chips<T extends string | number>({
  label,
  options,
  value,
  onPick,
  render,
  className = '',
}: {
  label: string;
  options: T[];
  value: T;
  onPick: (v: T) => void;
  render: (v: T) => string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`no-scrollbar flex gap-[0.3em] overflow-x-auto ${className}`}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={String(o)}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(o)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-[0.75em] py-[0.36em] text-[0.72em] font-medium transition-colors ${
              on ? 'border-[var(--demo-ink)] bg-[var(--demo-ink)] text-white' : 'border-[var(--demo-line)] bg-white text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
            }`}
          >
            {render(o)}
          </button>
        );
      })}
    </div>
  );
}

function PriceSlider({ filters, onChange, className = '' }: { filters: Filters; onChange: (f: Filters) => void; className?: string }) {
  const t = useTranslations('demoRealEstate.filters');
  const fmt = useFmt();
  const id = useId();
  const stops = PRICE_STOPS[filters.op];
  const max = stops[filters.price];
  const text = max === null ? t('noLimit') : t('upTo', { price: fmt.price(filters.op, max) });
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-[0.6em]">
        <label htmlFor={id} className="text-[0.7em] font-medium text-[var(--demo-muted)]">
          {t('price')}
        </label>
        <span aria-hidden className="tabular truncate text-[0.74em] font-semibold">
          {text}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={stops.length - 1}
        step={1}
        value={filters.price}
        aria-valuetext={text}
        onChange={(e) => onChange({ ...filters, price: Number(e.target.value) })}
        className="re-range mt-[0.15em]"
        style={{ '--re-fill': `${(filters.price / (stops.length - 1)) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

function useFilterState() {
  const { focus } = useEstate();
  // Opened from the chat's "see listing": show that listing's operation, unfiltered.
  const [filters, setFilters] = useState<Filters>(() => (focus ? { ...DEFAULT_FILTERS, op: listingById(focus).op } : DEFAULT_FILTERS));
  const [version, setVersion] = useState(0);
  const update = (f: Filters) => {
    setFilters(f);
    setVersion((v) => v + 1);
  };
  const dirty = filters.type !== 'all' || filters.beds !== 0 || filters.price !== PRICE_STOPS[filters.op].length - 1;
  const clear = () => update({ ...DEFAULT_FILTERS, op: filters.op });
  return { filters, update, dirty, clear, version, results: filterListings(filters) };
}

function ResultsCount({ count, className = '' }: { count: number; className?: string }) {
  const t = useTranslations('demoRealEstate.filters');
  return (
    <p aria-live="polite" aria-atomic="true" className={`text-[0.8em] font-semibold ${className}`}>
      {t('results', { count })}
    </p>
  );
}

function ClearButton({ onClear }: { onClear: () => void }) {
  const t = useTranslations('demoRealEstate.filters');
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex shrink-0 items-center gap-[0.35em] rounded-full px-[0.6em] py-[0.3em] text-[0.7em] font-semibold text-[var(--re-accent-ink)] hover:bg-[var(--demo-accent-soft)]"
    >
      <RotateCcw aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
      {t('clear')}
    </button>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  const t = useTranslations('demoRealEstate.filters');
  return (
    <div className="re-pop flex flex-col items-center gap-[0.5em] rounded-[1em] border border-dashed border-[var(--demo-line)] px-[1em] py-[1.6em] text-center">
      <p className="text-[0.8em] text-[var(--demo-muted)]">{t('empty')}</p>
      <ClearButton onClear={onClear} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Listing cards                                                        */
/* ------------------------------------------------------------------ */
function useListingText() {
  const t = useTranslations('demoRealEstate');
  const fmt = useFmt();
  return (l: Listing) => ({
    title: t('listing.title', { type: t(`types.${l.type}`), zone: t(`zones.${l.zone}`) }),
    price: fmt.price(l.op, l.price),
    features: l.features.map((f) => t(`features.${f}`)),
  });
}

/** Recommended by the agent in the live chat (+1 inquiry each). */
function useRecommended() {
  const { chat } = useEstate();
  return chat.recommended ?? [];
}

function Badges({ listing, recommended, short = false }: { listing: Listing; recommended: boolean; short?: boolean }) {
  const t = useTranslations('demoRealEstate');
  const name = t('people.liveFirst');
  return (
    <span className="absolute left-[0.45em] top-[0.45em] flex flex-wrap gap-[0.3em]">
      {recommended ? (
        <span className="re-pop inline-flex items-center gap-[0.25em] whitespace-nowrap rounded-full bg-[var(--demo-accent)] px-[0.5em] py-[0.15em] text-[0.58em] font-semibold text-white shadow-[0_0.2em_0.6em_-0.2em_rgb(21_21_27/0.5)]">
          <Sparkles aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
          {short ? (
            <>
              {t('listing.recommendedShort')}
              <span className="sr-only"> {t('listing.recommended', { name })}</span>
            </>
          ) : (
            t('listing.recommended', { name })
          )}
        </span>
      ) : listing.isNew ? (
        <span className="rounded-full bg-white/95 px-[0.5em] py-[0.15em] text-[0.58em] font-semibold text-[var(--demo-ink)] shadow-[0_0.2em_0.6em_-0.3em_rgb(21_21_27/0.4)]">
          {t('listing.new')}
        </span>
      ) : null}
    </span>
  );
}

function PhoneCard({ listing, index, focused }: { listing: Listing; index: number; focused: boolean }) {
  const text = useListingText()(listing);
  const recommended = useRecommended().includes(listing.id);
  return (
    <li
      data-listing={listing.id}
      style={{ '--i': index } as React.CSSProperties}
      className={`re-listing demo-card flex overflow-hidden rounded-[0.95em] ${focused ? 're-focus' : 're-card-in'}`}
    >
      <div className="relative w-[8.2em] shrink-0 overflow-hidden">
        <Thumb listing={listing} className="absolute inset-0 h-full w-full" />
        <Badges listing={listing} recommended={recommended} short />
      </div>
      <div className="min-w-0 flex-1 px-[0.7em] py-[0.6em]">
        <p className="tabular text-[0.98em] font-semibold tracking-[-0.01em]">{text.price}</p>
        <p className="mt-[0.1em] truncate text-[0.72em] font-medium">{text.title}</p>
        <Specs listing={listing} className="mt-[0.35em] text-[0.62em]" />
        {text.features.length ? <p className="mt-[0.35em] truncate text-[0.62em] text-[var(--re-accent-ink)]">{text.features.join(' · ')}</p> : null}
      </div>
    </li>
  );
}

function LaptopCard({ listing, index, focused }: { listing: Listing; index: number; focused: boolean }) {
  const t = useTranslations('demoRealEstate');
  const text = useListingText()(listing);
  const recommended = useRecommended().includes(listing.id);
  const inquiries = listing.inquiries + (recommended ? 1 : 0);
  return (
    <li
      data-listing={listing.id}
      style={{ '--i': index } as React.CSSProperties}
      className={`re-listing demo-card flex flex-col overflow-hidden rounded-[0.95em] ${focused ? 're-focus' : 're-card-in'}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Thumb listing={listing} className="absolute inset-0 h-full w-full" />
        <Badges listing={listing} recommended={recommended} />
      </div>
      <div className="flex flex-1 flex-col px-[0.7em] pb-[0.6em] pt-[0.5em]">
        <p className="tabular text-[0.92em] font-semibold tracking-[-0.01em]">{text.price}</p>
        <p className="mt-[0.05em] flex items-center gap-[0.25em] truncate text-[0.68em] font-medium">
          <MapPin aria-hidden className="size-[1.05em] shrink-0 text-[var(--demo-muted)]" strokeWidth={1.8} />
          <span className="truncate">{text.title}</span>
        </p>
        <Specs listing={listing} className="mt-[0.35em] text-[0.6em]" />
        <p className="mt-auto flex items-center justify-between gap-[0.5em] border-t border-[var(--demo-line)] pt-[0.4em] text-[0.6em] text-[var(--demo-muted)]">
          <span className="truncate">{text.features.join(' · ')}</span>
          <span key={inquiries} className={`shrink-0 whitespace-nowrap font-semibold ${recommended ? 're-pop text-[var(--re-accent-ink)]' : ''}`}>
            {t('listing.inquiries', { count: inquiries })}
          </span>
        </p>
      </div>
    </li>
  );
}

/** Opened from the chat: scroll that listing into view inside the device (never the page). */
function useRevealFocus(listRef: React.RefObject<HTMLElement | null>) {
  const { focus, reduced } = useEstate();
  useEffect(() => {
    if (!focus) return;
    const card = listRef.current?.querySelector<HTMLElement>(`[data-listing="${focus}"]`);
    const scroller = card?.closest('.demo-scroll');
    if (!card || !scroller) return;
    const box = card.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    scroller.scrollBy({ top: box.top - view.top - view.height * 0.3, behavior: reduced ? 'auto' : 'smooth' });
  }, [focus, reduced, listRef]);
}

/* ------------------------------------------------------------------ */
/* Views                                                                */
/* ------------------------------------------------------------------ */
export function PhoneListings() {
  const t = useTranslations('demoRealEstate');
  const { focus } = useEstate();
  const { filters, update, dirty, clear, version, results } = useFilterState();
  const listRef = useRef<HTMLUListElement>(null);
  useRevealFocus(listRef);
  return (
    <div className="flex flex-col gap-[0.7em]">
      <OpSwitch filters={filters} onChange={update} />
      <Card className="flex flex-col gap-[0.6em] p-[0.75em]">
        <Chips label={t('filters.type')} options={TYPE_FILTERS} value={filters.type} onPick={(type) => update({ ...filters, type })} render={(v) => t(`types.${v}`)} />
        <div className="flex items-center gap-[0.5em]">
          <span className="shrink-0 text-[0.7em] font-medium text-[var(--demo-muted)]">{t('filters.beds')}</span>
          <Chips
            label={t('filters.beds')}
            options={BED_FILTERS}
            value={filters.beds}
            onPick={(beds) => update({ ...filters, beds })}
            render={(v) => (v ? t('filters.bedsMin', { count: v }) : t('filters.any'))}
          />
        </div>
        <PriceSlider filters={filters} onChange={update} />
      </Card>
      <div className="flex min-h-[1.9em] items-center justify-between gap-[0.5em] px-[0.1em]">
        <ResultsCount count={results.length} />
        {dirty && results.length ? <ClearButton onClear={clear} /> : null}
      </div>
      {results.length ? (
        <ul ref={listRef} key={version} className="flex flex-col gap-[0.55em]">
          {results.map((l, i) => (
            <PhoneCard key={l.id} listing={l} index={i} focused={focus === l.id} />
          ))}
        </ul>
      ) : (
        <EmptyState onClear={clear} />
      )}
    </div>
  );
}

export function LaptopListings() {
  const t = useTranslations('demoRealEstate');
  const { focus, paired } = useEstate();
  const { filters, update, dirty, clear, version, results } = useFilterState();
  const listRef = useRef<HTMLUListElement>(null);
  useRevealFocus(listRef);
  const recommended = useRecommended();
  const totalInquiries = LISTINGS.reduce((n, l) => n + l.inquiries, 0) + recommended.length;
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--re-safe-top,0em)] flex items-end justify-between gap-[1em]">
        <div className="min-w-0">
          <h2 className="text-[1.45em] font-semibold leading-tight tracking-[-0.02em]">{t('listings.title')}</h2>
          <p className="truncate text-[0.78em] text-[var(--demo-muted)]">
            {t('listings.subtitle', { count: LISTINGS.length })} · <RollingNumber value={totalInquiries} /> {t('listings.inquiriesWeek')}
          </p>
        </div>
      </div>
      <div className="mr-[var(--re-safe,0em)] flex flex-col gap-[0.8em]">
        <Card className="flex flex-wrap items-end gap-x-[1.1em] gap-y-[0.7em] p-[0.75em]">
          <OpSwitch filters={filters} onChange={update} className="w-[13em]" />
          <Chips label={t('filters.type')} options={TYPE_FILTERS} value={filters.type} onPick={(type) => update({ ...filters, type })} render={(v) => t(`types.${v}`)} />
          <div className="flex items-center gap-[0.5em]">
            <span className="text-[0.7em] font-medium text-[var(--demo-muted)]">{t('filters.beds')}</span>
            <Chips
              label={t('filters.beds')}
              options={BED_FILTERS}
              value={filters.beds}
              onPick={(beds) => update({ ...filters, beds })}
              render={(v) => (v ? t('filters.bedsMin', { count: v }) : t('filters.any'))}
            />
          </div>
          <PriceSlider filters={filters} onChange={update} className="w-[13em]" />
          <div className="ml-auto flex items-center gap-[0.4em]">
            {dirty && results.length ? <ClearButton onClear={clear} /> : null}
            <ResultsCount count={results.length} className="whitespace-nowrap" />
          </div>
        </Card>
        {results.length ? (
          <ul ref={listRef} key={version} className={`grid gap-[0.7em] ${paired ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {results.map((l, i) => (
              <LaptopCard key={l.id} listing={l} index={i} focused={focus === l.id} />
            ))}
          </ul>
        ) : (
          <EmptyState onClear={clear} />
        )}
      </div>
    </div>
  );
}

/** Compact listing used inside the chat and the lead card. */
export function MiniListing({ listing, action, className = '' }: { listing: Listing; action?: React.ReactNode; className?: string }) {
  const text = useListingText()(listing);
  return (
    <div className={`flex items-center gap-[0.55em] ${className}`}>
      <span className="relative block h-[2.6em] w-[3.6em] shrink-0 overflow-hidden rounded-[0.5em]">
        <Thumb listing={listing} className="absolute inset-0 h-full w-full" />
      </span>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span className="tabular block truncate text-[0.78em] font-semibold">{text.price}</span>
        <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{text.title}</span>
      </span>
      {action}
    </div>
  );
}
