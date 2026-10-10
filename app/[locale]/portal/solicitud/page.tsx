import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LivePlanRequest } from '@/components/portal/live/LivePlanRequests';
import { NotLive } from '@/components/portal/live/NotLive';
import { LoadingState } from '@/components/portal/live/states';
import { IS_LIVE } from '@/lib/env';
import { liveMetadata } from '@/lib/portal/live-metadata';

export const generateMetadata = liveMetadata('request', '/portal/solicitud/');

/** /[locale]/portal/solicitud/ — live portal only (needs the backend); the demo build says so. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!IS_LIVE) return <NotLive locale={locale} />;
  return (
    <Suspense fallback={<div className="container-x pt-page"><LoadingState /></div>}>
      <LivePlanRequest />
    </Suspense>
  );
}
