import { describe, expect, it } from 'vitest';
import {
  addonsForPlan,
  annualFreeMonths,
  applyOffers,
  detectPlans,
  expandCovered,
  formatAmount,
  formatMoney,
  formatRate,
  isOfferActive,
  lowestItemPrice,
  lowestMaintenance,
  maintenanceSuggestion,
  planSavings,
  plansByTier,
  quote,
  resolveCombos,
  splitPayment,
} from '@/lib/pricing';
import { depositPct, itemCategories, items, maintenancePlans, offers, plans, type Offer, type Plan } from '@/lib/content';
import { FAMILIES, familyFromUsd, familyItems } from '@/components/sections/services/services';

const rates = { ARS: 1450, BRL: 5.4 };
const plan = (id: string) => plans.find((p) => p.id === id) as Plan;
const item = (id: string) => items.find((i) => i.id === id)!;
const NOW = new Date('2026-10-16T12:00:00Z');
const q = (planId: string | null, itemIds: string[] = [], maintenanceId: string | null = null) =>
  quote({ planId: planId as never, itemIds, maintenanceId: maintenanceId as never, now: NOW });

/**
 * Offer approved on 16/10/2026. Scenario numbers follow the acceptance list of the brief.
 */
describe('catalog of the 16/10 offer (content/*.json)', () => {
  it('two explicit offers: Adaptación 500 and Pack 700, single "desde", 50% upfront', () => {
    expect(plans.map((p) => [p.id, p.priceUsd.from, p.priceUsd.to])).toEqual([
      ['adaptacion', 500, 500],
      ['pack', 700, 700],
    ]);
    expect(depositPct).toBe(50);
  });
  it('independent / add-on prices of every piece', () => {
    const table = Object.fromEntries(items.map((i) => [i.id, [i.priceUsd, i.addonUsd]]));
    expect(table).toEqual({
      landing: [500, 200],
      'web-multi': [500, 150],
      seo: [500, 100],
      trailer: [500, 100],
      turnos: [750, 250],
      pedidos: [750, 250],
      whatsapp: [500, 100],
      dashboard: [750, 250],
      crm: [750, 250],
      gamificacion: [500, 150],
      migracion: [100, null],
      catalogo: [500, null],
      'app-fase': [1000, null],
      chatbot: [750, 250],
      voz: [750, 250],
      'asesoria-growth': [150, 150],
      'asesoria-economica': [150, 150],
      asesorias: [250, 250],
      marketing: [500, 150],
      auditoria: [500, 100],
    });
    expect(item('migracion').reviewRangeUsd).toEqual({ from: 100, to: 300 });
  });
  it('one monthly plan: 30/75/150 with 5/15/40 of third-party budget inside', () => {
    expect(maintenancePlans.map((m) => [m.id, m.priceUsd, m.thirdPartyUsd])).toEqual([
      ['esencial', 30, 5],
      ['conectado', 75, 15],
      ['ia', 150, 40],
    ]);
  });
  it('historical offers (founder, voice combo, annual, referral) are all off', () => {
    expect(offers.filter((o) => isOfferActive(o, NOW))).toEqual([]);
  });
  it('no offer is inferred by total: the pack is chosen explicitly, never detected', () => {
    expect(detectPlans(['landing', 'seo', 'gamificacion', 'asesorias'])).toEqual([]);
    for (const p of plans) expect(planSavings(p).show).toBe(false);
  });
});

