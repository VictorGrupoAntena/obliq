/**
 * Textos de la PÁGINA que lista los servicios (/servicios/ y /en/services/) —
 * facade async con WordPress headless CMS y fallback a src/i18n.
 *
 * Fuente: CPT `contenido`, entrada con `_obliq_key = 'servicios'` (seed v5).
 *
 * NO cubre los servicios en sí (CPT `servicio` → src/data/services.ts): el nombre,
 * la descripción y la imagen de cada uno se editan en su propia ficha. Aquí solo
 * viven los textos que envuelven a la lista.
 *
 * Patrón idéntico a about.ts: fallback CAMPO A CAMPO. Un campo vaciado por error
 * en wp-admin cae al texto de src/i18n en vez de dejar un hueco en blanco, y si
 * WordPress no responde el build sigue adelante. Deliberadamente NO se copia el
 * patrón de operator.ts, que lanza excepción a propósito: aquí no hay ningún dato
 * cuya ausencia deba detener un despliegue.
 */
import { isWPEnabled, getContenido, wpText } from '@/lib/wp-client';
import { t } from '@/lib/i18n';

export interface ServicesPageContent {
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaTitle: string;
  ctaButton: string;
  /**
   * Título COMPLETO para Google, tal y como debe salir en el resultado de búsqueda.
   * `undefined` = el cliente no lo ha escrito → BaseLayout compone el de siempre
   * (`title` + « | Obliq Productions»). Cuando trae valor se usa TAL CUAL, sin
   * añadirle nada: es lo que hace que el cliente vea exactamente lo que escribe.
   */
  seoTitle?: string;
  /** Descripción para Google. Cae a la descripción general del sitio si está vacía. */
  seoDescription: string;
}

/** Contenido por defecto: exactamente lo que hoy vive en src/i18n/*.json */
function fallbackServicesPage(locale: string): ServicesPageContent {
  const i18n = t(locale);
  const sp = i18n.SERVICES_PAGE;
  return {
    heroTag: sp.HERO_TAG,
    heroTitle: sp.HERO_TITLE,
    heroSubtitle: sp.HERO_SUBTITLE,
    ctaTitle: sp.CTA_TITLE,
    ctaButton: sp.CTA_BUTTON,
    // Sin valor: BaseLayout mantiene su composición de siempre.
    seoTitle: undefined,
    seoDescription: i18n.GLOBAL.DESCRIPTION,
  };
}

/**
 * Textos de la página de servicios — WordPress con fallback campo a campo a src/i18n.
 * Si WP_API_URL no está definido, WP no responde o el JSON viene mal, devuelve el
 * contenido de i18n y el build sigue adelante.
 */
export async function getServicesPageAsync(locale: string): Promise<ServicesPageContent> {
  const fallback = fallbackServicesPage(locale);
  if (!isWPEnabled()) return fallback;

  try {
    const { servicios } = await getContenido();
    if (!servicios) return fallback;

    const f = (key: string) => wpText(servicios, `${key}_${locale}`);

    return {
      heroTag: f('sp_hero_tag') ?? fallback.heroTag,
      heroTitle: f('sp_hero_title') ?? fallback.heroTitle,
      heroSubtitle: f('sp_hero_subtitle') ?? fallback.heroSubtitle,
      ctaTitle: f('sp_cta_title') ?? fallback.ctaTitle,
      ctaButton: f('sp_cta_button') ?? fallback.ctaButton,
      // Sin `??`: si está vacío debe quedarse en undefined, no caer a un texto.
      seoTitle: f('sp_seo_title'),
      seoDescription: f('sp_seo_desc') ?? fallback.seoDescription,
    };
  } catch (e) {
    console.warn('[services-page] WP fetch failed, using i18n content:', e);
    return fallback;
  }
}
