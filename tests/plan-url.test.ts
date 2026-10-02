import { describe, expect, it } from 'vitest';
import { decodePlanState, encodePlanState, emptyPlanState } from '@/lib/plan-url';
import { whatsappUrl } from '@/lib/whatsapp';

describe('plan URL state', () => {
  it('encodes the brief example', () => {
    expect(encodePlanState({ ...emptyPlanState, items: ['landing', 'turnos'], maintenance: 'crecimiento' })).toBe(
      'items=landing,turnos&m=crecimiento',
    );
  });
  it('round-trips a full state', () => {
    const state = {
      planId: 'sistema' as const,
      items: ['seo' as const],
      maintenance: null,
      billing: 'annual' as const,
      vertical: 'clinicas' as const,
      founder: true,
    };
    expect(decodePlanState(encodePlanState(state))).toEqual(state);
  });
  it('drops unknown or duplicated ids', () => {
    expect(decodePlanState('?items=landing,hack,landing&m=gold&plan=x&v=zzz&b=weekly')).toEqual({
      ...emptyPlanState,
      items: ['landing'],
    });
  });
  it('empty query → empty state', () => {
    expect(decodePlanState('')).toEqual(emptyPlanState);
  });
});

describe('whatsappUrl', () => {
  it('builds an encoded wa.me link', () => {
    expect(whatsappUrl('Hola Eclipse. Rubro: Clínicas & más', '5491100000000')).toBe(
      'https://wa.me/5491100000000?text=Hola%20Eclipse.%20Rubro%3A%20Cl%C3%ADnicas%20%26%20m%C3%A1s',
    );
    expect(whatsappUrl(undefined, '1')).toBe('https://wa.me/1');
  });
});
