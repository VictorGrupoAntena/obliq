/**
 * check-services.mjs — comprueba que todos los servicios de WordPress tienen
 * nombre y descripción corta en los dos idiomas, ANTES de construir.
 *
 * Por qué existe. Hasta agosto de 2026, el nombre y la descripción de cada
 * servicio vivían en src/i18n/*.json y se enlazaban con el slug de WordPress
 * mediante un diccionario hardcodeado (SERVICE_KEY_MAP). Un servicio creado en
 * wp-admin con un slug que no estuviera en la lista daba `undefined` al leer la
 * clave y REVENTABA EL BUILD con un TypeError, a mitad de las 76 páginas. El
 * cliente podía tumbar el despliegue sin enterarse: el fallo salía en un runner
 * de GitHub que él no ve, y la web se quedaba congelada en la última versión
 * buena sin avisar a nadie.
 *
 * Ese diccionario ya no existe y el contenido viene de WordPress, así que el
 * TypeError es imposible. Lo que sigue siendo posible es más silencioso: crear
 * un servicio y dejarse la descripción vacía, y publicar una tarjeta en blanco
 * en la portada. Esto lo detecta y detiene el deploy con un mensaje que dice
 * qué servicio y qué campo, en vez de una traza de pila.
 *
 * Va ANTES de `pnpm build`, no después: un gate post-build no serviría porque
 * el propio build es lo que fallaría.
 *
 * Si WordPress no responde, AVISA Y DEJA PASAR: los facades ya caen a los datos
 * del repo y una caída de WP no debe bloquear un despliegue.
 *
 * Uso: node scripts/check-services.mjs
 * Sale con código 1 solo si WP responde y hay campos vacíos.
 */

import { readFileSync } from 'node:fs';

/** Lee una clave del .env versionado — el build hace lo mismo vía import.meta.env. */
function leerDotEnv(clave) {
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = txt.match(new RegExp(`^${clave}=(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

// `process.env` gana sobre el .env, pero SOLO si trae valor. En el workflow,
// `WP_API_URL: ${{ vars.WP_API_URL }}` llega como cadena vacía si esa variable
// no está definida en GitHub; sin este `||` el gate se saltaría en silencio
// justo en el sitio donde más falta hace. Mismo criterio que el paso de build,
// que también se apoya en el .env versionado como red.
const WP_API_URL = process.env.WP_API_URL || leerDotEnv('WP_API_URL');

if (!WP_API_URL) {
  console.log('· check-services: WP_API_URL sin definir → modo sin WordPress, nada que comprobar.');
  process.exit(0);
}

/** Campos obligatorios de cada servicio. El nombre ES es el título de la entrada. */
const OBLIGATORIOS = [
  { campo: 'post_title', etiqueta: 'el título de la entrada (nombre en español)' },
  { campo: 'sv_name_en', etiqueta: 'Nombre del servicio (EN)' },
  { campo: 'sv_short_description_es', etiqueta: 'Descripción corta (ES)' },
  { campo: 'sv_short_description_en', etiqueta: 'Descripción corta (EN)' },
];

let servicios;
try {
  const url = `${WP_API_URL}/servicio?per_page=100&orderby=menu_order&order=asc`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  servicios = await res.json();
} catch (e) {
  // Deliberado: no bloqueamos el deploy por una caída de WordPress.
  console.warn(`⚠ check-services: no se pudo consultar WordPress (${e.message}).`);
  console.warn('  Se continúa: los datos del repo cubren el build. Revisa WP si esto se repite.');
  process.exit(0);
}

if (!Array.isArray(servicios)) {
  console.warn('⚠ check-services: WordPress no devolvió una lista de servicios. Se continúa.');
  process.exit(0);
}

if (servicios.length === 0) {
  console.warn('⚠ check-services: WordPress no devolvió ningún servicio. Se continúa con los datos del repo.');
  process.exit(0);
}

const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

const problemas = [];
for (const s of servicios) {
  const nombre = s?.title?.rendered?.trim() || `(sin título, ID ${s?.id})`;
  for (const { campo, etiqueta } of OBLIGATORIOS) {
    const valor = campo === 'post_title' ? s?.title?.rendered : s?.[campo];
    if (vacio(valor)) problemas.push({ nombre, slug: s?.slug ?? '?', etiqueta, campo });
  }
}

if (problemas.length === 0) {
  console.log(`✓ check-services: ${servicios.length} servicios con nombre y descripción en ES y EN.`);
  process.exit(0);
}

console.error('');
console.error('✗ Hay servicios de WordPress a los que les falta contenido.');
console.error('  El build se ha detenido ANTES de construir para no publicar tarjetas vacías');
console.error('  en la portada, en el listado de servicios y en el formulario de contacto.');
console.error('');
for (const p of problemas) {
  console.error(`  · «${p.nombre}» (slug: ${p.slug}) no tiene ${p.etiqueta}.`);
  console.error(`    Rellénalo en wp-admin → Servicios → ${p.nombre}   [campo: ${p.campo}]`);
}
console.error('');
console.error(`  ${problemas.length} campo(s) por rellenar en ${new Set(problemas.map((p) => p.slug)).size} servicio(s).`);
console.error('');
process.exit(1);
