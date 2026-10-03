'use client';

import { useId, useState, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { l, verticalById, type FounderSlot } from '@/lib/content';
import { caseHref, isExternalUrl, logoSrc, monogram } from '@/lib/founders';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';

const pad = (n: number) => String(n).padStart(2, '0');

/** Small deterministic offsets so the figure reads as a constellation, not a zigzag. */
const JITTER = [0, 5, -7, 3, -4, 6, -2, 4];

interface Point {
  x: number;
  y: number;
}

/** Wide screens: the stars run left → right in a W (Cassiopeia has five). */
function widePoints(n: number): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: n === 1 ? 50 : 7 + (86 * i) / (n - 1),
    y: (i % 2 === 0 ? 30 : 70) + JITTER[i % JITTER.length],
  }));
}
/** Phones: the same W, standing up. */
function tallPoints(n: number): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: (i % 2 === 0 ? 20 : 80) + JITTER[(i + 3) % JITTER.length] * 0.6,
    y: n === 1 ? 50 : 7 + (86 * i) / (n - 1),
  }));
}

/** Faint field stars behind the figure (deterministic → same SSR / client markup). */
const FIELD = Array.from({ length: 34 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return { x: Math.round((a - Math.floor(a)) * 1000) / 10, y: Math.round((b - Math.floor(b)) * 1000) / 10, r: i % 4 === 0 ? 1.4 : 0.8 };
});

/**
 * "Clientes fundadores" as a constellation: one star per slot of the program,
 * joined by hairlines. A free slot is a hollow star — "Tu negocio acá" — and a
 * real link to WhatsApp; hovering or focusing it lights the star and its lines.
 * A taken slot (content/founders.json) is a solid star with the client's name.
 * Never fake: slots are whatever content says.
 */
export function Constellation({
  slots,
  total,
  message,
  label,
  demoFilled = false,
}: {
  slots: FounderSlot[];
  total: number;
  message: string;
  /** Accessible name of the list of slots. */
  label: string;
  /** Lab samples only: labels taken slots as "Demo". */
  demoFilled?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = slots.length;
  const wide = widePoints(n);
  const tall = tallPoints(n);

  const lit = (a: number, b: number) => active === a || active === b;
  const lines = (points: Point[], className: string) => (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={`fd-lines ${className}`} focusable="false">
      {FIELD.map((s, i) => (
        <line key={i} x1={s.x} y1={s.y} x2={s.x} y2={s.y} strokeWidth={s.r * 1.6} className="fd-field" />
      ))}
      {points.slice(1).map((p, i) => (
        <line
          key={i}
          x1={points[i].x}
          y1={points[i].y}
          x2={p.x}
          y2={p.y}
          data-lit={lit(i, i + 1) ? '' : undefined}
          className="fd-line"
        />
      ))}
    </svg>
  );

  return (
    <div className="fd-sky" data-filled={slots.some((s) => s.filled) ? '' : undefined} style={{ '--n': n } as CSSProperties}>
      <span aria-hidden className="fd-sky-ticks ticks" />
      {lines(wide, 'fd-lines--wide')}
      {lines(tall, 'fd-lines--tall')}
      <ol aria-label={label} className="fd-stars">
        {slots.map((slot, i) => {
          const style = {
            '--wx': `${wide[i].x}%`,
            '--wy': `${wide[i].y}%`,
            '--tx': `${tall[i].x}%`,
            '--ty': `${tall[i].y}%`,
          } as CSSProperties;
          return (
            <li
              key={slot.id}
              style={style}
              data-side-wide={wide[i].x > 78 ? 'left' : 'right'}
              data-side-tall={tall[i].x > 50 ? 'left' : 'right'}
              data-active={active === i ? '' : undefined}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              className={`fd-star ${slot.filled ? 'fd-star--filled' : 'fd-star--free'}`}
            >
              {slot.filled ? (
                <TakenStar slot={slot} position={i + 1} demo={demoFilled} />
              ) : (
                <FreeStar slot={slot} position={i + 1} total={total} message={message} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StarMark() {
  return (
    <span aria-hidden className="fd-mark">
      <span className="fd-mark-glow" />
      <span className="fd-mark-ring" />
      <span className="fd-mark-core" />
    </span>
  );
}

function FreeStar({ slot, position, total, message }: { slot: FounderSlot; position: number; total: number; message: string }) {
  const t = useTranslations('founders.slot');
  return (
    <WhatsAppLink
      origin="founders"
      message={message}
      extra={{ slot: slot.id }}
      aria-label={t('ctaLabel', { n: position, total })}
      onClick={() => track('founder_cta_clicked', { slot: slot.id, position })}
      className="fd-star-link"
    >
      <StarMark />
      <span className="fd-star-text">
        <span className="fd-star-index">
          {pad(position)} · {t('free')}
        </span>
        <span className="fd-star-title">{t('emptyTitle')}</span>
        <span className="fd-star-cta">
          {t('cta')}
          <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </span>
      </span>
    </WhatsAppLink>
  );
}

function TakenStar({ slot, position, demo }: { slot: FounderSlot; position: number; demo: boolean }) {
  const t = useTranslations('founders.slot');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const name = slot.name?.trim() || t('number', { n: position });
  const vertical = verticalById(slot.vertical);
  const verticalName = vertical && vertical.id !== 'otro' ? l(vertical.name, locale) : null;
  const result = l(slot.result, locale);
  const src = logoSrc(slot.logo);
  const href = caseHref(slot.caseUrl);
  const external = href ? isExternalUrl(href) : false;

  const nameId = useId();
  return (
    <article aria-labelledby={nameId} className="fd-star-link fd-star-link--taken">
      <StarMark />
      <div className="fd-star-text">
        <p className="fd-star-index">
          {pad(position)} · {t('founder')}
          {demo ? <span className="badge-demo ml-2 align-middle">{tc('demo')}</span> : null}
        </p>
        <div className="fd-star-name">
          {src ? (
            // Static export with unoptimized images: a plain <img> is what next/image would render anyway.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={t('logoAlt', { name })} width={28} height={28} loading="lazy" decoding="async" className="fd-star-logo" />
          ) : (
            <span aria-hidden className="fd-star-monogram">
              {monogram(name)}
            </span>
          )}
          <h3 id={nameId} className="fd-star-title">
            {name}
          </h3>
        </div>
        {verticalName ? <p className="fd-star-rubro">{verticalName}</p> : null}
        {result ? <p className="fd-star-result">{result}</p> : null}
        {href ? (
          <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="fd-star-case">
            {t('case')}
            <span className="sr-only"> {t('caseOf', { name })}</span>
            <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
          </a>
        ) : null}
      </div>
    </article>
  );
}
