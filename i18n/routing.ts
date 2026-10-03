import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en', 'pt'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** BCP 47 tags for <html lang>, hreflang and Intl formatting. */
export const localeTags: Record<Locale, string> = {
  es: 'es-AR',
  en: 'en',
  pt: 'pt-BR',
};
