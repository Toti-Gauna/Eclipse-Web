'use client';

import { Fragment, useId, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Lightbulb, Lock } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { ContentIcon } from '@/components/ui/Icon';
import { Money } from '@/components/ui/Money';
import { l, verticals, type Item, type ItemId, type VerticalId } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import type { BuilderMode } from './usePlanState';
import type { CategoryGroup, HintId } from './rules';

export interface CatalogItemView {
  item: Item;
  checked: boolean;
  /** Plan name when the selected plan includes it (checked + locked). */
  includedIn: string | null;
  /** Effective price if selected (voice combo aware). */
  priceUsd: number;
  /** True when that price comes from an offer (voice combo). */
  offerTag: string | null;
  hint: HintId | null;
}

const HINT_KEYS: Record<HintId, string> = { dashboard: 'hintDashboard', chatbot: 'hintChatbot' };

/** "Tu rubro (opcional)": toggle chips; pressing the active one clears it. */
export function VerticalPicker({ value, onChange }: { value: VerticalId | null; onChange: (v: VerticalId | null) => void }) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <p id={labelId} className="eyebrow mb-3">
        {t('vertical')} <span className="normal-case tracking-normal">({t('optional')})</span>
      </p>
      <ul className="flex flex-wrap gap-2">
        {verticals
          .filter((v) => v.id !== 'otro')
          .map((v) => {
            const pressed = value === v.id;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onChange(pressed ? null : v.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-[background-color,border-color,color,box-shadow] duration-300 ${
                    pressed
                      ? 'border-corona bg-corona text-void shadow-[0_0_28px_-8px_rgb(245_185_66/0.8)]'
                      : 'border-line-strong bg-surface text-fg hover:border-corona'
                  }`}
                >
                  <ContentIcon name={v.icon} className={`size-4 ${pressed ? '' : 'text-corona'}`} />
                  {l(v.name, locale)}
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function ItemCard({ view, onToggle }: { view: CatalogItemView; onToggle: (id: ItemId) => void }) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const id = useId();
  const { item, checked, includedIn, priceUsd, offerTag, hint } = view;
  const locked = includedIn !== null;
  return (
    <li data-reveal data-pb-card className="flex flex-col">
      <label
        data-checked={checked || undefined}
        data-locked={locked || undefined}
        className={`pb-card group relative flex h-full min-h-[5.5rem] items-start gap-3 rounded-card-sm border p-3.5 transition-[border-color,background-color,box-shadow] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)] sm:gap-3.5 sm:p-4 ${
          checked
            ? 'border-corona/70 bg-[linear-gradient(180deg,rgb(245_185_66/0.1),rgb(245_185_66/0.03))] shadow-[0_18px_44px_-26px_rgb(245_185_66/0.7)]'
            : 'border-line bg-surface hover:border-line-strong hover:bg-[rgb(26_26_36/0.75)]'
        } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={locked}
          onChange={() => onToggle(item.id)}
          aria-labelledby={`${id}-name`}
          aria-describedby={`${id}-desc ${id}-price`}
        />
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300 ${
            checked ? 'border-corona bg-corona text-void' : 'border-line bg-[rgb(5_5_10/0.45)] text-corona'
          }`}
        >
          <ContentIcon name={item.icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span id={`${id}-name`} className="block pr-1 font-medium leading-snug text-fg">
            {l(item.name, locale)}
          </span>
          <span id={`${id}-desc`} className="mt-1 block text-sm leading-snug text-fg-muted">
            {l(item.description, locale)}
          </span>
          <span id={`${id}-price`} className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {locked ? (
              <span className="inline-flex items-center gap-1.5 text-corona">
                <Lock aria-hidden className="size-3.5" strokeWidth={1.8} />
                {t('includedIn', { plan: includedIn })}
              </span>
            ) : (
              <>
                <Money usd={priceUsd} className="font-medium text-fg" />
                {offerTag ? (
                  <span className="rounded-full border border-corona/50 px-2 py-0.5 text-[0.7rem] font-medium text-corona">{offerTag}</span>
                ) : null}
              </>
            )}
          </span>
        </span>
        <span
          aria-hidden
          className={`pb-check grid size-6 shrink-0 place-items-center rounded-full border transition-[background-color,border-color] duration-300 ${
            checked ? 'border-corona bg-corona text-void' : 'border-line-strong'
          } ${locked ? 'opacity-70' : ''}`}
        >
          <Check className="size-3.5" strokeWidth={2.4} />
        </span>
      </label>
      {hint && checked ? (
        <p className="pb-pop mt-2 flex items-start gap-2 rounded-xl border border-corona/25 bg-[rgb(245_185_66/0.06)] px-3 py-2 text-sm leading-snug text-flare/90">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-corona" strokeWidth={1.6} />
          {t(HINT_KEYS[hint])}
        </p>
      ) : null}
    </li>
  );
}

/** Items grouped by category as selectable cards (real checkboxes). */
export function Catalog({
  groups,
  views,
  onToggle,
  mode,
  headingLevel,
}: {
  groups: CategoryGroup[];
  views: Record<string, CatalogItemView>;
  onToggle: (id: ItemId) => void;
  mode: BuilderMode;
  headingLevel: 2 | 3;
}) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  // Reveal uses window ScrollTriggers: only on the page (the drawer scrolls its own box).
  const Wrap = ({ children, labelledBy }: { children: ReactNode; labelledBy: string }) =>
    mode === 'page' ? (
      <Reveal as="section" aria-labelledby={labelledBy} stagger={0.04}>
        {children}
      </Reveal>
    ) : (
      <section aria-labelledby={labelledBy}>{children}</section>
    );
  return (
    <div className="@container space-y-9">
      {groups.map(({ category, items }) => {
        const count = items.filter((i) => views[i.id]?.checked).length;
        const headingId = `pb-cat-${mode}-${category.id}`;
        return (
          <Fragment key={category.id}>
            {Wrap({
              labelledBy: headingId,
              children: (
                <>
                  <div data-reveal className="mb-3.5 flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                    <Heading id={headingId} className="font-serif text-[1.65rem] leading-none tracking-[-0.01em]">
                      {l(category.name, locale)}
                    </Heading>
                    {count > 0 ? (
                      <span className="text-xs font-medium tabular text-corona">{t('categoryCount', { count })}</span>
                    ) : null}
                  </div>
                  <ul className="grid gap-2.5 @xl:grid-cols-2">
                    {items.map((item) => (views[item.id] ? <ItemCard key={item.id} view={views[item.id]} onToggle={onToggle} /> : null))}
                  </ul>
                </>
              ),
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
