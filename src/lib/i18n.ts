import es from '@/i18n/es.json';
import en from '@/i18n/en.json';
import { translateSegment } from '@/lib/routes';

const translations: Record<string, typeof es> = { es, en };

/** Get translation object for a locale */
export function t(locale: string = 'es') {
  return translations[locale] ?? translations.es;
}

/** Detect locale from URL pathname */
export function getLocale(url: URL): string {
  return url.pathname.startsWith('/en/') || url.pathname === '/en' ? 'en' : 'es';
}

/**
 * Localized URL for an internal link.
 *
 * `path` is always written in SPANISH — it is the canonical vocabulary of the
 * codebase. This function translates the section segment and applies the /en/
 * prefix, so `('/servicios/', 'en')` yields `/en/services/`, not
 * `/en/servicios/`. Dynamic child slugs must already be in the target locale
 * (they come from the data, e.g. `svc.slug[locale]`).
 *
 * The route map lives in src/lib/routes.ts.
 */
export function localizedUrl(path: string, locale: string): string {
  return translateSegment(path, locale);
}
