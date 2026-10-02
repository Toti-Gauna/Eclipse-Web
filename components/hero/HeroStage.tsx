'use client';

import { Eclipse } from './Eclipse';
import { Starfield } from './Starfield';

/**
 * Full-bleed visual layer of the hero (behind the copy).
 * Phase 4: static eclipse + stars. Phase 5 adds the WebGL corona, parallax,
 * diamond ring, light reveal with the device demo and the pinned scroll.
 */
export function HeroStage() {
  return (
    <div data-hero-stage className="pointer-events-none absolute inset-0 overflow-hidden">
      <Starfield />
      <div
        data-hero-eclipse-anchor
        className="absolute left-1/2 top-[calc(var(--header-h)+2svh)] -translate-x-1/2 md:left-[71%] md:top-1/2 md:-translate-y-1/2"
      >
        <Eclipse className="[--eclipse-size:var(--hero-eclipse-size)]" />
      </div>
    </div>
  );
}
