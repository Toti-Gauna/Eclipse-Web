import { getTranslations, setRequestLocale } from 'next-intl/server';
import { jsonLd } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { LazyHydrate } from '@/components/motion/LazyHydrate';
import { Hero } from '@/components/hero/Hero';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { ProductsSection } from '@/components/sections/products/ProductsSection';
import { MediaSection } from '@/components/sections/media/MediaSection';
import { EquipmentSection } from '@/components/sections/equipment/EquipmentSection';
import { EphemerisRail } from '@/components/ui/EphemerisRail';
import { ContentVisibilitySync } from '@/components/motion/ContentVisibilitySync';
import { legacyAnchorsScript } from '@/components/layout/legacyAnchors';
import { IntroGate } from '@/components/intro/IntroGate';
import { AutoTourButton } from '@/components/tour/AutoTourButton';
import { introScript } from '@/components/intro/introScript';

/**
 * The home (decision of Ignacio, 28/10/2026): the hero, the four products screen by screen
 * (Roofy, Foody, Markyt, Handy), Eclipse Media and Equipamiento — nothing else. The units have
 * their own pages (header: Media · Academy · Intelligence · Agency); the v3 landing (qué
 * ofrecemos, para tu PyME, demos, precios, calculadora, cómo trabajamos, preguntas y contacto)
 * moved whole to /agency/ with its ids, and a shared `/#precios` is sent there (legacyAnchors).
 * Every full load opens with the intro film «Eclipse en 40 segundos» (components/intro), right after the loading screen,
 * which ends with «Activar Eclipse» and hands the eclipse over to the hero.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'meta' });
  // Organization + one Service per plan (schema.org). '<' escaped as recommended by Next.
  const structuredData = JSON.stringify(jsonLd(locale as Locale, t('organizationDescription'))).replace(/</g, '\\u003c');
  // The products banner hydrates with the page (it is the next screen and pins on desktop: its
  // trigger must exist before the visitor scrolls into it). Media and Equipamiento hydrate when
  // they get close (their server HTML is visible and usable before that).
  return (
    <main id="main">
      <script dangerouslySetInnerHTML={{ __html: legacyAnchorsScript(locale) }} />
      <script dangerouslySetInnerHTML={{ __html: introScript() }} />
      <IntroGate />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <Hero />
      <SkyTransition from="void" to="night" />
      <ProductsSection />
      <LazyHydrate className="cv-section">
        <MediaSection />
      </LazyHydrate>
      <SkyTransition from="night" to="dawn" />
      <LazyHydrate className="cv-section">
        <EquipmentSection />
      </LazyHydrate>
      <EphemerisRail page="home" />
      <AutoTourButton />
      <ContentVisibilitySync />
    </main>
  );
}
