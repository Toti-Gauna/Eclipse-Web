'use client';

import { useCallback, useEffect, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { decodePlanState, emptyPlanState, encodePlanState, type PlanState } from '@/lib/plan-url';
import type { VerticalId } from '@/lib/content';
import { BUILDER_FOCUS_EVENT, readStoredPlan, writeStoredPlan } from './browser';
import { applyPreset, normalizeState, type Preset } from './rules';

export type BuilderMode = 'sheet' | 'page';

const usable = (v: VerticalId | null): VerticalId | null => (v && v !== 'otro' ? v : null);

function onOpen(state: PlanState, preset: Preset | null, vertical: VerticalId | null): PlanState {
  const next = preset ? applyPreset(state, preset) : state;
  return vertical ? { ...next, vertical } : next;
}

/**
 * Builder state.
 * - sheet: client-only (lazy, ssr:false). Restores the session copy, applies the
 *   preset and the global vertical every time the drawer opens.
 * - page: SSR renders the empty plan; on mount it reads the URL (or the session
 *   copy) and from then on mirrors every change into the URL (replaceState).
 * Both keep a sessionStorage copy, so switching language keeps the plan.
 */
export function usePlanState(mode: BuilderMode, { open, preset }: { open: boolean; preset: Preset | null }) {
  const { vertical: globalVertical } = useExperience();
  const defaultVertical = usable(globalVertical);

  const [state, setState] = useState<PlanState>(() =>
    mode === 'sheet' ? normalizeState(readStoredPlan() ?? emptyPlanState) : emptyPlanState,
  );
  const [ready, setReady] = useState(mode === 'sheet');

  // Sheet: react to each open (render-phase update, no effect round-trip).
  const [seenOpen, setSeenOpen] = useState(false);
  if (mode === 'sheet' && open !== seenOpen) {
    setSeenOpen(open);
    if (open) setState((s) => onOpen(s, preset, defaultVertical));
  }

  // Page: read the shared link (or the session copy) once, after hydration.
  useEffect(() => {
    if (mode !== 'page') return;
    const fromUrl = decodePlanState(window.location.search);
    let next = encodePlanState(fromUrl) ? fromUrl : (readStoredPlan() ?? emptyPlanState);
    if (!next.vertical && defaultVertical) next = { ...next, vertical: defaultVertical };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after hydration
    setState(normalizeState(next));
    setReady(true);
    // Read once on mount; later changes flow the other way (state → URL).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Mirror: session copy always, URL in page mode.
  useEffect(() => {
    if (!ready) return;
    writeStoredPlan(state);
    if (mode !== 'page') return;
    const qs = encodePlanState(state);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, '', url);
    }
  }, [state, ready, mode]);

  // Page: the header's "Armá tu plan" lands here (BuilderHost) instead of opening the drawer.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (mode !== 'page') return;
    const onFocus = (e: Event) => {
      const next = (e as CustomEvent<Preset | null>).detail;
      if (next) setState((s) => applyPreset(s, next));
      setFocusTick((n) => n + 1);
    };
    window.addEventListener(BUILDER_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(BUILDER_FOCUS_EVENT, onFocus);
  }, [mode]);

  const update = useCallback((fn: (s: PlanState) => PlanState) => setState((s) => fn(s)), []);

  return { state, update, ready, focusTick };
}
