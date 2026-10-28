'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bone,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarSync,
  CalendarX,
  ChartLine,
  ChefHat,
  Clapperboard,
  ClipboardList,
  Contact,
  Dumbbell,
  Flame,
  Gauge,
  Globe,
  GraduationCap,
  Hammer,
  HeartPulse,
  House,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Package,
  PawPrint,
  QrCode,
  ShoppingBag,
  Smartphone,
  Smile,
  Stethoscope,
  Store,
  Truck,
  UserCheck,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Eclipse } from '@/components/hero/Eclipse';
import { ProductArt } from '@/components/sections/products/ProductArt';
import { Walker } from '@/components/sections/products/Walker';
import { ProductStatus } from '@/components/products/ProductStatus';
import { UnitArt } from '@/components/units/UnitEmblem';
import { EquipmentSheet } from '@/components/sections/equipment/EquipmentSheet';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { l, levels, productById, type ProductId } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { GEO, ORBIT_PRODUCTS, ORBIT_UNITS, STAGE, onOrbit, productAngle, unitAngle, type Layout, type OrbitUnit } from './geometry';

/** The four products the film zooms into (the ones with a page), then the four coming soon. */
export const ZOOMED: ProductId[] = ['roofy', 'foody', 'markyt', 'handy'];
export const COMING: ProductId[] = ['gym', 'dental', 'clinic', 'vet'];

const PRODUCT_ICON: Record<ProductId, LucideIcon> = {
  roofy: House,
  foody: ChefHat,
  markyt: ShoppingBag,
  handy: Wrench,
  gym: Dumbbell,
  dental: Smile,
  clinic: HeartPulse,
  vet: PawPrint,
};
const UNIT_ICON: Record<OrbitUnit, LucideIcon> = {
  media: Clapperboard,
  academy: GraduationCap,
  intelligence: Gauge,
  agency: Workflow,
  equipment: Package,
};
/** One drawing per thing a product includes (Lucide, thin stroke): what the visitor gets, at a glance. */
const POINT_ICON: Record<string, LucideIcon> = {
  'roofy.web': Globe,
  'roofy.crm': Contact,
  'roofy.visits': CalendarCheck,
  'roofy.chat': MessageCircle,
  'foody.web': Globe,
  'foody.menu': QrCode,
  'foody.bookings': CalendarClock,
  'foody.panel': LayoutDashboard,
  'markyt.store': Store,
  'markyt.catalog': ShoppingBag,
  'markyt.orders': Truck,
  'markyt.crm': Users,
  'handy.trades': Hammer,
  'handy.choose': UserCheck,
  'handy.app': Smartphone,
  'handy.city': MapPin,
  'gym.classes': CalendarClock,
  'gym.streaks': Flame,
  'gym.churn': ChartLine,
  'gym.winback': MessageCircle,
  'dental.booking': CalendarCheck,
  'dental.reschedule': CalendarSync,
  'dental.reception': MessageCircle,
  'dental.patients': ClipboardList,
  'clinic.booking': CalendarCheck,
  'clinic.reminders': BellRing,
  'clinic.noshow': CalendarX,
  'clinic.reception': Stethoscope,
  'vet.record': ClipboardList,
  'vet.visits': House,
  'vet.zones': MapPin,
  'vet.reminders': Bone,
};

const pad = (n: number) => String(n).padStart(2, '0');
const at = (x: number, y: number): CSSProperties => ({ left: x, top: y });

