'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useSound } from '@/components/sound/SoundContext';
import { track } from '@/lib/analytics';
import { PRODUCTS_HREF, SECTION_IDS } from './navLinks';
import './floating-cta.css';

/**
 * «Potenciar mi negocio», bottom right (decision of Ignacio, 28/10/2026: it left the header).
 * THE primary action of every landing page, always one tap away: a real link to the products
 * banner of the home (/#productos). Rendered by <Header> in landing mode.
 *
 * It steps aside (slides down and out of the tab order) while it would only repeat what is on
 * screen: the hero's own CTA or another page-level solid amber CTA ([data-hero-cta],
 * [data-page-cta]: one solid amber per viewport) — `hidden`, from the header — and the products
 * banner itself (where it leads). Reduced motion: it fades.
 */
export function FloatingCta({ hidden, query }: { hidden: boolean; query: string }) {
  const t = useTranslations('selector');
  const { play } = useSound();
  const atProducts = useProductsInView(query);
  const off = hidden || atProducts;

  return (
    <div className="fcta" data-off={off || undefined}>
      <Link
        href={PRODUCTS_HREF}
        tabIndex={off ? -1 : undefined}
        aria-hidden={off || undefined}
        className="btn btn-primary fcta-btn"
        onClick={() => {
          play('glint');
          track('hero_cta_clicked', { target: 'products', from: 'floating' });
        }}
      >
        {t('cta')}
        <ArrowDownRight aria-hidden className="size-4" strokeWidth={1.8} />
      </Link>
    </div>
  );
}

/** True while the home's products banner crosses the middle of the screen (none elsewhere: always false). */
function useProductsInView(query: string): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const target = document.getElementById(SECTION_IDS.products);
    if (!target) {
      // Syncing with the page just rendered: it has no banner to step aside for.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external (DOM) state
      setInView(false);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(target);
    return () => io.disconnect();
  }, [query]);
  return inView;
}
