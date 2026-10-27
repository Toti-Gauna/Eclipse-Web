import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { maintenanceSuggestion, quote } from '@/lib/pricing';
import { sellableItems } from '@/lib/content';

/**
 * Exports what the web's `quote` says for a fixed set of selections, as the reference the backend's estimator must
 * match cent by cent (Eclipse-be tests/fixtures/web-quote-cases.json). Skipped unless EXPORT_QUOTE_CASES=<path>.
 *   EXPORT_QUOTE_CASES=/tmp/web-quote-cases.json npx vitest run tests/export-quote-cases.test.ts
 */
const target = process.env.EXPORT_QUOTE_CASES;

describe.skipIf(!target)('export web quote cases for the backend parity fixture', () => {
  it('writes the cases', () => {
    const ids = sellableItems.map((i) => i.id);
    const selections: string[][] = [];
    for (const a of ids) selections.push([a]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) selections.push([ids[i], ids[j]]);
    // Curated larger selections: anchors, add-ons, review-priced pieces, one-off services only, AI + WhatsApp.
    selections.push(
      ['landing', 'seo', 'whatsapp'],
      ['landing', 'web-multi', 'seo', 'trailer'],
      ['turnos', 'pedidos', 'dashboard', 'crm'],
      ['chatbot', 'whatsapp', 'landing'],
      ['voz', 'chatbot', 'whatsapp'],
      ['migracion', 'landing'],
      ['migracion', 'crm', 'whatsapp'],
      ['asesoria-growth', 'marketing', 'auditoria'],
      ['asesoria-growth', 'auditoria'],
      ['catalogo', 'landing', 'gamificacion'],
      ['app-fase', 'crm', 'chatbot', 'voz', 'whatsapp'],
      ['gamificacion', 'seo', 'trailer'],
    );
    const cases = selections.map((itemIds) => {
      const q = quote({ planId: null, itemIds, maintenanceId: null, billing: 'monthly', founderOptIn: false });
      return {
        items: itemIds,
        subtotalCents: Math.round(q.subtotalUsd * 100),
        totalCents: Math.round(q.totalUsd * 100),
        lines: q.lines.map((l) => [l.id, Math.round(l.priceUsd * 100), Math.round(l.listUsd * 100), l.addon ? 1 : 0]),
        pending: q.pending.map((p) => [p.id, p.fromUsd * 100, p.toUsd * 100]),
        suggestedMaintenance: maintenanceSuggestion({ planId: null, itemIds }),
      };
    });
    writeFileSync(target!, JSON.stringify({ source: 'Eclipse-Web lib/pricing.ts quote()', count: cases.length, cases }) + '\n');
  });
});
