'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useSound } from '@/components/sound/SoundContext';
import { PORTAL_TOUR_EVENT } from '@/lib/portal/tour';

const VIEWS = ['full', 'empty', 'loading'] as const;
type View = (typeof VIEWS)[number];

export interface ProjectsBoardCopy {
  label: string;
  hint: string;
  full: string;
  empty: string;
  loading: string;
}

/**
 * "Mis proyectos" with a local switch between the screen's demo states: with projects,
 * without projects (empty state) and a preview of the loading state. Purely local: it
 * fetches, stores and announces nothing beyond the radio itself. The three views are
 * rendered on the server and passed in.
 */
export function ProjectsBoard({
  copy,
  full,
  empty,
  loading,
}: {
  copy: ProjectsBoardCopy;
  full: ReactNode;
  empty: ReactNode;
  loading: ReactNode;
}) {
  const id = useId();
  const [view, setView] = useState<View>('full');
  const { play } = useSound();
  const views: Record<View, ReactNode> = { full, empty, loading };

  // The guide points at the projects: starting it brings the "with projects" view back.
  useEffect(() => {
    const showFull = () => setView('full');
    window.addEventListener(PORTAL_TOUR_EVENT, showFull);
    return () => window.removeEventListener(PORTAL_TOUR_EVENT, showFull);
  }, []);

  return (
    <>
      <div className="pt-demo-bar">
        <p id={`${id}-label`} className="label">
          {copy.label}
        </p>
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="pt-seg">
          {VIEWS.map((v) => (
            <label key={v} className="pt-seg-option">
              <input
                type="radio"
                name={`${id}-view`}
                value={v}
                checked={view === v}
                onChange={() => {
                  setView(v);
                  play('select');
                }}
              />
              <span>{copy[v]}</span>
            </label>
          ))}
        </div>
        <p id={`${id}-hint`} className="pt-fine pt-demo-bar-hint">
          {copy.hint}
        </p>
      </div>
      <div className="pt-board" data-view={view}>
        {views[view]}
      </div>
    </>
  );
}
