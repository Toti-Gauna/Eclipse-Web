import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { CurrencyProvider } from './CurrencyProvider';
import { ExperienceProvider } from './ExperienceProvider';
import { SessionProvider } from './SessionProvider';
import { BuilderHost } from '@/components/plan-builder/BuilderHost';
import { SoundProvider } from '@/components/sound/SoundProvider';
import { SmoothAnchors } from '@/components/layout/SmoothAnchors';

export function AppProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <CurrencyProvider locale={locale}>
      <SoundProvider>
        <ExperienceProvider>
          <SessionProvider>
            {children}
            <BuilderHost />
            <SmoothAnchors />
          </SessionProvider>
        </ExperienceProvider>
      </SoundProvider>
    </CurrencyProvider>
  );
}
