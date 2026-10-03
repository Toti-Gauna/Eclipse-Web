import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { HeroStateProvider } from './HeroState';
import { HeroStage } from './HeroStage';
import { HeroCopy } from './HeroCopy';
import { HeroReveal } from './HeroReveal';
import { VerticalChips } from './VerticalChips';
import './hero.css';

/**
 * Hero. The H1 is server-rendered and visible from the first paint (it is the
 * LCP element): no entrance animation ever hides it.
 *
 * Layout: a one-cell grid. The stage (eclipse, stars) is a full-bleed layer
 * behind; the copy and the demo reveal share the cell, so when the demo is
 * taller than the screen (phones) the hero grows instead of clipping it.
 * Phones and portrait tablets stack the eclipse above the copy; landscape
 * screens from 768px and everything from 1024px put it on the right (hero.css).
 * There the copy fits one screen even on short laptops (1366×657): the pinned
 * scroll holds exactly what is visible. The H1 scales with the height there.
 *
 * [data-hero-pin-spacer] is the pinned scroll's spacer (useHeroMotion): giving
 * ScrollTrigger its own wrapper means it never re-parents the section, which
 * would blur the focused element and reset the demo on every refresh.
 */
export function Hero() {
  const t = useTranslations('hero');
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

  return (
    <div data-hero-pin-spacer>
      <section
        id={SECTION_IDS.hero}
        aria-labelledby="hero-title"
        data-hero
        className="hero theme-dark grain relative isolate grid min-h-[100svh] overflow-hidden bg-void"
      >
        <HeroStateProvider>
          <HeroStage />

          <HeroCopy className="relative z-10 [grid-area:1/1]">
            <div className="hero-copy-cell container-x">
              <div data-hero-copy-inner className="max-w-xl lg:max-w-2xl">
                <SectionMark section="hero" label={t('eyebrow')} />
                <h1 id="hero-title" className="display mt-4 text-[2.55rem] sm:text-6xl lg:text-[min(5.4rem,11.5svh,7.6vw)]">
                  {t.rich('title', { em })}
                </h1>
                <p className="hero-sub mt-5 max-w-lg text-base text-fg-muted sm:text-lg">{t('subtitle')}</p>

                <div className="hero-pick-wrap mt-7">
                  <VerticalChips />
                </div>

                <div className="hero-ctas mt-7 flex flex-col gap-3 sm:flex-row">
                  <div data-hero-enter className="flex">
                    <DemoCta origin="hero" className="btn btn-primary w-full sm:w-auto" />
                  </div>
                  <div data-hero-enter className="flex">
                    <BuildPlanButton source="hero" className="btn btn-ghost w-full sm:w-auto">
                      {t('ctaPlan')}
                    </BuildPlanButton>
                  </div>
                </div>
              </div>
            </div>

            <div
              aria-hidden
              data-hero-scroll-hint
              className="hero-scroll-hint absolute inset-x-0 bottom-6 flex-col items-center gap-3"
            >
              <span data-hero-enter className="label">
                {t('scroll')}
              </span>
              <span data-hero-enter className="scroll-hint-line" />
            </div>
          </HeroCopy>

          <HeroReveal />
        </HeroStateProvider>
      </section>
    </div>
  );
}
