import { describe, expect, it } from 'vitest';
import { GOAL_IDS, decodePlanState, encodePlanState, emptyPlanState, sortGoals } from '@/lib/plan-url';
import { whatsappUrl } from '@/lib/whatsapp';

describe('plan URL state', () => {
  it('encodes the brief example', () => {
    expect(encodePlanState({ ...emptyPlanState, items: ['landing', 'turnos'], maintenance: 'crecimiento' })).toBe(
      'items=landing,turnos&m=crecimiento',
    );
  });
  it('round-trips a full state', () => {
    const state = {
      goals: ['encontrar' as const, 'atender' as const],
      planId: 'sistema' as const,
      items: ['seo' as const],
      maintenance: null,
      billing: 'annual' as const,
      vertical: 'clinicas' as const,
      founder: true,
    };
    expect(encodePlanState(state)).toBe('g=encontrar,atender&plan=sistema&items=seo&m=none&b=annual&v=clinicas&f=1');
    expect(decodePlanState(encodePlanState(state))).toEqual(state);
  });
  it('drops unknown or duplicated ids', () => {
    expect(decodePlanState('?items=landing,hack,landing&m=gold&plan=x&v=zzz&b=weekly&g=nope,vender,vender')).toEqual({
      ...emptyPlanState,
      goals: ['vender'],
      items: ['landing'],
    });
  });
  it('empty query → empty state', () => {
    expect(decodePlanState('')).toEqual(emptyPlanState);
  });
  it('links made before goals existed still work and are re-encoded unchanged', () => {
    for (const old of [
      'items=landing',
      'items=turnos,pedidos,automatizacion,dashboard,landing,voz&m=crecimiento',
      'plan=sistema&items=seo&m=none&b=annual&v=clinicas&f=1',
    ]) {
      const state = decodePlanState(`?${old}`);
      expect(state.goals).toEqual([]);
      expect(encodePlanState(state)).toBe(old);
    }
  });
  it('goals keep their canonical order', () => {
    expect(sortGoals(['diagnostico', 'encontrar', 'x'])).toEqual(['encontrar', 'diagnostico']);
    expect(encodePlanState({ ...emptyPlanState, goals: ['app', 'encontrar'] })).toBe('g=encontrar,app');
    expect(GOAL_IDS).toHaveLength(7);
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
