import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Hero } from '@/components/hero/Hero';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main id="main">
      <Hero />
    </main>
  );
}
