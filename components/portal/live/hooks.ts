'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { errorKind, isApiError } from '@/lib/api';
import type { Locale } from '@/i18n/routing';
import { formatDate, formatTimestamp } from '@/lib/portal/format';

/** Words and formatting for the live portal screens (client side; copy in `portalLive` + `portal`). */
export function useLive() {
  const t = useTranslations('portalLive');
  const tp = useTranslations('portal');
  const locale = useLocale() as Locale;

  /** Calendar date from the API ("2026-11-09"). */
  const date = (iso: string) => formatDate(iso, locale);
  /** Timestamp from the API, in the visitor's zone. */
  const stamp = (iso: string) => formatTimestamp(iso, locale);

  /** A message the person can act on, never server text. `ref` is the request id for support. */
  const describe = (error: unknown) => {
    const kind = errorKind(error);
    const seconds = isApiError(error) && error.retryAfter ? Math.min(error.retryAfter, 3600) : null;
    return {
      kind,
      message: kind === 'rateLimited' && seconds ? t('errors.rateLimitedFor', { seconds }) : t(`errors.${kind}`),
      ref: isApiError(error) ? error.requestId : null,
    };
  };

  /** Copy of a "Más información" card (portal.info.<topic>); `chip` adds its visible text (legend). */
  const info = (topic: 'stages' | 'estimate' | 'action' | 'clientReview' | 'support' | 'changes', chip = false) => {
    const title = tp(`info.${topic}.title`);
    return {
      label: tp('info.more', { topic: title }),
      title,
      body: tp(`info.${topic}.body`),
      close: tp('info.close'),
      text: chip ? tp(`info.${topic}.chip`) : undefined,
    };
  };

  return { t, tp, locale, date, stamp, describe, info };
}

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: unknown };

/**
 * Loads a resource when `enabled`, aborts on unmount, and offers `reload` (with the spinner)
 * and `refresh` (silent: keeps what is on screen). Coming back to the tab refreshes silently
 * if the data is older than 30 s ("refetch on focus"). `load` must be stable (useCallback).
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, enabled: boolean) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const [silent, setSilent] = useState(false);
  const loadedAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        loadedAt.current = Date.now();
        setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        // A silent refresh that fails keeps the data already on screen.
        setState((current) => (current.status === 'ready' && silent ? current : { status: 'error', error }));
      },
    );
    return () => controller.abort();
    // `silent` is read when the request settles; it must not restart the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, enabled, tick]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setSilent(false);
    setTick((n) => n + 1);
  }, []);

  const refresh = useCallback(() => {
    setSilent(true);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - loadedAt.current > 30_000) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled, refresh]);

  return { state, reload, refresh };
}
