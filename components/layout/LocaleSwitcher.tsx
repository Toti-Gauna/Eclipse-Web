'use client';

import { Suspense, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getPathname, usePathname } from '@/i18n/navigation';
import { BASE_PATH } from '@/lib/env';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { track } from '@/lib/analytics';

const LOCALE_STORAGE_KEY = 'eclipse:locale';

/** Remembers the choice (the root page's language redirect reads it) and tracks the change. */
export function rememberLocale(from: Locale, to: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, to);
  } catch {
    // ignore
  }
  if (from !== to) track('locale_changed', { from, to });
}

type HrefFor = (locale: Locale) => string;

function Hrefs({ query, children }: { query?: Record<string, string>; children: (hrefFor: HrefFor) => ReactNode }) {
  const pathname = usePathname();
  return children((locale) => `${BASE_PATH}${getPathname({ href: { pathname, query }, locale })}`);
}

function WithQuery({ children }: { children: (hrefFor: HrefFor) => ReactNode }) {
  const params = useSearchParams();
  const query = Object.fromEntries(params.entries());
  return <Hrefs query={Object.keys(query).length ? query : undefined}>{children}</Hrefs>;
}

/**
 * Render prop with the URL of the current page in another locale. Keeps the path and
 * the query (shared plans survive). Links built with it must be real document
 * navigations (plain <a>, not next/link): the whole <html> changes language and the
 * loader's head script is never re-rendered by React.
 */
export function LocaleHrefs({ children }: { children: (hrefFor: HrefFor) => ReactNode }) {
  return (
    <Suspense fallback={<Hrefs>{children}</Hrefs>}>
      <WithQuery>{children}</WithQuery>
    </Suspense>
  );
}

/**
 * ES / EN / PT as a compact pill. (The header, menu and footer use <PrefsPanel>.)
 * `landmark={false}` renders a labelled group instead of a <nav>.
 * The visual pill is 36px tall; a ::before extends each link's hit area to 44px.
 */
export function LocaleSwitcher({ className = '', landmark = true }: { className?: string; landmark?: boolean }) {
  const t = useTranslations();
  const current = useLocale() as Locale;
  const links = (
    <LocaleHrefs>
      {(hrefFor) => (
        <ul className="flex items-center rounded-full border border-line p-0.5">
          {routing.locales.map((locale) => {
            const active = locale === current;
            return (
              <li key={locale}>
                <a
                  href={hrefFor(locale)}
                  hrefLang={localeTags[locale]}
                  lang={localeTags[locale]}
                  aria-current={active ? 'true' : undefined}
                  // Visible text first ("PT"), so voice control users can say what they see (WCAG 2.5.3).
                  aria-label={`${locale.toUpperCase()} — ${t(`languages.${locale}`)}`}
                  onClick={() => rememberLocale(current, locale)}
                  className={`relative grid h-9 min-w-11 place-items-center rounded-full px-2 font-mono text-xs uppercase tracking-wider transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:rounded-full ${
                    active ? 'bg-fg text-fg-inverse' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {locale}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </LocaleHrefs>
  );
  return landmark ? (
    <nav aria-label={t('header.language')} className={className}>
      {links}
    </nav>
  ) : (
    <div role="group" aria-label={t('header.language')} className={className}>
      {links}
    </div>
  );
}
