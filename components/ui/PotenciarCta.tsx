'use client';

import type { MouseEvent, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { openSelector, preloadSelector, type SelectorOrigin } from '@/components/demo-experience/store';
import { useSound } from '@/components/sound/SoundContext';
import { track } from '@/lib/analytics';

/**
 * «Potenciar mi negocio»: the one way into the showroom. A REAL link to the contact block
 * (`#contacto`, where WhatsApp lives), upgraded by JS to open the rubro selector: without
 * JavaScript, or if the selector's chunk can't be fetched, it simply goes to the contact — it
 * never dead-ends. A modified click (new tab, ctrl/cmd, middle button) keeps the link's own
 * behavior.
 *
 * `origin` names the control (analytics, focus return via `data-demo-opener="selector:<origin>"`).
 * `pageCta` / `heroCta` mark a solid amber instance for the "one amber per viewport" rule
 * (the header's own CTA turns quiet while either is on screen).
 */
export function PotenciarCta({
  origin,
  className,
  children,
  pageCta = false,
  label,
  markOpener = true,
  onActivate,
}: {
  origin: SelectorOrigin;
  className?: string;
  children?: ReactNode;
  pageCta?: boolean;
  /** Accessible name when the visible text is shortened. */
  label?: string;
  /** False when focus must return to another control (the phone menu marks its own button). */
  markOpener?: boolean;
  /** Runs just before the selector opens (the phone menu closes itself). */
  onActivate?: () => void;
}) {
  const t = useTranslations('selector');
  const { play } = useSound();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    play('glint');
    onActivate?.();
    if (origin === 'hero') track('hero_cta_clicked', { target: 'selector' });
    openSelector({ origin }, e.currentTarget, () => {
      // The chunk didn't come: do what the link says.
      window.location.hash = SECTION_IDS.agent;
    });
  };

  return (
    <a
      href={`#${SECTION_IDS.agent}`}
      className={className}
      data-page-cta={pageCta || undefined}
      data-opens-selector
      data-demo-opener={markOpener ? `selector:${origin}` : undefined}
      aria-haspopup="dialog"
      aria-label={label}
      onClick={onClick}
      onPointerEnter={() => void preloadSelector()}
      onFocus={() => void preloadSelector()}
    >
      {children ?? t('cta')}
    </a>
  );
}
