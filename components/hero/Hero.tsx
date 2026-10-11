import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { HeroStateProvider } from './HeroState';
import { HeroStage } from './HeroStage';
import { HeroCopy } from './HeroCopy';
import { VerticalChips } from './VerticalChips';
import { DemoExperienceHost } from '@/components/demo-experience/DemoExperienceHost';
import './hero.css';

/**
 * Hero (v3d). One message, one concrete line and two ways to see it, nothing else:
 * "Pedí tu demo" (THE primary action, `data-hero-cta` — the header quiets its own CTA
 * while this one is on screen: a demo of YOUR business, by WhatsApp) and, right under it,
 * the rubro keys ("o mirá una demo de tu rubro, ahora": they open that rubro's demo in the
 * "Ver demo" layer). "Armá tu plan" and the section links live in the header (and the
 * phone menu): repeating them here only added controls to the first screen.
 *
 * The H1 is server-rendered and visible from the first paint (it is the LCP
 * element): no entrance animation ever hides it.
 *
 * Layout: a one-cell grid. The stage (eclipse, stars) is a full-bleed layer
 * behind the copy.
 * Phones and portrait tablets stack the eclipse above the copy; landscape
 * screens from 768px and everything from 1024px put it on the right, and the copy
 * column never reaches the dial (hero.css sizes it from the eclipse's geometry).
 * There the copy fits one screen even on short laptops (1366×657): the pinned
 * scroll holds exactly what is visible.
 *
 * [data-hero-pin-spacer] is the pinned scroll's spacer (useHeroMotion): giving
 * ScrollTrigger its own wrapper means it never re-parents the section, which
 * would blur the focused element on every refresh.
 *
 * <DemoExperienceHost> is the page's one "Ver demo" layer (components/demo-experience): a
 * top-layer <dialog>, rendered here because the hero always hydrates first; the demos
 * section opens the same layer.
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
              <div data-hero-copy-inner className="hero-copy-inner">
                <SectionMark section="hero" label={t('eyebrow')} />
                <h1 id="hero-title" className="hero-title display mt-4">
                  {t.rich('title', { em })}
                </h1>
                <p className="hero-sub mt-5 text-base text-fg-muted sm:text-lg">{t('subtitle')}</p>

                <div className="hero-ctas mt-6">
                  <div data-hero-enter data-hero-cta className="flex">
                    <DemoCta origin="hero" className="btn btn-primary w-full sm:w-auto" />
                  </div>
                </div>

                <div className="hero-pick-wrap">
                  <VerticalChips />
                </div>
              </div>
            </div>
          </HeroCopy>

        </HeroStateProvider>
      </section>
      <DemoExperienceHost />
    </div>
  );
}
