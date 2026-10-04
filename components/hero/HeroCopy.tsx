import type { ReactNode } from 'react';

/**
 * The hero copy (server-rendered children). v3b: the demo opens in the "Ver demo" layer (a
 * modal <dialog>, which makes the page inert by itself), so the copy never needs hiding here.
 */
export function HeroCopy({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div data-hero-copy className={className}>
      {children}
    </div>
  );
}
