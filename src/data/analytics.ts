/**
 * Identidad de medición y contrato de almacenamiento del banner de cookies.
 *
 * Fuente única para el bootstrap de Consent Mode del <head> (BaseLayout.astro)
 * y para el barrido de cookies al rechazar o revocar. Antes el ID de medición
 * estaba escrito dos veces a mano; con el CMP pasaría a estar en cuatro sitios,
 * y uno de ellos —los nombres de cookie— ya se había desincronizado de la
 * realidad: la política declaraba `_gid`, que es de Universal Analytics y este
 * sitio no instala. Derivar el nombre del ID impide que vuelva a pasar.
 *
 * NO se lleva a una variable de entorno: obligaría a declararla en .env,
 * .env.local y deploy.yml, y ese último tiene un check de paridad main↔redesign
 * (.github/workflows/check-workflow-sync.yml) que convertiría un valor público
 * y estable en un cambio coordinado entre dos ramas.
 */

export const GA_MEASUREMENT_ID = 'G-896V9YZVME';

/**
 * Las cookies que GA4 escribe de verdad: `_ga` y `_ga_<ID sin el prefijo G->`.
 * Verificado en producción con navegación limpia (13-ago-2026):
 * `_ga` y `_ga_896V9YZVME`. Ninguna otra.
 */
export const GA_COOKIE_NAMES = ['_ga', `_ga_${GA_MEASUREMENT_ID.replace('G-', '')}`];

/** Clave de localStorage con la decisión del usuario. Misma familia que `obliq-quote-cart`. */
export const CONSENT_KEY = 'obliq-consent';

/**
 * Versión del esquema del registro guardado. Subirla invalida todos los
 * consentimientos anteriores y vuelve a preguntar: es el mecanismo para cuando
 * se añada una categoría nueva (un consentimiento dado sobre dos categorías no
 * dice nada sobre una tercera que no existía).
 */
export const CONSENT_SCHEMA = 1;

/** 24 meses — máximo de vigencia del consentimiento según la guía de la AEPD. */
export const CONSENT_MAX_AGE_MS = 730 * 24 * 60 * 60 * 1000;
