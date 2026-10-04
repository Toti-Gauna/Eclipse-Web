import type { CSSProperties, ReactNode } from 'react';
import type { DemoId } from '@/lib/content';
import './showcase.css';

/**
 * Frameless demo views (v3): no laptop or phone shell, just a screen with a hairline,
 * a radius and a small label. Server-safe (no hooks), so static posters can share the
 * exact geometry of the live <DemoShowcase>.
 *
 * Each screen is a CSS size container (`container-type: size`, name `screen`): demos size
 * everything in cqw/em and look the same at any scale.
 * - laptop ("Escritorio"): 16 / 10 screen
 * - phone ("Celular"): 9 / 19.5 screen (shorter in the tabs layout, see showcase.css)
 *
 * `.device-laptop` / `.device-phone` / `.device-screen` are kept: the demo kit pairs the two
 * views of one showcase with them (kit/store.ts → findPairHost). Never put them on posters.
 */
export function DeviceFrame({
  kind,
  label,
  caption,
  children,
  className = '',
}: {
  kind: 'phone' | 'laptop';
  /** Accessible name of the view (e.g. "Clínica Aurora: demo navegable, versión de escritorio"). */
  label: string;
  /** Visible label above the screen (decorative: `label` already names the region). */
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="region" aria-label={label} className={`device-${kind} sc-pane ${className}`} data-kind={kind}>
      {caption ? (
        <p aria-hidden className="sc-caption">
          {caption}
        </p>
      ) : null}
      <div className="device-screen sc-screen">{children}</div>
    </div>
  );
}

/**
 * Static stand-in for a <DemoShowcase> with its exact geometry: the split (both views,
 * captioned) on wide containers, the tab row + phone view on narrow ones (CSS container
 * query at SPLIT_MIN). No demo code, no pairing classes: use it as the poster before the
 * live demo mounts and as the Suspense fallback of the showcase chunk.
 * Decorative (aria-hidden); `plate` sits over the desktop view (e.g. name + "Demo" badge).
 */
export function ShowcasePoster({
  demo,
  captions,
  plate,
  className = '',
}: {
  demo: DemoId;
  /** The views' visible labels (icon + "Escritorio" / "Celular"). */
  captions: Record<'laptop' | 'phone', ReactNode>;
  plate?: ReactNode;
  className?: string;
}) {
  return (
    <div aria-hidden className={`sc ${className}`} data-poster="">
      <div className="sc-tablist">
        <span className="sc-tab" data-on="">
          {captions.phone}
        </span>
        <span className="sc-tab">{captions.laptop}</span>
      </div>
      <div className="sc-split">
        <div className="sc-pane" data-kind="laptop">
          <p className="sc-caption">{captions.laptop}</p>
          <div className="sc-screen">
            <ScreenPlaceholder demo={demo} kind="laptop" />
            {plate ? <div className="sc-plate">{plate}</div> : null}
          </div>
        </div>
        <div className="sc-pane" data-kind="phone">
          <p className="sc-caption">{captions.phone}</p>
          <div className="sc-screen">
            <ScreenPlaceholder demo={demo} kind="phone" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Colors of each demo product (its theme: bg, surface, ink, accent — CLAUDE.md → Demos).
 * Design data for placeholders only, so the page never loads a demo's code to paint one.
 */
export const DEMO_SURFACE: Record<DemoId, { bg: string; surface: string; ink: string; accent: string }> = {
  clinic: { bg: '#F7F4EF', surface: '#FFFFFF', ink: '#1D2A2B', accent: '#127C74' },
  realEstate: { bg: '#ECE8E1', surface: '#F6F4EF', ink: '#141414', accent: '#2448C8' },
  gym: { bg: '#0B0C0F', surface: '#14161B', ink: '#F1F3EC', accent: '#CCFF33' },
  shop: { bg: '#FBF6EE', surface: '#FFFDF9', ink: '#2B1B14', accent: '#E4472B' },
  restaurant: { bg: '#1A1113', surface: '#251A1C', ink: '#F3E6D0', accent: '#B23A52' },
  academy: { bg: '#172338', surface: '#1E2C45', ink: '#F3F0E6', accent: '#7CC8F5' },
};

/**
 * Placeholder screen while a demo's code loads: the product's own colors with a faint
 * layout (sidebar + cards on the laptop, app bar + cards + tab bar on the phone).
 * Static: no shimmer, so nothing moves before the demo does.
 */
export function ScreenPlaceholder({ demo, kind }: { demo: DemoId; kind: 'phone' | 'laptop' }) {
  const s = DEMO_SURFACE[demo];
  const vars = { background: s.bg, color: s.ink, '--ph-surface': s.surface, '--ph-accent': s.accent } as CSSProperties;
  return (
    <div aria-hidden className="sc-ph" data-kind={kind} style={vars}>
      {kind === 'laptop' ? (
        <>
          <span className="sc-ph-side" />
          <span className="sc-ph-top" />
          <span className="sc-ph-grid">
            <span className="sc-ph-card sc-ph-card--accent" />
            <span className="sc-ph-card" />
            <span className="sc-ph-card" />
            <span className="sc-ph-card sc-ph-card--wide" />
            <span className="sc-ph-card" />
          </span>
        </>
      ) : (
        <>
          <span className="sc-ph-bar" />
          <span className="sc-ph-card sc-ph-card--accent" />
          <span className="sc-ph-card" />
          <span className="sc-ph-card" />
          <span className="sc-ph-tabs" />
        </>
      )}
    </div>
  );
}
