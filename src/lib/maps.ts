/**
 * URLs de Google Maps derivadas de la dirección del sitio.
 *
 * FUENTE ÚNICA, Y ESE ES EL PUNTO. La dirección ya viaja de WordPress
 * (`ct_address_*`) a src/data/site.ts y de ahí a la página de contacto y al
 * JSON-LD PostalAddress. El mapa NO añade un dato propio: recibe esa misma
 * cadena y construye la URL. Si el cliente corrige la dirección en wp-admin,
 * el texto, el schema y el mapa se mueven a la vez porque son el mismo dato.
 *
 * Un `<iframe src="…pb=!1m18!1m12…">` copiado del botón «Compartir» de Maps
 * habría sido más rápido de pegar y habría creado exactamente el problema que
 * esto evita: un literal opaco, imposible de leer, que nadie recuerda
 * actualizar cuando la empresa se muda.
 *
 * SIN CLAVE DE API, a propósito. La alternativa es Maps Embed API, que está
 * documentada y es gratuita en modo `place`, pero obliga a declarar la clave en
 * .env, .env.local y deploy.yml — y ese último tiene el check de paridad
 * main↔redesign (.github/workflows/check-workflow-sync.yml), así que sería un
 * commit coordinado en dos ramas. Es el mismo motivo por el que
 * GA_MEASUREMENT_ID tampoco es variable de entorno (ver src/data/analytics.ts).
 * `output=embed` no está documentado por Google, pero es la forma que produce
 * el propio Maps y lleva más de una década estable.
 *
 * NINGUNA de estas dos funciones carga nada por sí sola: devuelven cadenas.
 * Quién y cuándo pide la de embed lo decide el consentimiento, en
 * src/components/sections/MapSection.astro.
 */

/** Zoom del embed. Parámetro de presentación, no un dato del negocio. */
const ZOOM = 16;

function hl(locale: string): string {
  return locale === 'en' ? 'en' : 'es';
}

/**
 * URL para el `src` del iframe. SOLO debe usarse con consentimiento de la
 * categoría `maps`: pedirla instala cookies de Google.
 */
export function mapsEmbedUrl(address: string, locale: string): string {
  const q = encodeURIComponent(address);
  return `https://www.google.com/maps?q=${q}&z=${ZOOM}&hl=${hl(locale)}&output=embed`;
}

/**
 * URL para abrir Maps en una pestaña nueva. Es la salida SIN consentimiento:
 * un enlace no carga nada en nuestra página, así que no instala nada mientras
 * el usuario no lo pulse — y si lo pulsa, ya está en el sitio de Google.
 *
 * Usa el endpoint documentado `search/?api=1`, que sí es estable por contrato.
 * También alimenta `hasMap` del LocalBusiness (src/lib/schema.ts): es la URL
 * canónica de la ubicación, no la del incrustado.
 */
export function mapsLinkUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
