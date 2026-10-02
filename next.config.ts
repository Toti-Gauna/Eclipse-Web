import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Empty for a custom domain (Hostinger + Cloudflare); "/Eclipse-Web" for GitHub Pages.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export default function config(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return withNextIntl({
    output: 'export',
    basePath: basePath || undefined,
    assetPrefix: basePath || undefined,
    trailingSlash: true,
    images: { unoptimized: true },
    poweredByHeader: false,
    reactStrictMode: true,
    // `*.dev.tsx` routes (component labs) only exist in `next dev`, never in the export.
    pageExtensions: isDev ? ['dev.tsx', 'tsx', 'ts'] : ['tsx', 'ts'],
    // Lets several dev servers run side by side (one per distDir).
    distDir: process.env.NEXT_DIST_DIR || '.next',
  });
}
