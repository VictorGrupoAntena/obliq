#!/usr/bin/env node
/**
 * Gate de consentimiento: comprueba sobre `dist/` que ninguna página carga un
 * tercero sin consentimiento previo — Google Analytics en todas, y desde
 * agosto de 2026 también el mapa de Google en las dos páginas de contacto.
 *
 * POR QUÉ EXISTE
 * Hasta agosto de 2026 el sitio cargaba gtag.js incondicionalmente en el <head>
 * de las ~78 páginas: instalaba `_ga` y `_ga_896V9YZVME` antes de que el
 * visitante tocara nada. El banner lo arregla, pero es exactamente el tipo de
 * regresión que vuelve sin que nadie se entere: basta con que alguien pegue de
 * nuevo el snippet de GA que Google da por defecto —el que lleva el <script
 * async src=gtag/js> delante— y todo seguirá pareciendo correcto. La página
 * carga, el banner sale, y la medición ocurre igual desde el primer byte.
 *
 * Este script convierte esa regresión silenciosa en un fallo visible.
 *
 * PENDIENTE: NO está cableado en .github/workflows/deploy.yml. Cablearlo obliga
 * a tocar ese fichero, que tiene un check de paridad main↔redesign
 * (check-workflow-sync.yml), así que sería un cambio coordinado en dos ramas y
 * se dejó fuera del sprint del banner (13-ago-2026).
 *
 * Mientras no esté en CI, esto depende de que alguien se acuerde de ejecutarlo
 * — que es precisamente el fallo que dejó `check:links` sin correr durante
 * semanas en 2026: el síntoma de esa deriva es que NO PASA NADA. Los despliegues
 * siguen saliendo verdes, solo que sin red.
 *
 * Uso: pnpm build && pnpm check:consent
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

/**
 * Dominios que no pueden aparecer como carga estática en el HTML, y en qué
 * atributos buscarlos.
 *
 * Los tres primeros son medición; los tres últimos, el mapa de /contacto/
 * (14-ago-2026). El fallo que persiguen es el mismo: un tercero que se descarga
 * sin que el visitante haya dicho que sí.
 *
 * POR QUÉ LOS DE MAPS SOLO MIRAN `src`. El bloque sin consentimiento incluye a
 * propósito un `<a href="https://www.google.com/maps/search/…">`, que es la
 * salida para quien no acepta: un enlace no descarga nada: hasta que se pulsa, y
 * al pulsarlo el usuario se va a Google por su propio pie. Prohibir `href` a
 * secas convertiría en fallo justo la pieza que resuelve el problema. Los `href`
 * que sí cargan —los de `<link>`— se cubren aparte, más abajo.
 *
 * Se listan CON RUTA (`www.google.com/maps`) y no como host suelto: el host
 * `www.google.com` a secas cazaría cualquier enlace legítimo a Google.
 */
const DOMINIOS_PROHIBIDOS = [
  { dominio: 'www.googletagmanager.com', attrs: ['src', 'href'] },
  { dominio: 'www.google-analytics.com', attrs: ['src', 'href'] },
  { dominio: 'analytics.google.com', attrs: ['src', 'href'] },
  { dominio: 'www.google.com/maps', attrs: ['src'] },
  { dominio: 'maps.google.com', attrs: ['src'] },
  { dominio: 'maps.googleapis.com', attrs: ['src'] },
];

/**
 * Un `<link rel="preconnect|dns-prefetch|preload">` abre conexión con el
 * tercero antes de cualquier decisión, así que cuenta como carga previa aunque
 * el atributo se llame `href` igual que en un enlace normal. Se comprueba sobre
 * la etiqueta `<link>` concreta, que es lo que distingue un recurso de un
 * enlace en el que hay que hacer clic.
 */
function linkTagRegex(dominio) {
  const escapado = dominio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<link[^>]+href=["']https://${escapado}`, 'i');
}

/** Marcas que deben estar en TODAS las páginas. */
const REQUERIDOS = [
  { marca: "gtag('consent', 'default'", nombre: 'consent default de Consent Mode v2' },
  { marca: 'id="cookie-banner"', nombre: 'banner de cookies' },
];

/**
 * Comprobaciones que solo aplican a ciertas páginas.
 *
 * El bloque sin consentimiento del mapa NO es decorativo: es lo único que ve
 * quien no ha aceptado. Si alguien quita el fallback y deja el iframe suelto
 * —o vuelve a dejar un hueco gris, que es de donde venimos—, el gate de
 * dominios seguiría en verde porque el iframe se monta desde JS y no aparece
 * en el HTML construido. Esto lo convierte en un fallo visible.
 */
const REQUERIDOS_POR_PAGINA = [
  {
    paginas: ['contacto/index.html', 'en/contact/index.html'],
    marcas: [
      { marca: 'id="map-fallback"', nombre: 'bloque del mapa sin consentimiento' },
      { marca: 'data-cookie-prefs', nombre: 'enlace a preferencias dentro del bloque del mapa' },
    ],
  },
];

/** Las cuatro señales de la v2. Faltar una es un consent mode incompleto. */
const SENALES = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];

