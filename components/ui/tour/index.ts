/**
 * Guided tour (spotlight + rings + arrow + card), shared by the demo guide and the portal onboarding.
 *
 *   const copy = useTourCopy(tTour('labelFor', { name }));       // generic copy, `tour` namespace
 *   const { seen, markSeen } = useTourSeen('portal-onboarding'); // "don't show again"
 *   <Tour open={open} steps={steps} copy={copy}
 *         root={() => rootRef.current}                      // targets are queried in here
 *         host={() => hostRef.current}                      // inside the <dialog> when there is one
 *         scroller={() => scrollRef.current}                // optional
 *         onStep={async (step) => setTab(step.view)}        // e.g. switch a tab; awaited, then measured
 *         onClose={(reason, i) => { setOpen(false); markSeen(); }} />
 *
 * - Every visible match of `step.targets` inside `root()` is lit; the first one anchors the card.
 *   A step with no visible target is skipped (in the direction of travel); if none is left the card
 *   shows centered without an arrow.
 * - Inside a native <dialog>: render into an element inside it (`host`). Escape (and Android back)
 *   closes the tour only (reason 'escape'): the dialog's `cancel` is prevented while the tour is open.
 * - Keyboard: ←/→ move, Escape closes, Tab stays in the card. Focus goes back to what had it before.
 * - The close (×) button reports reason 'skip'.
 */
export { Tour } from './Tour';
export { useTourSeen } from './useTourSeen';
export { useTourCopy } from './useTourCopy';
export { computePlacement, mergeHoles, veilClipPath, centerDelta } from './geometry';
export type { Placement, Rect } from './geometry';
export type { TourCopy, TourProps, TourStep, TourCloseReason } from './types';
