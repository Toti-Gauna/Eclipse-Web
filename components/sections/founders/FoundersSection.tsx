'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { founders as foundersContent, l, offers, verticalById, type FounderOffer, type ReferralOffer } from '@/lib/content';
import { founderOfferOpen, foundersState, type FoundersData } from '@/lib/founders';
import type { Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { offerLive, useNow } from '@/components/pricing/useNow';
import { DemoCta } from '@/components/ui/DemoCta';
import { EmptySlot, FilledSlot } from './FounderSlotCard';
import { FounderDeal } from './FounderDeal';
import './founders.css';

const founderOffer = offers.find((o) => o.kind === 'founder') as FounderOffer | undefined;
const referralOffer = offers.find((o) => o.kind === 'referral') as ReferralOffer | undefined;

/**
 * "Clientes fundadores" (#fundadores). Five slots read from content/founders.json:
 * free ones invite ("Quiero ser fundador" → WhatsApp), taken ones show the client.
 * While slots remain: "Quedan X de 5" + the founder deal (only if the offer is live).
 * When all are taken the section becomes "Clientes": no counter, no founder price.
 *
 * `data` defaults to the content file; the lab passes sample states.
 * `demoFilled` labels every taken slot as "Demo" (lab samples only — never content).
 */
export function FoundersSection({ data = foundersContent, demoFilled = false }: { data?: FoundersData; demoFilled?: boolean }) {
  const t = useTranslations('founders');
  const locale = useLocale() as Locale;
  const { vertical } = useExperience();
  const now = useNow();
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  const state = foundersState(data);
  const { total, remaining, allFilled, slots } = state;
  const offerOpen = founderOfferOpen(founderOffer, state, now === null ? null : new Date(now));
  const referral = referralOffer && offerLive(referralOffer, now) ? referralOffer : null;

  const v = verticalById(vertical);
  const message = v && v.id !== 'otro' ? t('whatsappVertical', { vertical: l(v.name, locale) }) : t('whatsapp');

  return (
    <section
      id={SECTION_IDS.founders}
      aria-labelledby="founders-title"
      data-header-theme="light"
      className="founders theme-light relative isolate overflow-hidden bg-dawn py-24 md:py-36"
    >
      <div aria-hidden className="founders-glow" />

      <div className="container-x">
        <Reveal className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SectionHeading
            id="founders-title"
            eyebrow={allFilled ? t('eyebrowClients') : t('eyebrow')}
            sub={allFilled ? t('subClients') : t(offerOpen ? 'sub' : 'subNoOffer', { total })}
          >
            {allFilled ? t.rich('titleClients', { em }) : t.rich('title', { em })}
          </SectionHeading>

          {!allFilled ? (
            <div data-reveal className="lg:justify-self-end lg:text-right">
              <p className="sr-only">{t('counterSr', { left: remaining, total })}</p>
              <p aria-hidden className="founders-counter-line">
                {t.rich('counter', {
                  left: remaining,
                  total,
                  n: () => (
                    <span data-count>
                      <CountUp value={remaining} locale={locale} />
                    </span>
                  ),
                  v: (chunks) => <span data-word>{chunks}</span>,
                })}
              </p>
              <span aria-hidden className="mt-5 flex gap-2 lg:justify-end">
                {slots.map((slot) => (
                  <span
                    key={slot.id}
                    className={`size-2.5 rounded-full ${
                      slot.filled ? 'bg-ink' : 'bg-corona shadow-[0_0_12px_rgb(245_185_66/0.9)]'
                    }`}
                  />
                ))}
              </span>
            </div>
          ) : null}
        </Reveal>

        <Reveal start="top 88%" className="mt-12 md:mt-16">
          <ol aria-label={allFilled ? t('clientsLabel') : t('slotsLabel')} data-count={slots.length} className="founders-grid">
            {slots.map((slot, i) => (
              <li key={slot.id} data-reveal>
                {slot.filled ? (
                  <FilledSlot slot={slot} position={i + 1} demo={demoFilled} />
                ) : (
                  <EmptySlot slot={slot} position={i + 1} total={total} message={message} />
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        {offerOpen && founderOffer ? (
          <Reveal className="mt-10 md:mt-14">
            <FounderDeal offer={founderOffer} referral={referral} />
          </Reveal>
        ) : null}

        {allFilled ? (
          <Reveal className="mt-10 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between md:mt-14">
            <p data-reveal className="display text-3xl md:text-4xl">
              {t('next')}
            </p>
            <div data-reveal>
              <DemoCta origin="founders" />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