describe('quote — offers and add-ons', () => {
  it('1 · Adaptación 500: 250 upfront, 250 balance, one plan', () => {
    const r = q('adaptacion', [], 'esencial');
    expect([r.totalUsd, r.depositUsd, r.balanceUsd]).toEqual([500, 250, 250]);
    expect(r.maintenance.monthlyUsd).toBe(30);
    expect(r.maintenance.intro).toBeNull();
  });
  it('2 · Adaptación + landing add-on = 700 (350/350), with NO pack credit', () => {
    const r = q('adaptacion', ['landing'], 'esencial');
    expect(r.lines.map((l) => [l.id, l.priceUsd, !!l.addon])).toEqual([
      ['adaptacion', 500, false],
      ['landing', 200, true],
    ]);
    expect([r.totalUsd, r.depositUsd, r.balanceUsd]).toEqual([700, 350, 350]);
    expect(r.plan?.id).toBe('adaptacion');
    expect(r.maintenance.intro).toBeNull();
  });
  it('2 · a landing the offer already covers is not charged (pack)', () => {
    expect(q('pack', ['landing']).totalUsd).toBe(700);
  });
  it('3 · advisory sessions: 150 each, both = the 250 combo (never 150 + 150 + 250)', () => {
    expect(q(null, ['asesoria-growth']).totalUsd).toBe(150);
    expect(q(null, ['asesoria-economica']).totalUsd).toBe(150);
    const both = q(null, ['asesoria-growth', 'asesoria-economica']);
    expect(both.lines.map((l) => l.id)).toEqual(['asesorias']);
    expect(both.totalUsd).toBe(250);
    expect(q(null, ['asesoria-growth', 'asesoria-economica', 'asesorias']).totalUsd).toBe(250);
    expect(resolveCombos(['asesorias', 'asesoria-growth'])).toEqual(['asesorias']);
    expect(item('asesoria-economica').validate).toBe(true);
    expect(plan('pack').validate).toBe(true);
  });
  it('4 · Pack 700: 350/350, included pieces and standard gamification never charged', () => {
    const r = q('pack', ['gamificacion', 'seo', 'asesoria-growth', 'asesoria-economica', 'asesorias'], 'esencial');
    expect(r.lines.map((l) => l.id)).toEqual(['pack']);
    expect([r.totalUsd, r.depositUsd, r.balanceUsd]).toEqual([700, 350, 350]);
    expect(expandCovered(plan('pack').items)).toEqual(expect.arrayContaining(['asesoria-growth', 'asesoria-economica']));
  });
  it('9 · standard gamification is covered by the adaptation too', () => {
    expect(q('adaptacion', ['gamificacion']).totalUsd).toBe(500);
  });
  it('8 · migration is a pending 100–300 range: never in the total or the deposit', () => {
    const r = q('adaptacion', ['migracion']);
    expect(r.totalUsd).toBe(500);
    expect(r.depositUsd).toBe(250);
    expect(r.lines.map((l) => l.id)).toEqual(['adaptacion']);
    expect(r.pending).toEqual([{ id: 'migracion', fromUsd: 100, toUsd: 300 }]);
    const alone = q(null, ['migracion']);
    expect([alone.totalUsd, alone.depositUsd, alone.pending.length]).toEqual([0, 0, 1]);
  });
  it('11 · modules 750, phases 1.000 and independent services keep their own price', () => {
    expect(q(null, ['turnos']).totalUsd).toBe(750);
    expect(q(null, ['app-fase']).totalUsd).toBe(1000);
    expect(q(null, ['catalogo']).totalUsd).toBe(500);
    expect(q(null, ['marketing']).totalUsd).toBe(500);
    // a piece without an add-on price stays independent even on an offer
    expect(q('adaptacion', ['catalogo']).totalUsd).toBe(1000);
    // WhatsApp 100 stays a compatible add-on without AI
    expect(q('adaptacion', ['whatsapp']).lines[1]).toMatchObject({ id: 'whatsapp', priceUsd: 100, addon: true });
  });
  it('14 · WhatsApp: independent 500 (250/250) or add-on 100 on a base (600, 300/300), never both', () => {
    const alone = q(null, ['whatsapp']);
    expect([alone.totalUsd, alone.depositUsd, alone.balanceUsd]).toEqual([500, 250, 250]);
    expect(alone.lines[0].addon).toBeUndefined();
    const onBase = q('adaptacion', ['whatsapp', 'whatsapp']);
    expect([onBase.totalUsd, onBase.depositUsd, onBase.balanceUsd]).toEqual([600, 300, 300]);
  });
  it('15 · chatbot or voice: independent 750 (375/375) or add-on 250 on the 500 base (750, 375/375)', () => {
    for (const id of ['chatbot', 'voz']) {
      const alone = q(null, [id]);
      expect([alone.totalUsd, alone.depositUsd, alone.balanceUsd], id).toEqual([750, 375, 375]);
      const onBase = q('adaptacion', [id]);
      expect([onBase.totalUsd, onBase.depositUsd, onBase.balanceUsd], id).toEqual([750, 375, 375]);
      expect(onBase.lines.find((l) => l.id === id)?.addon, id).toBe(true);
    }
  });
  it('15 · two different services: the widest is the project, the other an add-on on it', () => {
    const r = q(null, ['chatbot', 'whatsapp']);
    expect(r.lines.map((l) => [l.id, l.priceUsd])).toEqual([
      ['whatsapp', 100],
      ['chatbot', 750],
    ]);
    expect(r.totalUsd).toBe(850);
  });
  it('16 · Pack + chatbot (or voice) add-on = 950, 475/475; nothing is added by itself', () => {
    for (const id of ['chatbot', 'voz']) {
      const r = q('pack', [id], 'ia');
      expect([r.totalUsd, r.depositUsd, r.balanceUsd], id).toEqual([950, 475, 475]);
    }
    expect(q('pack').lines.map((l) => l.id)).toEqual(['pack']);
  });
  it('19 · basic SEO is covered by both offers: never charged again', () => {
    expect(q('adaptacion', ['seo']).totalUsd).toBe(500);
    expect(q('pack', ['seo']).totalUsd).toBe(700);
  });
});

