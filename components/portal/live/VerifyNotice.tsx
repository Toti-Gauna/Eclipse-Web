'use client';

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { endpoints } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { Link } from '@/i18n/navigation';
import { livePaths } from '@/lib/portal/live';
import { useLive } from './hooks';

/**
 * The account exists but its email is not verified: the API refuses project reads and plan
 * requests (403) until it is. Says so plainly, offers a new link and a way to re-check.
 */
export function VerifyNotice({ client, compact = false }: { client: { email: string }; compact?: boolean }) {
  const { t, describe } = useLive();
  const { reload } = useSession();
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [problem, setProblem] = useState<ReturnType<typeof describe> | null>(null);
  const Heading = compact ? 'h3' : 'h1';

  const resend = async () => {
    setPhase('sending');
    setProblem(null);
    try {
      await endpoints.requestEmailVerification(client.email);
      setPhase('sent');
    } catch (error) {
      setProblem(describe(error));
      setPhase('error');
    }
  };

  return (
    <section className="lv-state" data-unverified aria-labelledby="lv-verify-title">
      <p className="label lv-state-label">
        <MailCheck aria-hidden strokeWidth={1.5} className="size-4" />
        {t('verify.label')}
      </p>
      <Heading id="lv-verify-title" className="lv-state-title">
        {t('unverified.title')}
      </Heading>
      <p className="pt-lead lv-state-lead">{t('unverified.body', { email: client.email })}</p>
      <div className="lv-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={resend} disabled={phase === 'sending' || phase === 'sent'}>
          {phase === 'sending' ? t('verify.sending') : t('unverified.resend')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void reload()}>
          {t('unverified.recheck')}
        </button>
        <Link href={livePaths.verifyEmail} className="pt-link">
          {t('unverified.help')}
        </Link>
      </div>
      <div role="status" aria-live="polite" className="lv-live">
        {phase === 'sent' ? <p className="pt-fine">{t('verify.requested')}</p> : null}
        {phase === 'error' && problem ? (
          <p className="lv-error" role="alert">
            {problem.message}
            {problem.ref ? <span className="lv-ref"> {t('errors.ref', { id: problem.ref })}</span> : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
