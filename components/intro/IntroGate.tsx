'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { introDone, introOn } from './introScript';
import './intro.css';

const IntroFilm = lazy(() => import('./IntroFilm'));

/**
 * The home's intro (introScript.ts): the server renders the veil, which only shows while html[data-intro="on"] (set by
 * the inline script before the first paint), so the hero never flashes between the loading screen and the film. Once
 * hydrated, the film's chunk is fetched (it is not in the page's bundle) and plays right after the loader. If the
 * chunk can't load, the veil simply goes: the page is never held hostage by the film.
 */
export function IntroGate() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!introOn()) return;
    let alive = true;
    import('./IntroFilm').then(
      () => alive && setOn(true),
      () => introDone(),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <div aria-hidden className="intro-veil" />
      {on ? (
        <Suspense fallback={null}>
          <IntroFilm onClose={() => setOn(false)} />
        </Suspense>
      ) : null}
    </>
  );
}
