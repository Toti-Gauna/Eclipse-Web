import { describe, expect, it } from 'vitest';
import {
  addonsForPlan,
  annualize,
  applyOffers,
  detectPlans,
  formatMoney,
  maintenanceSuggestion,
  planSavings,
  quote,
  sumItems,
  voiceComboApplies,
  isOfferActive,
  defaultCatalog,
} from '@/lib/pricing';
import { plans, offers, type Offer, type Plan } from '@/lib/content';

const rates = { ARS: 1450, BRL: 5.4 };
const plan = (id: string) => plans.find((p) => p.id === id) as Plan;
const NOW = new Date('2026-10-02T12:00:00Z');

describe('sumItems', () => {
  it('sums catalog prices', () => {
    expect(sumItems(['landing', 'turnos'])).toBe(650);
  });
  it('ignores duplicates and unknown ids', () => {
    expect(sumItems(['landing', 'landing', 'nope'])).toBe(250);
    expect(sumItems([])).toBe(0);
  });
});

describe('planSavings', () => {
  it('Sistema: 2.350 por separado vs desde 1.000 → 57%', () => {
    const s = planSavings(plan('sistema'));
    expect(s.separateUsd).toBe(2350);
    expect(s.savingsUsd).toBe(1350);
    expect(s.savingsPct).toBe(57);
    expect(s.show).toBe(true);
  });
  it('Comercio and Plataforma show real savings', () => {
    expect(planSavings(plan('comercio'))).toMatchObject({ separateUsd: 3650, savingsPct: 45, show: true });
    expect(planSavings(plan('plataforma'))).toMatchObject({ separateUsd: 5650, savingsPct: 29, show: true });
    expect(planSavings(plan('automatiza'))).toMatchObject({ separateUsd: 650, savingsPct: 38, show: true });
  });
  it('single-item plans never claim a saving', () => {
    for (const id of ['diagnostico', 'presencia', 'voz']) expect(planSavings(plan(id)).show, id).toBe(false);
  });
});

describe('detectPlans', () => {
  it('detects Sistema when all its items are selected', () => {
    const matches = detectPlans(['turnos', 'pedidos', 'automatizacion', 'dashboard', 'landing', 'voz', 'seo']);
    expect(matches[0].plan.id).toBe('sistema');
    expect(matches[0].savingsPct).toBe(57);
    expect(matches[0].extras).toEqual(['seo']);
  });
  it('does not detect a plan with a missing item', () => {
    expect(detectPlans(['turnos', 'automatizacion', 'dashboard', 'landing', 'voz']).map((m) => m.plan.id)).not.toContain('sistema');
  });
  it('detects Automatiza (chatbot + automatizaciones)', () => {
    expect(detectPlans(['chatbot', 'automatizacion']).map((m) => m.plan.id)).toEqual(['automatiza']);
  });
  it('orders by biggest saving first', () => {
    const ids = detectPlans(plans.find((p) => p.id === 'comercio')!.items.concat(['voz', 'chatbot'])).map((m) => m.plan.id);
    expect(ids[0]).toBe('comercio');
    expect(ids).toContain('sistema');
    expect(ids).toContain('automatiza');
  });
  it('ignores single-item plans', () => {
    expect(detectPlans(['voz'])).toEqual([]);
    expect(detectPlans(['landing'])).toEqual([]);
  });
});

describe('voice combo', () => {
  it('applies on Sistema or higher', () => {
    expect(voiceComboApplies({ planId: 'comercio', restUsd: 2000 }, offers, NOW)).not.toBeNull();
    expect(voiceComboApplies({ planId: 'presencia', restUsd: 250 }, offers, NOW)).toBeNull();
  });
  it('applies when the rest of the selection reaches 1.000 (voice agent excluded)', () => {
    expect(voiceComboApplies({ restUsd: 999 }, offers, NOW)).toBeNull();
    expect(voiceComboApplies({ restUsd: 1000 }, offers, NOW)).not.toBeNull();
  });
  it('is disabled when the offer is inactive or expired', () => {
    const off = offers.map((o) => (o.kind === 'voiceCombo' ? { ...o, active: false } : o)) as Offer[];
    expect(voiceComboApplies({ planId: 'sistema', restUsd: 5000 }, off, NOW)).toBeNull();
    const expired = offers.map((o) => (o.kind === 'voiceCombo' ? { ...o, endsAt: '2026-01-01T00:00:00Z' } : o)) as Offer[];
    expect(voiceComboApplies({ planId: 'sistema', restUsd: 5000 }, expired, NOW)).toBeNull();
  });
});

