'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { items, l, type ItemId } from '@/lib/content';
import { formatMoney, lowestItemPrice } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { FAMILIES, familyCategory, familyItems } from '@/components/sections/services/services';
import { PriceReadout } from './PriceReadout';

/**
 * Tab B · Pieza por pieza: the 16 pieces grouped by family (same families, order and
 * prices as 03 · Soluciones and the builder), each with its single price (pago único)
 * and "Sumar", which opens "Armá tu plan" with it; plus the builder itself.
 */
export function PiecesPanel({ onShowPackages }: { onShowPackages: () => void }) {
  const t = useTranslations('pricing');
  const ts = useTranslations('services');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { openBuilder } = useExperience();
  const { play } = useSound();
  const local = isApproximate(currency);
  const cheapest = lowestItemPrice(items.map((i) => i.id));

  const open = (itemIds?: ItemId[]) => {
    play('open');
    openBuilder('pricing', itemIds ? { items: itemIds } : undefined);
  };

  return (
    <div className="pr-pieces">
      <div className="pr-pieces-intro">
        <p className="pr-panel-intro">
          <span>{t('ways.pieces.text')}</span>
          {cheapest !== null ? <span className="pr-panel-meta">{t('ways.pieces.from', { price: format(cheapest) })}</span> : null}
        </p>
        <button type="button" aria-haspopup="dialog" onClick={() => open()} className="btn btn-sm pr-btn-ghost pr-pieces-cta">
          {t('ways.pieces.cta')}
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="pr-fams">
        {FAMILIES.map((family, fi) => {
          const pieces = familyItems(family);
          const titleId = `pr-fam-${family.id}`;
          return (
            <section key={family.id} aria-labelledby={titleId} className="pr-fam">
              <h3 id={titleId} className="pr-fam-title">
                <span aria-hidden className="pr-fam-index">
                  {String(fi + 1).padStart(2, '0')}
                </span>
                <span className="pr-fam-name">{l(familyCategory(family)?.name, locale)}</span>
                <span className="pr-fam-count">{ts('pieces', { count: pieces.length })}</span>
              </h3>
              <ul className="pr-fam-list">
                {pieces.map((item) => {
                  const name = l(item.name, locale);
                  return (
                    <li key={item.id} className="pr-piece">
                      <span className="pr-piece-name">{name}</span>
                      <span aria-hidden className="leader pr-piece-leader" />
                      <span className="pr-piece-price">
                        <PriceReadout usd={item.priceUsd} />
                        {local ? <span className="pr-piece-usd readout">{formatMoney(item.priceUsd, 'USD', rates, locale)}</span> : null}
                      </span>
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-label={ts('addLabel', { name })}
                        onClick={() => open([item.id])}
                        className="pr-piece-add"
                      >
                        <Plus aria-hidden strokeWidth={1.75} />
                        <span>{ts('add')}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="pr-nonefits">
        <span>{ts('key.pieceText')}</span>
        <button type="button" aria-controls="pr-panel-packages" onClick={onShowPackages} className="pr-link">
          <ArrowLeft aria-hidden strokeWidth={1.5} />
          {t('how.project.link')}
        </button>
      </p>
    </div>
  );
}
