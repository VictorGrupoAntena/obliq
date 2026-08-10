/**
 * check-links.mjs — detecta enlaces internos rotos en el build, sin desplegar.
 *
 * Recorre dist/ y valida contra el propio dist/ tres superficies:
 *   1. <a href="/..."> — navegación, footer y contenido
 *   2. <link rel="alternate" hreflang="..."> — INCLUIDO x-default
 *   3. <link rel="canonical">
 *
 * El punto 2 es el que motiva este script: el bug de i18n de agosto de 2026
 * mantuvo durante dos semanas 109 referencias del <head> apuntando a 404, y
 * el crawl externo solo vio 37 porque las páginas EN eran inalcanzables desde
 * el menú. Un enlace roto en el <head> no se ve navegando: hay que medirlo.
 *
 * Uso: node scripts/check-links.mjs   (requiere haber hecho pnpm build)
 * Sale con código 1 si hay algún destino roto → apto para bloquear el deploy.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://obliqproductions.com';

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Ejecuta `pnpm build` antes.');
  process.exit(1);
}

// --- Recolecta los .html del build ---
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Ruta pública de un fichero del build: dist/en/about/index.html → /en/about/ */
function urlOf(file) {
  const rel = relative(dist, file).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
}

/**
 * Un destino es válido si existe como página. Tres formas legítimas en este build:
 *   /en/about/  → dist/en/about/index.html   (formato directory, el habitual)
 *   /404        → dist/404.html              (Astro emite la 404 plana)
 *   /robots.txt → dist/robots.txt            (fichero suelto de public/)
 */
function resolves(url) {
  const clean = url.replace(/[?#].*$/, '').replace(/^\//, '').replace(/\/$/, '');
  return existsSync(join(dist, clean, 'index.html'))
    || existsSync(join(dist, `${clean}.html`))
    || existsSync(join(dist, clean))
    || (clean === '' && existsSync(join(dist, 'index.html')));
}

/** Descarta lo que no es una página interna: assets, anclas, protocolos. */
function isInternalPage(href) {
  if (!href.startsWith('/')) return false;
  if (href.startsWith('//') || href.startsWith('/_astro/')) return false;
  const path = href.replace(/[?#].*$/, '');
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return !last.includes('.'); // .jpg, .php, .xml, .ico… no son páginas
}

/** Absoluta del propio sitio → relativa. Externa → null (no la validamos). */
function toInternal(href) {
  if (href.startsWith(SITE)) return href.slice(SITE.length) || '/';
  if (/^https?:\/\//.test(href)) return null;
  return href;
}

// --- Extracción ---
const RE_ANCHOR = /<a\b[^>]*?\shref="([^"]+)"/gi;
const RE_ALTERNATE = /<link\b[^>]*?\srel="alternate"[^>]*?>/gi;
const RE_CANONICAL = /<link\b[^>]*?\srel="canonical"[^>]*?\shref="([^"]+)"/gi;
const RE_HREF_ATTR = /\shref="([^"]+)"/i;
const RE_HREFLANG_ATTR = /\shreflang="([^"]+)"/i;

/** Cada referencia rota: { source, target, kind } */
const broken = [];
let checked = 0;

function check(source, rawHref, kind) {
  const href = toInternal(rawHref);
  if (href === null) return;
  if (!isInternalPage(href)) return;
  checked++;
  if (!resolves(href)) broken.push({ source, target: href, kind });
}

const files = htmlFiles(dist);
for (const file of files) {
  const source = urlOf(file);
  const html = readFileSync(file, 'utf8');

  for (const m of html.matchAll(RE_ANCHOR)) check(source, m[1], 'href');

  for (const m of html.matchAll(RE_ALTERNATE)) {
    const tag = m[0];
    const href = tag.match(RE_HREF_ATTR)?.[1];
    const lang = tag.match(RE_HREFLANG_ATTR)?.[1] ?? '?';
    if (href) check(source, href, `hreflang=${lang}`);
  }

  for (const m of html.matchAll(RE_CANONICAL)) check(source, m[1], 'canonical');
}

// --- Informe, agrupado por destino roto ---
const byTarget = new Map();
for (const b of broken) {
  if (!byTarget.has(b.target)) byTarget.set(b.target, []);
  byTarget.get(b.target).push(b);
}

const sorted = [...byTarget.entries()].sort((a, b) => b[1].length - a[1].length);

for (const [target, refs] of sorted) {
  console.log(`\n✗ ${target}  — ${refs.length} referencia(s)`);
  const seen = new Set();
  for (const r of refs) {
    const key = `${r.source} ${r.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`    ${r.source}  [${r.kind}]`);
  }
}

const headRefs = broken.filter((b) => b.kind !== 'href').length;
const bodyRefs = broken.length - headRefs;

console.log('\n---');
console.log(`Páginas analizadas:      ${files.length}`);
console.log(`Referencias comprobadas: ${checked}`);
console.log(`Rotas:                   ${broken.length}  (${bodyRefs} en <a href>, ${headRefs} en <head>)`);
console.log(`Destinos rotos únicos:   ${byTarget.size}`);

if (broken.length) {
  console.log('\n✗ FALLO — hay enlaces internos rotos.');
  process.exit(1);
}
console.log('\n✓ OK — ningún enlace interno roto.');