/** Everything the film shows, stacked on the stage; introTimeline.ts brings each scene in and out. */
export function IntroScenes({ layout, activate }: { layout: Layout; activate: ReactNode }) {
  const t = useTranslations('intro');
  const em = (c: ReactNode) => <em>{c}</em>;
  const geo = GEO[layout];
  const { w } = STAGE[layout];

  return (
    <>
      {/* The ecosystem: the world the camera flies through. */}
      <div className="it-world" data-world>
        <Ecosystem layout={layout} />
      </div>

      {/* 0 · Ignition: the wordmark under the eclipse, the four things Eclipse does. */}
      <div className="it-scene it-ignite" data-scene="ignite">
        <p className="it-word" aria-label="Eclipse">
          {'ECLIPSE'.split('').map((c, i) => (
            <span key={i} data-letter aria-hidden>
              {c}
            </span>
          ))}
        </p>
        <p className="it-tagline" data-tagline>
          {t('tagline')}
        </p>
      </div>

      {/* The eclipse itself travels through the film: ignition → the ecosystem's core → the end card. */}
      <div className="it-eclipse" data-eclipse-wrap style={{ width: geo.eclipse, height: geo.eclipse }}>
        <Eclipse size={`${geo.eclipse}px`} />
        <span className="it-glint" data-glint aria-hidden />
      </div>

      {/* 1 · Golpes: four words on the beat. */}
      <div className="it-scene it-golpes" data-scene="golpes">
        {(['g1', 'g2', 'g3', 'g4'] as const).map((k, i) => (
          <div key={k} className="it-golpe" data-golpe={i}>
            <GolpeMark i={i} />
            <p className="it-golpe-n readout">{pad(i + 1)} / 04</p>
            <p className="it-golpe-word display">{t(`golpes.${k}`)}</p>
          </div>
        ))}
      </div>

      {/* 2 · The ecosystem's copy (the world itself is above). */}
      <div className="it-scene it-eco-copy" data-scene="eco">
        <h2 className="it-title display">{t.rich('eco.title', { em })}</h2>
        <p className="it-kicker label" data-eco-kicker>
          <span>{t('eco.products')}</span>
          <span aria-hidden>·</span>
          <span>{t('eco.units')}</span>
        </p>
      </div>

      {/* 3 · Zoom: one panel per product. */}
      <div className="it-scene it-panels" data-scene="panels">
        {ZOOMED.map((id, i) => (
          <ProductPanel key={id} id={id} index={i} />
        ))}
      </div>

      {/* 4 · Coming soon. */}
      <div className="it-scene it-soon" data-scene="soon">
        <h2 className="it-title display">{t('soon.title')}</h2>
        <ol className="it-soon-list">
          {COMING.map((id) => (
            <SoonCard key={id} id={id} />
          ))}
        </ol>
      </div>

      {/* 5 · The units. */}
      <div className="it-scene it-units" data-scene="units">
        <h2 className="it-title display">{t('units.title')}</h2>
        <UnitsRow />
      </div>

      {/* 6 · The six plans, priced from content/levels.json. */}
      <div className="it-scene it-plans" data-scene="plans">
        <h2 className="it-title display">{t('plans.title')}</h2>
        <Plans />
        <p className="it-plans-note" data-plans-note>
          {t('plans.note')}
        </p>
      </div>

      {/* The scene changes: a light that sweeps the stage (the plates' scan, at film size). */}
      <span className="it-wipe" data-wipe aria-hidden />

      {/* 7 · The end card. */}
      <div className="it-scene it-end" data-scene="end">
        <h2 className="it-end-title display" data-end-title>
          {t.rich('end.title', { em })}
        </h2>
        <div className="it-end-cta" data-end-cta>
          {activate}
        </div>
        <p className="it-end-hint" data-end-hint>
          {t('activateHint')}
        </p>
      </div>

      {/* The street: people on their way to the businesses (ecosystem and units). */}
      <svg className="it-ground" data-ground viewBox={`0 0 ${w} 120`} aria-hidden focusable="false" style={{ top: geo.ground - 100, width: w }}>
        <path d={`M0 100H${w}`} className="it-ground-line" />
        <Walker x={-40} y={100} hook="w1" carry="bag" />
        <Walker x={-140} y={100} hook="w2" carry="toolbox" s={0.9} />
        <Walker x={-90} y={100} hook="w3" s={0.82} />
      </svg>
    </>
  );
}

