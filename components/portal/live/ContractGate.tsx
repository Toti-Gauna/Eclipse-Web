'use client';
import { useCallback, useEffect, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { endpoints } from '@/lib/api';
import { useResource } from './hooks';
import { useTranslations } from 'next-intl';

/** Server state is checked on every protected screen; a local flag or safe next cannot skip it. */
export function ContractGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations('contracting');
  const load = useCallback((signal: AbortSignal) => endpoints.onboarding(signal), []);
  const { state, reload } = useResource(load, true);
  const blocked = state.status === 'ready' && (state.data.required || state.data.state === 'deposit_pending');
  useEffect(() => {
    if (blocked) router.replace('/portal/bienvenida/');
  }, [blocked, router]);
  if (state.status === 'error')
    return (
      <div role="alert">
        <p>{t('loadError')}</p>
        <button className="btn btn-ghost" onClick={reload}>
          {t('retry')}
        </button>
      </div>
    );
  if (state.status !== 'ready' || blocked) return <p role="status">{t('loading')}</p>;
  return <>{children}</>;
}
