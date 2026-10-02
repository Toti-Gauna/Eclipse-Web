import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';

export function AppProviders({ children }: { locale: Locale; children: ReactNode }) {
  return <>{children}</>;
}
