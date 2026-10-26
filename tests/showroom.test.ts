import { describe, expect, it } from 'vitest';
import { isPortalPath, isShowroomMarker, parseShowroomParams, stripShowroomParams, withShowroomParams } from '@/lib/showroom';

describe('parseShowroomParams (contract of lote 1.1 §5)', () => {
  it('no showroom parameters → null', () => {
    expect(parseShowroomParams('')).toBeNull();
    expect(parseShowroomParams('?utm_source=x&corona=1')).toBeNull();
  });

  it('rubro alone opens the entrance', () => {
    expect(parseShowroomParams('?rubro=inmobiliarias')).toEqual({
      rubro: 'inmobiliarias',
      vista: 'entrada',
      area: null,
    });
    expect(parseShowroomParams('rubro=ecommerce')).toEqual({
      rubro: 'ecommerce',
      vista: 'entrada',
      area: null,
    });
  });

  it('accepts the allow-listed views and areas', () => {
    expect(parseShowroomParams('?rubro=inmobiliarias&vista=guia&area=ventas')).toEqual({
      rubro: 'inmobiliarias',
      vista: 'guia',
      area: 'ventas',
    });
    for (const vista of ['entrada', 'guia', 'branding', 'intelligence', 'academy']) {
      expect(parseShowroomParams(`?rubro=inmobiliarias&vista=${vista}`)).toMatchObject({ vista });
    }
  });

  it("normalizes Notion's aliases (area=branding|intelligence|academy → vista)", () => {
    expect(parseShowroomParams('?rubro=inmobiliarias&area=branding')).toEqual({
      rubro: 'inmobiliarias',
      vista: 'branding',
      area: null,
    });
    expect(parseShowroomParams('?rubro=inmobiliarias&area=academy')).toMatchObject({ vista: 'academy', area: null });
  });

  it('one value outside the list invalidates everything', () => {
    for (const search of [
      '?rubro=clinicas',
      '?rubro=inmobiliarias&vista=admin',
      '?rubro=inmobiliarias&vista=guia&area=../../etc',
      '?vista=guia',
      '?area=ventas',
      '?rubro=',
      '?rubro=INMOBILIARIAS',
    ]) {
      expect(parseShowroomParams(search), search).toBe('invalid');
    }
  });

  it('an area only exists inside the guide', () => {
    expect(parseShowroomParams('?rubro=inmobiliarias&vista=entrada&area=ventas')).toBe('invalid');
    expect(parseShowroomParams('?rubro=inmobiliarias&vista=branding&area=ventas')).toBe('invalid');
    expect(parseShowroomParams('?rubro=inmobiliarias&area=ventas')).toBe('invalid');
  });

  it('never returns anything but allow-list constants (no injection through a value)', () => {
    const hostile = parseShowroomParams('?rubro=inmobiliarias&vista=guia%22%3E%3Cscript%3E');
    expect(hostile).toBe('invalid');
    const ok = parseShowroomParams('?rubro=inmobiliarias&vista=guia');
    expect(ok).not.toBe('invalid');
    expect(Object.values(ok as object).every((v) => v === null || ['inmobiliarias', 'guia'].includes(v as string))).toBe(true);
  });
});

describe('writing the contract back', () => {
  it('strips only its own three parameters and keeps foreign ones', () => {
    expect(stripShowroomParams('?rubro=inmobiliarias&vista=guia&utm_source=ad&corona=1')).toBe('?utm_source=ad&corona=1');
    expect(stripShowroomParams('?rubro=inmobiliarias&vista=guia&area=ventas')).toBe('');
    expect(stripShowroomParams('')).toBe('');
  });

  it('writes the state after the foreign parameters, replacing a previous one', () => {
    expect(
      withShowroomParams('?utm_source=ad', {
        rubro: 'inmobiliarias',
        vista: 'guia',
        area: null,
      }),
    ).toBe('?utm_source=ad&rubro=inmobiliarias&vista=guia');
    expect(
      withShowroomParams('?rubro=ecommerce&vista=entrada&utm_source=ad', {
        rubro: 'inmobiliarias',
        vista: 'guia',
        area: 'ventas',
      }),
    ).toBe('?utm_source=ad&rubro=inmobiliarias&vista=guia&area=ventas');
  });

  it('round-trips', () => {
    const state = {
      rubro: 'inmobiliarias',
      vista: 'guia',
      area: 'recepcion',
    } as const;
    expect(parseShowroomParams(withShowroomParams('?utm_medium=x', state))).toEqual(state);
  });
});

describe('history marker and portal exclusion', () => {
  it('recognises only versioned markers with a known level', () => {
    expect(isShowroomMarker({ v: 1, level: 'selector' })).toBe(true);
    expect(isShowroomMarker({ v: 1, level: 'view' })).toBe(true);
    expect(isShowroomMarker({ v: 2, level: 'view' })).toBe(false);
    expect(isShowroomMarker({ v: 1, level: 'other' })).toBe(false);
    expect(isShowroomMarker({ eclipseDemo: 'token' })).toBe(false);
    expect(isShowroomMarker(null)).toBe(false);
  });

  it('knows the portal paths (with and without locale, base path or trailing slash)', () => {
    expect(isPortalPath('/es/portal/')).toBe(true);
    expect(isPortalPath('/portal/proyectos/')).toBe(true);
    expect(isPortalPath('/es/portal/proyecto/abc')).toBe(true);
    expect(isPortalPath('/es/')).toBe(false);
    expect(isPortalPath('/es/plan/')).toBe(false);
    expect(isPortalPath('/es/?rubro=portal')).toBe(false);
  });
});
