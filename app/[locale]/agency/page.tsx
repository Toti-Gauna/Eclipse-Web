import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { baseMetadata } from '@/lib/seo';
import { LazyHydrate } from '@/components/motion/LazyHydrate';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { AgencyIntro } from '@/components/units/AgencyIntro';
import { ServicesSection } from '@/components/sections/services/ServicesSection';
import { PymeSection } from '@/components/sections/pyme/PymeSection';
import { ExamplesSection } from '@/components/sections/examples/ExamplesSection';
import { PricingSection } from '@/components/pricing/PricingSection';
import { ProblemSection } from '@/components/sections/problem/ProblemSection';
import { ProcessSection } from '@/components/sections/process/ProcessSection';
import { AgentSection } from '@/components/sections/agent/AgentSection';
import { DemoExperienceHost } from '@/components/demo-experience/DemoExperienceHost';
import { EphemerisRail } from '@/components/ui/EphemerisRail';
import { ContentVisibilitySync } from '@/components/motion/ContentVisibilitySync';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return baseMetadata({ locale, title: t('pages.agency.title'), description: t('pages.agency.description'), ogAlt: t('ogAlt'), path: '/agency/' });
}

/**
 * /[locale]/agency/ — Eclipse Agency. The v3 landing moved here whole on 28/10/2026 (decision of
 * Ignacio: the home is the products, Media and Equipamiento), with its ids, so every block of
 * docs/v3/inventario.md is still reachable: qué ofrecemos → para tu PyME → demos → [sunrise] →
 * precios → calculadora → cómo trabajamos → preguntas y contacto (components/ui/sectionIndex.ts
 * numbers them 02–08 after the intro). The page mounts its own "Ver demo" layer (the home's lives
 * in the hero) for the demos, the levels' «Ver la demo» and the rubro selector.
 */
export default async function AgencyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main id="main">
      <AgencyIntro />
      <SkyTransition from="void" to="night" />
      <LazyHydrate className="cv-section">
        <ServicesSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <PymeSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <ExamplesSection />
      </LazyHydrate>
      <SkyTransition from="night" to="dawn" />
      <LazyHydrate className="cv-section">
        <PricingSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <ProblemSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <ProcessSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <AgentSection />
      </LazyHydrate>
      <DemoExperienceHost />
      <EphemerisRail page="agency" />
      <ContentVisibilitySync />
    </main>
  );
}
