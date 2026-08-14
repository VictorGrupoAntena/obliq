#!/usr/bin/env node
/**
 * Gate anti-duplicados: impide que un fichero con el patrón de duplicado de
 * iCloud («index 2.html») entre en el build desde `src/` o `public/`.
 *
 * POR QUÉ EXISTE
 * El proyecto vive en ~/Documents, que iCloud sincroniza. Durante el sprint del
 * mapa (14-ago-2026) iCloud creó 60 ficheros duplicados dentro de `dist/`. Ahí
 * eran inofensivos —los despliegues construyen en un runner limpio y el `dist/`
 * local no se sube nunca—, pero al investigarlo apareció la vía que sí importa:
 * **el repositorio**. Ya ocurrió una vez: 7 duplicados `… 2.astro` se
 * commitearon en `af06cd7` (26-mar-2026) y se salvaron por casualidad, porque
 * cayeron en `_es.disabled/` y `_videos.disabled/`, que Astro ignora por el
 * guion bajo. Se borraron el mismo día en `b68741d`.
 *
 * EL FALLO QUE PREVIENE, Y POR QUÉ NINGÚN OTRO GATE LO VE
 * Un `contact 2.astro` en un directorio ACTIVO de `src/pages/` se construiría,
 * entraría en `dist/` en el runner y se publicaría. Y saldría verde en todo:
 *
 *   · check:links   no lo caza — la página basura no la enlaza nadie, así que
 *                   no es un enlace roto.
 *   · check:consent no lo caza — llevaría el banner y el consent default como
 *                   cualquier otra página, y pasaría.
 *   · @astrojs/sitemap SÍ la incluiría → página basura indexable, publicada.
 *
 * Es el modo de fallo de siempre: algo roto que no hace ruido.
 *
 * DÓNDE CORRE
 * Encadenado al script `build` de package.json, ANTES de `astro build`. Así
 * entra en CI sin tocar `.github/workflows/deploy.yml` —que tiene el check de
 * paridad main↔redesign y convierte cualquier retoque en un commit coordinado
 * en dos ramas, que es justo lo que lleva un sprint bloqueando a check:consent—.
 * Corre también en local con `pnpm check:duplicates`.
 *
 * PRECISIÓN: no bloquea nombres legítimos con números
 * Solo mira «espacio + 1-2 dígitos + extensión» al final del nombre, y además
 * distingue tres casos (ver `clasificar`): un duplicado de verdad convive con
 * su original, mientras que una secuencia numerada («slide 1.png», «slide
 * 2.png») no tiene original sin numerar. Las secuencias se dejan pasar.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';

const RAICES = ['src', 'public'];
const IGNORAR = new Set(['node_modules', '.git', 'dist', '.astro', '.vercel']);

/** 1-2 dígitos: descarta años y versiones («vídeo 2024.mp4», «spec 2026.md»). */
const SUFIJO = /^(.*\S) (\d{1,2})$/;

/**
 * «nombre 2.ext» → { base: 'nombre', n: 2, ext: '.ext' }. null si no encaja.
 * Con `esDir`, el nombre va entero: un directorio no tiene extensión.
 */
function partir(nombre, esDir = false) {
  const ext = esDir ? '' : extname(nombre);
  const sinExt = ext ? nombre.slice(0, -ext.length) : nombre;
  const m = sinExt.match(SUFIJO);
  return m ? { base: m[1], n: Number(m[2]), ext } : null;
}

function rutas(dir, salida = []) {
  for (const entrada of readdirSync(dir)) {
    if (IGNORAR.has(entrada)) continue;
    const ruta = join(dir, entrada);
    const esDir = statSync(ruta).isDirectory();
    salida.push({ ruta, nombre: entrada, esDir });
    if (esDir) rutas(ruta, salida);
  }
  return salida;
}

/**
 * Tres desenlaces, y solo dos son fallo:
 *
 *   duplicado — convive con el original sin numerar («index.html» +
 *               «index 2.html»). Es exactamente lo que hace iCloud.
 *   huerfano  — «algo 2.ext» sin original y sin más hermanos numerados. En un
 *               repo de código eso no se escribe a mano: es un duplicado al
 *               que le borraron el original.
 *   secuencia — varios numerados y ningún original («slide 1.png», «slide
 *               2.png»). Legítimo: se deja pasar.
 */
function clasificar({ ruta, nombre, esDir }, partes) {
  const dir = dirname(ruta);
  const original = join(dir, partes.base + partes.ext);
  if (existsSync(original)) return { tipo: 'duplicado', original };

  const hermanos = readdirSync(dir).filter((otro) => {
    if (otro === nombre) return false;
    const p = partir(otro, esDir);
    return p && p.base === partes.base && p.ext === partes.ext;
  });
  return hermanos.length > 0 ? { tipo: 'secuencia' } : { tipo: 'huerfano' };
}

const fallos = [];
const permitidos = [];

for (const raiz of RAICES) {
  if (!existsSync(raiz)) continue;
  for (const entrada of rutas(raiz)) {
    // Cubre también directorios («images 2/»): un `src/pages/blog 2/` duplicado
    // generaría una ruta entera, no un solo fichero.
    const partes = partir(entrada.nombre, entrada.esDir);
    if (!partes) continue;

    const veredicto = clasificar(entrada, partes);
    if (veredicto.tipo === 'secuencia') {
      permitidos.push(entrada.ruta);
    } else if (veredicto.tipo === 'duplicado') {
      fallos.push(`${entrada.ruta}  → duplicado de ${veredicto.original}`);
    } else {
      fallos.push(`${entrada.ruta}  → sufijo de duplicado y sin original`);
    }
  }
}

if (fallos.length > 0) {
  console.error(`\n✗ DUPLICADOS: ${fallos.length} fichero(s) con patrón de duplicado en ${RAICES.join('/ y ')}/\n`);
  for (const fallo of fallos) console.error(`  · ${fallo}`);
  console.error('\n  Casi siempre los crea iCloud al sincronizar ~/Documents.');
  console.error('  Un duplicado en un directorio activo de src/pages/ se PUBLICA:');
  console.error('  se construye, entra en el sitemap, y check:links y check:consent');
  console.error('  siguen en verde porque para ellos no tiene nada de malo.');
  console.error('\n  Bórralos y repite el build.\n');
  process.exit(1);
}

console.log(`✓ Duplicados: sin ficheros con patrón de duplicado en ${RAICES.join('/ y ')}/.`);
if (permitidos.length > 0) {
  console.log(`  · ${permitidos.length} secuencia(s) numerada(s) legítima(s), ignoradas.`);
}
