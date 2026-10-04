import { MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { TOTAL_STAGES } from '@/lib/portal/project';
import { whatsappUrl } from '@/lib/whatsapp';
import { usePortal } from '../usePortal';

/**
 * No projects linked to the account. Says nothing about whether an email or a company
 * has records: projects appear once the team links them (after the seña). A real
 * contact channel stays visible. The empty five-stage rail is decorative.
 */
export function EmptyProjects() {
  const { t } = usePortal();
  return (
    <section className="pt-empty" aria-labelledby="pt-empty-title">
      <div aria-hidden className="pt-empty-rail">
        {Array.from({ length: TOTAL_STAGES }, (_, i) => (
          <PhaseGlyph key={i} phase={(i + 1) / TOTAL_STAGES} size={22} />
        ))}
      </div>
      <h2 id="pt-empty-title" className="pt-empty-title">
        {t('projects.empty.title')}
      </h2>
      <p className="pt-empty-body">{t('projects.empty.body')}</p>
      <div className="pt-empty-actions">
        <a
          href={whatsappUrl(t('projects.empty.message'))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <MessageCircle aria-hidden className="size-4" strokeWidth={1.6} />
          {t('projects.empty.cta')}
        </a>
        <Link href="/" className="pt-link">
          {t('nav.backToSite')}
        </Link>
      </div>
    </section>
  );
}
