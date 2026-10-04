'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { l, verticalById, type FounderSlot } from '@/lib/content';
import { caseHref, isExternalUrl, logoSrc, monogram } from '@/lib/founders';
import type { Locale } from '@/i18n/routing';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The taken slots of the program (content/founders.json): the client's name (logo or
 * monogram), rubro, result and case link. Renders nothing while no slot is taken —
 * never a placeholder client. `demo` labels them "Demo" (lab samples only).
 */
export function ClientList({ slots, label, demo = false }: { slots: FounderSlot[]; label: string; demo?: boolean }) {
  const taken = slots.map((slot, i) => ({ slot, position: i + 1 })).filter(({ slot }) => slot.filled);
  if (!taken.length) return null;
  return (
    <ol aria-label={label} className="fd-clients">
      {taken.map(({ slot, position }) => (
        <li key={slot.id}>
          <ClientCard slot={slot} position={position} demo={demo} />
        </li>
      ))}
    </ol>
  );
}

function ClientCard({ slot, position, demo }: { slot: FounderSlot; position: number; demo: boolean }) {
  const t = useTranslations('founders.slot');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const nameId = useId();
  const name = slot.name?.trim() || t('number', { n: position });
  const vertical = verticalById(slot.vertical);
  const verticalName = vertical && vertical.id !== 'otro' ? l(vertical.name, locale) : null;
  const result = l(slot.result, locale);
  const src = logoSrc(slot.logo);
  const href = caseHref(slot.caseUrl);
  const external = href ? isExternalUrl(href) : false;

  return (
    <article aria-labelledby={nameId} className="fd-client">
      <p className="fd-client-index">
        {pad(position)} · {t('founder')}
        {demo ? <span className="badge-demo ml-2 align-middle">{tc('demo')}</span> : null}
      </p>
      <div className="fd-client-name">
        {src ? (
          // Static export with unoptimized images: a plain <img> is what next/image would render anyway.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={t('logoAlt', { name })} width={28} height={28} loading="lazy" decoding="async" className="fd-client-logo" />
        ) : (
          <span aria-hidden className="fd-client-monogram">
            {monogram(name)}
          </span>
        )}
        <h3 id={nameId} className="fd-client-title">
          {name}
        </h3>
      </div>
      {verticalName ? <p className="fd-client-rubro">{verticalName}</p> : null}
      {result ? <p className="fd-client-result">{result}</p> : null}
      {href ? (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="fd-client-case">
          {t('case')}
          <span className="sr-only"> {t('caseOf', { name })}</span>
          <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </a>
      ) : null}
    </article>
  );
}
