'use client';

import { useLocale, useTranslations } from 'next-intl';
import { verticals, showcaseVerticals, l } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { openerKey, preloadDemoExperience } from '@/components/demo-experience/store';
import { useHeroState } from './HeroState';

/**
 * "O mirá una demo ahora" (the hero's second way in, under the primary CTA): one instrument
 * key per demo on show (`showcaseVerticals`; today Inmobiliarias, number 02 on the dial — the
 * demos in standby and "Otro" have no key). Hovering or focusing a key turns the dial around
 * the eclipse to its number; pressing it records the rubro and opens its demo in the "Ver
 * demo" layer, born from the key. The chosen rubro stays lit (`data-chosen`, not a second
 * solid amber button).
 *
 * Phones: two tidy rows that scroll sideways (snap, edge fade). From md up the
 * keys simply wrap in the copy column.
 */
export function VerticalChips() {
  const t = useTranslations('hero');
  const locale = useLocale() as Locale;
  const { choose, aim } = useHeroState();
  const { vertical } = useExperience();

  return (
    <div role="group" aria-labelledby="hero-pick-vertical">
      <p id="hero-pick-vertical" className="hero-pick label">
        <span>{t('pickVertical')}</span>
        <span aria-hidden className="hero-pick-rule" />
      </p>
      <div className="hero-chips-scroller no-scrollbar">
        <ul className="hero-chips" onPointerLeave={() => aim(null, 'hover')}>
          {verticals.map((v, i) => {
            if (!showcaseVerticals.includes(v)) return null;
            const demo = v.demo;
            const preload = demo ? () => preloadDemoExperience(demo, locale) : undefined;
            return (
              <li key={v.id} data-hero-enter>
                <button
                  type="button"
                  data-hero-chip={v.id}
                  data-demo-opener={demo ? openerKey('hero', demo) : undefined}
                  data-chosen={vertical === v.id ? '' : undefined}
                  aria-haspopup="dialog"
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
                  onClick={(e) => choose(v.id, e.currentTarget)}
                  className="hero-chip"
                >
                  <span aria-hidden className="hero-chip-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="hero-chip-name">{l(v.name, locale)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
