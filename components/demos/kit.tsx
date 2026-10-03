'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import './demo.css';

export interface DemoTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * App chrome shared by every demo.
 * - phone: status bar, app header (logo + name + "Demo" badge), content, bottom tabs
 * - laptop: sidebar with tabs, top bar (name + "Demo" badge), content
 * Size everything inside with `em` (see demo.css).
 */
export function DemoShell({
  screen,
  business,
  accent,
  logo,
  tabs,
  activeTab,
  onTab,
  headerRight,
  children,
}: {
  screen: 'phone' | 'laptop';
  /** Fictional business name, without the " — Demo" suffix. */
  business: string;
  /** Brand color of the fictional business. */
  accent: string;
  logo: ReactNode;
  tabs?: DemoTab[];
  activeTab?: string;
  onTab?: (id: string) => void;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('common');
  const td = useTranslations('demoShowcase');
  const style = { '--demo-accent': accent } as CSSProperties;
  // The laptop and the phone render side by side: each tab bar needs its own landmark name.
  const navLabel = `${td(screen === 'laptop' ? 'laptopLabel' : 'phoneLabel', { business })} — ${t('sections')}`;
  const name = (
    <span className={`flex min-w-0 gap-[0.5em] ${screen === 'laptop' ? 'flex-wrap items-center' : 'items-center'}`}>
      <span className="grid size-[2em] shrink-0 place-items-center rounded-[0.6em] bg-[var(--demo-accent)] text-white">{logo}</span>
      <span className="truncate font-semibold">
        {business}
        <span className="sr-only"> — {t('demo')}</span>
      </span>
      <span className="demo-badge" aria-hidden>
        {t('demo')}
      </span>
    </span>
  );

  if (screen === 'laptop') {
    return (
      <div className="demo-root" data-screen="laptop" style={style}>
        <nav aria-label={navLabel} className="flex w-[15em] shrink-0 flex-col gap-[0.25em] border-r border-[var(--demo-line)] bg-white p-[1em]">
          <div className="mb-[1.2em]">{name}</div>
          {tabs?.map((tab) => {
            const Icon = tab.icon;
            const on = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={on}
                onClick={() => onTab?.(tab.id)}
                className={`flex items-center gap-[0.6em] rounded-[0.6em] px-[0.7em] py-[0.55em] text-left text-[0.92em] transition-colors ${
                  on ? 'bg-[var(--demo-accent-soft)] font-semibold text-[var(--demo-accent)]' : 'text-[var(--demo-muted)] hover:bg-black/[0.03]'
                }`}
              >
                <Icon aria-hidden className="size-[1.15em]" strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-end gap-[0.8em] border-b border-[var(--demo-line)] bg-white/70 px-[1.2em] py-[0.7em]">
            {headerRight}
          </div>
          <div className="demo-scroll p-[1.2em]">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-root" data-screen="phone" style={style}>
      <div aria-hidden className="flex items-center justify-between px-[1.6em] pb-[0.2em] pt-[0.9em] text-[0.72em] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-[0.3em]">
          <span className="h-[0.7em] w-[1em] rounded-[0.15em] border border-current" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-[0.5em] px-[1em] py-[0.6em]">
        {name}
        {headerRight}
      </div>
      <div className="demo-scroll px-[1em] pb-[1em]">{children}</div>
      {tabs?.length ? (
        <nav aria-label={navLabel} className="grid border-t border-[var(--demo-line)] bg-white pb-[0.9em] pt-[0.4em]" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const on = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={on}
                onClick={() => onTab?.(tab.id)}
                className={`flex flex-col items-center gap-[0.2em] py-[0.35em] text-[0.62em] ${on ? 'font-semibold text-[var(--demo-accent)]' : 'text-[var(--demo-muted)]'}`}
              >
                <Icon aria-hidden className="size-[1.9em]" strokeWidth={on ? 2 : 1.6} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

/**
 * Ticks every `everyMs` while `active` (and the tab is visible). Use it to drive
 * "live" simulations. With reduced motion it jumps straight to `max`.
 */
export function useDemoClock(active: boolean, everyMs = 1600, max = Infinity): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion: show the end state at once
      if (Number.isFinite(max)) setTick(max);
      return;
    }
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTick((n) => (n >= max ? n : n + 1));
    }, everyMs);
    return () => window.clearInterval(id);
  }, [active, everyMs, max]);
  return tick;
}

/** Three bouncing dots ("typing…"). */
export function TypingDots({ label }: { label: string }) {
  return (
    <span className="demo-typing inline-flex gap-[0.2em]" role="status" aria-label={label}>
      <span className="size-[0.4em] rounded-full bg-current" />
      <span className="size-[0.4em] rounded-full bg-current" />
      <span className="size-[0.4em] rounded-full bg-current" />
    </span>
  );
}
