import { useTranslations } from 'next-intl';

/**
 * The sober notice every portal page carries, right under the header. Marked with
 * `data-portal-demo-notice` for the e2e checks.
 */
export function DemoNotice() {
  const t = useTranslations('portal');
  return (
    <div role="note" aria-label={t('notice.label')} data-portal-demo-notice className="pt-notice">
      <div className="container-x pt-notice-row">
        <span className="badge-demo">{t('badge')}</span>
        <p className="pt-notice-text">{t('notice.text')}</p>
      </div>
    </div>
  );
}
