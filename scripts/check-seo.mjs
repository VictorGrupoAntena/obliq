/**
 * check-seo.mjs — audita el título y la descripción de todas las páginas
 * construidas, DESPUÉS de `astro build`.
 *
 * Por qué existe. Desde la fase 3 el cliente edita en wp-admin lo que Google
 * enseña de seis URLs, y el campo se publica **tal cual**: si escribe un título
 * de 140 caracteres, Google lo corta; si copia el mismo en dos páginas, compiten
 * entre ellas; si vacía la descripción, la página se queda sin ella. Ninguna de
 * esas tres cosas rompe el build ni se ve en la web: solo se ven en Google,
 * semanas después, cuando ya nadie recuerda qué se tocó.
 *
 * Va DESPUÉS del build, no antes, por un motivo mecánico: audita el HTML
 * generado, así que necesita `dist/`. Es el reverso de `check-services.mjs`,
 * que va antes porque previene un fallo DEL build.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SALE SIEMPRE CON CÓDIGO 0 — A PROPÓSITO
 * ─────────────────────────────────────────────────────────────────────────────
 * Esto informa, no bloquea. Un título largo es un defecto de redacción, no un
 * fallo: detener el despliegue por eso dejaría la web congelada por una frase
 * mejorable, y el cliente —que es quien escribe— no ve el registro del runner.
 * Las cosas que SÍ deben parar un despliegue ya tienen su gate: `check:services`
 * antes del build, `check:links` y `check:redirects` antes del rsync.
 *
 * Lo que sí hace es dejar constancia en el registro del run, que es donde se
 * mira cuando alguien pregunta «¿por qué no salimos en Google?».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PENDIENTE: LE FALTA UNA LÍNEA BASE
 * ─────────────────────────────────────────────────────────────────────────────
 * En su primera ejecución (9-sep-2026) avisa **105 veces** sobre 72 páginas, y
 * casi todo es preexistente: las fichas de alquiler y de servicio componen su
 * título como `<nombre> — <sección> | Obliq Productions` y se van a 70-90
 * caracteres. Nada de eso lo introduce la fase 3.
 *
 * **Un check que grita 105 veces desde el primer día se vuelve ruido y nadie lo
 * lee** — que es justo lo contrario de para lo que se escribe. Antes de que esto
 * sirva de algo necesita una línea base que silencie lo preexistente y deje ver
 * solo lo NUEVO: un fichero con las URLs y avisos ya conocidos, comparado contra
 * el resultado de cada ejecución. Sin eso, el primer aviso de verdad se pierde
 * entre ciento cinco que ya estaban.
 *
 * Anotado en el backlog de MEMORY.md, punto 15. No entra en la fase 3.
 *
 * Uso: node scripts/check-seo.mjs [directorio]   (por defecto: dist)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Límites orientativos de Google. No son reglas: son el punto donde el texto
// deja de verse entero en un resultado de escritorio.
const TITULO_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 155;

const RAIZ = process.argv[2] ?? 'dist';

/** Duplicados de iCloud («index 2.html»): no son páginas, son ruido del disco. */
const DUPLICADO = / \d+(\.[A-Za-z0-9]+)?$/;

function htmls(dir, acc = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (DUPLICADO.test(nombre.replace(/\.html$/, ''))) continue;
    if (statSync(ruta).isDirectory()) htmls(ruta, acc);
    else if (nombre.endsWith('.html')) acc.push(ruta);
  }
  return acc;
}

function extraer(html) {
  const t = html.match(/<title>(.*?)<\/title>/s);
  const d = html.match(/<meta name="description" content="(.*?)"/s);
  const og = html.match(/<meta property="og:title" content="(.*?)"/s);
  const tw = html.match(/<meta name="twitter:title" content="(.*?)"/s);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  return {
    titulo: t ? t[1] : null,
    descripcion: d ? d[1] : null,
    ogTitle: og ? og[1] : null,
    twTitle: tw ? tw[1] : null,
    noindex,
  };
}

function url(ruta) {
  return '/' + ruta.replace(new RegExp(`^${RAIZ}/?`), '').replace(/index\.html$/, '');
}

let ficheros;
try {
  ficheros = htmls(RAIZ);
} catch {
  console.log(`✓ check-seo: no hay «${RAIZ}/» que auditar — nada que hacer.`);
  process.exit(0);
}

const avisos = [];
const porTitulo = new Map();
const porDescripcion = new Map();
let indexables = 0;

for (const f of ficheros) {
  const p = extraer(readFileSync(f, 'utf8'));
  const u = url(f);
  if (p.noindex) continue;
  indexables++;

  if (!p.titulo) avisos.push([u, 'no tiene <title>']);
  else {
    if (p.titulo.length > TITULO_MAX)
      avisos.push([u, `título de ${p.titulo.length} caracteres (Google corta sobre ${TITULO_MAX})`]);
    // Las tres etiquetas cuelgan de la misma variable en BaseLayout: si alguna
    // se despega, es que alguien ha tocado el layout sin darse cuenta.
    if (p.ogTitle !== null && p.ogTitle !== p.titulo)
      avisos.push([u, 'og:title no coincide con <title>']);
    if (p.twTitle !== null && p.twTitle !== p.titulo)
      avisos.push([u, 'twitter:title no coincide con <title>']);
    porTitulo.set(p.titulo, [...(porTitulo.get(p.titulo) ?? []), u]);
  }

  if (!p.descripcion) avisos.push([u, 'no tiene meta description']);
  else {
    if (p.descripcion.length > DESC_MAX)
      avisos.push([u, `descripción de ${p.descripcion.length} caracteres (Google corta sobre ${DESC_MAX})`]);
    else if (p.descripcion.length < DESC_MIN)
      avisos.push([u, `descripción de ${p.descripcion.length} caracteres (corta: se aprovecha hasta ${DESC_MAX})`]);
    porDescripcion.set(p.descripcion, [...(porDescripcion.get(p.descripcion) ?? []), u]);
  }
}

const duplicados = [
  ...[...porTitulo.entries()].filter(([, u]) => u.length > 1).map(([v, u]) => ['título', v, u]),
  ...[...porDescripcion.entries()].filter(([, u]) => u.length > 1).map(([v, u]) => ['descripción', v, u]),
];

if (avisos.length === 0 && duplicados.length === 0) {
  console.log(`✓ check-seo: ${indexables} páginas indexables, título y descripción correctos y sin repetir.`);
  process.exit(0);
}

console.log('');
console.log(`⚠ check-seo: ${indexables} páginas indexables · ${avisos.length} aviso(s) · ${duplicados.length} repetición(es).`);
console.log('  Esto NO detiene el despliegue: son mejoras de redacción, no fallos.');

if (avisos.length) {
  console.log('');
  for (const [u, motivo] of avisos) console.log(`  · ${u.padEnd(26)} ${motivo}`);
}

if (duplicados.length) {
  console.log('');
  console.log('  Repetidos entre páginas — compiten entre sí en Google:');
  for (const [tipo, valor, urls] of duplicados) {
    console.log(`  · mismo ${tipo} en ${urls.length}: ${urls.join(', ')}`);
    console.log(`      «${valor.slice(0, 90)}${valor.length > 90 ? '…' : ''}»`);
  }
}

console.log('');
console.log('  Se editan en wp-admin → Contenido de páginas → bloque «Cómo se ve en Google».');
console.log('');
process.exit(0);
