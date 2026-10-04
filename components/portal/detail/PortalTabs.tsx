'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSound } from '@/components/sound/SoundContext';

export interface PortalTab {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

/**
 * WAI-ARIA tabs (roving tabindex; ←/→, Home, End). Panels are rendered on the server and
 * passed in; inactive ones are `hidden`. Switching sections is the only thing it does.
 */
export function PortalTabs({ id, label, tabs }: { id: string; label: string; tabs: PortalTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { play } = useSound();

  const select = (index: number, focus: boolean) => {
    const tab = tabs[index];
    if (!tab) return;
    if (tab.id !== active) play('select');
    setActive(tab.id);
    if (focus) refs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  };

  return (
    <div className="pt-tabs">
      <div role="tablist" aria-label={label} className="pt-tablist">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${id}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className="pt-tab"
              onClick={() => select(i, false)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <>
                  {' '}
                  <span className="pt-tab-count">{tab.count}</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${id}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.id}`}
          tabIndex={0}
          hidden={tab.id !== active}
          className="pt-tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
