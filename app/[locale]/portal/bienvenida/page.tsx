import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { ContractsView } from '@/components/portal/live/ContractsView';
export const metadata = { title: 'Eclipse · Portal', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense
      fallback={
        <div className="container-x pt-page" role="status">
          …
        </div>
      }
    >
      <ContractsView welcome={true} />
    </Suspense>
  );
}
