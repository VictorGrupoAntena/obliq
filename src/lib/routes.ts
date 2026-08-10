/**
 * Mapa de rutas ES ↔ EN — fuente única de verdad del i18n de URLs.
 *
 * El español es el idioma por defecto y vive en la raíz; el inglés bajo /en/
 * con los slugs TRADUCIDOS (/servicios/streaming/ ↔ /en/services/streaming/).
 * Antes de este módulo las rutas EN se construían prefijando /en/ a la ruta
 * española, lo que generaba 404 en masa: el mapa existía solo de forma
 * implícita en los nombres de fichero de src/pages/en/.
 *
 * CONVENIO: el código escribe siempre las rutas en ESPAÑOL y la traducción
 * ocurre en el borde (localizedUrl). El primer segmento es siempre la clave
 * española; los segmentos hijos (slug de servicio, de categoría) ya vienen en
 * el idioma destino porque salen del dato — services.ts / rental.ts los
 * exponen como `slug: { es, en }`, y WordPress es su fuente en build.
 */

import { getServicesAsync } from '@/data/services';
import { getCategoriesAsync } from '@/data/rental';

/** Secciones con hijos dinámicos. Clave ES → segmento EN. */
const SECTIONS: Record<string, string> = {
  servicios: 'services',
  alquiler: 'rental',
};

/** Páginas sueltas sin hijos. Clave ES → segmento EN. */
const PAGES: Record<string, string> = {
  nosotros: 'about',
  contacto: 'contact',
  presupuesto: 'quote',
  portfolio: 'portfolio',
};

/**
 * Páginas que existen SOLO en español y se sirven sin prefijo desde ambos
 * idiomas. Decisión consciente, no un hueco del mapa: son textos jurídicos
 * (LSSI, RGPD, cookies) y no se publican traducidos sin validación del
 * cliente. Las tres son noindex, luego el impacto SEO es nulo.
 * Consecuencia: estas rutas NO emiten hreflang alterno. Ver MEMORY.md.
 */
const ES_ONLY = new Set(['aviso-legal', 'politica-privacidad', 'politica-cookies']);

/** ES → EN para el primer segmento (secciones y páginas juntas). */
const ES_TO_EN: Record<string, string> = { ...SECTIONS, ...PAGES };

/** EN → ES, derivado del anterior para que no puedan desincronizarse. */
const EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(ES_TO_EN).map(([es, en]) => [en, es]),
);

/** Divide '/servicios/streaming/' en ['servicios', 'streaming']. */
function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Traduce el PRIMER segmento de una ruta escrita en español al idioma destino
 * y aplica el prefijo /en/ cuando corresponde. Síncrono a propósito: es lo que
 * consume localizedUrl, que se llama dentro de .map() y no puede ser async.
 *
 * Las rutas ES_ONLY se devuelven sin prefijo aunque el locale sea 'en'.
 */
export function translateSegment(path: string, locale: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale !== 'en') return clean;

  const parts = segments(clean);
  if (parts.length === 0) return '/en/';

  const [first, ...rest] = parts;
  if (ES_ONLY.has(first)) return clean;

  const translated = ES_TO_EN[first];
  if (translated === undefined) {
    if (import.meta.env.DEV) {
      console.warn(
        `[routes] Segmento desconocido "${first}" en "${path}". ` +
          'Añádelo a SECTIONS/PAGES/ES_ONLY en src/lib/routes.ts o la ruta EN será un 404.',
      );
    }
    return `/en${clean}`;
  }

  const trailing = clean.endsWith('/') ? '/' : '';
  return `/en/${[translated, ...rest].join('/')}${trailing}`;
}

/**
 * Traduce una ruta COMPLETA al otro idioma, resolviendo también los segmentos
 * dinámicos contra el dato (WordPress en build, mock en local). Se usa para el
 * hreflang y el language switcher, donde hace falta la ruta real de la página
 * equivalente, no una construida a mano.
 *
 * Devuelve null cuando la página no tiene contraparte en el otro idioma: quien
 * llama debe OMITIR el enlace en vez de inventarlo. Es el caso de las ES_ONLY.
 */
export async function translatePath(pathname: string, fromLocale: string): Promise<string | null> {
  const parts = segments(pathname);

  if (fromLocale === 'es') {
    if (parts.length === 0) return '/en/';
    if (ES_ONLY.has(parts[0])) return null;
    return buildAlternate(parts, 'es', 'en');
  }

  // fromLocale === 'en': quitamos el prefijo /en y traducimos a la inversa.
  const enParts = parts[0] === 'en' ? parts.slice(1) : parts;
  if (enParts.length === 0) return '/';
  return buildAlternate(enParts, 'en', 'es');
}

/**
 * Núcleo de translatePath: traduce sección + slug hijo. Los slugs de producto
 * de alquiler (tercer nivel) son invariantes de idioma y pasan tal cual.
 */
async function buildAlternate(
  parts: string[],
  from: 'es' | 'en',
  to: 'es' | 'en',
): Promise<string | null> {
  const map = from === 'es' ? ES_TO_EN : EN_TO_ES;
  const [section, child, ...rest] = parts;

  const targetSection = map[section];
  if (targetSection === undefined) return null;

  const prefix = to === 'en' ? '/en' : '';
  if (child === undefined) return `${prefix}/${targetSection}/`;

  const targetChild = await translateChild(section, child, from, to);
  if (targetChild === null) return null;

  return `${prefix}/${[targetSection, targetChild, ...rest].join('/')}/`;
}

/** Traduce el slug hijo de /servicios/ o /alquiler/ consultando el dato real. */
async function translateChild(
  esSection: string,
  child: string,
  from: 'es' | 'en',
  to: 'es' | 'en',
): Promise<string | null> {
  const section = from === 'es' ? esSection : EN_TO_ES[esSection] ?? esSection;

  if (section === 'servicios') {
    const services = await getServicesAsync();
    return services.find((s) => s.slug[from] === child)?.slug[to] ?? null;
  }

  if (section === 'alquiler') {
    const categories = await getCategoriesAsync();
    return categories.find((c) => c.slug[from] === child)?.slug[to] ?? null;
  }

  return null;
}
