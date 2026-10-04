'use client';

import type { CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Check, CircleAlert, Plus, ShoppingBag } from 'lucide-react';
import { localeTags, type Locale } from '@/i18n/routing';
import type { FamilyId } from './services';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * A small static sketch of what each family looks like working (decorative,
 * aria-hidden: everything it says is also in the index). v3: no looping
 * animation — every scene is its finished frame (services.css → "Previews").
 * Copy: `services.families.<id>.preview`.
 */
export function ServicePreview({ family, className = '' }: { family: FamilyId; className?: string }) {
  return (
    <div aria-hidden className={`pv ${className}`} data-family={family}>
      <div className="pv-scene">
        {family === 'web' ? <WebScene /> : null}
        {family === 'ai' ? <AiScene /> : null}
        {family === 'ops' ? <OpsScene /> : null}
        {family === 'sales' ? <SalesScene /> : null}
        {family === 'apps' ? <AppsScene /> : null}
        {family === 'strategy' ? <StrategyScene /> : null}
      </div>
    </div>
  );
}

function WebScene() {
  const t = useTranslations('services.families.web.preview');
  return (
    <div className="pv-web">
      <div className="pv-win">
        <div className="pv-win-bar">
          <i />
          <i />
          <i />
          <span className="pv-url">{t('url')}</span>
        </div>
        <div className="pv-web-body">
          <p className="pv-kicker">{t('kicker')}</p>
          <p className="pv-web-head">{t('headline')}</p>
          <span className="pv-skel pv-web-skel-a" />
          <span className="pv-skel pv-web-skel-b" />
          <span className="pv-web-cta">{t('cta')}</span>
          <span className="pv-web-tiles">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
      <p className="pv-bubble">{t('bubble')}</p>
    </div>
  );
}

function AiScene() {
  const t = useTranslations('services.families.ai.preview');
  return (
    <div className="pv-ai">
      <div className="pv-call">
        <p className="pv-call-top">
          <span className="pv-live-dot" />
          <span className="pv-label">{t('call')}</span>
          <span className="pv-timer">00:49</span>
        </p>
        <span className="pv-wave">
          {Array.from({ length: 26 }, (_, i) => (
            <i key={i} style={{ '--i': i, '--h': 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7)) } as Vars} />
          ))}
        </span>
        <p className="pv-call-agent">{t('agent')}</p>
      </div>
      <div className="pv-chat">
        <p className="pv-msg pv-msg-in">{t('question')}</p>
        <p className="pv-msg pv-msg-out">{t('answer')}</p>
        <p className="pv-chip">
          <Check strokeWidth={2} />
          {t('done')}
        </p>
      </div>
    </div>
  );
}

/** Which agenda cells end up booked (5 days × 4 slots) and the one that lights up. */
const BOOKED = [0, 2, 3, 6, 7, 9, 11, 12, 15, 17, 18];
const HIGHLIGHT = 8;

function OpsScene() {
  const t = useTranslations('services.families.ops.preview');
  const locale = useLocale() as Locale;
  // Mon → Fri initials from Intl (2024-01-01 was a Monday): no copy to translate.
  const fmt = new Intl.DateTimeFormat(localeTags[locale], { weekday: 'narrow', timeZone: 'UTC' });
  const days = Array.from({ length: 5 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 0, 1 + i))));
  return (
    <div className="pv-ops">
      <div className="pv-cal">
        <p className="pv-label">{t('title')}</p>
        <span className="pv-cal-days">
          {days.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </span>
        <span className="pv-cal-grid">
          {Array.from({ length: 20 }, (_, i) => (
            // Row-major; the CSS fills them column by column (nth-child(5n + c)).
            <i key={i} data-state={i === HIGHLIGHT ? 'hi' : BOOKED.includes(i) ? 'on' : undefined} />
          ))}
        </span>
      </div>
      <div className="pv-kpis">
        <div className="pv-kpi">
          <p className="pv-label">{t('kpi')}</p>
          <p className="pv-kpi-value">12</p>
        </div>
        <div className="pv-kpi pv-kpi-order">
          <p>{t('order')}</p>
          <Check strokeWidth={2} />
        </div>
      </div>
      <p className="pv-toast">
        <Check strokeWidth={2} />
        {t('toast')}
      </p>
    </div>
  );
}

function SalesScene() {
  const t = useTranslations('services.families.sales.preview');
  return (
    <div className="pv-sales">
      <p className="pv-store-bar">
        <span className="pv-label">{t('store')}</span>
        <span className="pv-cart">
          <ShoppingBag strokeWidth={1.5} />
          <b>2</b>
        </span>
      </p>
      <span className="pv-products">
        {[0, 1, 2].map((i) => (
          <span key={i} className="pv-product" data-i={i}>
            <i className="pv-product-img" />
            <span className="pv-skel" />
            <span className="pv-skel pv-skel-short" />
            <span className="pv-add">
              <Plus strokeWidth={2} />
              {t('add')}
            </span>
          </span>
        ))}
      </span>
      <p className="pv-toast">
        <Check strokeWidth={2} />
        {t('paid')}
      </p>
    </div>
  );
}

function AppsScene() {
  const t = useTranslations('services.families.apps.preview');
  return (
    <div className="pv-apps">
      <div className="pv-board">
        <p className="pv-label">{t('board')}</p>
        {[0, 1, 2].map((i) => (
          <p key={i} className="pv-board-row" data-i={i}>
            <i />
            <span className="pv-skel" />
          </p>
        ))}
      </div>
      <div className="pv-phone">
        <span className="pv-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="18,86 18,58 52,58 52,30 80,30 80,16" />
          </svg>
          <span className="pv-pin" />
          {/* Full-size track: translate(%) of it moves the runner in map coordinates. */}
          <span className="pv-track">
            <span className="pv-runner" />
          </span>
        </span>
        <span className="pv-sheet">
          <span className="pv-label">{t('status')}</span>
          <span className="pv-eta">
            {t('eta')}{' '}
            <b>2</b>{' '}
            {t('unit')}
          </span>
          <span className="pv-steps">
            <i data-done />
            <i data-now />
            <i />
          </span>
        </span>
      </div>
    </div>
  );
}

/** Illustrative audit: the weakest line (Google) becomes priority 1. */
const METERS: { key: 'web' | 'google' | 'social' | 'whatsapp'; value: number; ok: boolean; focus?: boolean }[] = [
  { key: 'web', value: 0.78, ok: true },
  { key: 'google', value: 0.3, ok: false, focus: true },
  { key: 'social', value: 0.55, ok: false },
  { key: 'whatsapp', value: 0.86, ok: true },
];

function StrategyScene() {
  const t = useTranslations('services.families.strategy.preview');
  return (
    <div className="pv-strat">
      <p className="pv-label">{t('title')}</p>
      <span className="pv-meters">
        {METERS.map((m, i) => (
          <span
            key={m.key}
            className="pv-meter-row"
            data-weak={!m.ok || undefined}
            data-focus={m.focus || undefined}
            style={{ '--v': m.value, '--i': i } as Vars}
          >
            <span className="pv-meter-label">{t(m.key)}</span>
            <span className="pv-meter">
              <i />
            </span>
            <span className="pv-meter-mark">{m.ok ? <Check strokeWidth={2} /> : <CircleAlert strokeWidth={1.75} />}</span>
          </span>
        ))}
      </span>
      <p className="pv-priority">
        <ArrowRight strokeWidth={1.75} />
        {t('priority')}
      </p>
    </div>
  );
}
