import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { portalPaths } from '@/lib/portal/routes';
import { whatsappUrl } from '@/lib/whatsapp';
import { Breadcrumbs } from './Breadcrumbs';
import { LoginForm } from './LoginForm';
import { usePortal } from './usePortal';

const STEPS = ['confirm', 'invite', 'enter'] as const;

/**
 * /[locale]/portal/ — demo access. Explains who the portal is for (clients with a confirmed
 * project: it starts after the seña, then an email invitation), opens the example portal
 * and shows the sign-in layout, which goes nowhere.
 */
export function LoginView() {
  const { t } = usePortal();
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;
  return (
    <div className="container-x pt-page">
      <Breadcrumbs items={[{ label: t('nav.site'), href: '/' }, { label: t('nav.portal') }]} />

      <div className="pt-login-grid">
        <div>
          <p className="pt-kicker label">
            <PhaseGlyph phase={0.4} size={16} className="text-accent" />
            {t('login.label')}
          </p>
          <h1 className="display pt-login-title">{t.rich('login.title', { em })}</h1>
          <p className="pt-lead">{t('login.lead')}</p>
          <div className="pt-login-ctas">
            <div className="pt-login-main">
              <Link href={portalPaths.projects} className="btn btn-primary" aria-describedby="pt-login-note">
                {t('login.example')}
                <ArrowRight aria-hidden className="size-[1.1em]" strokeWidth={1.8} />
              </Link>
              <p id="pt-login-note" className="pt-fine">
                {t('login.exampleNote')}
              </p>
            </div>
            <Link href="/" className="pt-link">
              {t('nav.backToSite')}
            </Link>
          </div>
        </div>

        <div>
          <LoginForm
            copy={{
              badge: t('badge'),
              formLabel: t('login.formLabel'),
              formTitle: t('login.formTitle'),
              formHint: t('login.formHint'),
              email: t('login.email'),
              password: t('login.password'),
              submit: t('login.submit'),
              doneTitle: t('login.doneTitle'),
              doneEmpty: t('login.doneEmpty'),
              doneFilled: t('login.doneFilled'),
              doneCta: t('login.doneCta'),
            }}
          />
          <div className="pt-help">
            <p className="pt-help-title">{t('login.helpTitle')}</p>
            <p className="pt-fine">{t('login.help')}</p>
            <a href={whatsappUrl(t('login.helpMessage'))} target="_blank" rel="noopener noreferrer" className="pt-link">
              <MessageCircle aria-hidden strokeWidth={1.6} />
              {t('login.helpCta')}
            </a>
          </div>
        </div>
      </div>

      <section className="pt-steps" aria-labelledby="pt-steps-title">
        <h2 id="pt-steps-title" className="pt-h2">
          {t('login.stepsTitle')}
        </h2>
        <ol className="pt-steps-list">
          {STEPS.map((step, i) => (
            <li key={step} className="pt-step">
              <PhaseGlyph phase={(i + 1) / STEPS.length} size={28} className="pt-step-glyph" />
              <div>
                <span aria-hidden className="pt-step-n">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p>{t(`login.steps.${step}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
