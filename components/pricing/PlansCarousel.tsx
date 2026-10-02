'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { l, type Plan } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { Reveal } from '@/components/motion/Reveal';

/**
 * Plans list: a horizontal scroll-snap carousel below xl (it scrolls inside
 * itself, never the page) and a 4 + 3 grid from xl. Cards share row tracks
 * (CSS subgrid) so names, prices and CTAs line up.
 */
export function PlansCarousel({
  plans,
  featuredId,
  children,
}: {
  plans: readonly Plan[];
  featuredId: string;
  /** One <PlanCard> (an <li>) per plan, in the same order. */
  children: ReactNode;
}) {
  const t = useTranslations('pricing.carousel');
  const locale = useLocale() as Locale;
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const featuredIndex = Math.max(
    0,
    plans.findIndex((p) => p.id === featuredId),
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const cards = list.children;
      if (cards.length < 2) return;
      const first = cards[0] as HTMLElement;
      const step = (cards[1] as HTMLElement).offsetLeft - first.offsetLeft;
      if (step <= 0) return;
      const max = list.scrollWidth - list.clientWidth;
      const index = list.scrollLeft >= max - 2 ? cards.length - 1 : Math.round(list.scrollLeft / step);
      setActive(Math.min(cards.length - 1, Math.max(0, index)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    list.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      list.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const list = listRef.current;
    const card = list?.children[index] as HTMLElement | undefined;
    const first = list?.children[0] as HTMLElement | undefined;
    if (!list || !card || !first) return;
    list.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const featuredName = l(plans[featuredIndex].name, locale);

  return (
    <div>
      {/* Carousel affordances (hidden on the desktop grid) */}
      <div className="container-x flex items-center justify-between gap-3 xl:hidden">
        <p className="text-xs text-fg-muted">{t('hint', { count: plans.length })}</p>
        <button
          type="button"
          onClick={() => scrollToIndex(featuredIndex)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-1 text-xs font-medium text-accent"
        >
          <Sparkles aria-hidden className="size-3.5" strokeWidth={1.75} />
          {t('goToFeatured')}
          <span className="sr-only">: {featuredName}</span>
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <Reveal start="top 88%">
        <ul ref={listRef} aria-label={t('label')} className="plan-list no-scrollbar">
          {children}
        </ul>
      </Reveal>

      <div role="group" aria-label={t('dots')} className="mt-1 flex justify-center xl:hidden">
        {plans.map((plan, i) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={t('goTo', { name: l(plan.name, locale) })}
            aria-current={i === active ? 'true' : undefined}
            data-featured={plan.id === featuredId || undefined}
            className="plan-dot"
          >
            <span aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
