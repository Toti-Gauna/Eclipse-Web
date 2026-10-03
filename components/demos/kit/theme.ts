import type { CSSProperties } from 'react';

/** Font roles a theme can pick for display text (big numbers, headings) and body UI. */
export type DemoFontFamily = 'serif' | 'sans' | 'mono';

/**
 * The palette + personality of one fictional product. The demo root turns it into
 * `--demo-*` CSS variables (see `themeVars`); nothing in the kit hardcodes a color.
 *
 * Contrast is the theme's job: `muted`, `accentText` and the status colors are used
 * as TEXT on `bg` and `surface`, so they must pass WCAG AA (4.5:1) there; `accentInk`
 * and `accent2Ink` are text on top of `accent` / `accent2`.
 */
export interface DemoTheme {
  /** light: dark ink on a light background; dark: the opposite (status bar, scrims, shadows). */
  mode: 'light' | 'dark';
  /** App background. */
  bg: string;
  /** Cards, sidebar, bars. */
  surface: string;
  /** Recessed areas: tracks, inputs, empty cells. Default: ink at 5% over the surface. */
  sunken?: string;
  /** Main text. */
  ink: string;
  /** Secondary text (AA on bg and surface). */
  muted: string;
  /** Hairlines. Default: ink at 11%. */
  line?: string;
  /** Brand color: active states, primary buttons, the number that matters. */
  accent: string;
  /** Text and icons on top of `accent`. */
  accentInk: string;
  /** Accent used as text on bg/surface when `accent` itself is too light for AA. Default: accent. */
  accentText?: string;
  /** Second brand color (highlights, secondary marks). */
  accent2: string;
  /** Text and icons on top of `accent2`. */
  accent2Ink: string;
  /** `accent2` used as text on bg/surface (AA). Default: ink (most second accents are tints). */
  accent2Text?: string;
  /** Status colors used as text (AA on surface). Defaults depend on `mode`. */
  ok?: string;
  warn?: string;
  bad?: string;
  info?: string;
  /** Card radius, e.g. '1.1em' (round, calm) or '0' (square, editorial). Controls derive from it. */
  radius?: string;
  /** Display text (headings, big readouts). */
  display?: {
    family?: DemoFontFamily;
    weight?: number;
    /** letter-spacing, e.g. '-0.02em' or '0.04em'. */
    tracking?: string;
    uppercase?: boolean;
    italic?: boolean;
  };
  /** Body UI font. Default: sans (Geist). */
  body?: DemoFontFamily;
}

const FONT: Record<DemoFontFamily, string> = {
  serif: 'var(--font-serif)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
};

/**
 * The CSS variables of a theme, to put on the demo root (AppShell does it).
 * Soft tints (`--demo-accent-soft`, `--demo-ok-soft`…) are derived in demo.css
 * with color-mix, so they follow the theme automatically.
 */
export function themeVars(theme: DemoTheme): CSSProperties {
  const d = theme.display ?? {};
  const vars: Record<string, string | undefined> = {
    '--demo-bg': theme.bg,
    '--demo-surface': theme.surface,
    '--demo-sunken': theme.sunken,
    '--demo-ink': theme.ink,
    '--demo-muted': theme.muted,
    '--demo-line': theme.line,
    '--demo-accent': theme.accent,
    '--demo-accent-ink': theme.accentInk,
    '--demo-accent-text': theme.accentText ?? theme.accent,
    '--demo-accent-2': theme.accent2,
    '--demo-accent-2-ink': theme.accent2Ink,
    '--demo-accent-2-text': theme.accent2Text,
    '--demo-ok': theme.ok,
    '--demo-warn': theme.warn,
    '--demo-bad': theme.bad,
    '--demo-info': theme.info,
    '--demo-radius': theme.radius,
    '--demo-font-display': d.family ? FONT[d.family] : undefined,
    '--demo-display-weight': d.weight !== undefined ? String(d.weight) : undefined,
    '--demo-display-tracking': d.tracking,
    '--demo-display-case': d.uppercase ? 'uppercase' : undefined,
    '--demo-display-style': d.italic ? 'italic' : undefined,
    '--demo-font-body': theme.body ? FONT[theme.body] : undefined,
  };
  // Unset values fall back to the defaults in demo.css.
  return Object.fromEntries(Object.entries(vars).filter(([, v]) => v !== undefined)) as CSSProperties;
}

/**
 * The v1 look (warm paper, white cards), used when a demo only passes `accent`
 * (legacy `DemoShell`). New demos should define their own `DemoTheme`.
 */
export function legacyTheme(accent: string): DemoTheme {
  return {
    mode: 'light',
    bg: '#f7f4ee',
    surface: '#ffffff',
    ink: '#15151b',
    muted: '#5e5b69',
    accent,
    accentInk: '#ffffff',
    accent2: '#f5b942',
    accent2Ink: '#05050a',
    radius: '1em',
  };
}
