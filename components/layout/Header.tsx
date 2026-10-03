'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ScrollTrigger, useGSAP } from '@/components/motion/gsap';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { MiniEclipse } from './MiniEclipse';
import { LocaleSwitcher } from './LocaleSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';
import { MobileMenu } from './MobileMenu';
import { NAV_LINKS, navLabelKey } from './navLinks';
import { HYDRATED_EVENT } from '@/components/motion/LazyHydrate';

/**
 * Fixed header. Transparent over the hero, glass once scrolled, and it flips to
 * the light theme while it sits over any element marked [data-header-theme="light"].
 */
export function Header() {
  const t = useTranslations();
  const { openBuilder } = useExperience();
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);
  // Deferred sections re-create their DOM when they hydrate: rebuild the light zones then.
  const [domVersion, setDomVersion] = useState(0);
  useEffect(() => {
    const bump = () => setDomVersion((v) => v + 1);
    window.addEventListener(HYDRATED_EVENT, bump);
    return () => window.removeEventListener(HYDRATED_EVENT, bump);
  }, []);

  useGSAP(() => {
    const triggers: ScrollTrigger[] = [];
    triggers.push(
      ScrollTrigger.create({
        start: 8,
        end: 'max',
        // Not isActive: it turns false at the very bottom (progress 1), which left the
        // header transparent over the footer's text.
        onToggle: (self) => setScrolled(self.progress > 0),
      }),
    );
    const active = new Set<Element>();
    const lightZones = document.querySelectorAll('[data-header-theme="light"]');
    lightZones.forEach((zone) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: zone,
          start: () => `top top+=${(ref.current?.offsetHeight ?? 64) / 2}`,
          end: () => `bottom top+=${(ref.current?.offsetHeight ?? 64) / 2}`,
          onToggle: (self) => {
            if (self.isActive) active.add(zone);
            else active.delete(zone);
            setLight(active.size > 0);
          },
        }),
      );
    });
    return () => triggers.forEach((st) => st.kill());
  }, { dependencies: [domVersion], revertOnUpdate: true });

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-3 z-[60] rounded-full bg-corona px-4 py-3 text-sm font-medium text-void"
      >
        {t('header.skip')}
      </a>
      <header
        ref={ref}
        data-scrolled={scrolled || undefined}
        className={`site-header fixed inset-x-0 top-0 z-50 ${light ? 'theme-light' : 'theme-dark'}`}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-3">
          <Link href="/" aria-label={t('header.home')} className="-ml-1 flex min-h-11 items-center gap-2.5 rounded-full px-1">
            <MiniEclipse />
            <span className="text-[0.8rem] font-medium tracking-[0.32em] text-fg">ECLIPSE</span>
          </Link>

          <nav aria-label={t('header.mainNav')} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/#${link.hash}`}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {t(`nav.${navLabelKey(link.id)}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              <LocaleSwitcher />
              <CurrencySwitcher />
            </div>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => openBuilder('header')}
              className="btn btn-primary btn-sm !px-4 text-[0.85rem] sm:!px-5"
            >
              {t('header.buildPlan')}
            </button>
            <MobileMenu className="xl:hidden" />
          </div>
        </div>
      </header>
    </>
  );
}
