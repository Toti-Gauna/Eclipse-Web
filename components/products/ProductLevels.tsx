'use client';

import { Levels } from '@/components/pricing/Levels';
import type { VerticalId } from '@/lib/content';
import { OpenDemoButton } from './OpenDemoButton';
import '@/components/pricing/pricing.css';

/** The six levels on a product's page, each «Ver la demo» opening that product's demo directly. */
export function ProductLevels({ vertical }: { vertical: VerticalId }) {
  return (
    <Levels
      demo={({ label, className, children }) => (
        <OpenDemoButton vertical={vertical} label={label} className={className}>
          {children}
        </OpenDemoButton>
      )}
    />
  );
}