/** The ecosystem: Eclipse at the core (the travelling eclipse sits there), the products' orbit and the units' orbit. */
function Ecosystem({ layout }: { layout: Layout }) {
  const tp = useTranslations('products.items');
  const tu = useTranslations('units');
  const tf = useTranslations('footer');
  const geo = GEO[layout];
  const c = geo.core;
  const node = geo.orbit.node;
  const ring = (r: number, k: string) => (
    <svg className="it-ring" data-ring={k} viewBox={`${c.x - r - 2} ${c.y - r - 2} ${2 * r + 4} ${2 * r + 4}`} style={{ left: c.x - r - 2, top: c.y - r - 2, width: 2 * r + 4, height: 2 * r + 4 }} aria-hidden>
      <circle cx={c.x} cy={c.y} r={r} />
    </svg>
  );
  return (
    <>
      {ring(geo.orbit.products, 'products')}
      {ring(geo.orbit.units, 'units')}
      {/* Spokes: core → node, one packet each (rotate with their orbit). */}
      <div className="it-orbit" data-orbit="products" style={{ left: c.x, top: c.y }}>
        {ORBIT_PRODUCTS.map((id, i) => {
          const soon = productById(id)?.status === 'soon';
          const Icon = PRODUCT_ICON[id];
          const p = onOrbit({ x: 0, y: 0 }, geo.orbit.products, productAngle(i));
          return (
            <div key={id}>
              <span className="it-spoke" data-spoke style={{ width: geo.orbit.products, transform: `rotate(${productAngle(i)}deg)` }}>
                <i data-packet />
              </span>
              <div className="it-node" data-node={id} data-soon={soon || undefined} style={{ ...at(p.x - node / 2, p.y - node / 2), width: node, height: node }}>
                <Icon aria-hidden strokeWidth={1.5} />
                <span className="it-node-name">{tp.has(`${id}.title`) ? tp(`${id}.title`) : tp(`${id}.name`)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="it-orbit" data-orbit="units" style={{ left: c.x, top: c.y }}>
        {ORBIT_UNITS.map((id, i) => {
          const Icon = UNIT_ICON[id];
          const p = onOrbit({ x: 0, y: 0 }, geo.orbit.units, unitAngle(i));
          const name = id === 'equipment' ? tf('equipment') : tu(`${id}.name`).replace(/^Eclipse /, '');
          return (
            <div key={id}>
              <span className="it-spoke it-spoke-far" data-spoke style={{ width: geo.orbit.units, transform: `rotate(${unitAngle(i)}deg)` }}>
                <i data-packet />
              </span>
              <div className="it-node it-node-unit" data-node={id} style={{ ...at(p.x - node / 2, p.y - node / 2), width: node, height: node }}>
                <Icon aria-hidden strokeWidth={1.5} />
                <span className="it-node-name">{name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The golpes' marks: a browser, a system's grid, a frame of film, the nodes all connected (hairlines, no text). */
function GolpeMark({ i }: { i: number }) {
  const marks = [
    <>
      <rect x="6" y="10" width="108" height="76" rx="5" />
      <path d="M6 26H114M16 18H20M26 18H30" />
      <path d="M20 40H70M20 52H96M20 64H58" className="it-soft" />
    </>,
    <>
      <rect x="6" y="10" width="108" height="76" rx="5" />
      <path d="M6 30H114M40 30V86M77 30V86M6 58H114" className="it-soft" />
      <circle cx="58" cy="44" r="5" />
    </>,
    <>
      <rect x="6" y="14" width="108" height="68" rx="3" />
      <path d="M50 34V62L74 48Z" />
      <path d="M6 22H114M6 74H114" className="it-soft" />
    </>,
    <>
      <circle cx="60" cy="48" r="10" />
      {[0, 72, 144, 216, 288].map((a) => {
        const r = (a * Math.PI) / 180;
        const x = 60 + 38 * Math.cos(r);
        const y = 48 + 38 * Math.sin(r);
        return (
          <g key={a}>
            <path d={`M${60 + 10 * Math.cos(r)} ${48 + 10 * Math.sin(r)}L${x - 6 * Math.cos(r)} ${y - 6 * Math.sin(r)}`} className="it-soft" />
            <circle cx={x} cy={y} r="6" />
          </g>
        );
      })}
    </>,
  ];
  return (
    <svg className="it-golpe-mark" viewBox="0 0 120 96" aria-hidden focusable="false" data-golpe-mark>
      {marks[i]}
    </svg>
  );
}

function ProductPanel({ id, index }: { id: ProductId; index: number }) {
  const t = useTranslations('intro');
  const tp = useTranslations('products.items');
  const tf = useTranslations('products');
  const product = productById(id);
  if (!product) return null;
  // «Inmobiliarias», «Locales de comida», «Ecommerce»: what Eclipse offers, by rubro (Ignacio, 28/10/2026).
  const titled = tp.has(`${id}.title`);
  return (
    <section className="it-panel" data-panel={index} aria-label={tp(`${id}.name`)}>
      <div className="it-plate" data-plate>
        <ProductArt id={id} />
        <span aria-hidden className="pd-scan" data-art-scan />
      </div>
      <div className="it-copy">
        <p className="it-copy-n readout" data-copy-in>
          <span>{pad(index + 1)} / 04</span>
          <span className="it-copy-rubro">{titled ? tf('forLabel') : tp(`${id}.rubro`)}</span>
        </p>
        <p className="it-name display" data-name>
          {titled ? tp(`${id}.title`) : tp(`${id}.name`)}
        </p>
        <p className="it-line" data-copy-in>
          {tp(`${id}.line`)}
        </p>
        <p className="it-includes label" data-copy-in>
          {t('includes')}
        </p>
        <ul className="it-points">
          {product.points.map((k) => {
            const Icon = POINT_ICON[`${id}.${k}`] ?? Globe;
            return (
              <li key={k} data-point>
                <span className="it-point-icon" data-point-icon>
                  <Icon aria-hidden strokeWidth={1.5} />
                </span>
                <span>{tp(`${id}.points.${k}`)}</span>
              </li>
            );
          })}
        </ul>
        <div data-copy-in>
          <ProductStatus id={id} className="pd-status it-status" />
        </div>
      </div>
    </section>
  );
}

function SoonCard({ id }: { id: ProductId }) {
  const tp = useTranslations('products');
  const product = productById(id);
  if (!product) return null;
  return (
    <li className="it-soon-card" data-soon-card>
      <div className="it-soon-plate" data-plate>
        <ProductArt id={id} />
      </div>
      <p className="it-soon-name display">{tp(`items.${id}.name`)}</p>
      <p className="it-soon-rubro">{tp(`items.${id}.rubro`)}</p>
      <ul className="it-soon-points">
        {product.points.slice(0, 2).map((k) => {
          const Icon = POINT_ICON[`${id}.${k}`] ?? Globe;
          return (
            <li key={k}>
              <Icon aria-hidden strokeWidth={1.5} />
              <span>{tp(`items.${id}.points.${k}`)}</span>
            </li>
          );
        })}
      </ul>
      <p className="it-soon-pill label">{tp('status.soon')}</p>
    </li>
  );
}

function UnitsRow() {
  const t = useTranslations('intro');
  const tu = useTranslations('units');
  const tf = useTranslations('footer');
  return (
    <div className="it-units-row">
      <span className="it-bus" data-bus aria-hidden>
        <i data-bus-packet />
        <i data-bus-packet />
      </span>
      <ol className="it-units-list">
        {(['media', 'academy', 'intelligence', 'agency', 'equipment'] as const).map((id) => (
          <li key={id} className="it-unit" data-unit>
            <div className="it-unit-plate" data-plate>
              {id === 'equipment' ? <EquipmentSheet active={null} /> : <UnitArt id={id} />}
            </div>
            <p className="it-unit-name display">{id === 'equipment' ? tf('equipment') : tu(`${id}.name`)}</p>
            <p className="it-unit-short">{id === 'equipment' ? t('equipment') : tu(`${id}.short`)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The ladder: a bar per level (height by price), its price rolling up in the visitor's currency, what it adds. */
function Plans() {
  const t = useTranslations('intro');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const top = Math.max(...levels.map((lv) => lv.priceUsd));
  return (
    <ol className="it-plans-list">
      {levels.map((lv) => (
        <li key={lv.id} className="it-plan" data-plan style={{ ['--h' as string]: Math.sqrt(lv.priceUsd / top).toFixed(3) }}>
          <div className="it-plan-top">
            <p className="it-plan-price readout">
              <span data-price data-usd={lv.priceUsd}>
                {format(lv.priceUsd)}
              </span>
              <span className="it-plan-per">{t('perMonth')}</span>
            </p>
            <span className="it-plan-bar" data-plan-bar aria-hidden>
              <i data-bar-glow />
            </span>
          </div>
          <p className="it-plan-name display">{l(lv.name, locale)}</p>
          {lv.priceStatus === 'proposal' ? <p className="it-plan-tag label">{t('plans.proposal')}</p> : null}
          <p className="it-plan-lead">{l(lv.lead, locale)}</p>
          <ul className="it-plan-includes">
            {l(lv.includes, locale)
              .slice(0, 2)
              .map((x) => (
                <li key={x}>{x}</li>
              ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
