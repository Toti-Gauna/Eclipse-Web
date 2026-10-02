import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('hero');
  return (
    <main id="main" className="grain container-x grid min-h-dvh place-content-center py-24">
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1 className="display mt-6 text-5xl md:text-7xl">{t.rich('title', { em: (c) => <em>{c}</em> })}</h1>
      <p className="mt-6 max-w-xl text-lg text-fg-muted">{t('subtitle')}</p>
    </main>
  );
}
