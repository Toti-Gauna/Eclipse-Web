'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { TourCopy } from './types';

/**
 * Builds the tour's generic copy from the `tour` namespace (client messages).
 * `label` is the accessible name of this tour, e.g. t('tour.labelFor', { name }).
 * The engine itself never reads messages: hosts pass `copy` (this hook is the usual way).
 */
export function useTourCopy(label: string): TourCopy {
  const t = useTranslations('tour');
  return useMemo(
    () => ({
      label,
      next: t('next'),
      prev: t('prev'),
      done: t('done'),
      skip: t('skip'),
      close: t('close'),
      progress: (current: number, total: number) => t('progress', { current, total }),
    }),
    [t, label],
  );
}
