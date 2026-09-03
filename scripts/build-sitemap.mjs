/**
 * build-sitemap.mjs — post-proceso del sitemap generado por @astrojs/sitemap.
 *
 * Hace dos cosas que la integración no puede hacer por sí sola en este sitio:
 *
 *   1. SACA del sitemap las páginas `noindex`. Enviar una URL marcada noindex
 *      es una contradicción —«indexa esto» / «no indexes esto»— y Search
 *      Console la reporta como «Enviada URL marcada como noindex». Afecta a
 *      las tres legales, que son ES-only por decisión de negocio.
 *
 *   2. AÑADE los alternates hreflang (`xhtml:link`) a cada URL. El sitemap
 *      salía sin ellos pese a ser un sitio bilingüe: Google tenía que deducir
 *      el emparejamiento ES↔EN solo desde el <head> de cada página.
 *
 * POR QUÉ LEE EL HTML CONSTRUIDO Y NO EL DATO.
 *
 * La opción `i18n` de @astrojs/sitemap asume que /en/ replica la misma ruta
 * (/servicios/ → /en/servicios/). Aquí los slugs están TRADUCIDOS
 * (/servicios/streaming/ ↔ /en/services/streaming/), así que activarla
 * generaría alternates apuntando a 404. La alternativa —reimplementar el mapa
 * de rutas en este script— es justo el error que causó el incidente de i18n de
 * agosto de 2026: el mapa vivía implícito en dos sitios y se desincronizó,
 * dejando 1.014 enlaces rotos.
 *
 * Por eso la fuente es el <head> ya construido: lo escribe src/lib/routes.ts,
 * fuente única de verdad, y check-links.mjs ya valida que cada hreflang
 * resuelve. Si el mapa cambia, el sitemap le sigue solo.
 *
 * Corre dentro de `pnpm build`, no como paso suelto de CI: así no depende de
 * que alguien lo cablee en deploy.yml en las dos ramas. Si falla, el build
 * falla y no hay deploy.
 *
 * Uso: node scripts/build-sitemap.mjs   (después de `astro build`)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://obliqproductions.com';

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Este script corre después de `astro build`.');
  process.exit(1);
}

// ---------------------------------------------------------------- utilidades

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/en/about/index.html → /en/about/  (mismo criterio que check-links.mjs) */
function urlOf(file) {
  const rel = relative(dist, file).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
}

/** Normaliza a ruta con barra final para poder cruzar sitemap ↔ fichero. */
function pathKey(url) {
  const path = url.startsWith(SITE) ? url.slice(SITE.length) : url;
  const clean = path.replace(/[?#].*$/, '') || '/';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ------------------------------------------------- índice de páginas del build

// Se localiza primero la ETIQUETA y luego se extrae el content, en vez de
// exigir el orden name→content en un solo patrón. Si el orden de atributos
// cambiara, un patrón rígido no casaría, `robots` quedaría vacío y las páginas
// noindex volverían al sitemap SIN QUE NADA FALLARA. Por eso, además, una
// etiqueta robots cuyo content no se pueda leer aborta el build (ver abajo).
const RE_ROBOTS_TAG = /<meta\b[^>]*\bname="robots"[^>]*>/i;
const RE_CONTENT_ATTR = /\scontent="([^"]*)"/i;
const RE_ALTERNATE = /<link\b[^>]*\brel="alternate"[^>]*>/gi;
const RE_HREF_ATTR = /\shref="([^"]+)"/i;
const RE_HREFLANG_ATTR = /\shreflang="([^"]+)"/i;

/** pathname con barra final → { noindex, alternates: [{ hreflang, href }] } */
const pages = new Map();

