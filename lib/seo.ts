import type { Metadata } from 'next';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { absoluteUrl, CONTACT_EMAIL, WHATSAPP_NUMBER } from '@/lib/env';
import { plans, l } from '@/lib/content';

/** Builds canonical + hreflang alternates for a locale-agnostic path like "/" or "/plan/". */
export function localeAlternates(locale: Locale, path = '/'): Metadata['alternates'] {
  const suffix = path === '/' ? '/' : `${path.replace(/\/?$/, '/')}`;
  return {
    canonical: absoluteUrl(`/${locale}${suffix}`),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [localeTags[l], absoluteUrl(`/${l}${suffix}`)])),
      'x-default': absoluteUrl(path === '/' ? '/' : `/${routing.defaultLocale}${suffix}`),
    },
  };
}

export function baseMetadata(opts: {
  locale: Locale;
  title: string;
  description: string;
  ogAlt: string;
  path?: string;
}): Metadata {
  const { locale, title, description, ogAlt, path = '/' } = opts;
  const url = absoluteUrl(`/${locale}${path === '/' ? '/' : path}`);
  const image = { url: absoluteUrl(`/og-${locale}.jpg`), width: 1200, height: 630, alt: ogAlt };
  return {
    metadataBase: new URL(absoluteUrl('/')),
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: 'website',
      siteName: 'Eclipse',
      url,
      title,
      description,
      locale: localeTags[locale].replace('-', '_'),
      alternateLocale: routing.locales.filter((x) => x !== locale).map((x) => localeTags[x].replace('-', '_')),
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

/** JSON-LD: Organization + one Service per plan (with its real USD range). */
export function jsonLd(locale: Locale, organizationDescription: string) {
  const orgId = absoluteUrl('/#organization');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'Eclipse',
        url: absoluteUrl(`/${locale}/`),
        logo: absoluteUrl('/icon.svg'),
        description: organizationDescription,
        email: CONTACT_EMAIL,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          url: `https://wa.me/${WHATSAPP_NUMBER}`,
          availableLanguage: ['Spanish', 'English', 'Portuguese'],
        },
      },
      ...plans.map((plan) => ({
        '@type': 'Service',
        name: `Eclipse ${l(plan.name, locale)}`,
        description: l(plan.audience, locale),
        provider: { '@id': orgId },
        areaServed: ['AR', 'BR', 'Latin America', 'Worldwide'],
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: plan.priceUsd.from,
          highPrice: plan.priceUsd.to,
        },
      })),
    ],
  };
}
