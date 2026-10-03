'use client';

import { useEffect, useId, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Lightbulb } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { Money } from '@/components/ui/Money';
import { l, type Item, type ItemId, type Plan, type VoiceComboOffer } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import type { CategoryGroup, HintId } from './rules';
import { Mark } from './parts';

export interface PieceView {
  item: Item;
  checked: boolean;
  /** Package name when the selected package includes it (checked + locked). */
  includedIn: string | null;
  /** Effective price if selected (voice combo aware). */
  priceUsd: number;
  /** The voice combo sets this price. */
  combo: boolean;
  /** A chosen goal suggested it. */
  suggested: boolean;
  hint: HintId | null;
}

const HINT_KEYS: Record<HintId, string> = { dashboard: 'hintDashboard', chatbot: 'hintChatbot' };

/**
 * Step 2 — the pieces by category, as a price list: name, one line, price, or
 * "incluida en el paquete X". The package (if any) heads the list with its two exits.
 */
export function StepPieces({
  groups,
  views,
  plan,
  onToggle,
  onEditPieces,
  onDropPlan,
  comboOffer,
  comboGap,
  comboPlanName,
  highlight,
  active,
  Sub,
}: {
  groups: CategoryGroup[];
  views: Record<string, PieceView>;
  plan: Plan | null;
  onToggle: (id: ItemId) => void;
  onEditPieces: () => void;
  onDropPlan: () => void;
  comboOffer: VoiceComboOffer | null;
  comboGap: { offer: VoiceComboOffer; missingUsd: number } | null;
  /** First package of the combo ("Sistema"). */
  comboPlanName: string;
  highlight: readonly ItemId[];
  active: boolean;
  Sub: 'h3' | 'h4';
}) {
  const t = useTranslations('builder');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const uid = useId();
  const listRef = useRef<HTMLDivElement>(null);

  // A preset ("Sumala a tu plan") lands here: bring the first new piece into view.
  const first = highlight[0];
  useEffect(() => {
    if (!active || !first) return;
    const raf = requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-piece="${first}"]`)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [active, first]);

  const flash = new Set<string>(highlight);

  return (
    <div ref={listRef} className="pb-pieces">
      {plan ? (
        <div className="pb-package-head ticks">
          <p className="pb-package-head-name">
            <span className="label text-accent">{t('packageHead', { plan: l(plan.name, locale) })}</span>
            <span className="pb-package-head-price readout">
              {t('ledgerFrom')} <Money usd={plan.priceUsd.from} />
            </span>
          </p>
          <p className="pb-package-head-note">{t('packageIncludes', { count: plan.items.length })}</p>
          <p className="pb-package-head-actions">
            <button type="button" className="pb-link" onClick={onEditPieces}>
              {t('editPieces')}
            </button>
            <button type="button" className="pb-link" onClick={onDropPlan}>
              {t('dropPackage')}
            </button>
          </p>
        </div>
      ) : null}

      {groups.map(({ category, items }, gi) => {
        const headingId = `${uid}-cat-${category.id}`;
        const chosen = items.filter((i) => views[i.id]?.checked).length;
        return (
          <section key={category.id} aria-labelledby={headingId} className="pb-cat">
            <Sub id={headingId} className="pb-cat-head">
              <span aria-hidden className="pb-cat-index readout">{String(gi + 1).padStart(2, '0')}</span>
              <span className="pb-cat-name">{l(category.name, locale)}</span>
              <span aria-hidden className="pb-cat-count readout">
                {chosen}/{items.length}
              </span>
            </Sub>
            <ul className="pb-list">
              {items.map((item) => {
                const view = views[item.id];
                if (!view) return null;
                const locked = view.includedIn !== null;
                const descId = `${uid}-${item.id}-d`;
                return (
                  <li key={item.id} data-piece={item.id}>
                    <label className="pb-row pb-piece" data-checked={view.checked || undefined} data-locked={locked || undefined} data-flash={flash.has(item.id) || undefined}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={view.checked}
                        disabled={locked}
                        onChange={() => onToggle(item.id)}
                        aria-describedby={descId}
                      />
                      <Mark checked={view.checked} />
                      <span className="pb-row-body">
                        <span className="pb-row-name">
                          {l(item.name, locale)}
                          {view.suggested && !locked ? <span className="pb-tag">{t('suggestedTag')}</span> : null}
                          {view.combo && comboOffer && !locked ? <span className="pb-tag pb-tag--accent">{l(comboOffer.label, locale)}</span> : null}
                        </span>
                        <span id={descId} className="pb-row-desc">
                          {locked ? <span className="pb-row-included">{t('includedIn', { plan: view.includedIn ?? '' })}</span> : l(item.description, locale)}
                        </span>
                      </span>
                      <span className="pb-row-price readout">{locked ? <span aria-hidden>—</span> : <Money usd={view.priceUsd} />}</span>
                    </label>
                    {view.hint && view.checked ? (
                      <p className="pb-hint">
                        <Lightbulb aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={1.5} />
                        {t(HINT_KEYS[view.hint])}
                      </p>
                    ) : null}
                    {item.id === comboOffer?.itemId && comboGap && view.checked && !locked ? (
                      <p className="pb-hint">
                        {t('comboGap', {
                          min: format(comboGap.offer.minSubtotalUsd),
                          price: format(comboGap.offer.priceUsd),
                          missing: format(comboGap.missingUsd),
                        })}
                      </p>
                    ) : null}
                    {item.id === comboOffer?.itemId && view.combo && !locked ? (
                      <p className="pb-hint pb-hint--quiet">
                        {t('comboNote', {
                          price: format(comboOffer.priceUsd),
                          min: format(comboOffer.minSubtotalUsd),
                          plan: comboPlanName,
                        })}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
