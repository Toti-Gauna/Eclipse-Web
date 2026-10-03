'use client';

import { use, type ReactNode } from 'react';
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from 'next-intl';

import { DEMO_NAMESPACES } from './namespaces';

type Messages = Record<string, unknown>;
const cache = new Map<string, Promise<Messages>>();

function loadMessages(locale: string): Promise<Messages> {
  let promise = cache.get(locale);
  if (!promise) {
    promise = import(`@/messages/${locale}.json`).then((m) => m.default as Messages);
    cache.set(locale, promise);
  }
  return promise;
}

/** Warms the demo copy for a locale (call next to preloadDemo). */
export function preloadDemoMessages(locale: string) {
  void loadMessages(locale);
}

/**
 * Provides the demo namespaces to its children. Suspends (inside the demo's
 * Suspense boundary) until the locale's messages chunk arrives.
 */
export function DemoMessages({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const timeZone = useTimeZone();
  const parent = useMessages() as Messages;
  const all = use(loadMessages(locale));
  // `parent` only carries demo namespaces in development (drafts overlay, see the layout).
  const extra = Object.fromEntries(DEMO_NAMESPACES.map((ns) => [ns, parent[ns] ?? all[ns]]));
  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={{ ...parent, ...extra }}>
      {children}
    </NextIntlClientProvider>
  );
}
