'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { l, type FounderOffer, type ReferralOffer } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { DrawLine } from '@/components/motion/DrawLine';
import { OfferCountdown } from '@/components/pricing/OfferCountdown';

function Row({ title, value, children }: { title: ReactNode; value: ReactNode; children?: ReactNode }) {
  return (
    <li data-reveal className="fd-row">
      <p className="fd-row-line">
        <span className="fd-row-title">{title}</span>
        <span aria-hidden className="leader" />
        <span className="fd-row-value">{value}</span>
      </p>
      {children ? <div className="fd-row-note">{children}</div> : null}
    </li>
  );
}

/**
 * The founder deal as a two-column ledger: what the founder gets (the real
 * founder offer from content/offers.json) and what we ask in return. Rendered
 * only while the offer is live and slots remain; the caller decides.
 */
export function FounderLedger({ offer, referral }: { offer: FounderOffer; referral: ReferralOffer | null }) {
  const t = useTranslations('founders.deal');
  const locale = useLocale() as Locale;

  return (
    <div className="fd-ledger">
      <div data-reveal className="fd-ledger-head">
        <h3 className="fd-ledger-title display">{t('title')}</h3>
        <OfferCountdown endsAt={offer.endsAt} />
      </div>

      <div className="fd-ledger-cols">
        <div className="fd-ledger-col">
          <h4 data-reveal className="fd-ledger-label">
            <span aria-hidden className="fd-ledger-sign">+</span>
            {t('get')}
          </h4>
          <DrawLine className="fd-ledger-rule" />
          <ul className="fd-rows">
            <Row title={t('priceTitle')} value={t('priceValue', { percent: offer.percentOff })}>
              {t('priceText')}
            </Row>
            <Row title={t('maintenanceTitle')} value={t('maintenanceValue')}>
              {t('maintenanceText')}
            </Row>
            <Row title={t('priorityTitle')} value={t('priorityValue')}>
              {t('priorityText')}
            </Row>
          </ul>
        </div>

        <div className="fd-ledger-col">
          <h4 data-reveal className="fd-ledger-label">
            <span aria-hidden className="fd-ledger-sign">−</span>
            {t('give')}
          </h4>
          <DrawLine className="fd-ledger-rule" delay={0.15} />
          <ul className="fd-rows">
            <Row title={t('testimonialTitle')} value={t('testimonialValue')}>
              {t('testimonialText')}
            </Row>
            <Row title={t('caseTitle')} value={t('caseValue')}>
              {t('caseText')}
            </Row>
            <Row title={t('referralTitle')} value={t('referralValue')}>
              <p>{t('referralText')}</p>
              {referral ? (
                <p className="mt-1">
                  <span className="font-medium text-fg">{l(referral.label, locale)}:</span> {l(referral.description, locale)}
                </p>
              ) : null}
            </Row>
          </ul>
        </div>
      </div>
    </div>
  );
}