describe('quote — the one monthly plan', () => {
  it('5 · Pack: months 1–3 at 0 / 45 / 120, then 30 / 75 / 150', () => {
    const expected: Record<string, [number, number]> = { esencial: [0, 30], conectado: [45, 75], ia: [120, 150] };
    for (const [id, [intro, regular]] of Object.entries(expected)) {
      const r = q('pack', [], id);
      expect(r.maintenance.intro, id).toEqual({ months: 3, monthlyUsd: intro });
      expect(r.maintenance.monthlyUsd, id).toBe(regular);
      expect(r.totalUsd, id).toBe(700);
    }
  });
  it('6 · without the pack the plan is charged from launch, and changing it replaces it', () => {
    const r = q('adaptacion', ['landing'], 'conectado');
    expect([r.totalUsd, r.maintenance.monthlyUsd, r.maintenance.intro]).toEqual([700, 75, null]);
    expect(q('adaptacion', ['landing'], 'ia').maintenance.monthlyUsd).toBe(150);
  });
  it('7 · third-party budgets and hours are conditions, never charges', () => {
    const r = q('adaptacion', [], 'ia');
    expect(r.totalUsd).toBe(500);
    expect(r.maintenance.periodUsd).toBe(150);
  });
  it('17 · no automatic voice fee or per-channel monthly charge', () => {
    const r = q('adaptacion', ['voz', 'chatbot', 'whatsapp'], 'ia');
    expect(r.maintenance.periodUsd).toBe(150);
    expect(Object.keys(r.maintenance)).not.toContain('voiceUsageMonthlyUsd');
  });
  it('annual billing falls back to monthly while the annual offer is off', () => {
    const r = quote({ planId: 'adaptacion', itemIds: [], maintenanceId: 'esencial', billing: 'annual', now: NOW });
    expect(r.maintenance.billing).toBe('monthly');
    expect(r.maintenance.periodUsd).toBe(30);
  });
  it('founder opt-in does nothing while the founder offer is off', () => {
    const r = quote({ planId: 'pack', itemIds: [], founderOptIn: true, foundersLeft: 5, now: NOW });
    expect(r.totalUsd).toBe(700);
    expect(r.offers.applied).toEqual([]);
  });
});

describe('maintenanceSuggestion', () => {
  it('offers → Esencial; WhatsApp → Conectado; chatbot/voice → Automatización e IA', () => {
    expect(maintenanceSuggestion({ planId: 'adaptacion' })).toBe('esencial');
    expect(maintenanceSuggestion({ planId: 'pack' })).toBe('esencial');
    expect(maintenanceSuggestion({ planId: 'adaptacion', itemIds: ['whatsapp'] })).toBe('conectado');
    expect(maintenanceSuggestion({ planId: 'pack', itemIds: ['chatbot'] })).toBe('ia');
    expect(maintenanceSuggestion({ itemIds: ['voz'] })).toBe('ia');
    expect(maintenanceSuggestion({ itemIds: ['landing'] })).toBe('esencial');
  });
  it('one-off services never create a monthly plan', () => {
    expect(maintenanceSuggestion({ itemIds: ['asesorias', 'marketing', 'auditoria', 'trailer', 'migracion'] })).toBeNull();
  });
});

describe('splitPayment', () => {
  it('50/50 in whole cents', () => {
    expect(splitPayment(950)).toEqual({ depositUsd: 475, balanceUsd: 475 });
    expect(splitPayment(125)).toEqual({ depositUsd: 62.5, balanceUsd: 62.5 });
    expect(splitPayment(0)).toEqual({ depositUsd: 0, balanceUsd: 0 });
  });
});

describe('addonsForPlan', () => {
  it('add-on prices come from the catalog; covered pieces show as included or hide', () => {
    const adaptacion = addonsForPlan('adaptacion').map((a) => [a.item.id, a.status, a.priceUsd]);
    expect(adaptacion).toEqual([
      ['whatsapp', 'available', 100],
      ['chatbot', 'available', 250],
      ['voz', 'available', 250],
      ['landing', 'available', 200],
      ['trailer', 'available', 100],
    ]);
    // the pack covers the landing: hidden there
    expect(addonsForPlan('pack').map((a) => a.item.id)).not.toContain('landing');
  });
});

