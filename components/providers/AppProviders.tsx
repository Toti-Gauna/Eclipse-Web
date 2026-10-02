import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { CurrencyProvider } from './CurrencyProvider';
import { ExperienceProvider } from './ExperienceProvider';
import { BuilderHost } from '@/components/plan-builder/BuilderHost';

export function AppProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <CurrencyProvider locale={locale}>
      <ExperienceProvider>
        {children}
        <BuilderHost />
      </ExperienceProvider>
    </CurrencyProvider>
  );
}
