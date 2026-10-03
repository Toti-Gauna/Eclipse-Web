'use client';

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { gsap, ScrollTrigger } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { useHeroState, type DemoVertical, type RevealPhase } from './HeroState';
import { DISC, LIMB_POINT, MOON_DIR, REVEAL_MOON_DIAMOND } from './geometry';

// Showcase + demos are only downloaded when a vertical is picked (or hovered).
const DemoShowcase = lazy(() =>
  import('@/components/demos/DemoShowcase').then((m) => ({
    default: m.DemoShowcase,
  })),
);

/** Halo radius / light radius: the soft glow that runs just ahead of the light's edge. */
const HALO = 1.35;

/** The moon element is a hair bigger than the disc (hero.css): xPercent per disc radius. */
const MOON_PCT_PER_RADIUS = 50 * (DISC / (DISC + 0.008));

/** The header flips theme once the light covers this share of the way to its far end. */
const HEADER_COVER = 0.8;

type Direction = 'opening' | 'closing';

/** ScrollTrigger#setPositions exists at runtime (gsap 3.12+) but is missing from the typings. */
type Placeable = ScrollTrigger & { setPositions?: (start: number, end: number) => void };

interface Running {
  tl: gsap.core.Timeline;
  /** What playing it forward does. */
  dir: Direction;
  /** Still moving (cleared on complete / reverse complete). */
  moving: boolean;
}

/**
 * "El momento estrella": the sun's light takes over the hero and the demo of
 * the chosen vertical appears inside it.
 *
 * Opening (motion): moon slides diagonally → diamond ring (point + 400 ms
 * horizontal flare) at the exposed limb → circular clip-path light expands from
 * the eclipse until it covers the whole hero (copy included) → top bar and
 * devices rise in. Closing plays the way back and returns focus to the chip.
 * Changing course mid-way (Esc while it opens, a chip while it closes) reverses
 * the running timeline instead of jumping.
 * Reduced motion: a quick crossfade, no moon, no diamond ring.
 *
 * It is not a modal: it lives inside the hero (a grid cell stacked over the
 * copy), the page keeps scrolling; the covered copy is inert, Esc closes it.
 */
export function HeroReveal() {
  const { shown, reset, phase, setPhase, openedFrom, bus } = useHeroState();
  const mounted = phase !== 'closed' && shown !== null;

  // The header flips to its light theme over [data-header-theme="light"] zones,
  // registered when it mounts: this zone always exists and only gets a height
  // while the light covers the hero.
  const zone = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={zone} data-header-theme="light" aria-hidden className="hero-light-zone" />
      {mounted ? (
        <RevealLayer
          vertical={shown}
          phase={phase}
          setPhase={setPhase}
          reset={reset}
          openedFrom={openedFrom}
          bus={bus}
          zone={zone}
        />
      ) : null}
    </>
  );
}

type HeroState = ReturnType<typeof useHeroState>;

