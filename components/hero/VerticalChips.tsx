'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { verticals, l } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { useSound } from '@/components/sound/SoundContext';
import { useHeroState } from './HeroState';
import { preloadHeroDemo } from './preload';

/**
 * "Elegí tu rubro": one instrument key per rubro (01 Clínicas … 07 Otro).
 * Hovering or focusing a key turns the dial around the eclipse to its number;
 * pressing it reveals the demo (or, for "Otro", opens "Armá tu plan").
 *
 * Phones: two tidy rows that scroll sideways (snap, edge fade). From md up the
 * keys simply wrap in the copy column.
 */
export function VerticalChips() {
  const t = useTranslations('hero');
  const locale = useLocale() as Locale;
  const { revealed, choose, aim } = useHeroState();
  const { play } = useSound();

  return (
    <div role="group" aria-labelledby="hero-pick-vertical">
      <p id="hero-pick-vertical" className="hero-pick label">
        <span>{t('pickVertical')}</span>
        <span aria-hidden className="hero-pick-rule" />
        <span aria-hidden className="hero-pick-count">{String(verticals.length).padStart(2, '0')}</span>
      </p>
      <div className="hero-chips-scroller no-scrollbar">
        <ul className="hero-chips" onPointerLeave={() => aim(null, 'hover')}>
          {verticals.map((v, i) => {
            const pressed = revealed === v.id;
            const other = v.id === 'otro';
            const preload = v.demo ? () => preloadHeroDemo(v.demo!) : undefined;
            return (
              <li key={v.id} data-hero-enter>
                <button
                  type="button"
                  data-hero-chip={v.id}
                  aria-pressed={other ? undefined : pressed}
                  aria-haspopup={other ? 'dialog' : undefined}
                  onPointerEnter={(e) => {
                    preload?.();
                    if (e.pointerType === 'mouse') aim(v.id, 'hover');
                  }}
                  onPointerDown={preload}
                  onFocus={() => {
                    preload?.();
                    aim(v.id, 'focus');
                  }}
                  onBlur={() => aim(null, 'focus')}
                  onClick={() => {
                    play('select');
                    choose(v.id);
                  }}
                  className="hero-chip"
                >
                  <span aria-hidden className="hero-chip-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="hero-chip-name">{l(v.name, locale)}</span>
                  {other ? <Plus aria-hidden className="hero-chip-plus" strokeWidth={1.5} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
