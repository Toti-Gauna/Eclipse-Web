import { useLocale, useTranslations } from 'next-intl';
import { Mail, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { units, l } from '@/lib/content';
import { CONTACT_EMAIL } from '@/lib/env';
import type { Locale } from '@/i18n/routing';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { DemoCta } from '@/components/ui/DemoCta';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { PrefsPanel } from './PrefsPanel';
import { NAV_LINKS, navLabelKey } from './navLinks';

const BUILD_YEAR = new Date().getFullYear();

export function Footer() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const active = units.filter((u) => u.status === 'active');
  const soon = units.filter((u) => u.status === 'comingSoon');
  const em = (chunks: React.ReactNode) => <em className="em-accent">{chunks}</em>;

  return (
    <footer data-header-theme="light" className="theme-light relative overflow-hidden bg-dawn pb-10 pt-20 md:pt-28">
      <div className="container-x">
        <div className="grid gap-12 border-b border-line pb-14 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="flex items-center gap-3 text-sm font-medium tracking-[0.32em]">
              <span aria-hidden className="inline-block size-5 rounded-full bg-corona shadow-[0_0_24px_4px_rgb(245_185_66/0.45)]" />
              ECLIPSE
            </p>
            <p className="mt-5 text-fg-muted">{t('footer.tagline')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <DemoCta origin="footer" />
            </div>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="eyebrow mb-4">
              {t('footer.explore')}
            </h2>
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <Link href={`/#${link.hash}`} className="inline-flex min-h-11 items-center hover:text-[color:var(--accent)]">
                    {t(`nav.${navLabelKey(link.id)}`)}
                  </Link>
                </li>
              ))}
              <li>
                <BuildPlanButton source="footer" className="inline-flex min-h-11 items-center hover:text-[color:var(--accent)]">
                  {t('header.buildPlan')}
                </BuildPlanButton>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-4">{t('footer.contact')}</h2>
            <ul className="space-y-1">
              <li>
                <WhatsAppLink
                  origin="footer"
                  message={t('whatsapp.greeting')}
                  className="inline-flex min-h-11 items-center gap-2 hover:text-[color:var(--accent)]"
                >
                  <MessageCircle aria-hidden className="size-4" strokeWidth={1.6} />
                  {t('common.whatsapp')}
                </WhatsAppLink>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center gap-2 break-all hover:text-[color:var(--accent)]">
                  <Mail aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Same content as the header popover and the mobile menu. */}
        <section aria-labelledby="footer-prefs" className="border-b border-line py-12">
          <h2 id="footer-prefs" className="eyebrow mb-7">
            {t('footer.settings')}
          </h2>
          <PrefsPanel layout="band" />
        </section>

        <div className="grid gap-8 border-b border-line py-12 md:grid-cols-2 md:items-end">
          <p className="display text-3xl md:text-4xl">{t.rich('footer.teaser', { em })}</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 md:justify-end" aria-label={t('footer.comingSoon')}>
            {active.map((u) => (
              <li key={u.id} className="text-sm font-medium tracking-[0.18em] uppercase">
                {u.name}
                {u.tagline ? <span className="sr-only"> — {l(u.tagline, locale)}</span> : null}
              </li>
            ))}
            {soon.map((u) => (
              <li key={u.id} className="text-sm uppercase tracking-[0.18em] text-fg-muted">
                {u.name} <span className="ml-1 text-[0.65rem] normal-case tracking-normal">· {t('footer.comingSoon')}</span>
              </li>
            ))}
          </ul>
        </div>

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
