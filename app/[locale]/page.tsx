import { getTranslations, setRequestLocale } from 'next-intl/server';
import { jsonLd } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { LazyHydrate } from '@/components/motion/LazyHydrate';
import { Hero } from '@/components/hero/Hero';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { ExamplesSection } from '@/components/sections/examples/ExamplesSection';
import { ServicesSection } from '@/components/sections/services/ServicesSection';
import { PricingSection } from '@/components/pricing/PricingSection';
import { ProblemSection } from '@/components/sections/problem/ProblemSection';
import { ProcessSection } from '@/components/sections/process/ProcessSection';
import { FoundersSection } from '@/components/sections/founders/FoundersSection';
import { AgentSection } from '@/components/sections/agent/AgentSection';
import { EphemerisRail } from '@/components/ui/EphemerisRail';
import { ContentVisibilitySync } from '@/components/motion/ContentVisibilitySync';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'meta' });
  // Organization + one Service per plan (schema.org). '<' escaped as recommended by Next.
  const structuredData = JSON.stringify(jsonLd(locale as Locale, t('organizationDescription'))).replace(/</g, '\\u003c');
  // Below the fold, each section hydrates only when it gets close to the viewport
  // (or receives focus / a tap): its server HTML is visible and usable before that.
  // The page index rail (≥1280px) lives outside them and loads once the page is idle.
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <Hero />
      <SkyTransition from="void" to="night" />
      {/* v3 order (ids unchanged; components/ui/sectionIndex.ts numbers them 01–08):
          demos → soluciones → [sunrise] → precios → calculadora → cómo trabajamos →
          fundadores → preguntas y contacto. */}
      <LazyHydrate className="cv-section">
        <ExamplesSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <ServicesSection />
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
        <FoundersSection />
      </LazyHydrate>
      <LazyHydrate className="cv-section">
        <AgentSection />
      </LazyHydrate>
      <EphemerisRail />
      <ContentVisibilitySync />
    </main>
  );
}
