'use client';

import { useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { observeEnter } from '@/components/motion/observeEnter';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { SectionMark } from '@/components/ui/SectionMark';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { artEntrance } from '@/components/sections/products/artMotion';
import { MEDIA_FRAMES, MediaFrame } from './MediaFrames';
import '@/components/sections/products/products.css';
import './media.css';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 03 · Eclipse Media (#media): what the content unit makes, as a contact sheet — the same sheet
 * we review every film on, frame by frame. Six frames (trailers, motion, product images, social,
 * launches and seasons, 3D models), one condition (made to order, on any plan, quoted per piece)
 * and the way to its page. The page's second solid amber CTA ([data-page-cta]): the hero's is
 * two screens or more above.
 *
 * Motion: the first time the sheet reaches the reading line, a playhead crosses it and each
 * frame is exposed in turn (artEntrance, 120 ms apart). Reduced motion: the sheet is just there.
 */
export function MediaSection() {
  const t = useTranslations('media');
  const sheet = useRef<HTMLDivElement>(null);
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  useGSAP(
    () => {
      const root = sheet.current;
      if (!root || prefersReducedMotion()) return;
      const plates = gsap.utils.toArray<HTMLElement>('[data-media-plate]', root);
      const head = root.querySelector('[data-media-head]');
      const master = gsap.timeline({ paused: true });
      if (head) master.fromTo(head, { xPercent: 0, opacity: 1 }, { xPercent: 100, duration: 1.6, ease: 'expo.inOut' }, 0).to(head, { opacity: 0, duration: 0.3 }, 1.45);
      plates.forEach((plate, i) => master.add(artEntrance(plate, { duration: 0.9 }).paused(false), 0.12 + i * 0.12));
      return observeEnter(root, 'top 75%', () => void master.play());
    },
    { scope: sheet },
  );

  return (
    <section id={SECTION_IDS.media} aria-labelledby="media-title" className="md theme-dark grain relative isolate overflow-clip bg-night">
      <div aria-hidden className="md-light" />
      <div className="container-x md-grid">
        <div className="md-copy">
          <SectionMark section="media" />
          <h2 id="media-title" className="display md-title">
            {t.rich('title', { em })}
          </h2>
          <p className="md-lead">{t('lead')}</p>
          <p className="md-note">{t('note')}</p>
          <div data-page-cta className="md-cta">
            <Link href="/media/" className="btn btn-primary">
              {t('cta')}
              <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <figure className="md-sheet" aria-label={t('sheetLabel')}>
          <div ref={sheet} className="md-sheet-inner">
            <span aria-hidden className="md-head" data-media-head />
            <ol className="md-frames">
              {MEDIA_FRAMES.map((id, i) => (
                <li key={id} className="md-frame">
                  <div className="md-plate ticks" data-media-plate>
                    <MediaFrame id={id} />
                  </div>
                  <p className="md-cap">
                    <span aria-hidden className="md-cap-n readout">
                      F{pad(i + 1)}
                    </span>
                    <span>{t(`frames.${id}`)}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </figure>
      </div>
    </section>
  );
}