describe('isOfferActive', () => {
  it('honours active flag and endsAt', () => {
    const o = offers[0];
    expect(isOfferActive(o, NOW)).toBe(true);
    expect(isOfferActive({ ...o, active: false }, NOW)).toBe(false);
    expect(isOfferActive({ ...o, endsAt: '2026-12-31T00:00:00Z' }, NOW)).toBe(true);
    expect(isOfferActive({ ...o, endsAt: '2026-10-01T00:00:00Z' }, NOW)).toBe(false);
    expect(isOfferActive(undefined, NOW)).toBe(false);
  });
});

describe('applyOffers', () => {
  it('founder −20% only when opted in and slots remain', () => {
    expect(applyOffers({ subtotalUsd: 1000, founderOptIn: true, foundersLeft: 5, now: NOW }).totalUsd).toBe(800);
    expect(applyOffers({ subtotalUsd: 1000, founderOptIn: true, foundersLeft: 0, now: NOW }).totalUsd).toBe(1000);
    const notOpted = applyOffers({ subtotalUsd: 1000, founderOptIn: false, foundersLeft: 3, now: NOW });
    expect(notOpted.totalUsd).toBe(1000);
    expect(notOpted.available).toContain('founder');
  });
  it('founder offer disappears with no slots left', () => {
    expect(applyOffers({ subtotalUsd: 1000, foundersLeft: 0, now: NOW }).available).not.toContain('founder');
  });
  it('annual maintenance reports 2 months saved per year', () => {
    const r = applyOffers({ subtotalUsd: 0, billing: 'annual', maintenanceMonthlyUsd: 79, now: NOW });
    expect(r.applied).toContainEqual({ id: 'annual', kind: 'annualMaintenance', savingsUsd: 0, savingsPerYearUsd: 158 });
  });
  it('lists referrals as an available program', () => {
    expect(applyOffers({ subtotalUsd: 100, now: NOW }).available).toContain('referral');
  });
  it('reports the voice combo when it saved money', () => {
    expect(applyOffers({ subtotalUsd: 1300, voiceComboSavingsUsd: 300, now: NOW }).applied.map((a) => a.id)).toContain('combo-voz');
  });
});

describe('maintenanceSuggestion', () => {
  it('follows the plan table', () => {
    const expected: Record<string, string | null> = {
      diagnostico: null,
      presencia: null,
      voz: 'esencial',
      automatiza: 'esencial',
      sistema: 'crecimiento',
      comercio: 'escala',
      plataforma: 'escala',
    };
    for (const [id, m] of Object.entries(expected)) expect(maintenanceSuggestion({ planId: id as Plan['id'] }), id).toBe(m);
  });
  it('derives from items for a free selection', () => {
    expect(maintenanceSuggestion({ itemIds: ['landing', 'seo'] })).toBeNull();
    expect(maintenanceSuggestion({ itemIds: ['landing', 'chatbot'] })).toBe('esencial');
    expect(maintenanceSuggestion({ itemIds: ['turnos'] })).toBe('crecimiento');
    expect(maintenanceSuggestion({ itemIds: ['ecommerce', 'chatbot'] })).toBe('escala');
  });
  it('extras can raise a plan suggestion, never lower it', () => {
    expect(maintenanceSuggestion({ planId: 'presencia', itemIds: ['ecommerce'] })).toBe('escala');
    expect(maintenanceSuggestion({ planId: 'comercio', itemIds: ['seo'] })).toBe('escala');
  });
});

describe('annualize', () => {
  it('charges 10 months', () => {
    expect(annualize(25)).toBe(250);
    expect(annualize(79)).toBe(790);
    expect(annualize(199)).toBe(1990);
  });
});

