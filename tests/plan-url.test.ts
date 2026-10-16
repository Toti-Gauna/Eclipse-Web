import { describe, expect, it } from 'vitest';
import { GOAL_IDS, decodePlanState, encodePlanState, emptyPlanState, sortGoals } from '@/lib/plan-url';
import { whatsappUrl } from '@/lib/whatsapp';
import { quote } from '@/lib/pricing';

describe('plan URL state', () => {
  it('encodes the brief example', () => {
    expect(encodePlanState({ ...emptyPlanState, items: ['landing', 'turnos'], maintenance: 'conectado' })).toBe(
      'items=landing,turnos&m=conectado',
    );
  });
  it('round-trips a full state', () => {
    const state = {
      goals: ['encontrar' as const, 'atender' as const],
      planId: 'pack' as const,
      items: ['voz' as const],
      maintenance: null,
      billing: 'annual' as const,
      vertical: 'clinicas' as const,
      founder: true,
    };
    expect(encodePlanState(state)).toBe('g=encontrar,atender&plan=pack&items=voz&m=none&b=annual&v=clinicas&f=1');
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
    for (const old of ['items=landing', 'items=turnos,pedidos,dashboard,landing,voz&m=esencial', 'plan=adaptacion&items=seo&m=none&v=clinicas']) {
      const state = decodePlanState(`?${old}`);
      expect(state.goals).toEqual([]);
      expect(encodePlanState(state)).toBe(old);
    }
  });
  it('links from before the 16/10 offer drop the retired ids and never revive old promotions', () => {
    const state = decodePlanState('?plan=sistema&items=seo,automatizacion,ecommerce,voz&m=crecimiento&b=annual&f=1');
    expect(state).toMatchObject({ planId: null, items: ['seo', 'voz'], maintenance: undefined });
    const q = quote({
      planId: state.planId,
      itemIds: state.items,
      maintenanceId: 'ia',
      billing: state.billing,
      founderOptIn: state.founder,
      foundersLeft: 5,
      now: new Date('2026-10-16T12:00:00Z'),
    });
    // voice 750 as the project + SEO 100 as an add-on; no founder discount, monthly billing.
    expect([q.totalUsd, q.offers.applied.length, q.maintenance.billing, q.maintenance.periodUsd]).toEqual([850, 0, 'monthly', 150]);
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
