'use client';

import { verticals, type DemoId } from '@/lib/content';
import type { TrailerComponentProps } from './VerticalTrailer';

/** TEMPORARY (v2): stand-in for trailers that are being built; replaced before the PR. */
export function PlaceholderTrailer({ id, className = '' }: TrailerComponentProps & { id: DemoId }) {
  const business = verticals.find((v) => v.demo === id)?.business ?? '';
  return (
    <div className={`grid aspect-video w-full place-items-center bg-[#0c0c14] text-[#f4efe6] ${className}`}>
      <p className="font-serif text-2xl">{business}</p>
    </div>
  );
}
