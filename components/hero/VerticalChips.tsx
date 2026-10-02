'use client';

import { useLocale, useTranslations } from 'next-intl';
import { verticals, l } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { ContentIcon } from '@/components/ui/Icon';
import { preloadDemo } from '@/components/demos/DemoShowcase';
import { useHeroState } from './HeroState';

/** "Elegí tu rubro": Clínicas · Inmobiliarias · Gimnasios · Otro. */
export function VerticalChips() {
  const t = useTranslations('hero');
  const locale = useLocale() as Locale;
  const { revealed, choose } = useHeroState();

  return (
    <div role="group" aria-labelledby="hero-pick-vertical">
      <p id="hero-pick-vertical" className="eyebrow mb-3">
        {t('pickVertical')}
      </p>
      <ul className="flex flex-wrap gap-2">
        {verticals.map((v) => {
          const pressed = revealed === v.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                aria-pressed={v.id === 'otro' ? undefined : pressed}
                aria-haspopup={v.id === 'otro' ? 'dialog' : undefined}
                onPointerEnter={() => v.demo && preloadDemo(v.demo)}
                onFocus={() => v.demo && preloadDemo(v.demo)}
                onClick={() => choose(v.id)}
                className={`group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-[background-color,border-color,color,box-shadow] duration-300 ${
                  pressed
                    ? 'border-corona bg-corona text-void shadow-[0_0_30px_-6px_rgb(245_185_66/0.8)]'
                    : 'border-line-strong bg-surface text-fg hover:border-corona hover:shadow-[0_0_24px_-8px_rgb(245_185_66/0.7)]'
                }`}
              >
                <ContentIcon name={v.icon} className={`size-4 ${pressed ? '' : 'text-corona'}`} />
                {l(v.name, locale)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
