'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { observeEnter } from '@/components/motion/observeEnter';
import { startPlateLoop } from '@/components/sections/products/artIdle';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { SectionMark } from '@/components/ui/SectionMark';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { EQUIPMENT_PARTS, EquipmentSheet, PART_CENTERS, type EquipmentPart } from './EquipmentSheet';
import '@/components/sections/products/products.css';
import './equipment.css';

const pad = (n: number) => String(n).padStart(2, '0');
/** The kit's middle in the drawing's units: every part flies out from here. */
const KIT_CENTER = { x: 320, y: 200 };

/**
 * 04 · Equipamiento (#equipamiento, dawn): the physical side of the business — QR stands,
 * displays, packaging, cards, keychains, compatible hardware — as an exploded-view sheet with its
 * parts list. Everything is made to order against a quote and a deposit (approved copy: no stock
 * of our own), so every row reads «A cotizar» and the CTA asks for a quote on WhatsApp.
 * The CTA is quiet (the footer's «Pedí tu demo», right below, is the solid one).
 *
 * Motion: the first time the sheet reaches the reading line the kit comes apart — each part flies
 * out from the middle to its place — then the callouts pop in and the display lights up.
 * Then the exploded kit floats and its parts keep working while it is on screen (artIdle).
 * Pointing at a row of the list lights its part. Reduced motion: the sheet is just there, still.
 */
export function EquipmentSection() {
  const t = useTranslations('equipment');
  const sheet = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<EquipmentPart | null>(null);
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  useGSAP(
    () => {
      const root = sheet.current;
      if (!root || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      q('[data-eq-part]').forEach((part, i) => {
        const [cx, cy] = PART_CENTERS[(part as unknown as SVGElement).dataset.part as EquipmentPart] ?? [KIT_CENTER.x, KIT_CENTER.y];
        tl.fromTo(part, { x: (KIT_CENTER.x - cx) * 0.6, y: (KIT_CENTER.y - cy) * 0.6, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1.1 }, i * 0.06);
      });
      tl.fromTo(q('[data-eq-callout]'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(2)' }, 0.75);
      tl.fromTo(q('[data-art-light]'), { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(2.5)' }, 1.1);
      let stop: (() => void) | null = null;
      tl.call(() => {
        stop ??= startPlateLoop(root);
      });
      const cancel = observeEnter(root, 'top 90%', () => void tl.play());
      return () => {
        cancel();
        stop?.();
      };
    },
    { scope: sheet },
  );

  return (
    <section
      id={SECTION_IDS.equipment}
      aria-labelledby="equipment-title"
      data-header-theme="light"
      className="eq theme-light relative isolate overflow-clip bg-dawn"
    >
      <div className="container-x">
        <div className="eq-head">
          <SectionMark section="equipment" />
          <h2 id="equipment-title" className="display eq-title">
            {t.rich('title', { em })}
          </h2>
          <p className="eq-lead">{t('lead')}</p>
        </div>

        <div className="eq-body">
          <figure className="eq-sheet ticks" aria-label={t('sheetLabel')}>
            <div ref={sheet} className="eq-sheet-inner">
              <EquipmentSheet active={active} />
            </div>
          </figure>

          <div className="eq-ledger">
            <ol className="eq-parts">
              {EQUIPMENT_PARTS.map((part, i) => (
                <li
                  key={part}
                  className="eq-row"
                  data-active={active === part || undefined}
                  onPointerEnter={() => setActive(part)}
                  onPointerLeave={() => setActive((a) => (a === part ? null : a))}
                >
                  <span aria-hidden className="eq-row-n readout">
                    {pad(i + 1)}
                  </span>
                  <span className="eq-row-name">{t(`parts.${part}`)}</span>
                  <span aria-hidden className="leader" />
                  <span className="eq-row-quote">{t('quote')}</span>
                </li>
              ))}
            </ol>
            <p className="eq-note">{t('note')}</p>
            <WhatsAppLink origin="equipment" message={t('ask')} className="btn btn-ghost eq-cta">
              <MessageCircle aria-hidden className="size-4" strokeWidth={1.6} />
              {t('cta')}
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
