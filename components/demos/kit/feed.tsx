'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { IconChip, LiveDot, toneClass, type Tone } from './primitives';
import './feed.css';

export interface FeedItem {
  id: string;
  icon: LucideIcon;
  tone?: Tone;
  text: ReactNode;
  /** "9:42", "2 min"… */
  time?: string;
  /** Just happened: a "now" tag + entrance. */
  fresh?: boolean;
}

/** What the system did, newest first. Decorative entrances; announce changes elsewhere. */
export function ActivityFeed({
  items,
  title,
  live = false,
  limit = 6,
  empty,
  className = '',
}: {
  items: FeedItem[];
  title?: ReactNode;
  live?: boolean;
  limit?: number;
  empty?: string;
  className?: string;
}) {
  const t = useTranslations('demoKit.feed');
  const list = items.slice(0, limit);
  return (
    <div className={`demo-feed ${className}`}>
      {title ? (
        <h3 className="demo-feed-title">
          {live ? <LiveDot /> : null}
          {title}
        </h3>
      ) : null}
      {list.length ? (
        <ol className="demo-feed-list">
          {list.map((it) => (
            <li key={it.id} className="demo-feed-item" data-fresh={it.fresh ? '' : undefined}>
              <IconChip icon={it.icon} tone={it.tone} />
              <p className="demo-feed-text">
                {it.text}
                {it.fresh ? <span className="demo-feed-now">{t('now')}</span> : null}
              </p>
              {it.time ? <span className="demo-feed-time demo-num">{it.time}</span> : null}
            </li>
          ))}
        </ol>
      ) : empty ? (
        <p className="demo-feed-empty">{empty}</p>
      ) : null}
    </div>
  );
}

export interface ToastItem {
  id: string;
  icon: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  body?: ReactNode;
  /** Animate out (render it one more tick with `leaving`). */
  leaving?: boolean;
}

/**
 * Notifications that drop in when something happens live. You decide which are
 * visible at time t (e.g. the last event if it happened < 3 s ago).
 * Decorative (aria-hidden): announce the same event once in an aria-live region.
 */
export function ToastStack({ items, placement = 'top', className = '' }: { items: ToastItem[]; placement?: 'top' | 'bottom-right'; className?: string }) {
  return (
    <div aria-hidden className={`demo-toasts ${className}`} data-placement={placement}>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.id} className={`demo-toast ${toneClass(it.tone ?? 'accent')}`} data-leaving={it.leaving ? '' : undefined}>
            <span className="demo-toast-icon">
              <Icon strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1 leading-[1.3]">
              <span className="block text-[0.74em] font-semibold">{it.title}</span>
              {it.body ? <span className="demo-toast-body block text-[0.66em]">{it.body}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Phone push notification (e.g. the WhatsApp confirmation the patient receives).
 * Place it inside a positioned phone view; it slides down from the top.
 */
export function PushBanner({
  app,
  icon,
  time,
  title,
  body,
  onOpen,
  openLabel,
  leaving = false,
  className = '',
}: {
  app: string;
  icon: ReactNode;
  time: string;
  title: ReactNode;
  body: ReactNode;
  onOpen?: () => void;
  openLabel?: string;
  leaving?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <span className="demo-push-icon" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left leading-[1.3]">
        <span className="demo-push-app">
          <span className="truncate">{app}</span>
          <span className="demo-num">{time}</span>
        </span>
        <span className="block truncate text-[0.76em] font-semibold">{title}</span>
        <span className="demo-push-body">{body}</span>
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" className={`demo-push ${className}`} data-leaving={leaving ? '' : undefined} onClick={onOpen} aria-label={openLabel}>
      {content}
    </button>
  ) : (
    <div className={`demo-push ${className}`} data-leaving={leaving ? '' : undefined}>
      {content}
    </div>
  );
}