describe('applyOffers / isOfferActive (historical engine, kept for older agreements)', () => {
  const live: Offer[] = offers.map((o) => ({ ...o, active: true }));
  it('honours the active flag and endsAt', () => {
    const o = live[0];
    expect(isOfferActive(o, NOW)).toBe(true);
    expect(isOfferActive({ ...o, active: false }, NOW)).toBe(false);
    expect(isOfferActive({ ...o, endsAt: '2026-10-01T00:00:00Z' }, NOW)).toBe(false);
  });
  it('founder −20% only when opted in and slots remain (if ever re-enabled)', () => {
    expect(applyOffers({ subtotalUsd: 1000, founderOptIn: true, foundersLeft: 1, offerList: live, now: NOW }).totalUsd).toBe(800);
    expect(applyOffers({ subtotalUsd: 1000, founderOptIn: true, foundersLeft: 0, offerList: live, now: NOW }).totalUsd).toBe(1000);
  });
});

describe('plansByTier', () => {
  it('both offers in the "starter" group', () => {
    expect(plansByTier().map((g) => [g.tier, g.plans.map((p) => p.id)])).toEqual([['starter', ['adaptacion', 'pack']]]);
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
  it('locale changes the separators, BRL is always R$', () => {
    expect(clean(formatMoney(1000, 'BRL', rates, 'en'))).toMatch(/^≈ R\$ ?5,400$/);
    expect(clean(formatMoney(1000, 'BRL', rates, 'es'))).toMatch(/^≈ R\$ ?5\.400$/);
  });
  it('approximation prefix can be disabled', () => {
    expect(clean(formatMoney(1000, 'BRL', rates, 'pt', { approx: false }))).toBe('R$ 5.400');
  });
});

describe('annualFreeMonths', () => {
  it('12 minus the months charged, clamped', () => {
    expect(annualFreeMonths()).toBe(2);
    expect(annualFreeMonths(12)).toBe(0);
    expect(annualFreeMonths(14)).toBe(0);
    expect(annualFreeMonths(-1)).toBe(12);
  });
});

describe('annualFreeMonths', () => {
  it('12 minus the months charged, clamped', () => {
    expect(annualFreeMonths()).toBe(2);
    expect(annualFreeMonths(12)).toBe(0);
    expect(annualFreeMonths(-1)).toBe(12);
  });
});

describe('lowestMaintenance', () => {
  it('returns the cheapest plan (Esencial, USD 30)', () => {
    expect(lowestMaintenance()).toMatchObject({ id: 'esencial', priceUsd: 30 });
    expect(lowestMaintenance([...maintenancePlans].reverse())?.id).toBe('esencial');
    expect(lowestMaintenance([])).toBeNull();
  });
});

describe('lowestItemPrice', () => {
  it('lowest catalog price among the ids', () => {
    expect(lowestItemPrice(['landing', 'web-multi', 'seo', 'trailer'])).toBe(500);
    expect(lowestItemPrice(['voz', 'chatbot'])).toBe(750);
    expect(lowestItemPrice([])).toBeNull();
  });
});

describe('formatAmount', () => {
  const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
  it('converted and rounded like formatMoney, without symbol', () => {
    expect(formatAmount(1500, 'USD', rates, 'es')).toBe('1.500');
    expect(formatAmount(1500, 'USD', rates, 'en')).toBe('1,500');
    expect(clean(formatAmount(1000, 'ARS', rates, 'es'))).toBe('1.450.000');
    expect(formatAmount(25, 'BRL', rates, 'pt')).toBe('140');
  });
});

describe('formatRate', () => {
  const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
  it('shows the raw rate of the day', () => {
    expect(clean(formatRate('ARS', rates, 'es'))).toBe('$ 1.450');
    expect(clean(formatRate('BRL', rates, 'pt'))).toBe('R$ 5,40');
    expect(clean(formatRate('BRL', rates, 'en'))).toMatch(/^R\$ ?5\.40$/);
    expect(clean(formatRate('USD', rates, 'en'))).toBe('$1');
  });
  it('drops decimals for big fractional rates', () => {
    expect(clean(formatRate('ARS', { ARS: 1452.6, BRL: 5.4 }, 'es'))).toBe('$ 1.453');
  });
});

describe('services catalog (03 · Qué construimos)', () => {
  it('one family per item category, in the content order (same as the builder catalog)', () => {
    expect(FAMILIES.map((f) => f.category)).toEqual(itemCategories.map((c) => c.id));
  });
  it('every piece of the catalog belongs to exactly one family', () => {
    const listed = FAMILIES.flatMap((f) => familyItems(f).map((i) => i.id));
    expect([...listed].sort()).toEqual(items.map((i) => i.id).sort());
  });
  it('"pieza suelta desde" is the cheapest piece of each family', () => {
    for (const family of FAMILIES) {
      expect(familyFromUsd(family), family.id).toBe(Math.min(...familyItems(family).map((i) => i.priceUsd)));
    }
  });
});
