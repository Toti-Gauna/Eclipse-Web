'use client';

import { useTranslations } from 'next-intl';
import { verticals, type DemoId } from '@/lib/content';
import type { DemoProps } from './types';

/**
 * TEMPORARY (v2): stand-in for demos that are being built. Every registry entry
 * that points here gets replaced by the real demo before the PR.
 */
export function PlaceholderDemo({ id }: DemoProps & { id: DemoId }) {
  const tc = useTranslations('common');
  const business = verticals.find((v) => v.demo === id)?.business ?? '';
  return (
    <div className="grid h-full w-full place-items-center bg-[#f4efe6] p-[6cqw] text-center text-[#111114]">
      <p className="text-[4cqw] font-medium">
        {business} — {tc('demo')}
      </p>
    </div>
  );
}
