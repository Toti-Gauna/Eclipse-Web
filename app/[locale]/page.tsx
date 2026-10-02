import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Hero } from '@/components/hero/Hero';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { ProblemSection } from '@/components/sections/problem/ProblemSection';
import { ServicesSection } from '@/components/sections/services/ServicesSection';
import { ProcessSection } from '@/components/sections/process/ProcessSection';
import { PricingSection } from '@/components/pricing/PricingSection';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main id="main">
      <Hero />
      <SkyTransition from="void" to="night" />
      <ProblemSection />
      <ServicesSection />
      <ProcessSection />
      <SkyTransition from="night" to="dawn" />
      <PricingSection />
    </main>
  );
}
