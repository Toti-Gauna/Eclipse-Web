'use client';

import { useTranslations } from 'next-intl';
import type { DemoProps } from '../types';

// Placeholder screen (phase 4). The navigable demo replaces it in phase 6.
export default function GymDemo({ screen }: DemoProps) {
  const t = useTranslations('common');
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3cqw] p-[6cqw] text-center">
      <span className="badge-demo">{t('demo')}</span>
      <p className="font-serif text-[9cqw] leading-none">{'Órbita Fitness'}</p>
      <p className="text-[3.5cqw] text-mist-ink">{screen}</p>
    </div>
  );
}