/** Etiquetas <meta robots> presentes pero ilegibles: abortan el build. */
const unreadable = [];

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>') + 1 || html.length);

  const robotsTag = head.match(RE_ROBOTS_TAG)?.[0];
  let robots = '';
  if (robotsTag) {
    const content = robotsTag.match(RE_CONTENT_ATTR)?.[1];
    if (content === undefined) {
      unreadable.push({ file: relative(dist, file), tag: robotsTag });
      continue;
    }
    robots = content;
  }
  const alternates = [];
  for (const m of head.matchAll(RE_ALTERNATE)) {
    const tag = m[0];
    const href = tag.match(RE_HREF_ATTR)?.[1];
    const hreflang = tag.match(RE_HREFLANG_ATTR)?.[1];
    // Sin hreflang es otro tipo de alternate (RSS, por ejemplo): no va al sitemap.
    if (href && hreflang) alternates.push({ hreflang, href });
  }

  pages.set(pathKey(urlOf(file)), {
    noindex: /\bnoindex\b/i.test(robots),
    alternates,
  });
}

if (unreadable.length) {
  console.error(`\n\u2717 ${unreadable.length} etiqueta(s) <meta robots> sin content legible:`);
  for (const u of unreadable) console.error(`    ${u.file}  ${u.tag}`);
  console.error('\n  Sin poder leerlas no se sabe qué páginas son noindex y el');
  console.error('  sitemap las publicaría igualmente. Se aborta.');
  process.exit(1);
}

// ----------------------------------------------------------- reescritura XML

const sitemaps = readdirSync(dist).filter(
  (f) => /^sitemap-\d+\.xml$/.test(f),
);

if (sitemaps.length === 0) {
  console.error('✗ No hay dist/sitemap-N.xml. ¿Se ha quitado la integración @astrojs/sitemap?');
  process.exit(1);
}

const RE_URL_BLOCK = /<url>([\s\S]*?)<\/url>/g;
const RE_LOC = /<loc>([^<]+)<\/loc>/i;
const RE_LASTMOD = /<lastmod>([^<]+)<\/lastmod>/i;

let total = 0;
let dropped = 0;
let withAlternates = 0;
const orphans = [];
const droppedUrls = [];

for (const name of sitemaps) {
  const file = join(dist, name);
  const xml = readFileSync(file, 'utf8');

  const entries = [];

  for (const m of xml.matchAll(RE_URL_BLOCK)) {
    const block = m[1];
    const loc = block.match(RE_LOC)?.[1];
    if (!loc) continue;
    total++;

    const key = pathKey(loc);
    const page = pages.get(key);

    // Una URL en el sitemap sin página en dist/ es una incoherencia real:
    // o el build no la ha emitido o el sitemap la ha inventado. No se silencia.
    if (!page) {
      orphans.push(loc);
      continue;
    }

    if (page.noindex) {
      dropped++;
      droppedUrls.push(key);
      continue;
    }

    const lines = [`    <loc>${escapeXml(loc)}</loc>`];

    // lastmod: se conserva el que traiga la integración si lo hubiera.
    const lastmod = block.match(RE_LASTMOD)?.[1];
    if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);

    // Google exige el juego COMPLETO de alternates en cada URL, incluida la
    // autorreferencia. El <head> ya la emite (hreflang del propio locale), así
    // que se copian tal cual sin filtrar.
    if (page.alternates.length > 0) {
      withAlternates++;
      for (const alt of page.alternates) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}"/>`,
        );
      }
    }

    entries.push(`  <url>\n${lines.join('\n')}\n  </url>`);
  }

  const out =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  writeFileSync(file, out, 'utf8');
}

// ------------------------------------------------------------------- informe

console.log('\n--- sitemap ---');
console.log(`Ficheros reescritos:   ${sitemaps.join(', ')}`);
console.log(`URLs en el sitemap:    ${total}`);
console.log(`Excluidas por noindex: ${dropped}${droppedUrls.length ? '  → ' + droppedUrls.join(', ') : ''}`);
console.log(`Con alternates:        ${withAlternates}`);
console.log(`Publicadas:            ${total - dropped - orphans.length}`);

if (orphans.length) {
  console.error(`\n✗ ${orphans.length} URL(s) del sitemap sin página en dist/:`);
  for (const o of orphans) console.error(`    ${o}`);
  console.error('\n  El sitemap y el build no coinciden. No se despliega así.');
  process.exit(1);
}

console.log('\n✓ OK — sitemap coherente con el build.');
