import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CONTACT_EMAIL } from '@/lib/env';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { DemoCta } from '@/components/ui/DemoCta';
import { LandingOnly } from './LandingOnly';
import { PrefsDisclosure } from './PrefsDisclosure';
import { NAV_LINKS, PORTAL_ROUTES } from './navLinks';
import { IS_LIVE } from '@/lib/env';

const BUILD_YEAR = new Date().getFullYear();

/**
 * Footer (dawn): the demo CTA, the essential links and contact, preferences folded in
 * one row (<PrefsDisclosure>: every option is still one tap away) and the legal / demo
 * notices. The "Eclipse Agency / Media / Market" units were taken out of the footer (lote 2.2,
 * decision of Ignacio 26/10/2026: they collided with the Agency line); content/units.json stays as history.
 *
 * The CTA's wrapper is a page-level primary CTA ([data-page-cta]): while it is on screen
 * the header's "Pedí tu demo" turns quiet, so the footer never shows two amber buttons.
 * In the client portal the sales blocks (CTA, landing links) give way to
 * "Volver al sitio" (<LandingOnly>); contact, preferences and the notices stay.
 */
export function Footer() {
  const t = useTranslations();
  const link = 'inline-flex min-h-11 items-center gap-2 transition-colors hover:text-[color:var(--accent)]';

  return (
    <footer data-header-theme="light" className="theme-light relative overflow-hidden bg-dawn pb-10 pt-16 md:pt-24">
      <div className="container-x">
        <div className="grid gap-x-10 gap-y-12 pb-12 md:pb-16 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <p className="flex items-center gap-3 text-sm font-medium tracking-[0.32em]">
              <span aria-hidden className="inline-block size-5 rounded-full bg-corona shadow-[0_0_24px_4px_rgb(245_185_66/0.45)]" />
              ECLIPSE
            </p>
            <p className="mt-5 text-fg-muted">{t('footer.tagline')}</p>
            <LandingOnly
              fallback={
                <Link href="/" className={`${link} mt-5`}>
                  <ArrowLeft aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />
                  {t('header.backToSite')}
                </Link>
              }
            >
              <div data-page-cta className="mt-7 flex">
                <DemoCta origin="footer" />
              </div>
            </LandingOnly>
          </div>

          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:max-w-xl lg:max-w-none">
            <LandingOnly>
              <nav aria-labelledby="footer-explore">
                <h2 id="footer-explore" className="eyebrow mb-3">
                  {t('footer.explore')}
                </h2>
                {/* Phones: two columns of links, so the list stays short. */}
                <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-1">
                  {NAV_LINKS.map((item) => (
                    <li key={item.id}>
                      <Link href={`/#${item.hash}`} className={link}>
                        {t(`nav.${item.id}`)}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={PORTAL_ROUTES.login} prefetch={false} className={link}>
                      {t('header.login')}
                      <span className="sr-only"> {t(IS_LIVE ? 'header.loginContextLive' : 'header.loginContext')}</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </LandingOnly>

            <div>
              <h2 className="eyebrow mb-3">{t('footer.contact')}</h2>
              <ul>
                <li>
                  <WhatsAppLink origin="footer" message={t('whatsapp.greeting')} className={link}>
                    <MessageCircle aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />
                    {t('common.whatsapp')}
                  </WhatsAppLink>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={`${link} break-all`}>
                    <Mail aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />
                    {CONTACT_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Same content as the header popover and the phone menu, folded. */}
        <PrefsDisclosure layout="band" />

        <div className="flex flex-col gap-3 pt-8 text-sm text-fg-muted md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p>{t('currency.notice')}</p>
            <p>{t('footer.demoNotice')}</p>
          </div>
          <p className="shrink-0">{t('footer.rights', { year: BUILD_YEAR })}</p>
        </div>
      </div>
    </footer>
  );
}
