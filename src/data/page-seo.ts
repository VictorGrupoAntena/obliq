/**
 * Título y descripción para Google de las seis páginas singulares — fase 3.
 *
 * Una sola facade para las seis, en vez de repartir cuatro campos por cada uno
 * de los seis módulos de datos que ya existen (`home.ts`, `about.ts`, `site.ts`,
 * `rental.ts`…). El motivo no es la brevedad: es que el SEO de una URL es un
 * asunto distinto del contenido de esa URL. `about.ts` describe qué se ve en
 * /nosotros/; esto describe cómo se anuncia /nosotros/ en un buscador. Mezclarlos
 * obligaría a tocar seis ficheros cada vez que cambie el contrato de SEO, que es
 * justo lo que la fase 3 viene a evitar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL CONTRATO, QUE NO ES EL HABITUAL
 * ─────────────────────────────────────────────────────────────────────────────
 * · `seoTitle` **se publica TAL CUAL**, sin que `BaseLayout` le añada nada. Es lo
 *   que permite al cliente ver en Google exactamente lo que escribe — y también
 *   lo que le obliga a escribir « | Obliq Productions» si lo quiere. Por eso los
 *   valores sembrados lo llevan.
 * · `undefined` ≠ cadena vacía. `undefined` significa «el cliente no ha escrito
 *   nada» y cada página conserva el título y la descripción que ya tenía. Nunca
 *   se devuelve una cadena vacía: dejaría la etiqueta en blanco en Google.
 *
 * Fallback **campo a campo**, patrón de `about.ts` y `services-page.ts`: si WP no
 * responde, si la entrada no existe todavía o si un campo está vacío, la página
 * sale exactamente como salía antes. Deliberadamente NO se copia el patrón de
 * `operator.ts`, que rompe el build a propósito: aquí no hay ningún dato cuya
 * ausencia deba detener un despliegue.
 */
import { isWPEnabled, getContenido, wpText, type ContenidoBundle } from '@/lib/wp-client';

/** Las seis páginas singulares con campos propios de Google. */
export type PageSeoKey =
  | 'home'
  | 'about'
  | 'contact'
  | 'alquiler'
  | 'portfolio'
  | 'presupuesto';

export interface PageSeo {
  /** Título completo para Google, tal cual. `undefined` = usar el de siempre. */
  seoTitle?: string;
  /** Descripción para Google. `undefined` = usar la de siempre. */
  seoDescription?: string;
}

/**
 * De qué entrada del CPT y con qué prefijo se leen los campos de cada página.
 *
 * Los prefijos NO son libres: son el contrato con `obliq_contenido_field_defs()`
 * del mu-plugin. Renombrar uno aquí no renombra nada allí — vaciaría el campo.
 */
const ORIGEN: Record<PageSeoKey, { entrada: keyof ContenidoBundle; prefijo: string }> = {
  home: { entrada: 'home', prefijo: 'hm_' },
  about: { entrada: 'about', prefijo: 'ab_' },
  contact: { entrada: 'contact', prefijo: 'ct_' },
  alquiler: { entrada: 'alquiler', prefijo: 'op_' },
  portfolio: { entrada: 'portfolio', prefijo: 'pt_' },
  presupuesto: { entrada: 'presupuesto', prefijo: 'pr_' },
};

/** Nada escrito en WordPress: cada página se queda como estaba. */
const SIN_DATOS: PageSeo = { seoTitle: undefined, seoDescription: undefined };

/**
 * Lee los dos campos de Google de una página. Nunca lanza: ante cualquier
 * problema devuelve los dos campos a `undefined` y la página no cambia.
 */
export async function getPageSeoAsync(page: PageSeoKey, locale: string): Promise<PageSeo> {
  if (!isWPEnabled()) return SIN_DATOS;

  try {
    const { entrada, prefijo } = ORIGEN[page];
    const bundle = await getContenido();
    const registro = bundle[entrada];
    if (!registro) return SIN_DATOS;

    return {
      seoTitle: wpText(registro, `${prefijo}seo_title_${locale}`),
      seoDescription: wpText(registro, `${prefijo}seo_desc_${locale}`),
    };
  } catch (e) {
    console.warn(`[page-seo] WP fetch failed for "${page}", keeping current tags:`, e);
    return SIN_DATOS;
  }
}
