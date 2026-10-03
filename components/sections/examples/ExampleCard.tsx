'use client';

import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent, type RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Maximize2 } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { ContentIcon } from '@/components/ui/Icon';
import { trailerLoaders } from '@/components/trailers/registry';
import { TrailerPoster } from '@/components/trailers/TrailerPoster';
import type { TrailerComponentProps } from '@/components/trailers/VerticalTrailer';
import { l, verticalById, type DemoId, type VerticalId } from '@/lib/content';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { DemoModal } from './DemoModal';

const trailers: Record<DemoId, LazyExoticComponent<ComponentType<TrailerComponentProps>>> = {
  clinic: lazy(trailerLoaders.clinic),
  realEstate: lazy(trailerLoaders.realEstate),
  gym: lazy(trailerLoaders.gym),
};

/** Warms the showcase + demo chunks (hover / focus on "Abrir demo"). */
function preloadDemo(demo: DemoId) {
  void import('@/components/demos/DemoShowcase').then((m) => m.preloadDemo(demo));
}

/** True once the element is within `margin` of the viewport (never goes back). */
function useNearViewport(ref: RefObject<HTMLElement | null>, margin = '600px 0px'): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}

/**
 * One rubro in "Ejemplos": the trailer (lazy, plays on hover / in view), the
 * fictional business with its "Demo" badge, the pain, the key number of the
 * demo scenario (counts up) and "Abrir demo" (fullscreen modal).
 */
export function ExampleCard({ verticalId, index }: { verticalId: VerticalId; index: number }) {
  const t = useTranslations('examples');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const card = useRef<HTMLElement>(null);
  const near = useNearViewport(card);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const v = verticalById(verticalId);
  if (!v || !v.demo || !v.business || !v.keyNumber) return null;
  const demo = v.demo;
  const Trailer = trailers[demo];
  const titleId = `example-${v.id}-title`;
  const poster = <TrailerPoster vertical={v} copyKey={demo} />;

  const openDemo = () => {
    setMounted(true);
    setOpen(true);
    track('demo_opened', { vertical: v.id, source: 'examples' });
  };

  return (
    <>
      <article
        ref={card}
        aria-labelledby={titleId}
        data-trailer-hover
        className={`ex-card ${index % 2 === 1 ? 'ex-card--flip' : ''}`}
      >
        <div className="ex-media" data-reveal>
          {near ? (
            <Suspense fallback={poster}>
              <Trailer paused={open} />
            </Suspense>
          ) : (
            poster
          )}
        </div>

        <div className="ex-body" data-reveal>
          <p className="ex-eyebrow">
            <span aria-hidden className="tabular">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden className="ex-eyebrow-line" />
            <ContentIcon name={v.icon} className="size-4 text-accent" />
            <span>{l(v.name, locale)}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 id={titleId} className="display text-[2.4rem] leading-none sm:text-5xl">
              {v.business}
            </h3>
            <span className="badge-demo">{tc('demo')}</span>
          </div>

          <dl className="ex-facts">
            <div>
              <dt className="ex-fact-label">{t('pain')}</dt>
              <dd className="mt-1.5 text-[1.05rem] leading-snug text-fg">{l(v.pain, locale)}</dd>
            </div>
            <div>
              <dt className="ex-fact-label">{t('result')}</dt>
              <dd className="mt-2">
                <CountUp
                  value={v.keyNumber.value}
                  prefix={v.keyNumber.prefix}
                  suffix={v.keyNumber.suffix}
                  locale={locale}
                  className="ex-number"
                />
                <span className="mt-2 block max-w-[26ch] text-[0.98rem] leading-snug text-fg-muted">
                  {l(v.keyNumber.label, locale)}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={t('openDemoLabel', { business: v.business })}
              className="btn btn-primary w-full sm:w-auto"
              onClick={openDemo}
              onPointerEnter={() => preloadDemo(demo)}
              onFocus={() => preloadDemo(demo)}
            >
              <Maximize2 aria-hidden className="size-4" strokeWidth={1.8} />
              {t('openDemo')}
            </button>
          </div>
        </div>
      </article>
      {/* Outside the card: the dialog must not count as "hovering the card". */}
      <DemoModal open={open} mounted={mounted} onClose={() => setOpen(false)} vertical={v} />
    </>
  );
}
