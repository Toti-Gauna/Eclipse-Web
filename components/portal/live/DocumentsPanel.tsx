'use client';

import { useCallback, useState } from 'react';
import { Download, FileText, Lock } from 'lucide-react';
import { endpoints } from '@/lib/api';
import type { ApiDocument } from '@/lib/api/types';
import { ErrorState } from './states';
import { useLive, useResource } from './hooks';

const KB = 1024;
function size(bytes: number, locale: string): string {
  const fmt = (n: number, unit: string) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n)} ${unit}`;
  if (bytes < KB) return fmt(bytes, 'B');
  if (bytes < KB * KB) return fmt(bytes / KB, 'KB');
  return fmt(bytes / (KB * KB), 'MB');
}

/**
 * Documents the team shared with this client (GET /client/projects/:id/documents). Opening one
 * is a fetch with the session cookie → Blob → save: the API URL is never an `<a href>` on the
 * page, so it can't be copied around or opened without the session.
 */
export function DocumentsPanel({ projectId }: { projectId: string }) {
  const { t, locale, stamp } = useLive();
  const load = useCallback((signal: AbortSignal) => endpoints.documents(projectId, signal), [projectId]);
  const { state, reload } = useResource(load, true);

  return (
    <>
      <h3 className="sr-only">{t('docs.title')}</h3>
      {state.status === 'loading' ? (
        <p className="pt-fine" role="status">
          {t('docs.loading')}
        </p>
      ) : null}
      {state.status === 'error' ? <ErrorState error={state.error} onRetry={reload} /> : null}
      {state.status === 'ready' ? (
        state.data.items.length === 0 ? (
          <p className="pt-fine">{t('docs.empty')}</p>
        ) : (
          <ul className="pt-docs">
            {state.data.items.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} sizeText={size(doc.sizeBytes, locale)} when={stamp(doc.uploadedAt)} />
            ))}
          </ul>
        )
      ) : null}
      <p className="pt-fine pt-docs-note">
        <Lock aria-hidden strokeWidth={1.6} />
        {t('docs.note')}
      </p>
    </>
  );
}

function DocumentRow({ doc, sizeText, when }: { doc: ApiDocument; sizeText: string; when: string }) {
  const { t } = useLive();
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { describe } = useLive();

  const open = async () => {
    if (phase === 'busy') return;
    setPhase('busy');
    setMessage('');
    try {
      const file = await endpoints.downloadDocument(doc.id);
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName ?? doc.fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setPhase('done');
    } catch (error) {
      setMessage(describe(error).message);
      setPhase('error');
    }
  };

  return (
    <li className="pt-doc">
      <FileText aria-hidden strokeWidth={1.5} className="pt-doc-icon" />
      <p className="pt-doc-title">{doc.title}</p>
      <dl className="pt-doc-meta">
        <div>
          <dt>{t('docs.kind')}</dt>
          <dd>{t(`docs.kinds.${doc.kind}`)}</dd>
        </div>
        <div>
          <dt>{t('docs.date')}</dt>
          <dd>
            <time className="pt-date" dateTime={doc.uploadedAt}>
              {when}
            </time>
          </dd>
        </div>
        <div>
          <dt>{t('docs.file')}</dt>
          <dd className="pt-date">
            {doc.fileName} · {sizeText}
          </dd>
        </div>
      </dl>
      <div className="lv-doc-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={open} disabled={phase === 'busy'} aria-busy={phase === 'busy' || undefined}>
          <Download aria-hidden className="size-4" strokeWidth={1.6} />
          {phase === 'busy' ? t('docs.downloading') : t('docs.download')}
          <span className="sr-only">: {doc.title}</span>
        </button>
        <span role="status" aria-live="polite" className="pt-fine">
          {phase === 'done' ? t('docs.done') : null}
        </span>
        {phase === 'error' ? (
          <span className="lv-error" role="alert">
            {message}
          </span>
        ) : null}
      </div>
    </li>
  );
}
