'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, LogIn, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { DemoCta } from '@/components/ui/DemoCta';
import { useSound } from '@/components/sound/SoundContext';
import { SoundBadge, SoundToggle } from '@/components/sound/SoundToggle';
import { PrefsDisclosure } from './PrefsDisclosure';
import { NAV_LINKS, PORTAL_ROUTES, type ChromeMode } from './navLinks';
import { lockScroll } from '@/lib/scroll-lock';
import './header.css';

/**
 * Phones and tablets (< 1024px): a full-screen menu that opens as a quick iris from the
 * menu button. Short by design — everything fits the first screen of a 360×640 phone:
 * - landing / plan: the four section links, "Pedí tu demo" + "Armá tu plan", "Ingresar";
 * - portal: "Mis proyectos" and "Salir de la demo" (inside /portal/proyectos), "Volver al sitio";
 * then language / currency / sound folded in one row (<PrefsDisclosure>). The sound
 * master switch sits next to the close button. Esc, the close button or any link closes it.
 */
export function MobileMenu({
  mode,
  projects,
  className = '',
}: {
  mode: ChromeMode;
  projects: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { openBuilder } = useExperience();
  const { play } = useSound();
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
        tl.current.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 });
      } else {
        tl.current
          .fromTo(p, { clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 0.5, ease: 'expo.inOut' })
          .from(p.querySelectorAll('[data-menu-item]'), { y: 16, autoAlpha: 0, stagger: 0.04, duration: 0.45, ease: 'expo.out' }, '-=0.25');
      }
    } else if (d.open) {
      const at = origin();
      tl.current = gsap.timeline({ onComplete: () => d.close() });
      if (reduced) tl.current.to(p, { autoAlpha: 0, duration: 0.12 });
      else tl.current.to(p, { clipPath: `circle(0% at ${at})`, duration: 0.38, ease: 'expo.in' });
    }
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
      play('close');
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [play]);

  useEffect(() => (open ? lockScroll() : undefined), [open]);

  const close = () => {
    setOpen(false);
    play('close');
  };

  /** Closes at once, without the iris: for actions that take the visitor elsewhere (a route, the builder). */
  const closeNow = () => {
    tl.current?.kill();
    if (panel.current) gsap.set(panel.current, { clearProps: 'clipPath,opacity,visibility' });
    dialog.current?.close();
    setOpen(false);
  };

  // A client navigation (e.g. "Ingresar" → portal) never leaves the menu open behind.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (dialog.current?.open) {
      tl.current?.kill();
      dialog.current.close();
    }
  }, [pathname]);

  const portal = mode === 'portal';

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('header.menu')}
        onClick={() => {
          setOpen(true);
          play('open');
        }}
        className={`relative grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg transition-colors hover:border-[color:var(--accent)] ${className}`}
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.6} />
        <SoundBadge />
      </button>

      <dialog
        ref={dialog}
        aria-label={t('header.menuDialog')}
        className="mobile-menu theme-dark"
        // The iris closes before the dialog does; if it was cut short, `open` follows the real state.
        onClose={() => setOpen(false)}
      >
        <div ref={panel} className="grain flex min-h-dvh flex-col bg-void">
          <div className="container-x flex h-[var(--header-h)] shrink-0 items-center justify-between">
            <span aria-hidden className="text-[0.8rem] font-medium tracking-[0.32em]">
              ECLIPSE
            </span>
            <div className="flex items-center gap-2">
              <SoundToggle />
              <button
                type="button"
                autoFocus
                onClick={close}
                aria-label={t('header.closeMenu')}
                className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-[color:var(--accent)]"
              >
                <X aria-hidden className="size-5" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          {portal ? (
            <nav aria-label={t('header.portal')} className="container-x pt-6">
              <p data-menu-item className="label mb-3 text-fg-muted">
                {t('header.portal')}
              </p>
              <ul className="border-t border-line">
                {projects ? (
                  <>
                    <li data-menu-item className="border-b border-line">
                      <Link
                        href={PORTAL_ROUTES.projects}
                        onClick={closeNow}
                        aria-current={pathname.replace(/\/$/, '') === '/portal/proyectos' ? 'page' : undefined}
                        className="menu-link"
                      >
                        {t('header.myProjects')}
                      </Link>
                    </li>
                    <li data-menu-item className="border-b border-line">
                      <Link href={PORTAL_ROUTES.login} onClick={closeNow} className="menu-link">
                        {t('header.exitDemo')}
                      </Link>
                    </li>
                  </>
                ) : null}
                <li data-menu-item className="border-b border-line">
                  <Link href="/" onClick={closeNow} className="menu-link">
                    <ArrowLeft aria-hidden className="size-5 text-fg-muted" strokeWidth={1.5} />
                    {t('header.backToSite')}
                  </Link>
                </li>
              </ul>
            </nav>
          ) : (
            <>
              <nav aria-label={t('header.mainNav')} className="container-x pt-3">
                <ul>
                  {NAV_LINKS.map((link, i) => (
                    <li key={link.id} data-menu-item>
                      <Link href={`/#${link.hash}`} onClick={close} className="menu-section-link group">
                        <span aria-hidden className="menu-index">
                          0{i + 1}
                        </span>
                        <span className="transition-colors group-hover:text-corona">{t(`nav.${link.id}`)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="container-x pt-7">
                <div data-menu-item className={`grid gap-3 sm:max-w-md ${mode === 'landing' ? 'min-[360px]:grid-cols-2' : ''}`}>
                  <DemoCta origin="header" className="btn btn-primary !px-4" />
                  {mode === 'landing' ? (
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      className="btn btn-ghost !px-4"
                      onClick={() => {
                        // The dialog hands focus back to the menu button before the builder
                        // opens, so closing the builder returns focus there. No 'close' sound:
                        // the builder opening is the moment.
                        closeNow();
                        openBuilder('menu');
                      }}
                    >
                      {t('header.buildPlan')}
                    </button>
                  ) : null}
                </div>
                <div data-menu-item className="mt-2">
                  <Link href={PORTAL_ROUTES.login} prefetch={false} onClick={closeNow} className="hdr-login -ml-2 inline-flex">
                    <LogIn aria-hidden strokeWidth={1.5} />
                    {t('header.login')}
                    <span className="sr-only"> {t('header.loginContext')}</span>
                  </Link>
                </div>
              </div>
            </>
          )}

          <div data-menu-item className="container-x mt-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
            {/* One column on phones, three from 768px (tablets keep the menu short too). */}
            <PrefsDisclosure layout="band" />
          </div>
        </div>
      </dialog>
    </>
  );
}
