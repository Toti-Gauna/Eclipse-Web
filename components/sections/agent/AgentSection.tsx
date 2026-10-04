'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/env';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { DEMO_HOURS } from '@/components/sections/process/steps';
import { Faq } from '@/components/sections/faq/Faq';
import { AgentChat } from './AgentChat';
import { Dawn } from './Dawn';
import './agent.css';

/**
 * 08 · Preguntas y contacto (#contacto), v3:
 *   1. Preguntas frecuentes — answers made only of copy the site already shows.
 *   2. The closing line, "Tu negocio, a plena luz." (static dawn), with the two paths
 *      (demo by WhatsApp, build a plan) and the direct contact (WhatsApp, email)…
 *   3. …next to the scripted agent preview that ends in WhatsApp.
 * Phones: FAQ, closing line, CTAs + contact, then the chat.
 */
export function AgentSection() {
  const t = useTranslations('agent');
  const tf = useTranslations('faq');
  const th = useTranslations('hero');
  const tl = useTranslations('sections.labels');
  const tw = useTranslations('whatsapp');
  const tfo = useTranslations('footer');
  const tc = useTranslations('common');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.agent}
      aria-label={tl('agent')}
      data-header-theme="light"
      className="agent theme-light relative isolate overflow-hidden bg-dawn pt-20 pb-24 md:pt-28 md:pb-32"
    >
      <div aria-hidden className="agent-sky" />

      <div className="container-x">
        <Reveal className="faq-block">
          <div data-reveal className="faq-block-mark">
            <SectionMark section="agent" />
          </div>
          <h2 id="faq-title" data-reveal className="display faq-block-title">
            {tf('title')}
          </h2>
          <div data-reveal className="faq-block-list">
            <Faq />
          </div>
        </Reveal>

        <Dawn className="agent-close">
          <h2 id="agent-title" className="agent-title display">
            {t.rich('title', { em })}
          </h2>
        </Dawn>

        <div className="agent-grid">
          <Reveal className="agent-copy">
            <p data-reveal className="agent-sub">
              {t('sub', { hours: DEMO_HOURS })}
            </p>
            <div data-reveal className="agent-ctas">
              <DemoCta origin="final_cta" pageCta className="btn btn-primary w-full sm:w-auto" />
              <BuildPlanButton source="final_cta" className="btn btn-ghost w-full sm:w-auto">
                {th('ctaPlan')}
              </BuildPlanButton>
            </div>
            <div data-reveal className="agent-contact">
              <h3 className="agent-contact-label">{tfo('contact')}</h3>
              <ul>
                <li>
                  <WhatsAppLink origin="final_cta" message={tw('greeting')} className="agent-contact-link">
                    <MessageCircle aria-hidden strokeWidth={1.6} />
                    {tc('whatsapp')}
                  </WhatsAppLink>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="agent-contact-link">
                    <Mail aria-hidden strokeWidth={1.6} />
                    <span className="break-all">{CONTACT_EMAIL}</span>
                  </a>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal start="top 90%">
            <div data-reveal>
              <AgentChat />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
