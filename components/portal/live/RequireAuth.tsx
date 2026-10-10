'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { useSession } from '@/components/providers/SessionProvider';
import { Link } from '@/i18n/navigation';
import { loginHref } from '@/lib/portal/live';
import { VerifyNotice } from './VerifyNotice';
import { useLive } from './hooks';

/**
 * Gate for the private screens. Asks the session once, then:
 * checking → quiet status line · error → retry · anonymous → login (coming back here after) ·
 * authenticated but unverified → clear "verify your email" state (the API answers 403 to
 * project reads and plan requests until then) · otherwise the screen.
 */
export function RequireAuth({ children, verified = true }: { children: (client: { id: string; email: string; displayName: string | null }) => ReactNode; verified?: boolean }) {
  const { t } = useLive();
  const session = useSession({ ensure: true });
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const here = `${pathname}${search.size ? `?${search.toString()}` : ''}`;
  const { state } = session;

  const anonymous = state.status === 'anonymous';
  const expired = state.status === 'anonymous' && state.expired;
  const loggedOut = state.status === 'anonymous' && state.loggedOut === true;
  const target = loggedOut ? loginHref(null) : `${loginHref(here)}${expired ? `${loginHref(here).includes('?') ? '&' : '?'}expired=1` : ''}`;
  useEffect(() => {
    if (anonymous) router.replace(target);
  }, [anonymous, router, target]);

  if (state.status === 'authenticated') {
    if (verified && !state.client.emailVerified) return <VerifyNotice client={state.client} />;
    return <>{children(state.client)}</>;
  }
  if (state.status === 'error') {
    return (
      <section className="lv-state" role="alert">
        <h1 className="lv-state-title">{t('session.errorTitle')}</h1>
        <p className="pt-fine">{t('session.errorBody')}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void session.reload()}>
          {t('common.retry')}
        </button>
      </section>
    );
  }
  if (anonymous) {
    return (
      <section className="lv-state" role="status">
        <h1 className="lv-state-title">{expired ? t('session.expiredTitle') : t('session.needLoginTitle')}</h1>
        <p className="pt-fine">{expired ? t('session.expiredBody') : t('session.needLoginBody')}</p>
        <Link href={target} className="btn btn-primary btn-sm">
          {t('nav.login')}
        </Link>
      </section>
    );
  }
  return (
    <p className="lv-checking pt-fine" role="status">
      <PhaseGlyph phase={0.5} size={16} />
      {t('session.checking')}
    </p>
  );
}
