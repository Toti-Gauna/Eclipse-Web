import localFont from 'next/font/local';

// Vendored, subset to Latin (es / en / pt-BR) to keep the LCP font small.
export const fontSans = localFont({
  src: './fonts/Geist-Variable.woff2',
  variable: '--font-geist',
  weight: '100 900',
  display: 'swap',
});

export const fontSerif = localFont({
  src: [
    { path: './fonts/InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument',
  display: 'swap',
});

// Instrument labels and readouts (v2 art direction). Weight axis cut to 400–600 and
// not preloaded: it only sets small labels, so it must never compete with the LCP text.
export const fontMono = localFont({
  src: './fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '400 600',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});