describe('quote', () => {
  it('free selection: sums items and applies the voice combo from 1.000', () => {
    const q = quote({ itemIds: ['turnos', 'dashboard', 'landing', 'voz'], now: NOW });
    // rest = 400 + 400 + 250 = 1050 → voice at 300
    expect(q.voiceCombo).toBe(true);
    expect(q.subtotalUsd).toBe(1350);
    expect(q.totalUsd).toBe(1350);
    expect(q.offers.applied.map((a) => a.id)).toContain('combo-voz');
  });
  it('free selection under 1.000 keeps the voice agent at list price', () => {
    const q = quote({ itemIds: ['landing', 'voz'], now: NOW });
    expect(q.voiceCombo).toBe(false);
    expect(q.subtotalUsd).toBe(850);
  });
  it('plan + add-ons: price from, range, combo on Comercio', () => {
    const q = quote({ planId: 'comercio', itemIds: ['voz', 'seo'], now: NOW });
    expect(q.subtotalUsd).toBe(2000 + 300 + 150);
    expect(q.rangeUsd).toEqual({ from: 2450, to: 3950 });
    expect(q.hasVoice).toBe(true);
  });
  it('items already included in the plan are not charged twice', () => {
    const q = quote({ planId: 'sistema', itemIds: ['voz', 'landing'], now: NOW });
    expect(q.subtotalUsd).toBe(1000);
    expect(q.hasVoice).toBe(true);
    expect(q.maintenance.voiceUsageMonthlyUsd).toBe(49);
  });
  it('maintenance monthly vs annual', () => {
    const m = quote({ planId: 'sistema', itemIds: [], maintenanceId: 'crecimiento', now: NOW }).maintenance;
    expect(m.periodUsd).toBe(79);
    const a = quote({ planId: 'sistema', itemIds: [], maintenanceId: 'crecimiento', billing: 'annual', now: NOW }).maintenance;
    expect(a.periodUsd).toBe(790);
    expect(a.voiceUsageMonthlyUsd).toBe(49);
  });
  it('founder discount applies to the one-time total', () => {
    const q = quote({ planId: 'sistema', itemIds: [], founderOptIn: true, foundersLeft: 5, now: NOW });
    expect(q.totalUsd).toBe(800);
  });
  it('no voice agent → no voice usage fee', () => {
    expect(quote({ planId: 'presencia', itemIds: [], now: NOW }).maintenance.voiceUsageMonthlyUsd).toBe(0);
  });
});

describe('addonsForPlan', () => {
  const byId = (list: ReturnType<typeof addonsForPlan>) => Object.fromEntries(list.map((a) => [a.addon.id, a]));

  it('voice add-on: 600 on small plans, 300 from Sistema up, included in Voz/Sistema/Plataforma', () => {
    expect(byId(addonsForPlan('presencia', [], undefined, defaultCatalog, NOW))['addon-voz']).toMatchObject({ status: 'available', priceUsd: 600 });
    expect(byId(addonsForPlan('comercio', [], undefined, defaultCatalog, NOW))['addon-voz']).toMatchObject({ status: 'available', priceUsd: 300, discounted: true });
    for (const id of ['voz', 'sistema', 'plataforma'] as const) {
      expect(byId(addonsForPlan(id, [], undefined, defaultCatalog, NOW))['addon-voz'].status, id).toBe('included');
    }
  });
  it('chatbot add-on is hidden on Automatiza', () => {
    expect(byId(addonsForPlan('automatiza'))['addon-chatbot']).toBeUndefined();
    expect(byId(addonsForPlan('sistema'))['addon-chatbot']).toMatchObject({ status: 'available', priceUsd: 350 });
  });
  it('voice add-on drops to 300 once the card reaches 1.000 without it', () => {
    const list = addonsForPlan('presencia', ['addon-marketing', 'addon-trailer', 'addon-seo'], undefined, defaultCatalog, NOW);
    expect(byId(list)['addon-voz'].priceUsd).toBe(300);
  });
  it('returns nothing for an unknown plan', () => {
    expect(addonsForPlan('nope' as Plan['id'])).toEqual([]);
  });
});

describe('formatMoney', () => {
  const clean = (s: string) => s.replace(/ /g, ' ').replace(/ /g, ' ');
  it('USD: integer, no approximation', () => {
    expect(clean(formatMoney(1000, 'USD', rates, 'en'))).toBe('$1,000');
    expect(clean(formatMoney(999.6, 'USD', rates, 'es'))).toMatch(/US\$ ?1\.000/);
  });
  it('ARS: nearest 1.000 with ≈', () => {
    // 1000 × 1450 = 1.450.000
    expect(clean(formatMoney(1000, 'ARS', rates, 'es'))).toBe('≈ $ 1.450.000');
    // 25 × 1450 = 36.250 → 36.000
    expect(clean(formatMoney(25, 'ARS', rates, 'es'))).toBe('≈ $ 36.000');
  });
  it('BRL: nearest 10 with ≈', () => {
    // 25 × 5.4 = 135 → 140
    expect(clean(formatMoney(25, 'BRL', rates, 'pt'))).toBe('≈ R$ 140');
    expect(clean(formatMoney(1000, 'BRL', rates, 'pt'))).toBe('≈ R$ 5.400');
  });
  it('locale changes the separators', () => {
    expect(clean(formatMoney(1000, 'BRL', rates, 'en'))).toBe('≈ R$5,400');
  });
  it('approximation prefix can be disabled', () => {
    expect(clean(formatMoney(1000, 'BRL', rates, 'pt', { approx: false }))).toBe('R$ 5.400');
  });
});
