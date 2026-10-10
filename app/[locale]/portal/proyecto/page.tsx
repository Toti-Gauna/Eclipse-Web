import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LiveProject } from '@/components/portal/live/LiveProject';
import { NotLive } from '@/components/portal/live/NotLive';
import { LoadingState } from '@/components/portal/live/states';
import { IS_LIVE } from '@/lib/env';
import { liveMetadata } from '@/lib/portal/live-metadata';

export const generateMetadata = liveMetadata('project', '/portal/proyecto/');

/** /[locale]/portal/proyecto/ — live portal only (needs the backend); the demo build says so. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!IS_LIVE) return <NotLive locale={locale} />;
  return (
    <Suspense fallback={<div className="container-x pt-page"><LoadingState /></div>}>
      <LiveProject />
    </Suspense>
  );
}
