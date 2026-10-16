import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import es from '@/messages/es.json';
import en from '@/messages/en.json';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { quote } from '@/lib/pricing';

const rates = { ARS: 1450, BRL: 5.4 };
const NOW = new Date('2026-10-16T12:00:00Z');
const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const translator = (locale: 'es' | 'en', messages: typeof es | typeof en): Translate => {
  const t = createTranslator({ locale, messages, namespace: 'planMessage' });
  return (key, values) => t(key as never, values as never);
};

describe('buildPlanMessage', () => {
  it('10 · offer card in ARS (es): pack + chatbot add-on, 50/50, plan with the pack calendar', () => {
    const t = translator('es', es);
    const q = quote({ planId: 'pack', itemIds: ['chatbot'], maintenanceId: 'ia', now: NOW });
    const msg = clean(
      buildPlanMessage(
        {
          source: 'card',
          locale: 'es',
          currency: 'ARS',
          rates,
          quote: q,
          names: { pack: 'Pack lanzamiento', chatbot: 'Chatbot IA (WhatsApp o web)' },
          maintenanceName: 'Automatización e IA',
          verticalName: 'Clínicas',
          languageName: 'Español',
        },
        t,
      ),
    );
    expect(msg).toBe(
      [
        'Hola Eclipse. Quiero esta oferta:',
        '• Pack lanzamiento — desde ≈ $ 1.015.000 (US$ 700)',
        '• Chatbot IA (WhatsApp o web) (complemento) — ≈ $ 363.000 (US$ 250)',
        'Implementación estimada: ≈ $ 1.378.000 (US$ 950)',
        'Anticipo 50%: ≈ $ 689.000 (US$ 475) · Saldo: ≈ $ 689.000 (US$ 475)',
        'Plan mensual Automatización e IA: ≈ $ 218.000 (US$ 150) por mes',
        'Meses 1 a 3 desde la publicación: ≈ $ 174.000 (US$ 120) por mes; desde el mes 4: ≈ $ 218.000 (US$ 150) por mes',
        'Es una solicitud de propuesta, no una cotización: alcance y factibilidad a confirmar.',
        'Rubro: Clínicas',
        'Idioma: Español · Moneda: ARS',
      ].join('\n'),
    );
  });

  it('14 · builder in USD (en): standard WhatsApp alone, migration pending apart, no offers applied', () => {
    const t = translator('en', en);
    const q = quote({ itemIds: ['whatsapp', 'migracion'], maintenanceId: 'conectado', billing: 'annual', founderOptIn: true, foundersLeft: 5, now: NOW });
    const msg = clean(
      buildPlanMessage(
        {
          source: 'builder',
          locale: 'en',
          currency: 'USD',
          rates,
          quote: q,
          names: { whatsapp: 'Standard WhatsApp (no AI)', migracion: 'Excel/PDF migration' },
          maintenanceName: 'Connected',
          languageName: 'English',
        },
        t,
      ),
    );
    expect(msg).toBe(
      [
        'Hi Eclipse. I built my plan on your website:',
        '• Standard WhatsApp (no AI) — $500',
        'Estimated implementation: $500',
        '50% upfront: $250 · Balance: $250',
        '• Excel/PDF migration: $100 to $300, quoted after reviewing a sample (not in the total)',
        'Monthly plan Connected: $75 per month',
        'This is a proposal request, not a quote: scope and feasibility to be confirmed.',
        'Language: English · Currency: USD',
      ].join('\n'),
    );
  });

  it('says when there is no monthly plan, and never mentions a voice fee', () => {
    const t = translator('es', es);
    const q = quote({ itemIds: ['asesorias'], now: NOW });
    const msg = clean(
      buildPlanMessage(
        { source: 'builder', locale: 'es', currency: 'USD', rates, quote: q, names: { asesorias: 'Las dos asesorías' }, languageName: 'Español' },
        t,
      ),
    );
    expect(msg).toContain('Sin plan mensual por ahora');
    expect(msg).toContain('Las dos asesorías — US$ 250');
    expect(msg).not.toMatch(/minutos|Agente de voz/);
  });
});
