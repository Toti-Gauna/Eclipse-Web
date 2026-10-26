'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { items, l } from '@/lib/content';
import { formatMoney, lowestItemPrice } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { PotenciarCta } from '@/components/ui/PotenciarCta';
import { FAMILIES, familyCategory, familyItems } from '@/components/sections/services/services';
import { PriceReadout } from './PriceReadout';
import { piecesFamilyAnchor } from './anchors';

/**
 * Tab B · Pieza por pieza: the pieces grouped by family (same families and order as
 * 03 · Soluciones and the builder), each with its two alternative prices — as its own project
 * ("desde") and as a compatible add-on on a base — or, for the migration, the range quoted
 * after review. Read-only: the builder is dormant (lote 1.3), so the only action is «Potenciar mi negocio».
 */
export function PiecesPanel({ onShowPackages }: { onShowPackages: () => void }) {
  const t = useTranslations('pricing');
  const ts = useTranslations('services');
  const tsel = useTranslations('selector');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const local = isApproximate(currency);
  const cheapest = lowestItemPrice(items.map((i) => i.id));

  return (
    <div className="pr-pieces">
      <div className="pr-pieces-intro">
        <p className="pr-panel-intro">
          <span>{t('ways.pieces.text')}</span>
          {cheapest !== null ? <span className="pr-panel-meta">{t('ways.pieces.from', { price: format(cheapest) })}</span> : null}
        </p>
        <PotenciarCta origin="pricing" className="btn btn-sm pr-btn-ghost pr-pieces-cta">
          {tsel('cta')}
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </PotenciarCta>
      </div>

      <div className="pr-fams">
        {FAMILIES.map((family, fi) => {
          const pieces = familyItems(family);
          const titleId = piecesFamilyAnchor(family.id);
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
                      <span className="pr-piece-name">
                        {name}
                        {item.addonUsd != null ? (
                          <span className="pr-piece-addon">{t('pieces.addon', { price: format(item.addonUsd) })}</span>
                        ) : item.reviewRangeUsd ? (
                          <span className="pr-piece-addon">{t('pieces.review')}</span>
                        ) : (
                          <span className="pr-piece-addon">{t('pieces.alone')}</span>
                        )}
                        {item.validate ? <span className="pr-piece-addon">{t('plan.validate')}</span> : null}
                      </span>
                      <span aria-hidden className="leader pr-piece-leader" />
                      <span className="pr-piece-price">
                        {item.reviewRangeUsd ? (
                          <span className="readout">
                            {format(item.reviewRangeUsd.from)}–{format(item.reviewRangeUsd.to)}
                          </span>
                        ) : (
                          <>
                            <PriceReadout usd={item.priceUsd} />
                            {local ? <span className="pr-piece-usd readout">{formatMoney(item.priceUsd, 'USD', rates, locale)}</span> : null}
                          </>
                        )}
                      </span>
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
