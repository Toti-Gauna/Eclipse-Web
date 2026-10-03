'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { decodePlanState, emptyPlanState, encodePlanState, type PlanState } from '@/lib/plan-url';
import type { ItemId, VerticalId } from '@/lib/content';
import { BUILDER_FOCUS_EVENT, readStoredPlan, readStoredStep, writeStoredPlan, writeStoredStep } from './browser';
import { setVertical } from './goals';
import { addedByPreset, applyPreset, isEmptyState, landingStep, normalizeState, type Preset, type StepId } from './rules';

export type BuilderMode = 'sheet' | 'page';

const usable = (v: VerticalId | null): VerticalId | null => (v && v !== 'otro' ? v : null);

/** Pieces added one by one ("Sumala a tu plan") are pointed out in step 2; a package speaks for itself. */
function pointOut(state: PlanState, preset: Preset | null): ItemId[] {
  return preset && !preset.planId ? addedByPreset(state, preset) : [];
}

/** The vertical chosen elsewhere on the page fills an empty one (and refines "ordenar"). */
function withVertical(state: PlanState, vertical: VerticalId | null): PlanState {
  return vertical && !state.vertical ? setVertical(state, vertical) : state;
}

/**
 * Builder state + the current step.
 * - sheet: client-only (lazy, ssr:false). Restores the session copy; every open applies
 *   the preset (if any) and lands on the step that makes sense for it.
 * - page: SSR renders the empty plan; on mount it reads the URL (a shared link opens on the
 *   summary) or the session copy, and from then on mirrors every change into the URL.
 * Both keep a sessionStorage copy of the plan and the step, so switching language keeps them.
 * `focusTick` changes whenever the step should take focus (navigation, preset, open).
 */
export function usePlanState(mode: BuilderMode, { open, preset }: { open: boolean; preset: Preset | null }) {
  const { vertical: globalVertical } = useExperience();
  const defaultVertical = usable(globalVertical);

  const [state, setState] = useState<PlanState>(() =>
    mode === 'sheet' ? normalizeState(readStoredPlan() ?? emptyPlanState) : emptyPlanState,
  );
  const [step, setStep] = useState<StepId>(() =>
    mode === 'sheet' ? landingStep({ remembered: readStoredStep(), empty: isEmptyState(readStoredPlan() ?? emptyPlanState) }) : 'objetivo',
  );
  const [ready, setReady] = useState(mode === 'sheet');
  const [focusTick, setFocusTick] = useState(0);
  /** Pieces a preset just added: step 2 points them out. */
  const [highlight, setHighlight] = useState<ItemId[]>([]);

  // Sheet: react to each open (render-phase update, no effect round-trip).
  const [seenOpen, setSeenOpen] = useState(false);
  if (mode === 'sheet' && open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      const next = withVertical(preset ? applyPreset(state, preset) : state, defaultVertical);
      setHighlight(pointOut(state, preset));
      setState(next);
      if (preset) setStep(landingStep({ preset, empty: isEmptyState(next) }));
      setFocusTick((n) => n + 1);
    }
  }

  // Page: read the shared link (or the session copy) once, after hydration.
  useEffect(() => {
    if (mode !== 'page') return;
    const fromUrl = decodePlanState(window.location.search);
    const fromLink = encodePlanState(fromUrl) !== '';
    const next = normalizeState(withVertical(fromLink ? fromUrl : (readStoredPlan() ?? emptyPlanState), defaultVertical));
    /* eslint-disable react-hooks/set-state-in-effect -- the URL is only readable after hydration */
    setState(next);
    setStep(landingStep({ fromLink, remembered: fromLink ? null : readStoredStep(), empty: isEmptyState(next) }));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Read once on mount; later changes flow the other way (state → URL).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Mirror: session copy always, URL in page mode.
  useEffect(() => {
    if (!ready) return;
    writeStoredPlan(state);
    writeStoredStep(step);
    if (mode !== 'page') return;
    const qs = encodePlanState(state);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, '', url);
    }
  }, [state, step, ready, mode]);

  // Page: "Armá tu plan" anywhere on /plan lands here (BuilderHost) instead of opening the drawer.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    if (mode !== 'page') return;
    const onFocus = (e: Event) => {
      const next = (e as CustomEvent<Preset | null>).detail;
      if (next) {
        const current = latest.current;
        setHighlight(pointOut(current, next));
        setState(applyPreset(current, next));
        setStep(landingStep({ preset: next, empty: false }));
      }
      setFocusTick((n) => n + 1);
    };
    window.addEventListener(BUILDER_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(BUILDER_FOCUS_EVENT, onFocus);
  }, [mode]);

  const update = (fn: (s: PlanState) => PlanState) => setState((s) => fn(s));
  const goTo = (next: StepId) => {
    setStep(next);
    setHighlight([]);
    setFocusTick((n) => n + 1);
  };

  return { state, update, step, goTo, ready, focusTick, highlight };
}
