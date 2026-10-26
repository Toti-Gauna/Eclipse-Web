'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { ScrollTrigger, useGSAP } from '@/components/motion/gsap';
import { HYDRATED_EVENT } from '@/components/motion/LazyHydrate';
import { DemoCta } from '@/components/ui/DemoCta';
import { PotenciarCta } from '@/components/ui/PotenciarCta';
import { MiniEclipse } from './MiniEclipse';
import { PrefsMenu } from './PrefsMenu';
import { MobileMenu } from './MobileMenu';
import { NAV_LINKS, PORTAL_ROUTES, chromeRoute } from './navLinks';
import { usePageCtaInView } from './usePageCtaInView';
import { IS_LIVE } from '@/lib/env';
import { livePaths } from '@/lib/portal/live';
import './header.css';

/**
 * Fixed header. Transparent over the hero, glass once scrolled, and it flips to the
 * light theme while it sits over any element marked [data-header-theme="light"].
 *
 * Desktop (≥ 1024px): logo · Servicios · Demos · Precios · Cómo trabajamos · one
 * preferences trigger (language, currency, sound) · "Ingresar" (portal mockup) ·
 * «Potenciar mi negocio» (THE primary CTA: opens the rubro selector).
 * Phones and tablets: logo · a compact «Potenciar» · the menu button.
 * There is no "Armá tu plan" (the builder is dormant, lote 1.3); on /plan the CTA stays the
 * WhatsApp "Pedí tu demo" (the selector lives on the home).
 *
 * One solid amber button per viewport: the CTA is quiet (outline) while the hero's own CTA
 * — or another page-level primary CTA — is on screen, and on /plan; otherwise it is the
 * solid amber one. Over the page the header floats: a surface (`.hdr-row::before`) fades in
 * once the page has scrolled (header.css); the reserved height never changes.
 *
 * Portal routes (/portal…): logo (→ landing) · "Volver al sitio" (+ "Mis proyectos" and
 * "Salir de la demo" inside /portal/proyectos) · preferences. No landing nav, no sales CTAs.
 */
export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { mode, projects } = chromeRoute(pathname);
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

  // Re-query the page CTAs after a client navigation or a deferred section's hydration.
  const pageCtaInView = usePageCtaInView(`${pathname}#${domVersion}`, mode === 'landing');
  const ctaSolid = mode === 'landing' && !pageCtaInView;

  useGSAP(
    () => {
      const triggers: ScrollTrigger[] = [];
      // Rebuilt from scratch (a new page starts at its top): triggers that are already
      // active call onToggle as they are created, in this same synchronous pass.
      setScrolled(false);
      setLight(false);
      // Progress, not isActive (false at the very bottom, progress 1), and on every update,
      // not onToggle: a jump from the top straight to the bottom (End key, a short page,
      // restored scroll) never toggles, which left the header transparent over the text.
      // Same boolean on most frames: React bails out without rendering.
      const syncScrolled = (self: ScrollTrigger) => setScrolled(self.progress > 0);
      const top = ScrollTrigger.create({ start: 8, end: 'max', onUpdate: syncScrolled, onRefresh: syncScrolled });
      syncScrolled(top);
      triggers.push(top);
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
    },
    // The header lives in the layout: a client navigation (landing ↔ /plan ↔ portal) brings new zones.
    { dependencies: [domVersion, pathname], revertOnUpdate: true },
  );

  const projectsList = pathname.replace(/\/$/, '') === '/portal/proyectos';

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
        data-mode={mode}
        className={`site-header fixed inset-x-0 top-0 z-50 ${light ? 'theme-light' : 'theme-dark'}`}
      >
        {/* `relative`: the preferences popover anchors to this row. */}
        <div className="hdr-row container-x relative flex h-[var(--header-h)] items-center gap-1.5 min-[360px]:gap-2 xl:gap-3">
          <Link href="/" aria-label={t('header.home')} className="-ml-1 flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-1">
            <MiniEclipse />
            <span className="text-[0.8rem] font-medium tracking-[0.32em] text-fg">ECLIPSE</span>
          </Link>

          {mode === 'portal' ? (
            <>
              <span className="hdr-portal-label hidden sm:inline-flex">{t('header.portal')}</span>
              <nav aria-label={t('header.portal')} className="ml-auto hidden lg:block">
                <ul className="flex items-center gap-1">
                  {projects ? (
                    <>
                      <li>
                        <Link href={PORTAL_ROUTES.projects} aria-current={projectsList ? 'page' : undefined} className="hdr-link inline-flex">
                          {t('header.myProjects')}
                        </Link>
                      </li>
                      <li>
                        {IS_LIVE ? (
                          <Link href={livePaths.requests} className="hdr-link inline-flex">
                            {t('header.myRequests')}
                          </Link>
                        ) : (
                          <Link href={PORTAL_ROUTES.login} className="hdr-link inline-flex">
                            {t('header.exitDemo')}
                          </Link>
                        )}
                      </li>
                      <li aria-hidden className="mx-1 flex">
                        <span className="hdr-rule" />
                      </li>
                    </>
                  ) : null}
                  <li>
                    <Link href="/" className="hdr-back inline-flex">
                      <ArrowLeft aria-hidden strokeWidth={1.5} />
                      {t('header.backToSite')}
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="ml-auto flex items-center gap-2 lg:ml-1">
                <Link href="/" className="hdr-back inline-flex lg:hidden">
                  <ArrowLeft aria-hidden strokeWidth={1.5} />
                  {t('header.backToSite')}
                </Link>
                <PrefsMenu className="hidden lg:flex" />
                <MobileMenu mode={mode} projects={projects} className="lg:hidden" />
              </div>
            </>
          ) : (
            <>
              <nav aria-label={t('header.mainNav')} className="mx-auto hidden lg:block">
                <ul className="flex items-center">
                  {NAV_LINKS.map((link) => (
                    <li key={link.id}>
                      <Link href={`/#${link.hash}`} className="hdr-link inline-flex">
                        {t(`nav.${link.id}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="ml-auto flex items-center gap-1.5 min-[360px]:gap-2 lg:ml-0">
                <PrefsMenu className="hidden lg:flex" />
                <Link href={PORTAL_ROUTES.login} prefetch={false} className="hdr-login hidden lg:inline-flex">
                  <LogIn aria-hidden strokeWidth={1.5} />
                  {t('header.login')}
                  <span className="sr-only"> {t(IS_LIVE ? 'header.loginContextLive' : 'header.loginContext')}</span>
                </Link>
                <span aria-hidden className="hdr-rule mx-1 hidden lg:block" />
                {mode === 'landing' ? (
                  <PotenciarCta
                    origin="header"
                    label={t('selector.cta')}
                    className={`btn hdr-cta ${ctaSolid ? 'btn-primary' : 'hdr-cta-quiet'}`}
                  >
                    <span className="hdr-cta-long">{t('selector.cta')}</span>
                    <span aria-hidden className="hdr-cta-short">
                      {t('selector.ctaShort')}
                    </span>
                  </PotenciarCta>
                ) : (
                  <DemoCta origin="header" className={`btn hdr-cta ${ctaSolid ? 'btn-primary' : 'hdr-cta-quiet'}`} />
                )}
                <MobileMenu mode={mode} projects={projects} className="lg:hidden" />
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
