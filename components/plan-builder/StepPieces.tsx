'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useSound } from '@/components/sound/SoundContext';
import { Money } from '@/components/ui/Money';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { itemById, l, type Item, type ItemId, type Plan, type VoiceComboOffer } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import type { CategoryGroup, HintId } from './rules';
import { openCategories, type PreloadNotes } from './preload';
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
/** Up to this many pieces are named in a preload note; more are counted (they carry the "Sugerida" tag). */
const NAMED_MAX = 3;

/**
 * Step 2 — the pieces by category, as a price list: name, one line, price, or
 * "incluida en el paquete X". Each category folds (a disclosure button in its heading);
 * folded, it still says which pieces are chosen, or how many it has and from what price.
 * The step opens with the
 * categories that hold the visitor's pieces. What came preselected is explained on top
 * (goals, a piece added from elsewhere) with a way to change it; the package (if any)
 * heads the list with its two exits.
 */
export function StepPieces({
  groups,
  views,
  plan,
  selection,
  notes,
  onToggle,
  onEditPieces,
  onDropPlan,
  onUndoAdded,
  onEditGoals,
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
  /** Extras the visitor has (state.items): they decide which categories open. */
  selection: readonly ItemId[];
  notes: PreloadNotes;
  onToggle: (id: ItemId) => void;
  onEditPieces: () => void;
  onDropPlan: () => void;
  onUndoAdded: () => void;
  onEditGoals: () => void;
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
  const { play } = useSound();
  const uid = useId();
  const listRef = useRef<HTMLDivElement>(null);

  // Folding: decided each time the step opens (render-phase update, no effect round-trip).
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(openCategories(groups, { items: [...selection] }, highlight)));
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(new Set(openCategories(groups, { items: [...selection] }, highlight)));
  }
  // A preset that lands while the step is already open (the /plan page) unfolds its pieces too.
  const highlightKey = highlight.join(',');
  const [seenHighlight, setSeenHighlight] = useState(highlightKey);
  if (highlightKey !== seenHighlight) {
    setSeenHighlight(highlightKey);
    if (highlight.length) setOpen((current) => new Set([...current, ...openCategories(groups, { items: [] }, highlight)]));
  }
  const allOpen = groups.every((g) => open.has(g.category.id));
  const toggleCategory = (id: string) => {
    play('toggle');
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    play('toggle');
    setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.category.id)));
  };

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
  const nameOf = (id: ItemId) => {
    const item = itemById(id);
    return item ? l(item.name, locale) : id;
  };
  const listOf = (ids: readonly ItemId[]) => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(ids.map(nameOf));
  const goalsNote =
    notes.fromGoals.length > NAMED_MAX
      ? t('preloadGoalsMany', { count: notes.fromGoals.length })
      : t('preloadGoals', { list: listOf(notes.fromGoals) });

  return (
    <div ref={listRef} className="pb-pieces">
      {notes.fromGoals.length || notes.added.length ? (
        <ul className="pb-preload">
          {notes.fromGoals.length ? (
            <li className="pb-preload-row">
              <PhaseGlyph phase={0.25} size={16} className="pb-preload-glyph" />
              <p className="pb-preload-text">{goalsNote}</p>
              <button type="button" className="pb-link pb-preload-action" onClick={onEditGoals}>
                {t('preloadGoalsEdit')}
              </button>
            </li>
          ) : null}
          {notes.added.length ? (
            <li className="pb-preload-row">
              <PhaseGlyph phase={0.5} size={16} className="pb-preload-glyph" />
              <p className="pb-preload-text">{t('preloadAdded', { list: listOf(notes.added) })}</p>
              <button type="button" className="pb-link pb-preload-action" onClick={onUndoAdded}>
                {t('preloadUndo')}
                <span className="sr-only">: {listOf(notes.added)}</span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      {plan ? (
        <div className="pb-package-head ticks">
          <p className="pb-package-head-name">
            <span className="label text-accent">{t('packageHead', { plan: l(plan.name, locale) })}</span>
            <span className="pb-package-head-price readout">
              {t('ledgerFrom')} <Money usd={plan.priceUsd.from} />
            </span>
          </p>
          <p className="pb-package-head-note">
            {notes.packageFromPreset ? t('packageFromPreset', { count: plan.items.length }) : t('packageIncludes', { count: plan.items.length })}
          </p>
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

      <p className="pb-cats-bar">
        <button type="button" className="pb-link" onClick={toggleAll}>
          {allOpen ? t('collapseAll') : t('expandAll')}
        </button>
      </p>

      {groups.map(({ category, items }, gi) => {
        const headingId = `${uid}-cat-${category.id}`;
        const listId = `${uid}-cat-${category.id}-list`;
        const chosen = items.filter((i) => views[i.id]?.checked);
        const isOpen = open.has(category.id);
        return (
          <section key={category.id} aria-labelledby={headingId} className="pb-cat" data-open={isOpen || undefined}>
            <Sub className="pb-cat-head">
              <button
                type="button"
                id={headingId}
                className="pb-cat-toggle"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => toggleCategory(category.id)}
              >
                <span aria-hidden className="pb-cat-index readout">
                  {String(gi + 1).padStart(2, '0')}
                </span>
                <span className="pb-cat-name">{l(category.name, locale)}</span>
                <span className="pb-cat-count readout" data-some={chosen.length > 0 || undefined}>
                  <span aria-hidden>
                    {chosen.length}/{items.length}
                  </span>
                  <span className="sr-only">, {t('catChosen', { chosen: chosen.length, total: items.length })}</span>
                </span>
                <ChevronDown aria-hidden className="pb-cat-caret" strokeWidth={1.5} />
              </button>
            </Sub>
            {!isOpen ? (
              <p className="pb-cat-summary">
                {chosen.length
                  ? chosen.map((i) => l(i.name, locale)).join(' · ')
                  : `${t('pieceCount', { count: items.length })} · ${t('ledgerFrom')} ${format(Math.min(...items.map((i) => views[i.id]?.priceUsd ?? i.priceUsd)))}`}
              </p>
            ) : null}
            <ul id={listId} className="pb-list" hidden={!isOpen}>
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
