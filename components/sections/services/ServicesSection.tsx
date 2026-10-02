import './services.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { ServiceCard } from './ServiceCard';
import { ServiceGlow } from './ServiceGlow';
import { SERVICES } from './services';

/** "Qué hacemos": six service cards, each one opens "Armá tu plan" preloaded with its items. */
export function ServicesSection() {
  const t = useTranslations('services');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.services}
      aria-labelledby="services-title"
      className="services theme-dark relative isolate overflow-hidden bg-night py-24 md:py-36"
    >
      <div aria-hidden className="services-ambient" />
      <div className="container-x">
        <Reveal>
          <SectionHeading id="services-title" eyebrow={t('eyebrow')} sub={t('sub')}>
            {t.rich('title', { em })}
          </SectionHeading>
        </Reveal>

        <ServiceGlow className="mt-14 md:mt-20">
          <Reveal as="ul" role="list" start="top 85%" className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <li key={service.id} data-reveal className="flex">
                <ServiceCard service={service} />
              </li>
            ))}
          </Reveal>
        </ServiceGlow>
      </div>
    </section>
  );
}
