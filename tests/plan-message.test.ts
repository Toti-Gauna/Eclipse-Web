import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import es from '@/messages/es.json';
import en from '@/messages/en.json';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { quote } from '@/lib/pricing';

const rates = { ARS: 1450, BRL: 5.4 };
const NOW = new Date('2026-10-02T12:00:00Z');
const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const translator = (locale: 'es' | 'en', messages: typeof es | typeof en): Translate => {
  const t = createTranslator({ locale, messages, namespace: 'planMessage' });
  return (key, values) => t(key as never, values as never);
};

describe('buildPlanMessage', () => {
  it('plan card in ARS (es) with add-on, maintenance and voice usage', () => {
    const t = translator('es', es);
    const q = quote({ planId: 'comercio', itemIds: ['voz'], maintenanceId: 'escala', now: NOW });
    const msg = clean(
      buildPlanMessage(
        {
          source: 'card',
          locale: 'es',
          currency: 'ARS',
          rates,
          quote: q,
          names: { comercio: 'Comercio', voz: 'Agente de voz con IA' },
          maintenanceName: 'Escala',
          offers: ['Combo voz'],
          verticalName: 'Clínicas',
          languageName: 'Español',
        },
        t,
      ),
    );
    expect(msg).toBe(
      [
        'Hola Eclipse. Quiero este plan:',
        '• Plan Comercio — desde ≈ $ 2.900.000 (US$ 2.000)',
        '• Agente de voz con IA — ≈ $ 435.000 (US$ 300) (combo)',
        'Total estimado: de ≈ $ 3.335.000 (US$ 2.300) a ≈ $ 5.510.000 (US$ 3.800)',
        'Mantenimiento Escala: ≈ $ 289.000 (US$ 199) por mes',
        'Agente de voz: ≈ $ 71.000 (US$ 49) por mes + minutos según uso',
        'Ofertas: Combo voz',
        'Rubro: Clínicas',
        'Idioma: Español · Moneda: ARS',
      ].join('\n'),
    );
  });

  it('builder in USD (en) with founder discount and annual maintenance', () => {
    const t = translator('en', en);
    const q = quote({
      itemIds: ['landing', 'seo'],
      maintenanceId: 'esencial',
      billing: 'annual',
      founderOptIn: true,
      foundersLeft: 5,
      now: NOW,
    });
    const msg = clean(
      buildPlanMessage(
        {
          source: 'builder',
          locale: 'en',
          currency: 'USD',
          rates,
          quote: q,
          names: { landing: 'Premium landing page', seo: 'SEO + analytics' },
          maintenanceName: 'Essential',
          offers: ['Founder price −20%'],
          languageName: 'English',
        },
        t,
      ),
    );
    expect(msg).toBe(
      [
        'Hi Eclipse. I built my plan on your website:',
        '• Premium landing page — $250',
        '• SEO + analytics — $150',
        'Estimated total: $400',
        'With offers: $320',
        'Essential maintenance: $250 per year (paid yearly, 2 months free)',
        'Offers: Founder price −20%',
        'Language: English · Currency: USD',
      ].join('\n'),
    );
  });

  it('says when there is no maintenance', () => {
    const t = translator('es', es);
    const q = quote({ planId: 'presencia', itemIds: [], now: NOW });
    const msg = buildPlanMessage(
      { source: 'card', locale: 'es', currency: 'USD', rates, quote: q, names: { presencia: 'Presencia' }, languageName: 'Español' },
      t,
    );
    expect(msg).toContain('Sin mantenimiento por ahora');
    expect(msg).not.toContain('Agente de voz');
  });
});
