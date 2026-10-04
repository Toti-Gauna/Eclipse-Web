/**
 * Contract of the guided tour (spotlight + arrow + card) shared by the demo guide
 * ("Ver con guía") and the client portal onboarding. Implementation: ./Tour.tsx.
 */
export interface TourStep {
  id: string;
  /**
   * CSS selectors resolved inside `root()`. Every visible match is lit (e.g. the same function in the
   * desktop and the mobile view of a demo); the first visible match anchors the card and the arrow.
   */
  targets: string[];
  title: string;
  body: string;
  /** Optional short tag shown on the card, e.g. "Vista escritorio" / "Vista celular" / "Las dos vistas". */
  tag?: string;
  /** Preferred side of the card relative to the anchor; 'auto' picks the side with most room. */
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export interface TourCopy {
  /** Accessible name of the tour region, e.g. "Guía de Clínica Aurora". */
  label: string;
  next: string;
  prev: string;
  done: string;
  skip: string;
  close: string;
  /** "Paso {current} de {total}". */
  progress: (current: number, total: number) => string;
}

export type TourCloseReason = 'done' | 'skip' | 'escape';

export interface TourProps {
  open: boolean;
  steps: TourStep[];
  /** Where the targets live (queried on every step). */
  root: () => HTMLElement | null;
  /**
   * Where the tour layer is rendered (portal). Must be inside the same top-layer <dialog> as the
   * targets when there is one (outside it would be inert). Default: document.body.
   */
  host?: () => HTMLElement | null;
  /** Scrolls targets into view inside this element (default: the nearest scrollable ancestor / window). */
  scroller?: () => HTMLElement | null;
  copy: TourCopy;
  /** Before a step shows (switch a tab, open a panel). May return a promise; the step waits for it. */
  onStep?: (step: TourStep, index: number) => void | Promise<void>;
  onClose: (reason: TourCloseReason, lastIndex: number) => void;
  /** Start at this step (default 0). */
  initialStep?: number;
}
