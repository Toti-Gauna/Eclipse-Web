'use client';

import type { ReactNode, Ref } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Lock, RotateCw } from 'lucide-react';
import './browser.css';

/**
 * Browser chrome around a public mini-site of the business. Always a FICTIONAL url
 * (use the reserved `.demo` TLD, e.g. "clinicaaurora.demo/reservar").
 * - desktop: traffic dots, back/forward, address field.
 * - mobile: compact address bar (inside a phone screen).
 */
export function BrowserFrame({
  url,
  variant = 'desktop',
  children,
  className = '',
  bodyRef,
}: {
  url: string;
  variant?: 'desktop' | 'mobile';
  children: ReactNode;
  className?: string;
  /** The scrolling body (scroll it to show a section). */
  bodyRef?: Ref<HTMLDivElement>;
}) {
  const t = useTranslations('demoKit.browser');
  return (
    <div className={`demo-browser ${className}`} data-variant={variant}>
      <div className="demo-browser-bar">
        {variant === 'desktop' ? (
          <span aria-hidden className="demo-browser-dots">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        {variant === 'desktop' ? (
          <span aria-hidden className="demo-browser-nav">
            <ChevronLeft strokeWidth={1.8} />
            <ChevronRight strokeWidth={1.8} />
          </span>
        ) : null}
        <p className="demo-browser-url">
          <Lock aria-hidden strokeWidth={2} />
          <span className="sr-only">{t('address')}: </span>
          <span className="min-w-0 truncate">{url}</span>
        </p>
        <RotateCw aria-hidden className="demo-browser-reload" strokeWidth={1.8} />
      </div>
      <div ref={bodyRef} className="demo-browser-body">
        {children}
      </div>
    </div>
  );
}

/**
 * Layout of a fictional business's public site: nav (brand, links, CTA), hero
 * (text + media), then your sections. Typography follows the theme's display font.
 */
export function LandingPreview({
  brand,
  links = [],
  cta,
  hero,
  compact = false,
  children,
  className = '',
}: {
  brand: ReactNode;
  links?: string[];
  cta?: ReactNode;
  hero: { kicker?: ReactNode; title: ReactNode; body?: ReactNode; actions?: ReactNode; media?: ReactNode };
  /** Mobile layout (stacked hero, no links). */
  compact?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`demo-site ${className}`} data-compact={compact ? '' : undefined}>
      <nav className="demo-site-nav" aria-label={typeof brand === 'string' ? brand : undefined}>
        <span className="demo-site-brand">{brand}</span>
        {!compact && links.length ? (
          <ul className="demo-site-links" aria-hidden>
            {links.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        ) : null}
        {cta ? <span className="demo-site-cta">{cta}</span> : null}
      </nav>
      <header className="demo-site-hero">
        <div className="demo-site-hero-copy">
          {hero.kicker ? <p className="demo-site-kicker">{hero.kicker}</p> : null}
          <h3 className="demo-site-title demo-display">{hero.title}</h3>
          {hero.body ? <p className="demo-site-body">{hero.body}</p> : null}
          {hero.actions ? <div className="demo-site-actions">{hero.actions}</div> : null}
        </div>
        {hero.media ? <div className="demo-site-media">{hero.media}</div> : null}
      </header>
      {children}
    </div>
  );
}

/** A titled block of a LandingPreview. */
export function SiteSection({ kicker, title, children, className = '' }: { kicker?: ReactNode; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`demo-site-section ${className}`}>
      {kicker ? <p className="demo-site-kicker">{kicker}</p> : null}
      {title ? <h4 className="demo-site-h demo-display">{title}</h4> : null}
      {children}
    </section>
  );
}
