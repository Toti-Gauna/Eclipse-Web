'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Award, ChevronRight, Plus, ShoppingBag } from 'lucide-react';
import { GRINDS, LOW_STOCK, PRODUCTS, SIZES, productById, unitUsd, type BrewId, type GrindId, type Line, type ProductId } from '../data';
import { useShop } from '../context';
import { Bag, useShopMoney, useShopText } from '../ui';
import { useFront } from './context';

/** The grind a product page starts with (what it's best for). */
export const defaultGrind = (id: ProductId): GrindId => {
  const p = productById(id);
  if (p.kind === 'gear') return 'beans';
  const first: BrewId | undefined = p.brew[0];
  return first ?? 'beans';
};
const defaultLine = (id: ProductId): Line => ({ product: id, size: 's250', grind: defaultGrind(id), qty: 1 });

/** Store home: hero, categories, the shelf of bags, the club teaser. */
export function Catalog() {
  const f = useFront();
  const t = useTranslations('demoShop.front');
  const list = PRODUCTS.filter((p) => f.ui.cat === 'all' || p.kind === f.ui.cat);
  return (
    <div className="sf-catalog">
      <section className="sf-hero">
        <div className="sf-hero-copy">
          <p className="sf-kicker demo-mono">{t('hero.kicker')}</p>
          <h3 className="sf-hero-title demo-display">{t.rich('hero.title', { em: (c) => <em>{c}</em> })}</h3>
          <p className="sf-hero-body">{t('hero.body')}</p>
        </div>
        <div className="sf-hero-art" aria-hidden>
          <Bag product="huila" className="sf-hero-bag" style={{ '--i': 0 } as CSSProperties} />
          <Bag product="cerrado" className="sf-hero-bag" style={{ '--i': 1 } as CSSProperties} />
          <Bag product="niebla" className="sf-hero-bag" style={{ '--i': 2 } as CSSProperties} />
        </div>
      </section>
      <div className="sf-cats" role="group" aria-label={t('cats.label')}>
        {(['all', 'coffee', 'gear'] as const).map((c) => (
          <button key={c} type="button" className="sf-pill" aria-pressed={f.ui.cat === c} onClick={() => f.act(() => ({ cat: c }))}>
            {t(`cats.${c}`)}
          </button>
        ))}
      </div>
      <ul className="sf-grid">
        {list.map((p) => (
          <Tile key={p.id} id={p.id} />
        ))}
      </ul>
      <button type="button" className="sf-clubstrip" onClick={() => f.act(() => ({ screen: 'club', sheet: null }))}>
        <span className="sf-clubstrip-icon" aria-hidden>
          <Award strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1 text-left leading-[1.25]">
          <span className="block font-semibold">{t('clubStrip.title')}</span>
          <span className="block text-[0.86em] opacity-80">{t('clubStrip.body')}</span>
        </span>
        <ChevronRight aria-hidden strokeWidth={2} className="sf-clubstrip-go" />
      </button>
    </div>
  );
}

function Tile({ id }: { id: ProductId }) {
  const f = useFront();
  const { view } = useShop();
  const t = useTranslations('demoShop');
  const { product } = useShopText();
  const money = useShopMoney();
  const p = productById(id);
  const line = defaultLine(id);
  const left = view.stock[id];
  const low = p.kind === 'coffee' && left <= LOW_STOCK;
  return (
    <li className="sf-tile" style={{ '--tint': p.tint } as CSSProperties}>
      <button
        type="button"
        className="sf-tile-main"
        onClick={() => f.act(() => ({ screen: 'product', product: id, size: 's250', grind: defaultGrind(id), sheet: null }))}
      >
        <span className="sf-tile-art">
          <Bag product={id} />
        </span>
        <span className="sf-tile-name demo-display">{product(id)}</span>
        <span className="sf-tile-notes">{t(`products.${id}.notes`)}</span>
        <span className="sf-tile-price demo-mono">
          {p.kind === 'coffee' ? <span className="sf-tile-from">{t('front.from')} </span> : null}
          {money.fmt(money.local(unitUsd(line)))}
        </span>
      </button>
      {low ? <span className="sf-tile-flag demo-mono">{t('front.left', { count: left })}</span> : null}
      <button type="button" className="sf-tile-add" aria-label={t('front.addNamed', { name: product(id) })} onClick={() => f.add(line)}>
        <Plus aria-hidden strokeWidth={2.2} />
      </button>
    </li>
  );
}

