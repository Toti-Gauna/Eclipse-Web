import './examples.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { TRAILER_DURATION } from '@/components/trailers/constants';
import { verticals } from '@/lib/content';
import { ExampleCard } from './ExampleCard';

/**
 * "Ejemplos": one large card per rubro (trailer + demo business + key number +
 * "Abrir demo"), then "¿No ves tu rubro? Lo armamos en 48 h." → WhatsApp.
 * Every business here is fictional and labeled "Demo".
 */
export function ExamplesSection() {
  const t = useTranslations('examples');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;
  const items = verticals.filter((v) => v.id !== 'otro' && v.demo && v.business && v.keyNumber);

  return (
    <section
      id={SECTION_IDS.examples}
      aria-labelledby="examples-title"
      className="examples theme-dark relative isolate overflow-hidden bg-night py-24 md:py-36"
    >
      <div aria-hidden className="examples-ambient" />
      <div className="container-x">
        <Reveal>
          <SectionHeading id="examples-title" eyebrow={t('eyebrow')} sub={t('sub', { seconds: TRAILER_DURATION })}>
            {t.rich('title', { em })}
          </SectionHeading>
        </Reveal>

        <ol role="list" className="mt-14 flex flex-col gap-6 md:mt-20 md:gap-10 lg:gap-14">
          {items.map((v, i) => (
            <Reveal as="li" key={v.id} start="top 88%">
              <ExampleCard verticalId={v.id} index={i} />
            </Reveal>
          ))}
        </ol>

        <Reveal className="ex-more mt-16 md:mt-24" start="top 90%">
          <div data-reveal className="ex-more-inner">
            <div className="max-w-2xl">
              <p className="display text-[2.1rem] leading-[1.02] sm:text-[2.6rem] md:text-5xl">{t.rich('notListed.title', { em })}</p>
              <p className="mt-4 text-base text-fg-muted sm:text-lg">{t('notListed.body')}</p>
            </div>
            <WhatsAppLink origin="examples_not_listed" message={t('notListed.message')} className="btn btn-ghost w-full shrink-0 sm:w-auto">
              <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
              {t('notListed.cta')}
            </WhatsAppLink>
          </div>
          <p data-reveal className="mt-8 max-w-2xl text-[0.8rem] leading-relaxed text-fg-muted">
            {t('note')}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
