'use client';

import { lazy, Suspense, useMemo, type ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import type { DemoId } from '@/lib/content';
import { useMediaQuery } from '@/components/motion/useMediaQuery';
import { DeviceFrame } from './DeviceFrame';
import { demoLoaders } from './registry';
import type { DemoProps } from './types';

const lazyDemos: Record<DemoId, ComponentType<DemoProps>> = {
  clinic: lazy(demoLoaders.clinic),
  realEstate: lazy(demoLoaders.realEstate),
  gym: lazy(demoLoaders.gym),
};

/** Preloads a demo's code (call on hover/focus of the control that reveals it). */
export function preloadDemo(id: DemoId) {
  void demoLoaders[id]();
}

function ScreenSkeleton() {
  return <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,#ece6db_30%,#f7f3ec_50%,#ece6db_70%)]" />;
}

/**
 * A demo inside its devices: phone only on mobile; laptop + phone from md up.
 * Used by the hero reveal, the Examples modal and the Examples previews.
 */
export function DemoShowcase({
  demo,
  business,
  active,
  forceLayout,
  className = '',
}: {
  demo: DemoId;
  business: string;
  active: boolean;
  /** Override the responsive choice (e.g. small previews always show the phone). */
  forceLayout?: 'phone' | 'both';
  className?: string;
}) {
  const t = useTranslations('hero');
  const wide = useMediaQuery('(min-width: 768px)');
  const layout = forceLayout ?? (wide ? 'both' : 'phone');
  const Demo = useMemo(() => lazyDemos[demo], [demo]);
  const label = t('demoLabel', { business });

  if (layout === 'phone') {
    return (
      <div className={`mx-auto w-full max-w-[min(320px,78vw)] ${className}`}>
        <DeviceFrame kind="phone" label={label}>
          <Suspense fallback={<ScreenSkeleton />}>
            <Demo screen="phone" active={active} />
          </Suspense>
        </DeviceFrame>
      </div>
    );
  }

  return (
    <div className={`relative mx-auto w-full max-w-[1040px] pb-[6%] pr-[12%] ${className}`}>
      <DeviceFrame kind="laptop" label={label}>
        <Suspense fallback={<ScreenSkeleton />}>
          <Demo screen="laptop" active={active} />
        </Suspense>
      </DeviceFrame>
      <div className="absolute bottom-0 right-0 w-[24%] min-w-[150px]">
        <DeviceFrame kind="phone" label={label}>
          <Suspense fallback={<ScreenSkeleton />}>
            <Demo screen="phone" active={active} />
          </Suspense>
        </DeviceFrame>
      </div>
    </div>
  );
}
