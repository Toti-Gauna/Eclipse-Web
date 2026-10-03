/** Hours it takes us to build the demo (step 1). Also quoted in the section intro. */
export const DEMO_HOURS = 48;
/** Hours from the call to the written proposal (step 2). */
export const PROPOSAL_HOURS = 24;

/** The five "Cómo trabajamos" steps, in order. Copy lives in messages (`process.steps.<id>`). */
export type ProcessStep =
  /** A fixed turnaround, shown as "48 h" and counted up. */
  | { id: 'demo' | 'call'; meta: 'hours'; hours: number }
  /** A short qualitative tag from messages (`process.steps.<id>.meta`). */
  | { id: 'build' | 'launch'; meta: 'text' }
  /** "Desde <lowest maintenance plan>/mes", from content/maintenance.json. */
  | { id: 'care'; meta: 'maintenance' };

export const PROCESS_STEPS: readonly ProcessStep[] = [
  { id: 'demo', meta: 'hours', hours: DEMO_HOURS },
  { id: 'call', meta: 'hours', hours: PROPOSAL_HOURS },
  { id: 'build', meta: 'text' },
  { id: 'launch', meta: 'text' },
  { id: 'care', meta: 'maintenance' },
];

/**
 * Eclipse phase of step `i` (its glyph): the first crescent of light at the demo,
 * the full sun at the last step (0.8 → 0.6 → … → 0 for five steps).
 */
export function stepPhase(i: number, count: number = PROCESS_STEPS.length): number {
  return Math.max(0, 1 - (i + 1) / count);
}
