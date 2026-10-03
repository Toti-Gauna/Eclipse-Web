'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeftRight,
  BadgePercent,
  Eye,
  MessageSquareQuote,
  UserPlus,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { l, type FounderOffer, type ReferralOffer } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { OfferCountdown } from '@/components/pricing/OfferCountdown';

function Perk({ icon: Icon, title, children }: { icon: LucideIcon; title: ReactNode; children: ReactNode }) {
  return (
    <li data-reveal className="flex gap-4">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-white/60 text-accent">
        <Icon className="size-[1.1rem]" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 pt-1.5">
        <p className="font-medium leading-snug">{title}</p>
        <div className="mt-1 text-sm leading-snug text-fg-muted">{children}</div>
      </div>
    </li>
  );
}

/**
 * The founder deal: what the founder gets (the real founder offer from
 * content/offers.json) and what they give back. Rendered only while the offer
 * is live and slots remain; the caller decides.
 */
export function FounderDeal({ offer, referral }: { offer: FounderOffer; referral: ReferralOffer | null }) {
  const t = useTranslations('founders.deal');
  const locale = useLocale() as Locale;
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <div className="founders-deal rounded-card-lg border border-line p-6 sm:p-8 md:p-10">
      <div data-reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="display text-[2rem] sm:text-4xl md:text-[2.75rem]">{t.rich('title', { em })}</h3>
        <OfferCountdown endsAt={offer.endsAt} />
      </div>

      <div className="mt-8 grid gap-10 md:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-8 lg:gap-14">
        <div>
          <h4 data-reveal className="eyebrow mb-5">
            {t('get')}
          </h4>
          <ul className="space-y-5">
            <Perk icon={BadgePercent} title={l(offer.label, locale)}>
              {t('priceText')}
            </Perk>
            <Perk icon={Wrench} title={t('maintenanceTitle')}>
              {t('maintenanceText')}
            </Perk>
            <Perk icon={Zap} title={t('priorityTitle')}>
              {t('priorityText')}
            </Perk>
          </ul>
        </div>

        <div aria-hidden className="hidden md:flex md:flex-col md:items-center">
          <span className="w-px flex-1 bg-linear-to-b from-transparent via-line-strong to-transparent" />
          <span className="my-4 grid size-12 place-items-center rounded-full bg-corona text-ink shadow-[0_12px_36px_-12px_rgb(245_185_66/0.9)]">
            <ArrowLeftRight className="size-5" strokeWidth={1.5} />
          </span>
          <span className="w-px flex-1 bg-linear-to-b from-transparent via-line-strong to-transparent" />
        </div>

        <div>
          <h4 data-reveal className="eyebrow mb-5">
            {t('give')}
          </h4>
          <ul className="space-y-5">
            <Perk icon={MessageSquareQuote} title={t('testimonialTitle')}>
              {t('testimonialText')}
            </Perk>
            <Perk icon={Eye} title={t('caseTitle')}>
              {t('caseText')}
            </Perk>
            <Perk icon={UserPlus} title={t('referralTitle')}>
              <p>{t('referralText')}</p>
              {referral ? (
                <p className="mt-1.5">
                  <span className="font-medium text-fg">{l(referral.label, locale)}:</span> {l(referral.description, locale)}
                </p>
              ) : null}
            </Perk>
          </ul>
        </div>
      </div>
    </div>
  );
}
