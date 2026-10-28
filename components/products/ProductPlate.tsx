'use client';

import { useRef } from 'react';
import type { ProductId } from '@/lib/content';
import { ProductArt } from '@/components/sections/products/ProductArt';
import { useMountEntrance } from '@/components/units/useMountEntrance';

/** A product's plate at the top of its page, drawn once as the page shows. */
export function ProductPlate({ id }: { id: ProductId }) {
  const ref = useRef<HTMLDivElement>(null);
  useMountEntrance(ref);
  return (
    <div ref={ref} className="u-emblem ticks">
      <ProductArt id={id} />
      <span aria-hidden className="pd-scan" data-art-scan />
    </div>
  );
}
