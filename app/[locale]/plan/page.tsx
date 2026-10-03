import type { Metadata } from 'next';
import { use } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { baseMetadata } from '@/lib/seo';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { PlanBuilder } from '@/components/plan-builder/PlanBuilder';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  // baseMetadata builds canonical + hreflang with localeAlternates(locale, '/plan/').
  return baseMetadata({ locale, title: t('planTitle'), description: t('planDescription'), ogAlt: t('ogAlt'), path: '/plan/' });
}

/** /[locale]/plan/?items=landing,turnos&m=crecimiento — "Armá tu plan" as a shareable page. */
export default function PlanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main id="main" className="theme-dark grain relative isolate bg-night">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_0%,rgb(245_185_66/0.13),transparent_70%)]" />
        <div className="absolute -right-24 -top-28 size-[22rem] rounded-full bg-void shadow-[0_0_90px_18px_rgb(245_185_66/0.28),0_0_0_1px_rgb(255_232_176/0.35),inset_0_0_40px_rgb(245_185_66/0.12)] md:-right-16 md:-top-44 md:size-[34rem]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,var(--night))]" />
      </div>
      <PlanBuilder mode="page" />
      <SkyTransition from="night" to="dawn" />
    </main>
  );
}
