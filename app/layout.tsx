import type { ReactNode } from 'react';

// The real document (<html>, fonts, providers) lives in app/[locale]/layout.tsx.
// The root page (language redirect) and not-found render their own <html>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
