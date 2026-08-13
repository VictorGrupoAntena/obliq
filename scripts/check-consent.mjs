#!/usr/bin/env node
/**
 * Gate de consentimiento: comprueba sobre `dist/` que ninguna página carga
 * Google Analytics sin consentimiento previo.
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

/** Dominios que no pueden aparecer como carga estática en el HTML. */
const DOMINIOS_PROHIBIDOS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
];

/** Marcas que deben estar en TODAS las páginas. */
const REQUERIDOS = [
  { marca: "gtag('consent', 'default'", nombre: 'consent default de Consent Mode v2' },
  { marca: 'id="cookie-banner"', nombre: 'banner de cookies' },
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
  for (const dominio of DOMINIOS_PROHIBIDOS) {
    for (const attr of ['src', 'href']) {
      if (html.includes(`${attr}="https://${dominio}`) || html.includes(`${attr}='https://${dominio}`)) {
        fallos.push(`${ruta}: carga estática de ${dominio} en un atributo ${attr}=`);
      }
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
  console.error('\n  Google Analytics no puede cargarse antes del consentimiento.');
  console.error('  Revisa el bloque de Consent Mode en src/layouts/BaseLayout.astro.\n');
  process.exit(1);
}

console.log(`✓ Consentimiento: ${paginas.length} páginas sin carga de analítica previa al consentimiento.`);
console.log('  · Sin cargas estáticas de googletagmanager / google-analytics.');
console.log("  · consent 'default' con las 4 señales v2 en 'denied' en todas.");
console.log('  · Banner presente en todas.');
