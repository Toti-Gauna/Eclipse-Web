import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { pagedProducts, productById, type ProductId } from '@/lib/content';
import { productPath, PRODUCTS_HREF } from '@/components/layout/navLinks';
import { DemoExperienceHost } from '@/components/demo-experience/DemoExperienceHost';
import { UnitLedger, UnitNote } from '@/components/units/UnitBlocks';
import { UnitAsk } from '@/components/units/UnitAsk';
import { OpenDemoButton } from './OpenDemoButton';
import { ProductLevels } from './ProductLevels';
import { ProductPlate } from './ProductPlate';
import { ProductStatus } from './ProductStatus';
import { launchDate } from '@/components/sections/products/products';
import type { Locale } from '@/i18n/routing';
import './product-page.css';

/**
 * /productos/<id>/ — where «Conocer <producto>» leads while the product has no site of its own
 * (content/products.json `site`). All in dawn light (decision of Ignacio, 28/10/2026: «Conocer X» opens like the
 * Lumen demo, into the light — PageTransition's light screen). The name as the page's one big moment, what it is for, its
 * status (the only price is Roofy's «desde», from content/levels.json), what it includes, what is
 * still being designed (marked «En diseño», never as included) and how to start.
 *
 * Roofy (on sale): «Ver la demo» opens the Lumen demo in the "Ver demo" layer (mounted here) and
 * the six levels follow, each with its demo and «Pedir este plan». Foody and Markyt (in the works):
 * «Avisame cuando esté» over WhatsApp. Handy (its own team, launching on its date): a question
 * over WhatsApp.
 */
export function ProductPage({ id, locale }: { id: ProductId; locale: Locale }) {
  const t = useTranslations('products');
  const product = productById(id);
  if (!product) return null;
  const name = t(`items.${id}.name`);
  const date = launchDate(product, locale) ?? '';
  const others = pagedProducts.filter((p) => p.id !== id);
  const available = product.status === 'available' && product.vertical;

  return (
    <main id="main" className="bg-dawn">
      <section
        aria-labelledby="pp-title"
        data-header-theme="light"
        className="u-hero pp-hero theme-light relative isolate overflow-clip bg-dawn"
        data-product={id}
      >
        <div aria-hidden className="u-hero-light" />
        <div className="container-x u-hero-grid">
          <div className="u-hero-copy">
            <p className="pp-kicker">
              <span>{t('page.eyebrow')}</span>
              <span aria-hidden className="pp-kicker-rule" />
              <span>{t(`items.${id}.rubro`)}</span>
            </p>
            <h1 id="pp-title" className="display u-h1-name pp-name">
              {name}
            </h1>
            <p className="display u-statement">{t(`items.${id}.line`)}</p>
            <p className="u-lead">{t(`items.${id}.lead`)}</p>
            <ProductStatus id={id} />
            <div data-page-cta className="u-cta">
              {available && product.vertical ? (
                <>
                  <OpenDemoButton vertical={product.vertical} className="btn btn-primary">
                    {t('page.demo')}
                    <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.8} />
                  </OpenDemoButton>
                  <UnitAsk unit={id} origin="product" message={t(`items.${id}.ask`)} className="btn btn-ghost">
                    {t('page.ask')}
                  </UnitAsk>
                </>
              ) : (
                <UnitAsk unit={id} origin="product" message={t(`items.${id}.ask`)}>
                  {product.status === 'planned' ? t('page.notify') : t('page.ask')}
                </UnitAsk>
              )}
            </div>
            {available ? <p className="pp-note">{t('page.demoNote')}</p> : null}
          </div>
          <ProductPlate id={id} />
        </div>
      </section>

      <UnitLedger
        light
        id="included"
        title={t('page.included')}
        rows={product.features.map((key) => ({ key, name: t(`items.${id}.features.${key}.name`), text: t(`items.${id}.features.${key}.text`) }))}
      />
      {product.later.length ? (
        <UnitLedger
          light
          id="later"
          title={t('page.later')}
          rows={product.later.map((key) => ({
            key,
            name: t(`items.${id}.later.${key}.name`),
            text: `${t(`items.${id}.later.${key}.text`)} ${t('page.laterText')}`,
            tag: t('page.later'),
          }))}
        />
      ) : null}

      {available && product.vertical ? (
        <section data-header-theme="light" aria-label={t('page.start')} className="pp-levels theme-light bg-dawn">
          <div className="container-x">
            <p className="pp-start">{t(`items.${id}.start`)}</p>
            <ProductLevels vertical={product.vertical} />
          </div>
        </section>
      ) : (
        <UnitNote light title={t('page.start')}>
          <p>{t(`items.${id}.start`, { date })}</p>
        </UnitNote>
      )}

      <nav aria-labelledby="pp-others-title" data-header-theme="light" className="u-band u-others theme-light bg-dawn">
        <div className="container-x">
          <h2 id="pp-others-title" className="label u-others-title">
            {t('page.others')}
          </h2>
          <ul className="u-others-list">
            {others.map((p) => (
              <li key={p.id}>
                <Link href={productPath(p.id)} className="u-other" data-transition="light" data-transition-label={t(`items.${p.id}.name`)}>
                  <span className="display u-other-name">{t(`items.${p.id}.name`)}</span>
                  <span className="u-other-short">{t(`items.${p.id}.line`)}</span>
                  <ArrowUpRight aria-hidden className="u-other-arrow" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
          <p className="pp-all">
            <Link href={PRODUCTS_HREF} className="u-toc-link">
              {t('page.all')}
            </Link>
          </p>
        </div>
      </nav>
      {available ? <DemoExperienceHost /> : null}
    </main>
  );
}
