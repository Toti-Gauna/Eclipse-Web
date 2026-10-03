'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getPathname, usePathname } from '@/i18n/navigation';
import { BASE_PATH } from '@/lib/env';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { track } from '@/lib/analytics';

const LOCALE_STORAGE_KEY = 'eclipse:locale';

function remember(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

function Links({ query, tone }: { query?: Record<string, string>; tone: 'pill' | 'plain' }) {
  const t = useTranslations();
  const current = useLocale() as Locale;
  const pathname = usePathname();
  return (
    <ul className={tone === 'pill' ? 'flex items-center rounded-full border border-line p-0.5' : 'flex items-center gap-1'}>
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <li key={locale}>
            {/* A real document navigation (not a client transition): the whole <html> changes
                language, and the loader's head script is never re-rendered by React. */}
            <a
              href={`${BASE_PATH}${getPathname({ href: { pathname, query }, locale })}`}
              hrefLang={localeTags[locale]}
              lang={localeTags[locale]}
              aria-current={active ? 'true' : undefined}
              // Visible text first ("PT"), so voice control users can say what they see (WCAG 2.5.3).
              aria-label={`${locale.toUpperCase()} — ${t(`languages.${locale}`)}`}
              onClick={() => {
                remember(locale);
                if (!active) track('locale_changed', { from: current, to: locale });
              }}
              className={`relative grid h-9 min-w-11 place-items-center rounded-full px-2 text-xs before:absolute before:inset-x-0 before:-inset-y-1 before:rounded-full font-medium uppercase tracking-wider transition-colors ${
                active ? 'bg-fg text-fg-inverse' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {locale}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function WithQuery({ tone }: { tone: 'pill' | 'plain' }) {
  const params = useSearchParams();
  const query = Object.fromEntries(params.entries());
  return <Links tone={tone} query={Object.keys(query).length ? query : undefined} />;
}

/**
 * ES / EN / PT. Keeps the current path and query (shared plans survive).
 * `landmark={false}` renders a labelled group instead of a <nav>, for a second
 * copy on the same page (footer): two "Idioma" navigation landmarks are ambiguous.
 * The visual pill is 36px tall; a ::before extends each link's hit area to 44px.
 */
export function LocaleSwitcher({
  tone = 'pill',
  className = '',
  landmark = true,
}: {
  tone?: 'pill' | 'plain';
  className?: string;
  landmark?: boolean;
}) {
  const t = useTranslations('header');
  const links = (
    <Suspense fallback={<Links tone={tone} />}>
      <WithQuery tone={tone} />
    </Suspense>
  );
  return landmark ? (
    <nav aria-label={t('language')} className={className}>
      {links}
    </nav>
  ) : (
    <div role="group" aria-label={t('language')} className={className}>
      {links}
    </div>
  );
}
