'use client';

import type { ReactNode } from 'react';
import { MessageCircle, RotateCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { TOTAL_STAGES } from '@/lib/portal/live-model';
import { livePaths } from '@/lib/portal/live';
import { useLive } from './hooks';

const LEDGER = [
  ['40%', '82%', '58%'],
  ['34%', '70%', '88%'],
  ['30%', '46%', '76%'],
];
const ROWS = [
  ['42%', '66%'],
  ['36%', '72%'],
  ['48%', '60%'],
];

/** Loading, shaped like the screen. Static bars: nothing loops. */
export function LoadingState({ label }: { label?: string }) {
  const { t } = useLive();
  return (
    <div className="pt-skel" aria-busy="true" role="status">
      <p className="pt-skel-note pt-fine">
        <PhaseGlyph phase={0.5} size={16} />
        {label ?? t('common.loading')}
      </p>
      <div aria-hidden className="pt-overview pt-skel-ledger">
        {LEDGER.map((widths, i) => (
          <div key={i}>
            {widths.map((width, j) => (
              <span key={j} className="pt-skel-bar" style={{ width }} />
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden className="pt-skel-rows">
        {ROWS.map((widths, i) => (
          <div key={i} className="pt-skel-row">
            <span className="pt-skel-dot" />
            {widths.map((width, j) => (
              <span key={j} className="pt-skel-bar" style={{ width }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A failed load: what happened in words, the reference for support and a way to try again. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t, describe } = useLive();
  const info = describe(error);
  return (
    <section className="lv-state" role="alert">
      <h2 className="lv-state-title">{t('errors.title')}</h2>
      <p className="pt-fine">{info.message}</p>
      {info.ref ? <p className="pt-fine lv-ref-line">{t('errors.ref', { id: info.ref })}</p> : null}
      {onRetry ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RotateCw aria-hidden className="size-4" strokeWidth={1.6} />
          {t('common.retry')}
        </button>
      ) : null}
    </section>
  );
}

/** Same wording for an unknown id and for another client's id: nothing says which one it was. */
export function NotFoundState({ title, body, back, href }: { title: string; body: string; back: string; href: string }) {
  return (
    <section className="lv-state" role="status">
      <h1 className="lv-state-title">{title}</h1>
      <p className="pt-fine">{body}</p>
      <Link href={href} className="btn btn-ghost btn-sm">
        {back}
      </Link>
    </section>
  );
}

export function EmptyState({ title, body, children, rail = true }: { title: string; body: string; children?: ReactNode; rail?: boolean }) {
  return (
    <section className="pt-empty" aria-labelledby="lv-empty-title">
      {rail ? (
        <div aria-hidden className="pt-empty-rail">
          {Array.from({ length: TOTAL_STAGES }, (_, i) => (
            <PhaseGlyph key={i} phase={(i + 1) / TOTAL_STAGES} size={22} />
          ))}
        </div>
      ) : null}
      <h2 id="lv-empty-title" className="pt-empty-title">
        {title}
      </h2>
      <p className="pt-empty-body">{body}</p>
      <div className="pt-empty-actions">{children}</div>
    </section>
  );
}

export function WhatsAppHelp({ message, label, from }: { message: string; label: string; from: string }) {
  return (
    <WhatsAppLink message={message} origin="portal" extra={{ from }} className="btn btn-ghost btn-sm">
      <MessageCircle aria-hidden className="size-4" strokeWidth={1.6} />
      {label}
    </WhatsAppLink>
  );
}

export { livePaths };
