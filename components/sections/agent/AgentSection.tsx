'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { DEMO_HOURS } from '@/components/sections/process/steps';
import { AgentChat } from './AgentChat';
import { Dawn } from './Dawn';
import './agent.css';

/**
 * 08 · "Tu negocio, a plena luz." (#contacto) — the climax: the eclipse is over
 * and the sun rises behind the giant title (scrubbed), then the two conversion
 * paths (demo by WhatsApp, build a plan) next to the live, scripted agent
 * preview that ends in WhatsApp. Phones: dawn, CTAs, then the chat.
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
      className="agent theme-light relative isolate overflow-hidden bg-dawn pt-16 pb-24 md:pt-20 md:pb-32"
    >
      <div aria-hidden className="agent-sky" />

      <div className="container-x">
        <Reveal>
          <div data-reveal>
            <SectionMark section="agent" />
          </div>
        </Reveal>

        <Dawn className="mt-6 md:mt-8">
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
              <DemoCta origin="final_cta" className="btn btn-primary w-full sm:w-auto" />
              <BuildPlanButton source="final_cta" className="btn btn-ghost w-full sm:w-auto">
                {th('ctaPlan')}
              </BuildPlanButton>
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
