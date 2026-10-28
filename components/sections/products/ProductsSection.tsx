'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useSound } from '@/components/sound/SoundContext';
import { SectionMark } from '@/components/ui/SectionMark';
import { ProductStatus } from '@/components/products/ProductStatus';
import { UnitAsk } from '@/components/units/UnitAsk';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { STATUS_PHASE } from './products';
import { SECTION_IDS, productPath } from '@/components/layout/navLinks';
import { products, type Product } from '@/lib/content';
import { ProductArt } from './ProductArt';
import { useProductsMotion } from './useProductsMotion';
import './products.css';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 02 · Productos (#productos, decision of Ignacio 28/10/2026): Roofy, Foody, Markyt and Handy,
 * one screen each — what it is for, what it does (four points), whether it is on sale today and
 * «Conocer <producto>», which opens its page — then the ones coming next (gimnasios, DentalOS,
 * clínicas, VetOS), which say «Próximamente» and offer a heads-up over WhatsApp instead. Products and their status come from
 * content/products.json; the only price is Roofy's «desde», read from content/levels.json.
 *
 * With a mouse or a trackpad on a wide screen the screens are a horizontal track pinned to the
 * page (useProductsMotion): the scroll moves from one product to the next, a rail at the bottom
 * says where you are and jumps to any of them. Everywhere else (touch, small screens, reduced
 * motion) they stack, each drawn once when it comes in. The server HTML is the stacked list,
 * one screen tall per product where the track will exist, so hydrating never changes the height.
 *
 * No solid amber here (the hero's is the page's first; Media's is the next): «Conocer» is the
 * quiet button.
 */
export function ProductsSection() {
  const t = useTranslations('products');
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { play } = useSound();
  const motion = useProductsMotion(root, setActive);
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      ref={root}
      id={SECTION_IDS.products}
      aria-labelledby="products-title"
      className="pd theme-dark grain relative isolate bg-night"
      style={{ ['--pd-n' as string]: products.length }}
    >
      <div aria-hidden className="pd-light" />
      <div className="pd-head container-x">
        <SectionMark section="products" />
        <h2 id="products-title" className="display pd-title">
          {t.rich('title', { em })}
        </h2>
        <p className="pd-sub">{t('sub')}</p>
      </div>

      <div data-pd-pin-spacer>
        <div className="pd-stage" data-pd-stage>
          <div aria-hidden className="pd-orb-wrap">
            <span className="pd-orb" data-pd-orb />
          </div>
          <ol className="pd-track" data-pd-track aria-label={t('listLabel')}>
            {products.map((p, i) => (
              <ProductScreen key={p.id} product={p} index={i} total={products.length} />
            ))}
          </ol>

          {/* Track mode only (CSS): where you are, and a way to jump to any product. */}
          <div className="pd-rail container-x" role="group" aria-label={t('railLabel')}>
            <div aria-hidden className="pd-rail-line">
              <span className="pd-rail-fill" data-pd-fill />
            </div>
            <ol className="pd-rail-list">
              {products.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="pd-rail-btn"
                    aria-current={i === active ? 'true' : undefined}
                    onClick={() => {
                      play('select');
                      motion.goTo(i);
                    }}
                  >
                    <span aria-hidden className="pd-rail-index readout">
                      {pad(i + 1)}
                    </span>
                    <span>{t.has(`items.${p.id}.title`) ? t(`items.${p.id}.title`) : t(`items.${p.id}.name`)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductScreen({ product, index, total }: { product: Product; index: number; total: number }) {
  const t = useTranslations('products');
  const id = product.id;
  const name = t(`items.${id}.name`);
  // «Eclipse para inmobiliarias / locales de comida / ecommerce» (decision of Ignacio, 28/10/2026): the screen leads with
  // who it is for and «Eclipse para» rides in the label above; Handy and the coming ones keep their own name.
  const titled = t.has(`items.${id}.title`);
  const title = titled ? t(`items.${id}.title`) : name;
  const nameId = `pd-${id}-name`;
  const knowClass = 'btn btn-ghost pd-know';
  // «Conocer Eclipse para locales de comida» doesn't fit a phone: those say «Conocer más», named in full for AT.
  const knowLabel = titled ? t('knowMoreAbout', { name }) : undefined;
  const know = (
    <>
      {titled ? t('knowMore') : t('know', { name })}
      <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.6} />
    </>
  );

  return (
    <li id={`pd-${id}`} className="pd-screen" data-pd-screen data-product={id} aria-labelledby={nameId}>
      <div className="pd-screen-inner container-x">
        <div className="pd-copy" data-pd-copy>
          <p className="pd-meta">
            <span aria-hidden className="pd-count readout">
              {pad(index + 1)} / {pad(total)}
            </span>
            <span className="pd-rubro">{titled ? t('forLabel') : t(`items.${id}.rubro`)}</span>
          </p>
          <h3 id={nameId} className="display pd-name">
            {title}
          </h3>
          <p className="pd-line">{t(`items.${id}.line`)}</p>
          <ul className="pd-points">
            {product.points.map((key) => (
              <li key={key}>
                <span aria-hidden className="pd-tick" />
                {t(`items.${id}.points.${key}`)}
              </li>
            ))}
          </ul>
          {product.status === 'soon' ? (
            // «Próximamente»: no page and no price yet; a heads-up over WhatsApp instead of «Conocer».
            <div className="pd-foot" data-soon>
              <p className="pd-soon">
                <PhaseGlyph phase={STATUS_PHASE.soon} size={16} className="pd-status-glyph" />
                <span>{t('status.soon')}</span>
                <span className="sr-only"> · {t('soonNote')}</span>
              </p>
              <UnitAsk unit={id} origin="product" message={t(`items.${id}.ask`)} className="pd-notify">
                {t('page.notify')}
              </UnitAsk>
            </div>
          ) : (
          <div className="pd-foot">
            <ProductStatus id={id} />
            {product.site ? (
              <a href={product.site} className={knowClass} aria-label={knowLabel}>
                {know}
              </a>
            ) : (
              <Link href={productPath(id)} className={knowClass} aria-label={knowLabel} data-transition="light" data-transition-label={name}>
                {know}
              </Link>
            )}
          </div>
          )}
        </div>
        <div className="pd-art ticks" data-pd-art>
          <ProductArt id={id} />
          <span aria-hidden className="pd-scan" data-art-scan />
        </div>
      </div>
    </li>
  );
}
