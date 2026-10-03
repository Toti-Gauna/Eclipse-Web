'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { DemoCta } from '@/components/ui/DemoCta';
import { LocaleSwitcher } from './LocaleSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';
import { NAV_LINKS, navLabelKey } from './navLinks';
import { lockScroll } from '@/lib/scroll-lock';

/** Full-screen menu that opens as an iris from the hamburger button. */
export function MobileMenu({ className = '' }: { className?: string }) {
  const t = useTranslations();
  const { openBuilder } = useExperience();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const origin = () => {
    const r = button.current?.getBoundingClientRect();
    return r ? `${r.left + r.width / 2}px ${r.top + r.height / 2}px` : '100% 0%';
  };

  useEffect(() => {
    const d = dialog.current;
    const p = panel.current;
    if (!d || !p) return;
    tl.current?.kill();
    const reduced = prefersReducedMotion();
    if (open) {
      if (!d.open) d.showModal();
      const at = origin();
      tl.current = gsap.timeline();
      if (reduced) {
        tl.current.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      } else {
        tl.current
          .fromTo(p, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 0.7, ease: 'expo.inOut' })
          .from(p.querySelectorAll('[data-menu-item]'), { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: 'expo.out' }, '-=0.35');
      }
    } else if (d.open) {
      const at = origin();
      tl.current = gsap.timeline({ onComplete: () => d.close() });
      if (reduced) tl.current.to(p, { autoAlpha: 0, duration: 0.15 });
      else tl.current.to(p, { clipPath: `circle(0% at ${at})`, duration: 0.55, ease: 'expo.inOut' });
    }
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, []);

  useEffect(() => (open ? lockScroll() : undefined), [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('header.menu')}
        onClick={() => setOpen(true)}
        className={`grid size-11 place-items-center rounded-full border border-line text-fg transition-colors hover:border-[color:var(--accent)] ${className}`}
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.6} />
      </button>

      <dialog ref={dialog} aria-label={t('header.menuDialog')} className="mobile-menu theme-dark">
        <div ref={panel} className="grain flex min-h-dvh flex-col bg-void">
          <div className="container-x flex h-[var(--header-h)] items-center justify-between">
            <span className="text-[0.8rem] font-medium tracking-[0.32em]">ECLIPSE</span>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label={t('header.closeMenu')}
              className="grid size-11 place-items-center rounded-full border border-line"
            >
              <X aria-hidden className="size-5" strokeWidth={1.6} />
            </button>
          </div>

          <nav aria-label={t('header.mainNav')} className="container-x flex-1 pt-6">
            <ul className="space-y-1">
              {NAV_LINKS.map((link, i) => (
                <li key={link.id} data-menu-item>
                  <Link
                    href={`/#${link.hash}`}
                    onClick={close}
                    className="group flex min-h-14 items-baseline gap-4 py-2 font-serif text-5xl leading-none"
                  >
                    <span className="font-sans text-xs tabular text-fg-muted">0{i + 1}</span>
                    <span className="transition-colors group-hover:text-corona">{t(`nav.${navLabelKey(link.id)}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="container-x space-y-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div data-menu-item className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  // Close at once, without the iris (the builder covers it anyway): the
                  // dialog hands focus back to the menu button before the builder opens,
                  // so closing the builder returns focus there instead of losing it.
                  tl.current?.kill();
                  dialog.current?.close();
                  close();
                  openBuilder('menu');
                }}
              >
                {t('header.buildPlan')}
              </button>
              <DemoCta origin="header" className="btn btn-ghost" />
            </div>
            <div data-menu-item className="flex flex-wrap items-center gap-3">
              <LocaleSwitcher />
              <CurrencySwitcher />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
