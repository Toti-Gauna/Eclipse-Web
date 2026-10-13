import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import { quote, maintenanceSuggestion, addonsForPlan } from '@/lib/pricing';
import { campaignProblem, bonusMonths } from '@/lib/campaign';
import { buildPlanMessage } from '@/lib/plan-message';
import { catalogMismatches } from '@/lib/plan-request';
import { emptyPlanState } from '@/lib/plan-url';
import { toApiSelection } from '@/lib/plan-request';
import catalog from './fixtures/backend-catalog.reto-v2.json';
import old from './fixtures/backend-catalog.v1.json';
import type { ApiCatalog } from '@/lib/api/types';
import es from '@/messages/es.json';
describe('new campaign catalog / web API agreement', () => {
  it.each([
    ['volta', [], 500],
    ['velmar', [], 500],
    ['volta', ['landing-extra'], 550],
    ['velmar', ['whatsapp-extra'], 600],
    ['volta', ['whatsapp-extra', 'landing-extra'], 650],
    ['velmar', ['whatsapp-extra', 'landing-extra'], 650],
    ['operativo', [], 750],
    ['ampliado', [], 1000],
    ['presencia', [], 500],
    ['automatiza', [], 500],
  ] as const)('%s with %j produces %i and exact 50/50', (planId, ids, total) => {
    const q = quote({ planId, itemIds: ids, maintenanceId: 'esencial', billing: 'annual', founderOptIn: true, foundersLeft: 5 });
    expect(q.totalUsd).toBe(total);
    expect(Math.round(q.totalUsd * 100) / 2).toBe(total * 50);
    expect(q.maintenance.billing).toBe('monthly');
    expect(q.offers.applied).toEqual([]);
  });
  it('server fixture matches current content; archived fixture remains unchanged', () => {
    expect(catalogMismatches(catalog as unknown as ApiCatalog)).toEqual([]);
    expect(old.plans.find((p) => p.id === 'presencia')?.rangeCents.from).toBe(25000);
    expect(old.maintenance.find((p) => p.id === 'crecimiento')?.monthlyCents).toBe(7900);
  });
  it.each([
    [null, ['landing-extra']],
    ['presencia', ['whatsapp-extra']],
    ['operativo', ['landing-extra']],
    ['volta', ['voz']],
  ] as const)('flags incompatible extras for %s', (id, ids) => {
    expect(campaignProblem(id, ids)).toBe('incompatible');
  });
  it('bonus is only Presence on Volta/Velmar; recommendations do not accumulate plans', () => {
    expect(bonusMonths('volta', 'esencial')).toBe(3);
    expect(bonusMonths('velmar', 'esencial')).toBe(3);
    for (const p of ['presencia', 'automatiza', 'operativo']) expect(bonusMonths(p, 'esencial')).toBe(0);
    for (const p of ['crecimiento', 'escala']) expect(bonusMonths('volta', p)).toBe(0);
    expect(maintenanceSuggestion({ itemIds: ['automatizacion'] })).toBe('escala');
    expect(maintenanceSuggestion({ itemIds: ['landing'] })).toBe('esencial');
  });
  it('card extras and WhatsApp show payments, eligible bonus and excluded consumption', () => {
    expect(addonsForPlan('volta').map((x) => x.addon.itemId)).toEqual(['whatsapp-extra', 'landing-extra']);
    expect(addonsForPlan('presencia')).toEqual([]);
    const t = createTranslator({ locale: 'es', messages: es, namespace: 'planMessage' });
    const q = quote({ planId: 'volta', itemIds: ['whatsapp-extra', 'landing-extra'], maintenanceId: 'esencial' });
    const text = buildPlanMessage(
      { quote: q, source: 'builder', locale: 'es', currency: 'USD', rates: { ARS: 1450, BRL: 5.4 }, names: {}, languageName: 'Español' },
      (key, values) => t(key as never, values as never),
    );
    expect(text).toContain('Anticipo 50%');
    expect(text).toContain('325');
    expect(text).toContain('desde el cuarto');
    expect(text).toContain('Sin consumo ilimitado');
  });
  it('selection never sends money/bonus or creates acceptance', () => {
    const input = toApiSelection({ ...emptyPlanState, planId: 'volta', items: ['landing-extra'] });
    expect(input).not.toHaveProperty('totalCents');
    expect(input).not.toHaveProperty('bonusMonths');
    expect(input).not.toHaveProperty('accepted');
  });
});
