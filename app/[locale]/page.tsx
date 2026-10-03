import { getTranslations, setRequestLocale } from 'next-intl/server';
import { jsonLd } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { LazyHydrate } from '@/components/motion/LazyHydrate';
import { Hero } from '@/components/hero/Hero';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { ProblemSection } from '@/components/sections/problem/ProblemSection';
import { ServicesSection } from '@/components/sections/services/ServicesSection';
import { ExamplesSection } from '@/components/sections/examples/ExamplesSection';
import { ProcessSection } from '@/components/sections/process/ProcessSection';
import { PricingSection } from '@/components/pricing/PricingSection';
import { FoundersSection } from '@/components/sections/founders/FoundersSection';
import { AgentSection } from '@/components/sections/agent/AgentSection';
import { EphemerisRail } from '@/components/ui/EphemerisRail';

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
      <LazyHydrate>
        <ProblemSection />
      </LazyHydrate>
      <LazyHydrate>
        <ServicesSection />
      </LazyHydrate>
      <LazyHydrate>
        <ExamplesSection />
      </LazyHydrate>
      <LazyHydrate>
        <ProcessSection />
      </LazyHydrate>
      <SkyTransition from="night" to="dawn" />
      <LazyHydrate>
        <PricingSection />
      </LazyHydrate>
      <LazyHydrate>
        <FoundersSection />
      </LazyHydrate>
      <LazyHydrate>
        <AgentSection />
      </LazyHydrate>
      <EphemerisRail />
    </main>
  );
}
