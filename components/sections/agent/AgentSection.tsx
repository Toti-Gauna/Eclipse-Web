'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { DemoCta } from '@/components/ui/DemoCta';
import { DEMO_HOURS } from '@/components/sections/process/steps';
import { AgentChat } from './AgentChat';
import { Sun } from './Sun';
import './agent.css';

/**
 * "Agente en vivo + CTA final" (#contacto). The eclipse resolves into a full sun
 * over --dawn: "Tu negocio, a plena luz." with the two conversion paths (demo by
 * WhatsApp, build a plan) and a scripted agent preview that ends in WhatsApp.
 * Phones: sun, title and CTAs first, then the chat. Desktop: two columns.
 */
export function AgentSection() {
  const t = useTranslations('agent');
  const th = useTranslations('hero');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.agent}
      aria-labelledby="agent-title"
      data-header-theme="light"
      className="agent theme-light relative isolate overflow-hidden bg-dawn pt-20 pb-24 md:pt-32 md:pb-36"
    >
      <div aria-hidden className="agent-sky" />

      <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-center lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] xl:gap-24">
        <Reveal>
          <Sun className="mb-10 md:mb-14" />
          <SectionHeading id="agent-title" eyebrow={t('eyebrow')} sub={t('sub', { hours: DEMO_HOURS })}>
            {t.rich('title', { em })}
          </SectionHeading>
          <div data-reveal className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <DemoCta origin="final_cta" className="btn btn-primary w-full sm:w-auto" />
            <BuildPlanButton source="final_cta" className="btn btn-ghost w-full sm:w-auto">
              {th('ctaPlan')}
            </BuildPlanButton>
          </div>
        </Reveal>

        <Reveal start="top 88%">
          <div data-reveal>
            <AgentChat />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
