import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { DemoCta } from '@/components/ui/DemoCta';
import { HeroStateProvider } from './HeroState';
import { HeroStage } from './HeroStage';
import { VerticalChips } from './VerticalChips';

/**
 * Hero. The H1 is server-rendered and visible from the first paint (it is the
 * LCP element): no entrance animation ever hides it.
 */
export function Hero() {
  const t = useTranslations('hero');
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.hero}
      aria-labelledby="hero-title"
      data-hero
      className="hero theme-dark grain relative isolate min-h-[100svh] overflow-hidden bg-void [--hero-eclipse-size:min(60vw,34svh,300px)] md:[--hero-eclipse-size:min(44vw,72svh,640px)]"
    >
      <HeroStateProvider>
        <HeroStage />

        <div className="hero-copy container-x relative z-10 flex min-h-[100svh] flex-col justify-end pb-24 pt-[calc(var(--header-h)+2svh+var(--hero-eclipse-size)+0.75rem)] md:justify-center md:pb-20 md:pt-[calc(var(--header-h)+2rem)]">
          <div className="max-w-xl lg:max-w-2xl">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 id="hero-title" className="display mt-4 text-[2.55rem] sm:text-6xl lg:text-[5.4rem]">
              {t.rich('title', { em })}
            </h1>
            <p className="mt-5 max-w-lg text-base text-fg-muted sm:text-lg">{t('subtitle')}</p>

            <div className="mt-7">
              <VerticalChips />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <DemoCta origin="hero" />
              <BuildPlanButton source="hero" className="btn btn-ghost">
                {t('ctaPlan')}
              </BuildPlanButton>
            </div>
          </div>
        </div>

        <div aria-hidden className="absolute inset-x-0 bottom-6 z-10 hidden flex-col items-center gap-3 md:flex">
          <span className="text-[0.65rem] uppercase tracking-[0.24em] text-fg-muted">{t('scroll')}</span>
          <span className="scroll-hint-line" />
        </div>
      </HeroStateProvider>
    </section>
  );
}