function htmlDeDist(dir) {
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...htmlDeDist(ruta));
    else if (entrada.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

if (!existsSync(DIST)) {
  console.error(`✗ No existe ${DIST}/. Ejecuta primero: pnpm build`);
  process.exit(1);
}

const paginas = htmlDeDist(DIST);
if (paginas.length === 0) {
  console.error(`✗ ${DIST}/ no contiene ninguna página HTML.`);
  process.exit(1);
}

const fallos = [];

for (const pagina of paginas) {
  const html = readFileSync(pagina, 'utf8');
  const ruta = pagina.replace(`${DIST}/`, '');

  // 1. Ninguna carga estática de dominios de medición. Se busca en atributos
  //    src/href, no en el texto: el bootstrap SÍ menciona googletagmanager
  //    dentro del string que inyecta tras el consentimiento, y eso es correcto.
  for (const { dominio, attrs } of DOMINIOS_PROHIBIDOS) {
    for (const attr of attrs) {
      if (html.includes(`${attr}="https://${dominio}`) || html.includes(`${attr}='https://${dominio}`)) {
        fallos.push(`${ruta}: carga estática de ${dominio} en un atributo ${attr}=`);
      }
    }
    if (linkTagRegex(dominio).test(html)) {
      fallos.push(`${ruta}: <link> hacia ${dominio} (preconnect/preload conecta antes del consentimiento)`);
    }
  }

  // 2. El consent default y el banner en todas las páginas.
  for (const { marca, nombre } of REQUERIDOS) {
    if (!html.includes(marca)) fallos.push(`${ruta}: falta el ${nombre}`);
  }

  // 3. Las cuatro señales, cada una en 'denied' por defecto.
  for (const senal of SENALES) {
    if (!html.includes(`${senal}: 'denied'`)) {
      fallos.push(`${ruta}: la señal ${senal} no está en 'denied' por defecto`);
    }
  }

  // 4. Las marcas propias de páginas concretas (hoy: el mapa de contacto).
  for (const { paginas, marcas } of REQUERIDOS_POR_PAGINA) {
    if (!paginas.includes(ruta)) continue;
    for (const { marca, nombre } of marcas) {
      if (!html.includes(marca)) fallos.push(`${ruta}: falta el ${nombre}`);
    }
  }
}

// Que las páginas esperadas EXISTAN. Sin esto, renombrar una ruta desactivaría
// su comprobación en silencio y el gate seguiría en verde sin comprobar nada.
for (const { paginas } of REQUERIDOS_POR_PAGINA) {
  for (const esperada of paginas) {
    if (!existsSync(join(DIST, esperada))) {
      fallos.push(`${esperada}: la página no existe en dist/ y su comprobación no se ha ejecutado`);
    }
  }
}

if (fallos.length > 0) {
  console.error(`\n✗ CONSENTIMIENTO: ${fallos.length} problema(s) en ${paginas.length} páginas\n`);
  // Agrupado por tipo: si falla, falla en las ~78 a la vez y listarlas todas
  // no aporta nada.
  const porTipo = new Map();
  for (const fallo of fallos) {
    const tipo = fallo.slice(fallo.indexOf(': ') + 2);
    porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + 1);
  }
  for (const [tipo, veces] of porTipo) {
    console.error(`  · ${tipo}  → ${veces} página(s)`);
  }
  console.error('\n  Ningún tercero puede cargarse antes del consentimiento.');
  console.error('  Analítica: el bloque de Consent Mode en src/layouts/BaseLayout.astro.');
  console.error('  Mapa: src/components/sections/MapSection.astro.\n');
  process.exit(1);
}

console.log(`✓ Consentimiento: ${paginas.length} páginas sin carga de terceros previa al consentimiento.`);
console.log('  · Sin cargas estáticas de googletagmanager / google-analytics / maps.');
console.log("  · consent 'default' con las 4 señales v2 en 'denied' en todas.");
console.log('  · Banner presente en todas.');
console.log('  · Bloque del mapa sin consentimiento presente en /contacto/ y /en/contact/.');
