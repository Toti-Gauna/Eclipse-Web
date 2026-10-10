import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { portalPaths } from '@/lib/portal/routes';

/**
 * Shown by the live-only routes (registro, verificar-email, solicitudes…) when the site is
 * built without a backend: those screens only make sense against the real API, so the demo
 * says so instead of pretending.
 */
export async function NotLive({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'portalLive.notLive' });
  return (
    <div className="container-x pt-page">
      <section className="lv-state" style={{ marginTop: 40 }}>
        <h1 className="lv-state-title">{t('title')}</h1>
        <p className="pt-fine">{t('body')}</p>
        <Link href={portalPaths.login} className="btn btn-ghost btn-sm">
          {t('cta')}
        </Link>
      </section>
    </div>
  );
}
