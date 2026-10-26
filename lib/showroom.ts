/**
 * Showroom URL contract (lote 1.1 §5, implemented in 1.3): `?rubro=…&vista=…&area=…` on the
 * locale's home. Pure functions, no DOM: the history owner (components/demo-experience/
 * showroomHistory.ts) reads and writes through them.
 *
 * Every value is compared against a constant allow-list and the CONSTANT is used afterwards;
 * nothing received is ever interpolated into `import()`, HTML or an `href`. Any value outside
 * the lists invalidates the whole showroom state (the caller cleans the three parameters).
 * Foreign parameters (UTM, `corona`, …) are kept untouched.
 */

export const SHOWROOM_RUBROS = ['inmobiliarias', 'ecommerce'] as const;
export const SHOWROOM_VISTAS = ['entrada', 'guia', 'branding', 'intelligence', 'academy'] as const;
export const SHOWROOM_AREAS = ['recepcion', 'administracion', 'ventas', 'marketing'] as const;

export type ShowroomRubro = (typeof SHOWROOM_RUBROS)[number];
export type ShowroomVista = (typeof SHOWROOM_VISTAS)[number];
export type ShowroomArea = (typeof SHOWROOM_AREAS)[number];

export interface ShowroomState {
  rubro: ShowroomRubro;
  vista: ShowroomVista;
  area: ShowroomArea | null;
}

/** `null`: no showroom in the URL. `'invalid'`: something in it is not on the allow-list. */
export type ShowroomParse = ShowroomState | null | 'invalid';

/** The three parameters this module owns. */
const OWNED = ['rubro', 'vista', 'area'] as const;
/** Notion's aliases: `area=branding|intelligence|academy` means `vista=…` (read, never written). */
const AREA_ALIASES = ['branding', 'intelligence', 'academy'] as const;

const pick = <T extends string>(list: readonly T[], value: string | null): T | null => list.find((item) => item === value) ?? null;

/** Reads the showroom state from a query string (`location.search`, with or without `?`). */
export function parseShowroomParams(search: string): ShowroomParse {
  const p = new URLSearchParams(search);
  const rawRubro = p.get('rubro');
  const rawVista = p.get('vista');
  const rawArea = p.get('area');
  if (rawRubro === null && rawVista === null && rawArea === null) return null;

  const rubro = pick(SHOWROOM_RUBROS, rawRubro);
  if (!rubro) return 'invalid';

  let vistaValue = rawVista;
  let areaValue = rawArea;
  if (vistaValue === null && areaValue !== null && AREA_ALIASES.some((a) => a === areaValue)) {
    vistaValue = areaValue;
    areaValue = null;
  }
  const vista = vistaValue === null ? 'entrada' : pick(SHOWROOM_VISTAS, vistaValue);
  if (!vista) return 'invalid';

  let area: ShowroomArea | null = null;
  if (areaValue !== null) {
    area = pick(SHOWROOM_AREAS, areaValue);
    // An area only exists inside the guide.
    if (!area || vista !== 'guia') return 'invalid';
  }
  return { rubro, vista, area };
}

/** `search` without the showroom parameters (everything else is kept as it was written). */
export function stripShowroomParams(search: string): string {
  const p = new URLSearchParams(search);
  OWNED.forEach((key) => p.delete(key));
  const rest = p.toString();
  return rest ? `?${rest}` : '';
}

/** `search` with `state` written into it, foreign parameters first and untouched. */
export function withShowroomParams(search: string, state: ShowroomState): string {
  const p = new URLSearchParams(stripShowroomParams(search));
  p.set('rubro', state.rubro);
  p.set('vista', state.vista);
  if (state.area) p.set('area', state.area);
  return `?${p.toString()}`;
}

/** Marker kept in `history.state` for entries the showroom owns (version + level, no user data). */
export interface ShowroomHistoryMarker {
  v: 1;
  level: 'selector' | 'view';
}

export const isShowroomMarker = (value: unknown): value is ShowroomHistoryMarker => {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<ShowroomHistoryMarker>;
  return m.v === 1 && (m.level === 'selector' || m.level === 'view');
};

/** The showroom never exists inside the client portal. */
export const isPortalPath = (pathname: string): boolean => /(^|\/)portal(\/|$)/.test(pathname);