function RevealLayer({
  vertical,
  phase,
  setPhase,
  reset,
  openedFrom,
  bus,
  zone,
}: {
  vertical: DemoVertical;
  phase: RevealPhase;
  setPhase: HeroState['setPhase'];
  reset: () => void;
  openedFrom: HeroState['openedFrom'];
  bus: HeroState['bus'];
  zone: React.RefObject<HTMLDivElement | null>;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const wide = useMediaQuery('(min-width: 768px)');
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const running = useRef<Running | null>(null);
  const [inView, setInView] = useState(false);

  const v = verticalById(vertical);
  const business = v?.business ?? '';
  const verticalName = v ? l(v.name, locale) : '';
  const active = inView && (phase === 'open' || phase === 'opening');

  // Opening / closing timelines.
  useLayoutEffect(() => {
    const el = root.current;
    const section = el?.closest<HTMLElement>('[data-hero]');
    if (!el || !section || (phase !== 'opening' && phase !== 'closing')) return;
    const target: Direction = phase;

    // Focus follows the light: into the reveal when it opens, back to the chip
    // (the copy stops being inert as soon as it closes) when it closes.
    if (target === 'opening') {
      heading.current?.focus({ preventScroll: true });
    } else if (el.contains(document.activeElement) || document.activeElement === document.body) {
      section.querySelector<HTMLElement>(`[data-hero-chip="${openedFrom.current}"]`)?.focus({ preventScroll: true });
    }

    // Already heading there (React StrictMode replays effects in dev).
    const current = running.current;
    if (current?.moving) {
      const toward = current.tl.reversed() ? flip(current.dir) : current.dir;
      if (toward !== target) current.tl.reversed(!current.tl.reversed());
      return;
    }

    const reduced = prefersReducedMotion();
    const stage = section.querySelector<HTMLElement>('[data-hero-stage]');
    const eclipse = stage?.querySelector<HTMLElement>('[data-eclipse]') ?? null;
    const moon = stage?.querySelector<HTMLElement>('[data-eclipse-moon]') ?? null;
    const core = stage?.querySelector<HTMLElement>('[data-diamond-core]') ?? null;
    const flare = stage?.querySelector<HTMLElement>('[data-diamond-flare]') ?? null;
    const glow = halo.current;
    const items = el.querySelectorAll<HTMLElement>('[data-reveal-item]');
    const b = bus.current;

    // The header flips over the light (it toggles over [data-header-theme="light"]
    // zones). The zone's top never moves, so its trigger is re-placed by hand from
    // its own start: cheap enough mid-animation, unlike a full ScrollTrigger.refresh()
    // (a dropped frame or two on a long page). Full refreshes (resize, fonts, the
    // hero's height changing) measure it right too: hero.css gives the zone the
    // pin distance on top of the hero's height.
    const setHeaderLight = (on: boolean) => {
      const z = zone.current;
      if (!z || z.hasAttribute('data-on') === on) return;
      z.toggleAttribute('data-on', on);
      const st = ScrollTrigger.getAll().find((s) => s.trigger === z) as Placeable | undefined;
      if (st?.setPositions) st.setPositions(st.start, st.start + (on ? z.offsetHeight : 0));
      else ScrollTrigger.refresh();
    };

    const finish = (reached: Direction) => {
      if (running.current) running.current.moving = false;
      if (reached === 'opening') {
        el.style.clipPath = 'none';
        setHeaderLight(true);
        setPhase('open');
      } else {
        if (moon) gsap.set(moon, { clearProps: 'transform' });
        b.revealMoon.x = 0;
        b.revealMoon.y = 0;
        setHeaderLight(false);
        setPhase('closed');
      }
    };
    const start = (tl: gsap.core.Timeline, dir: Direction) => {
      tl.eventCallback('onComplete', () => finish(dir)).eventCallback('onReverseComplete', () => finish(flip(dir)));
      running.current = { tl, dir, moving: true };
    };

    if (target === 'opening') {
      // Phones: bring the top of the demo into view (the hero isn't pinned there).
      const sr = section.getBoundingClientRect();
      if (!section.hasAttribute('data-pinned') && sr.top < -48)
        window.scrollTo({ top: window.scrollY + sr.top, behavior: reduced ? 'auto' : 'smooth' });
    }

    if (reduced) {
      el.style.clipPath = 'none';
      if (target === 'opening') setHeaderLight(true);
      start(gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }), 'opening');
      if (target === 'closing') running.current?.tl.progress(1, true).reverse();
      return;
    }

    // The light is born at the diamond (the exposed limb) and floods the hero.
    const rr = el.getBoundingClientRect();
    const er = eclipse?.getBoundingClientRect();
    const x = er ? er.left + er.width * LIMB_POINT.x - rr.left : rr.width / 2;
    const y = er ? er.top + er.height * LIMB_POINT.y - rr.top : rr.height / 3;
    const r0 = er ? er.width * 0.05 : 16;
    const r1 = Math.hypot(Math.max(x, rr.width - x), Math.max(y, rr.height - y)) + 8;
    el.style.setProperty('--reveal-x', `${x}px`);
    el.style.setProperty('--reveal-y', `${y}px`);
    if (glow) {
      const size = r1 * HALO * 2;
      gsap.set(glow, { width: size, height: size, left: x - size / 2, top: y - size / 2 });
    }
    // Far end of the header's content (logo or menu), in the light's coordinates.
    const hh = document.querySelector<HTMLElement>('header')?.offsetHeight ?? 64;
    const gutter = 16;
    const hy = hh / 2 - rr.top;
    const rHeader =
      HEADER_COVER *
      Math.max(Math.hypot(x - (gutter - rr.left), y - hy), Math.hypot(x - (window.innerWidth - gutter - rr.left), y - hy));

    const light = { r: target === 'opening' ? 0 : r1 };
    const paint = () => {
      el.style.clipPath = `circle(${light.r}px at ${x}px ${y}px)`;
      setHeaderLight(light.r >= rHeader);
    };
    gsap.set(el, { opacity: 1 });
    paint();

    if (target === 'opening') {
      const moonTo = REVEAL_MOON_DIAMOND * MOON_PCT_PER_RADIUS;
      gsap.set(items, { opacity: 0, y: 18 });
      if (glow) gsap.set(glow, { autoAlpha: 0, scale: r0 / r1 });

      const t1 = gsap.timeline();
      // 1 · the moon slides diagonally
      if (moon)
        t1.to(moon, { xPercent: MOON_DIR.x * moonTo, yPercent: MOON_DIR.y * moonTo, duration: 0.62, ease: 'power2.inOut' }, 0);
      t1.to(
        b.revealMoon,
        { x: MOON_DIR.x * REVEAL_MOON_DIAMOND, y: MOON_DIR.y * REVEAL_MOON_DIAMOND, duration: 0.62, ease: 'power2.inOut' },
        0,
      );
      // 2 · diamond ring: an intense point + a 400 ms horizontal flare
      if (core)
        t1.fromTo(core, { autoAlpha: 0, scale: 0.15 }, { autoAlpha: 1, scale: 1, duration: 0.32, ease: 'expo.out' }, 0.34);
      if (flare)
        t1.fromTo(flare, { autoAlpha: 0, scaleX: 0.04 }, { autoAlpha: 1, scaleX: 1, duration: 0.16, ease: 'power2.out' }, 0.4).to(
          flare,
          { autoAlpha: 0, scaleX: 1.4, duration: 0.24, ease: 'power2.in' },
          0.56,
        );
      // 3 · the light expands from the diamond until it covers the whole hero
      const grow = { duration: 1.15, ease: 'expo.inOut' };
      t1.fromTo(light, { r: r0 }, { r: r1, onUpdate: paint, immediateRender: false, ...grow }, 0.72);
      if (glow)
        t1.set(glow, { autoAlpha: 1 }, 0.72)
          .to(glow, { scale: 1, ...grow }, 0.72)
          .to(glow, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 1.6);
      // The point blooms with the light so its hard clip edge reads as glare.
      if (core)
        t1.to(core, { scale: 4.5, duration: 0.8, ease: 'power2.out' }, 0.72).to(
          core,
          { autoAlpha: 0, duration: 0.45, ease: 'power1.in' },
          1.02,
        );
      // 4 · the demo rises inside the light
      t1.to(items, { opacity: 1, y: 0, duration: 0.95, stagger: 0.07, ease: 'expo.out', clearProps: 'opacity,transform' }, 1.35);
      start(t1, 'opening');
      return;
    }

    // Closing: the light collapses back into the diamond, the moon returns.
    const shrink = { duration: 0.9, ease: 'expo.inOut' };
    const t2 = gsap.timeline();
    t2.fromTo(items, { opacity: 1, y: 0 }, { opacity: 0, y: 12, duration: 0.26, stagger: 0.025, ease: 'power2.in' }, 0).fromTo(
      light,
      { r: r1 },
      { r: r0, onUpdate: paint, immediateRender: false, ...shrink },
      0.16,
    );
    if (glow)
      t2.fromTo(glow, { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, duration: 0.2 }, 0.16)
        .to(glow, { scale: r0 / r1, ...shrink }, 0.16)
        .to(glow, { autoAlpha: 0, duration: 0.25 }, 0.9);
    // Its bloom hides the hard clip edge while the light shrinks into it.
    if (core)
      t2.fromTo(core, { autoAlpha: 0, scale: 4.5 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0.62)
        .to(core, { scale: 1, duration: 0.5, ease: 'power2.in' }, 0.62)
        .to(core, { autoAlpha: 0, scale: 0.35, duration: 0.5, ease: 'power2.in' }, 1.2);
    t2.to(el, { opacity: 0, duration: 0.18, ease: 'power1.out' }, 1.0).to(
      b.revealMoon,
      { x: 0, y: 0, duration: 0.75, ease: 'power2.inOut' },
      1.05,
    );
    if (moon) t2.to(moon, { xPercent: 0, yPercent: 0, duration: 0.75, ease: 'power2.inOut' }, 1.05);
    start(t2, 'closing');
  }, [phase, setPhase, bus, zone, openedFrom]);

  // Unmount (closed, or the page goes away mid-animation). In dev StrictMode this
  // also runs once right after mounting: the layout effect above then starts over.
  useEffect(
    () => () => {
      running.current?.tl.kill();
      running.current = null;
    },
    [],
  );

  // Esc closes (unless a dialog, e.g. "Armá tu plan", is on top).
  useEffect(() => {
    if (phase !== 'open' && phase !== 'opening') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]')) return;
      reset();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, reset]);

  // The demo runs only while revealed and on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[entries.length - 1].isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!v || !v.demo) return null;

  const wantThis = (className: string) => (
    <WhatsAppLink
      origin="hero_demo"
      message={t('whatsapp.wantThis', { business, vertical: verticalName })}
      extra={{ vertical }}
      className={className}
    >
      <MessageCircle aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
      {t('hero.wantThis')}
    </WhatsAppLink>
  );

  return (
    <>
      <div ref={halo} aria-hidden className="hero-reveal-halo" />
      <div ref={root} data-hero-reveal inert={phase === 'closing'} className="theme-light relative z-20 [grid-area:1/1]">
        <div aria-hidden className="hero-reveal-light absolute inset-0" />
        <div
          role="region"
          aria-labelledby="hero-reveal-title"
          className="container-x relative flex min-h-full flex-col pb-6 pt-[calc(var(--header-h)+0.5rem)] md:pt-[calc(var(--header-h)+1rem)]"
        >
          <div className="grid items-center gap-x-6 gap-y-2 md:grid-cols-[1fr_auto] md:gap-y-3 lg:grid-cols-[1fr_auto_1fr]">
            <div data-reveal-item className="justify-self-start">
              <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
                <ArrowLeft aria-hidden className="size-4" strokeWidth={1.6} />
                {t('hero.seeAnother')}
              </button>
            </div>
            <div
              data-reveal-item
              className="md:col-span-2 md:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:text-center"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:justify-center">
                <span className="badge-demo" aria-hidden>
                  {t('common.demo')}
                </span>
                <h2
                  ref={heading}
                  id="hero-reveal-title"
                  tabIndex={-1}
                  className="display text-[1.6rem] leading-tight focus:outline-none md:text-[2.4rem]"
                >
                  {business}
                  <span className="text-fg-muted"> — {t('common.demo')}</span>
                </h2>
              </div>
              <p className="mt-1.5 hidden text-sm text-fg-muted md:block">{t('heroReveal.hint')}</p>
            </div>
            <div data-reveal-item className="hidden justify-self-end md:col-start-2 md:row-start-1 md:block lg:col-start-3">
              {wantThis('btn btn-primary btn-sm')}
            </div>
          </div>

          <div data-reveal-item className="mt-4 flex flex-1 items-start justify-center md:mt-5 md:items-center">
            <div data-reveal-showcase className="hero-reveal-showcase">
              <Suspense fallback={<ShowcaseSkeleton wide={wide} label={t('heroReveal.loading', { business })} />}>
                <DemoShowcase demo={v.demo} business={business} active={active} fit />
              </Suspense>
            </div>
          </div>

          <div data-reveal-item className="mt-5 md:hidden">
            {wantThis('btn btn-primary w-full')}
            <p className="mt-3 text-center text-sm text-fg-muted">{t('heroReveal.hint')}</p>
          </div>
        </div>
      </div>
    </>
  );
}

const flip = (dir: Direction): Direction => (dir === 'opening' ? 'closing' : 'opening');

/** Same footprint as the devices, so nothing jumps when the showcase chunk lands. */
function ShowcaseSkeleton({ wide, label }: { wide: boolean; label: string }) {
  return (
    <div role="status" className={`relative w-full ${wide ? 'aspect-[1/0.651]' : 'aspect-[9/19.5]'}`}>
      <span className="sr-only">{label}</span>
      <div
        aria-hidden
        className={`absolute animate-pulse bg-ink/10 ${wide ? 'bottom-[10%] left-0 right-[12%] top-0 rounded-[2.2%/3.4%]' : 'inset-0 rounded-[13%/6%]'}`}
      />
    </div>
  );
}
