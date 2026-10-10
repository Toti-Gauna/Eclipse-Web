'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { livePaths } from '@/lib/portal/live';
import { useLive } from './hooks';

const LINKS = [
  { key: 'projects', href: livePaths.projects, match: ['/portal/proyectos', '/portal/proyecto'] },
  { key: 'requests', href: livePaths.requests, match: ['/portal/solicitudes', '/portal/solicitud'] },
] as const;

/**
 * Who is signed in, the two private areas and "Salir". Only rendered for an authenticated
 * session. Logging out asks the API to revoke the session, forgets everything held in memory
 * and returns to the login screen.
 */
export function AccountBar() {
  const { t } = useLive();
  const session = useSession();
  const router = useRouter();
  const pathname = (usePathname() ?? '').replace(/\/$/, '');
  const [leaving, setLeaving] = useState(false);
  if (session.state.status !== 'authenticated') return null;
  const { client } = session.state;

  const logout = async () => {
    setLeaving(true);
    await session.logout();
    router.replace(livePaths.login);
  };

  return (
    <div className="lv-bar">
      <nav aria-label={t('nav.areas')} className="lv-bar-nav">
        <ul>
          {LINKS.map((link) => (
            <li key={link.key}>
              <Link href={link.href} className="lv-bar-link" aria-current={(link.match as readonly string[]).includes(pathname) ? 'page' : undefined}>
                {t(`nav.${link.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="lv-bar-who">
        <span className="lv-bar-email" title={client.email}>
          {t('nav.signedInAs', { email: client.email })}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={logout} disabled={leaving}>
          <LogOut aria-hidden className="size-4" strokeWidth={1.6} />
          {leaving ? t('nav.leaving') : t('nav.logout')}
        </button>
      </div>
    </div>
  );
}
