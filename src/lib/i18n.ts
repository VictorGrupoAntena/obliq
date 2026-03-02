import es from '@/i18n/es.json';
import en from '@/i18n/en.json';

const translations: Record<string, typeof es> = { es, en };

/** Get translation object for a locale */
export function t(locale: string = 'es') {
  return translations[locale] ?? translations.es;
}

/** Detect locale from URL pathname */
export function getLocale(url: URL): string {
  return url.pathname.startsWith('/en/') || url.pathname === '/en' ? 'en' : 'es';
}

/** Generate localized URL path. ES has no prefix, EN uses /en/ */
export function localizedUrl(path: string, locale: string): string {
  const clean = path.startsWith('/') ? path : '/' + path;
  if (locale === 'en') {
    return '/en' + (clean === '/' ? '/' : clean);
  }
  return clean;
}

/** Get the alternate locale URL for hreflang */
export function alternateUrl(currentPath: string, currentLocale: string): string {
  if (currentLocale === 'es') {
    return '/en' + (currentPath === '/' ? '/' : currentPath);
  }
  // Remove /en prefix
  const stripped = currentPath.replace(/^\/en/, '') || '/';
  return stripped;
}
