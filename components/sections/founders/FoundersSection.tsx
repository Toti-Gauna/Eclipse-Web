'use client';

import { useLocale, useTranslations } from 'next-intl';
import { founders as foundersContent, l, offers, verticalById, type FounderOffer, type ReferralOffer } from '@/lib/content';
import { founderOfferOpen, foundersState, type FoundersData } from '@/lib/founders';
import type { Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { LightSweep } from '@/components/motion/LightSweep';
import { Occult } from '@/components/motion/Occult';
import { Reveal } from '@/components/motion/Reveal';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { offerLive, useNow } from '@/components/pricing/useNow';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { Constellation } from './Constellation';
import { FounderLedger } from './FounderLedger';
import './founders.css';

const founderOffer = offers.find((o) => o.kind === 'founder') as FounderOffer | undefined;
const referralOffer = offers.find((o) => o.kind === 'referral') as ReferralOffer | undefined;

/**
 * 07 · "Clientes fundadores" (#fundadores). The slots of content/founders.json as
 * a constellation: free ones are hollow stars that invite ("Quiero ser
 * fundador" → WhatsApp), taken ones show the client. While slots remain: the
 * giant "Quedan X de 5" readout + the deal as a ledger (only if the offer is
 * live). When every slot is taken the section becomes "Clientes": no counter,
 * no founder price.
 *
 * `data` defaults to the content file; the lab passes sample states.
 * `demoFilled` labels every taken slot as "Demo" (lab samples only — never content).
 */
export function FoundersSection({ data = foundersContent, demoFilled = false }: { data?: FoundersData; demoFilled?: boolean }) {
  const t = useTranslations('founders');
  const ts = useTranslations('sections');
  const locale = useLocale() as Locale;
  const { vertical } = useExperience();
  const now = useNow();

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
      className="founders theme-light relative isolate overflow-hidden bg-dawn py-24 md:py-32"
    >
      <div aria-hidden className="founders-glow" />

      <div className="container-x">
        <Reveal className="fd-head">
          <div data-reveal className="fd-mark-row">
            <SectionMark section="founders" label={allFilled ? ts('clients') : undefined} />
          </div>
          <h2 id="founders-title" data-reveal className="fd-title display">
            <LightSweep>{allFilled ? t('titleClients') : t('title')}</LightSweep>
          </h2>
          <p data-reveal className="fd-sub">
            {allFilled ? t('subClients') : t(offerOpen ? 'sub' : 'subNoOffer', { total })}
          </p>

          {!allFilled ? (
            <div data-reveal className="fd-readout">
              <p className="sr-only">{t('counterSr', { left: remaining, total })}</p>
              <p aria-hidden className="fd-readout-top">
                {t('readout.left', { left: remaining })}
              </p>
              <p aria-hidden className="fd-readout-num">
                {remaining}
              </p>
              <p aria-hidden className="fd-readout-of">
                {t('readout.of', { total })}
              </p>
              <span aria-hidden className="fd-readout-scale">
                {slots.map((slot) => (
                  <span key={slot.id} data-free={slot.filled ? undefined : ''} />
                ))}
              </span>
            </div>
          ) : null}
        </Reveal>

        <Occult shape="circle" at="50% 45%" duration={1.1} start="top 85%" className="fd-sky-wrap">
          <Constellation
            slots={slots}
            total={total}
            message={message}
            label={allFilled ? t('clientsLabel') : t('slotsLabel')}
            demoFilled={demoFilled}
          />
        </Occult>

        {offerOpen && founderOffer ? (
          <Reveal className="mt-14 md:mt-20">
            <FounderLedger offer={founderOffer} referral={referral} />
          </Reveal>
        ) : null}

        {allFilled ? (
          <Reveal className="mt-12 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between md:mt-16">
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
