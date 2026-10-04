'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { items, plans } from '@/lib/content';
import type { Billing } from '@/lib/pricing';
import { useSound } from '@/components/sound/SoundContext';
import { Packages } from './Packages';
import { PiecesPanel } from './PiecesPanel';
import { PRICING_ANCHORS } from './anchors';

const TABS = ['packages', 'pieces'] as const;
type Tab = (typeof TABS)[number];

const tabId = (tab: Tab) => `pr-tab-${tab}`;
const panelId = (tab: Tab) => `pr-panel-${tab}`;

/**
 * "Dos formas de comprar" as tabs (WAI-ARIA tabs, automatic activation):
 *   A · Paquetes (7)  — the packages compared field by field
 *   B · Pieza por pieza (16) — every piece by family, with its price and the builder
 * Arrow keys / Home / End move between tabs. An in-page link to something inside
 * the hidden panel (e.g. "Incluida en: Sistema" → #plan-sistema) switches to it
 * first, synchronously, so <SmoothAnchors> can scroll and focus the target.
 */
export function BuyTabs({ billing, now }: { billing: Billing; now: number | null }) {
  const t = useTranslations('pricing');
  const { play } = useSound();
  const [tab, setTab] = useState<Tab>('packages');
  const tabs = useRef<Record<Tab, HTMLButtonElement | null>>({ packages: null, pieces: null });
  const counts: Record<Tab, number> = { packages: plans.length, pieces: items.length };

  const select = (next: Tab, focus = false) => {
    if (focus) tabs.current[next]?.focus();
    if (next === tab) return;
    setTab(next);
    play('select');
  };

  // Links (or a #hash) pointing inside the hidden panel open that panel first.
  useEffect(() => {
    const reveal = (id: string, sync: boolean) => {
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const owner = TABS.find((k) => document.getElementById(panelId(k))?.contains(target));
      const panel = owner ? document.getElementById(panelId(owner)) : null;
      if (!owner || !panel?.hidden) return;
      if (sync) flushSync(() => setTab(owner));
      else setTab(owner);
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      reveal(decodeURIComponent(url.hash.slice(1)), true);
    };
    const onHash = () => reveal(decodeURIComponent(window.location.hash.slice(1)), false);
    // Capture on window: runs before <SmoothAnchors> (capture on document) measures the target.
    window.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    const to = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(TABS[(to + TABS.length) % TABS.length], true);
  };

  return (
    <div id={PRICING_ANCHORS.packages} className="pr-buy">
      <p id="pr-buy-label" className="pr-label">
        {t('ways.label')}
      </p>
      <div role="tablist" aria-labelledby="pr-buy-label" className="pr-tabs">
        {TABS.map((key, i) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabs.current[key] = el;
              }}
              id={tabId(key)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(key)}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="pr-tab"
            >
              <span aria-hidden className="pr-tab-mark">
                {i === 0 ? 'A' : 'B'}
              </span>
              <span className="pr-tab-title">{t(key === 'packages' ? 'ways.bundles.title' : 'ways.pieces.title')}</span>
              <span aria-hidden className="pr-tab-count">
                ({counts[key]})
              </span>
              <span className="sr-only">{t('ways.options', { count: counts[key] })}</span>
            </button>
          );
        })}
      </div>

      <div id={panelId('packages')} role="tabpanel" aria-labelledby={tabId('packages')} hidden={tab !== 'packages'} className="pr-panel">
        <Packages billing={billing} now={now} onShowPieces={() => select('pieces', true)} />
      </div>
      <div id={panelId('pieces')} role="tabpanel" aria-labelledby={tabId('pieces')} hidden={tab !== 'pieces'} className="pr-panel">
        <PiecesPanel onShowPackages={() => select('packages', true)} />
      </div>
    </div>
  );
}
