'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { founders as foundersContent, l, offers, verticalById, type FounderOffer, type ReferralOffer } from '@/lib/content';
import { founderOfferOpen, foundersState, type FoundersData } from '@/lib/founders';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { offerLive, useNow } from '@/components/pricing/useNow';
import { useSound } from '@/components/sound/SoundContext';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { ClientList } from './ClientList';
import { FounderLedger } from './FounderLedger';
import './founders.css';

const founderOffer = offers.find((o) => o.kind === 'founder') as FounderOffer | undefined;
const referralOffer = offers.find((o) => o.kind === 'referral') as ReferralOffer | undefined;

/**
 * 07 · Programa fundador (#fundadores), v3: compact and in one piece.
 * - The slots are content/founders.json: "Quedan X de 5" with one mark per slot,
 *   and the taken ones (if any) listed with their real name, rubro and result.
 * - "Lo que recibís / Lo que te pedimos" sit side by side in one ledger (only while
 *   the founder offer is live and slots remain), followed by one CTA to WhatsApp.
 * When every slot is taken the section becomes "Clientes": no counter, no founder
 * price, the clients list and "¿Querés ser el próximo caso?".
 *
 * `data` defaults to the content file; the lab passes sample states.
 * `demoFilled` labels every taken slot as "Demo" (lab samples only — never content).
 */
export function FoundersSection({ data = foundersContent, demoFilled = false }: { data?: FoundersData; demoFilled?: boolean }) {
  const t = useTranslations('founders');
  const ts = useTranslations('sections');
  const tp = useTranslations('pricing.offers');
  const locale = useLocale() as Locale;
  const { vertical } = useExperience();
  const { play } = useSound();
  const now = useNow();

  const state = foundersState(data);
  const { total, remaining, allFilled, slots } = state;
  const offerOpen = founderOfferOpen(founderOffer, state, now === null ? null : new Date(now));
  const referral = referralOffer && offerLive(referralOffer, now) ? referralOffer : null;
  const nextSlot = slots.findIndex((s) => !s.filled);

  const v = verticalById(vertical);
  const message = v && v.id !== 'otro' ? t('whatsappVertical', { vertical: l(v.name, locale) }) : t('whatsapp');

  return (
    <section
      id={SECTION_IDS.founders}
      aria-labelledby="founders-title"
      data-header-theme="light"
      className="founders theme-light relative isolate overflow-hidden bg-dawn py-20 md:py-28"
    >
      <div aria-hidden className="founders-glow" />

      <div className="container-x">
        <Reveal className="fd-head">
          <div data-reveal className="fd-mark-row">
            <SectionMark section="founders" label={allFilled ? ts('clients') : undefined} />
          </div>
          <h2 id="founders-title" data-reveal className="fd-title display">
            {allFilled ? t('titleClients') : t('title')}
          </h2>
          <p data-reveal className="fd-sub">
            {allFilled ? t('subClients') : t(offerOpen ? 'sub' : 'subNoOffer', { total })}
          </p>

          {!allFilled ? (
            <div data-reveal className="fd-readout">
              <p className="sr-only">{t('counterSr', { left: remaining, total })}</p>
              <p aria-hidden className="fd-readout-num">
                {remaining}
              </p>
              <div aria-hidden className="fd-readout-text">
                <p className="fd-readout-top">{t('readout.left', { left: remaining })}</p>
                <p className="fd-readout-of">{t('readout.of', { total })}</p>
                <span className="fd-readout-scale">
                  {slots.map((slot) => (
                    <span key={slot.id} data-free={slot.filled ? undefined : ''} />
                  ))}
                </span>
              </div>
            </div>
          ) : null}
        </Reveal>

        <ClientList slots={slots} label={allFilled ? t('clientsLabel') : t('slotsLabel')} demo={demoFilled} />

        {offerOpen && founderOffer ? (
          <Reveal className="fd-deal">
            <FounderLedger offer={founderOffer} referral={referral} />
            <div data-reveal className="fd-cta">
              <WhatsAppLink
                origin="founders"
                message={message}
                extra={nextSlot >= 0 ? { slot: slots[nextSlot].id } : undefined}
                aria-label={t('slot.ctaLabel', { n: nextSlot + 1, total })}
                onClick={() => {
                  play('glint');
                  track('founder_cta_clicked', { slot: nextSlot >= 0 ? slots[nextSlot].id : 'none', position: nextSlot + 1 });
                }}
                className="btn btn-primary w-full sm:w-auto"
                data-page-cta
              >
                {t('slot.cta')}
                <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
              </WhatsAppLink>
              <p className="fd-cta-note">{tp('founderHow')}</p>
            </div>
          </Reveal>
        ) : null}

        {!allFilled && !offerOpen ? (
          <Reveal className="fd-cta fd-cta--plain">
            <div data-reveal>
              <WhatsAppLink
                origin="founders"
                message={message}
                aria-label={t('slot.ctaLabel', { n: nextSlot + 1, total })}
                onClick={() => track('founder_cta_clicked', { slot: nextSlot >= 0 ? slots[nextSlot].id : 'none', position: nextSlot + 1 })}
                className="btn btn-primary w-full sm:w-auto"
                data-page-cta
              >
                {t('slot.cta')}
                <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
              </WhatsAppLink>
            </div>
          </Reveal>
        ) : null}

        {allFilled ? (
          <Reveal className="fd-next">
            <p data-reveal className="display fd-next-title">
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
