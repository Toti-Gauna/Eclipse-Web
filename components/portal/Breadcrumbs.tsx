import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export interface Crumb {
  label: string;
  /** Locale-less path; omitted for the current page. */
  href?: string;
}

/** "Sitio / Portal / Mis proyectos / …" — where you are and the way back (current page last). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations('portal.nav');
  return (
    <nav aria-label={t('breadcrumb')} className="pt-crumbs" data-trail={items.length > 3 ? 'long' : undefined}>
      <ol>
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className="pt-crumb">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="pt-crumb pt-crumb-current">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
