import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { livePaths } from '@/lib/portal/live';

/** The fictional project pages don't exist in a live build: say so and point to the real list. */
export async function DemoOff({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'portalLive.demoOff' });
  return (
    <div className="container-x pt-page">
      <section className="lv-state" style={{ marginTop: 40 }}>
        <h1 className="lv-state-title">{t('title')}</h1>
        <p className="pt-fine">{t('body')}</p>
        <Link href={livePaths.projects} className="btn btn-ghost btn-sm">
          {t('cta')}
        </Link>
      </section>
    </div>
  );
}
