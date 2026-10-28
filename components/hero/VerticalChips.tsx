'use client';

import { useTranslations } from 'next-intl';
import { ArrowDown } from 'lucide-react';
import { PRODUCTS_HREF } from '@/components/layout/navLinks';

/**
 * The hero's second way in, under the primary CTA: «Descubrí los productos», a real link to the products banner
 * (decision of Ignacio, 28/10/2026: the Inmobiliarias key now leads to discovering Eclipse's products; the demos
 * are one tap further, in each product). `data-hero-chip` keeps the instrument key's look (hero.css).
 */
export function VerticalChips() {
  const t = useTranslations('hero');
  return (
    <div role="group" aria-labelledby="hero-pick-vertical">
      <p id="hero-pick-vertical" className="hero-pick label">
        <span>{t('pickVertical')}</span>
        <span aria-hidden className="hero-pick-rule" />
      </p>
      <div className="hero-chips-scroller no-scrollbar">
        <ul className="hero-chips">
          <li data-hero-enter>
            <a href={PRODUCTS_HREF.replace('/#', '#')} data-hero-chip="productos" className="hero-chip">
              <span className="hero-chip-name">{t('discover')}</span>
              <ArrowDown aria-hidden className="size-4" strokeWidth={1.5} />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
