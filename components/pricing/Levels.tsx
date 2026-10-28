'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { l, levels } from '@/lib/content';
import { formatMoney } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { DrawLine } from '@/components/motion/DrawLine';
import { PotenciarCta } from '@/components/ui/PotenciarCta';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useSound } from '@/components/sound/SoundContext';
import { PriceReadout } from './PriceReadout';
import { PRICING_ANCHORS } from './anchors';
import './levels.css';

/**
 * Tab A · Planes (lote 2.3b): the ladder of six monthly levels, the same for every rubro (EstateOS, the first one,
 * fills it today). Prices are visible; the first action is always to SEE THE DEMO (what you are buying), the second
 * asks for the proposal of that level over WhatsApp. There is no cart and no payment here: the payment link, the
 * transfer or the cash are agreed after the proposal. Quotas and the setup are not shown because they are still a
 * proposal; each proposal states them. Everything comes from content/levels.json.
 */
export function Levels({
  demo,
}: {
  /** How «Ver la demo» opens it; by default the rubro selector (<PotenciarCta>). The Roofy page opens Lumen directly. */
  demo?: (opts: { label: string; className: string; children: ReactNode }) => ReactNode;
} = {}) {
  const t = useTranslations('pricing');
  const tl = useTranslations('pricing.levels');
  const locale = useLocale() as Locale;
  const { currency, rates } = useCurrency();
  const { play } = useSound();
  const local = isApproximate(currency);

  return (
    <div id={PRICING_ANCHORS.care} className="pr-lv" role="group" aria-labelledby="pr-lv-title">
      <div className="pr-lv-head">
        <p className="pr-label">{tl('label')}</p>
        <h3 id="pr-lv-title" className="display pr-lv-title">
          {tl('title')}
        </h3>
        <p className="pr-lv-text">{tl('text')}</p>
      </div>

      <ol className="pr-lv-list">
        {levels.map((lv, i) => {
          const name = l(lv.name, locale);
          const proposal = lv.priceStatus === 'proposal';
          return (
            <li key={lv.id} id={`plan-${lv.id}`} className="pr-lv-row" data-level={lv.id} data-proposal={proposal || undefined}>
              <DrawLine className="pr-lv-rule" />
              <span aria-hidden className="pr-lv-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="pr-lv-id">
                <h4 className="pr-lv-name">{name}</h4>
                <p className="pr-lv-price">
                  <PriceReadout usd={lv.priceUsd} animated className="pr-lv-readout" />
                  <span className="pr-lv-period">{t('perMonth')}</span>
                </p>
                {local ? <p className="pr-lv-ref">{`${formatMoney(lv.priceUsd, 'USD', rates, locale)} ${t('perMonth')}`}</p> : null}
                {proposal ? <p className="pr-lv-badge">{tl('proposal')}</p> : null}
              </div>
              <div className="pr-lv-body">
                <p className="pr-lv-lead">{l(lv.lead, locale)}</p>
                <p className="pr-lv-audience">
                  <span className="sr-only">{t('plan.audienceLabel')}: </span>
                  {l(lv.audience, locale)}
                </p>
                <ul className="pr-lv-includes" aria-label={t('plan.includes')}>
                  {l(lv.includes, locale).map((line) => (
                    <li key={line}>
                      <Check aria-hidden strokeWidth={1.75} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pr-lv-actions">
                {demo ? (
                  demo({
                    label: tl('seeDemoLabel', { name }),
                    className: 'btn btn-sm pr-btn-ghost pr-lv-demo',
                    children: (
                      <>
                        {tl('seeDemo')}
                        <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
                      </>
                    ),
                  })
                ) : (
                  <PotenciarCta origin="plan_card" label={tl('seeDemoLabel', { name })} className="btn btn-sm pr-btn-ghost pr-lv-demo">
                    {tl('seeDemo')}
                    <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
                  </PotenciarCta>
                )}
                <WhatsAppLink
                  origin="plan_card"
                  message={tl('whatsapp', { plan: name, price: lv.priceUsd })}
                  extra={{ plan: lv.id }}
                  aria-label={tl('askLabel', { name })}
                  onClick={() => play('select')}
                  className="pr-lv-ask"
                >
                  {tl('ask')}
                  <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
                </WhatsAppLink>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="pr-lv-foot">
        <p>{tl('notes.example')}</p>
        <p>{tl('notes.pay')}</p>
      </div>
    </div>
  );
}