/** Product page: the bag, tasting notes, grind and size pills, specs, add to cart. */
export function ProductPage() {
  const f = useFront();
  const t = useTranslations('demoShop');
  const { product, size: sizeLabel, grind: grindLabel } = useShopText();
  const money = useShopMoney();
  const p = productById(f.ui.product);
  const coffee = p.kind === 'coffee';
  const line: Line = { product: p.id, size: coffee ? f.ui.size : 's250', grind: coffee ? f.ui.grind : 'beans', qty: 1 };
  const price = money.fmt(money.line(line));
  return (
    <div className="sf-product">
      <button type="button" className="sf-back" onClick={() => f.act(() => ({ screen: 'catalog' }), 'close')}>
        <ArrowLeft aria-hidden strokeWidth={2} />
        {t('front.back')}
      </button>
      <div className="sf-product-art" style={{ background: p.tint }}>
        <Bag product={p.id} size={line.size} className="sf-product-bag" />
        {coffee ? (
          <span className="sf-stamp" aria-hidden>
            <span className="demo-mono">{t('front.product.stampTop')}</span>
            <b className="demo-display">{t('front.product.stampDay')}</b>
          </span>
        ) : null}
      </div>
      <div className="sf-product-info">
        <p className="sf-kicker demo-mono">{t(`products.${p.id}.origin`)}</p>
        <div className="sf-product-titlerow">
          <h3 className="sf-product-name demo-display">{product(p.id)}</h3>
          <span className="sf-product-price demo-mono">{price}</span>
        </div>
        <p className="sf-product-notes">{t(`products.${p.id}.about`)}</p>
        {coffee ? (
          <>
            <fieldset className="sf-opts">
              <legend>{t('front.product.grind')}</legend>
              <div className="sf-opts-row">
                {GRINDS.map((g) => (
                  <button key={g} type="button" className="sf-pill" aria-pressed={f.ui.grind === g} onClick={() => f.act(() => ({ grind: g }))}>
                    {grindLabel(g)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="sf-opts">
              <legend>{t('front.product.size')}</legend>
              <div className="sf-opts-row">
                {SIZES.map((s) => (
                  <button key={s} type="button" className="sf-pill sf-pill-size" aria-pressed={f.ui.size === s} onClick={() => f.act(() => ({ size: s }))}>
                    <span>{sizeLabel(s)}</span>
                    <span className="demo-mono">{money.fmt(money.local(unitUsd({ product: p.id, size: s })))}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : null}
        <dl className="sf-specs">
          {coffee ? (
            <div>
              <dt>{t('front.product.roast')}</dt>
              <span aria-hidden className="sf-leader" />
              <dd>
                <span className="sf-roast" aria-hidden>
                  {[1, 2, 3].map((i) => (
                    <span key={i} data-on={i <= (p.roast ?? 0) ? '' : undefined} />
                  ))}
                </span>
                {t(`front.product.roasts.${p.roast ?? 2}`)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{coffee ? t('front.product.process') : t('front.product.material')}</dt>
            <span aria-hidden className="sf-leader" />
            <dd>{t(`products.${p.id}.process`)}</dd>
          </div>
          <div>
            <dt>{t('front.product.bestFor')}</dt>
            <span aria-hidden className="sf-leader" />
            <dd>{p.brew.map((b) => t(`front.brew.${b}`)).join(' · ')}</dd>
          </div>
        </dl>
        <div className="sf-buybar">
          <span className="sf-buybar-price">
            <span className="sf-buybar-label">{coffee ? `${sizeLabel(line.size)} · ${grindLabel(line.grind)}` : t(`products.${p.id}.short`)}</span>
            <b className="demo-mono">{price}</b>
          </span>
          <button type="button" className="sf-cta" onClick={() => f.add(line, true)}>
            <ShoppingBag aria-hidden strokeWidth={2} />
            {t('front.product.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
