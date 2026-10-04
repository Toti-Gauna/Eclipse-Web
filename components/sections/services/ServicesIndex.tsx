'use client';

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Plus } from 'lucide-react';
import { l, type Item } from '@/lib/content';
import { formatMoney, plansIncluding } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { Occult } from '@/components/motion/Occult';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { planAnchor } from '@/components/pricing/anchors';
import { PriceReadout } from '@/components/pricing/PriceReadout';
import { ServicePreview } from './ServicePreview';
import { FAMILIES, familyCategory, familyFromUsd, familyItems } from './services';

const DESKTOP = '(min-width: 1024px)';

/**
 * The index of families (01–06), v3: every row already answers "what do I get"
 * (the family's result) and "from how much" (its cheapest piece, pago único);
 * opening a row shows the description and every piece with its price, the
 * packages that include it and "Sumar". One family open at a time.
 * Phones: all rows start closed (a short index). Desktop: one family is always
 * open and a static preview of it sits in a sticky stage on the right
 * (decorative: everything it shows is also in the list). The media query reads
 * false until React runs, so the default family is marked `data-default` and
 * skips the `hidden` attribute (Tailwind's preflight makes it !important): CSS
 * keeps it open on desktop and closed on phones, also in the server markup, so
 * the row doesn't grow on hydration.
 */
export function ServicesIndex() {
  const t = useTranslations('services');
  const locale = useLocale() as Locale;
  const { play } = useSound();
  const desktop = useMediaQuery(DESKTOP);
  const uid = useId();
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const total = FAMILIES.length;
  const stageFamily = FAMILIES[shown];
  // Desktop always shows one family (the stage needs one).
  const openIndex = desktop && open === null ? shown : open;

  // Opening a family closes the one above it: keep the tapped row where it was on screen
  // (Safari has no native scroll anchoring).
  const anchor = useRef<{ index: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const pending = anchor.current;
    anchor.current = null;
    const btn = pending ? buttons.current[pending.index] : null;
    if (!pending || !btn) return;
    const delta = btn.getBoundingClientRect().top - pending.top;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
  }, [openIndex]);

  const select = (index: number) => {
    // On desktop one family is always open (the stage needs one); on phones it closes.
    const next = openIndex === index && !desktop ? null : index;
    if (next === openIndex) return;
    const btn = buttons.current[index];
    if (btn) anchor.current = { index, top: btn.getBoundingClientRect().top };
    setOpen(next);
    if (next !== null) setShown(next);
    play('select');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = FAMILIES.length - 1;
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    buttons.current[Math.min(last, Math.max(0, to))]?.focus();
  };

  return (
    <div className="svc-index">
      <ol className="svc-list">
        {FAMILIES.map((family, index) => {
          const isOpen = openIndex === index;
          const isDefault = open === null && index === shown;
          const name = l(familyCategory(family)?.name, locale) ?? family.id;
          const pieces = familyItems(family);
          const fromUsd = familyFromUsd(family);
          const headId = `${uid}-${family.id}-head`;
          const panelId = `${uid}-${family.id}-panel`;
          return (
            <li
              key={family.id}
              className="svc-row"
              data-open={isOpen || undefined}
              data-default={isDefault || undefined}
            >
              <div className="svc-row-top">
                <h3 className="svc-head">
                  <button
                    ref={(el) => {
                      buttons.current[index] = el;
                    }}
                    id={headId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => select(index)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                    className="svc-head-btn"
                  >
                    <span aria-hidden className="svc-num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <PhaseGlyph phase={(index + 1) / total} size={16} className="svc-glyph" />
                    <span className="svc-name">{name}</span>
                    <span aria-hidden className="leader svc-leader" />
                    <span className="svc-from">
                      <span className="svc-from-label">{t('from')}</span>{' '}
                      {fromUsd !== null ? <PriceReadout usd={fromUsd} /> : null}
                      <span className="svc-count">{t('pieces', { count: pieces.length })}</span>
                    </span>
                    <ChevronDown aria-hidden strokeWidth={1.5} className="svc-chevron" />
                  </button>
                </h3>
                {/* The family's result, visible in the index (the whole top block opens the row). */}
                <p className="svc-result">
                  <span className="sr-only">{t('resultLabel')}: </span>
                  {t(`families.${family.id}.result`)}
                </p>
              </div>
              <div
                id={panelId}
                role="region"
                aria-labelledby={headId}
                hidden={!isOpen && !isDefault}
                className="svc-panel"
              >
                <p className="svc-desc">{t(`families.${family.id}.description`)}</p>
                <PiecesLedger pieces={pieces} />
              </div>
            </li>
          );
        })}
      </ol>

      <div aria-hidden className="svc-stage">
        <div className="svc-stage-frame ticks">
          <div className="svc-stage-inner">
            <p className="svc-stage-top">
              <span className="svc-stage-count">
                {String(shown + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              <span className="svc-stage-name">{l(familyCategory(stageFamily)?.name, locale)}</span>
              <span className="svc-stage-tag">{t('preview')}</span>
            </p>
            <Occult key={stageFamily.id} on="mount" shape="circle" at="88% 12%" duration={0.7} className="svc-stage-screen">
              <ServicePreview family={stageFamily.id} />
            </Occult>
            <StageRuler active={shown} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Six ticks under the stage: which family of the index is on screen. */
function StageRuler({ active }: { active: number }) {
  return (
    <span className="svc-stage-ruler">
      {FAMILIES.map((f, i) => (
        <i key={f.id} data-on={i === active || undefined} />
      ))}
    </span>
  );
}

/** The family's pieces: name ····· price [+ Sumar], and the packages that already include each one. */
function PiecesLedger({ pieces }: { pieces: Item[] }) {
  const t = useTranslations('services');
  const locale = useLocale() as Locale;
  const { currency, rates } = useCurrency();
  const { openBuilder } = useExperience();
  const { play } = useSound();
  const local = isApproximate(currency);

  return (
    <div className="svc-pieces">
      <p className="svc-pieces-title">
        <span>{t('piecesTitle')}</span>
      </p>
      <ul>
        {pieces.map((item) => {
          const name = l(item.name, locale);
          const inPlans = plansIncluding(item.id);
          return (
            <li key={item.id} className="svc-piece">
              <p className="svc-piece-main">
                <span className="svc-piece-name">{name}</span>
                <span aria-hidden className="leader" />
                <span className="svc-piece-price">
                  <PriceReadout usd={item.priceUsd} />
                  {local ? <span className="svc-piece-usd readout">{formatMoney(item.priceUsd, 'USD', rates, locale)}</span> : null}
                </span>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={t('addLabel', { name })}
                  onClick={() => {
                    play('open');
                    openBuilder('services', { items: [item.id] });
                  }}
                  className="svc-add"
                >
                  <Plus aria-hidden strokeWidth={1.75} />
                  {t('add')}
                </button>
              </p>
              <p className="svc-piece-in">
                {inPlans.length ? (
                  <>
                    <span className="svc-piece-in-label">{t('includedIn')}</span>
                    {inPlans.map((plan) => (
                      <a key={plan.id} href={`#${planAnchor(plan.id)}`} aria-label={t('goToPlan', { name: l(plan.name, locale) })}>
                        {l(plan.name, locale)}
                      </a>
                    ))}
                  </>
                ) : (
                  <span className="svc-piece-in-label">{t('extra')}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
