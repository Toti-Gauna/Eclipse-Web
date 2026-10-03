'use client';

import { useId, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { l, verticalById, type FounderSlot } from '@/lib/content';
import { caseHref, isExternalUrl, logoSrc, monogram } from '@/lib/founders';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A free founder slot: dashed amber outline that breathes, "Tu negocio acá" and
 * "Quiero ser fundador" (a real WhatsApp link stretched over the whole card).
 */
export function EmptySlot({
  slot,
  position,
  total,
  message,
}: {
  slot: FounderSlot;
  /** 1-based position in the program. */
  position: number;
  total: number;
  message: string;
}) {
  const t = useTranslations('founders.slot');
  return (
    <div className="founder-slot founder-slot--empty" style={{ '--i': position - 1 } as CSSProperties}>
      <span aria-hidden className="founder-slot-glow" />
      <p className="founder-slot-index flex items-center justify-between gap-2">
        <span aria-hidden className="tabular">{pad(position)}</span>
        <span className="sr-only">{t('number', { n: position })}</span>
        <span>{t('free')}</span>
      </p>
      <p className="display mt-auto pt-8 text-[1.75rem] text-fg sm:text-[2rem]">{t('emptyTitle')}</p>
      <WhatsAppLink
        origin="founders"
        message={message}
        extra={{ slot: slot.id }}
        aria-label={t('ctaLabel', { n: position, total })}
        onClick={() => track('founder_cta_clicked', { slot: slot.id, position })}
        className="founder-slot-cta mt-5 flex min-h-11 items-center justify-between gap-3 text-sm font-medium leading-snug text-fg"
      >
        <span>{t('cta')}</span>
        <span
          aria-hidden
          className="founder-slot-arrow grid size-10 shrink-0 place-items-center rounded-full bg-corona text-ink shadow-[0_10px_30px_-10px_rgb(245_185_66/0.9)]"
        >
          <ArrowUpRight className="size-4" strokeWidth={1.75} />
        </span>
      </WhatsAppLink>
    </div>
  );
}

/** A taken slot: logo (or monogram), name, rubro, the result in one line and the case link. */
export function FilledSlot({ slot, position, demo = false }: { slot: FounderSlot; position: number; demo?: boolean }) {
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
    <article className="founder-slot founder-slot--filled" aria-labelledby={nameId}>
      <p className="founder-slot-index flex items-center justify-between gap-2">
        <span aria-hidden className="tabular">
          {pad(position)}
        </span>
        <span>{t('founder')}</span>
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        {src ? (
          // Static export with unoptimized images: a plain <img> is what next/image would render anyway.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={t('logoAlt', { name })}
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="size-12 shrink-0 rounded-full border border-line bg-white object-contain p-1"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-serif text-xl tracking-wide text-dawn shadow-[0_0_0_4px_rgb(245_185_66/0.25)]"
          >
            {monogram(name)}
          </span>
        )}
        {demo ? <span className="badge-demo">{tc('demo')}</span> : null}
      </div>
      <h3 id={nameId} className="display mt-5 text-[1.7rem] leading-[1.02] sm:text-[1.9rem]">
        {name}
      </h3>
      {verticalName ? <p className="eyebrow mt-2">{verticalName}</p> : null}
      {result ? <p className="mt-4 text-sm leading-snug text-fg">{result}</p> : null}
      {href ? (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          {t('case')}
          <span className="sr-only"> {t('caseOf', { name })}</span>
          <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
        </a>
      ) : null}
    </article>
  );
}
