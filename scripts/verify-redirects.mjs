/**
 * verify-redirects.mjs — verifica las reglas 301 de public/.htaccess sin desplegar.
 *
 * Parsea las RewriteRule del .htaccess, las aplica con semántica Apache
 * (primer match gana, [L]) sobre el set de URLs antiguas, y comprueba:
 *   1. cada origen → destino esperado en UN salto
 *   2. cada destino existe como página 200 en dist/ (index.html)
 *   3. ningún destino vuelve a matchear un patrón de origen → sin cadenas ni bucles
 *
 * Uso: node scripts/verify-redirects.mjs   (requiere haber hecho pnpm build)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Parse RewriteRule ^pattern target [flags] del .htaccess ---
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
const rules = [];
for (const line of htaccess.split('\n')) {
  const m = line.match(/^\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[R=301,L\]/);
  if (m) rules.push({ pattern: new RegExp(m[1]), target: m[2] });
}

// Apache per-directory: la ruta llega SIN barra inicial. Devuelve el destino
// del primer patrón que matchea (semántica [L]), o null si ninguno.
function applyRules(pathNoSlash) {
  for (const r of rules) {
    if (r.pattern.test(pathNoSlash)) {
      return pathNoSlash.replace(r.pattern, r.target);
    }
  }
  return null;
}

// --- Casos esperados: URL antigua → destino final ---
const expected = [
  ['es/', '/'],
  ['es', '/'],
  ['es/about/', '/nosotros/'],
  ['es/contact/', '/contacto/'],
  ['es/rental/', '/alquiler/'],
  ['es/legal/', '/aviso-legal/'],
  ['es/videos/masterchef/', '/portfolio/'],
  ['es/videos/director/juan-perez/', '/portfolio/'],
  ['about/', '/en/about/'],
  ['contact/', '/en/contact/'],
  ['rental/', '/en/rental/'],
  ['legal/', '/aviso-legal/'],
  ['videos/loewe/', '/en/portfolio/'],
  ['videos/director/juan-perez/', '/en/portfolio/'],
];

// Añade automáticamente la variante SIN barra final de cada caso con barra
for (const [src, dst] of [...expected]) {
  if (src.endsWith('/')) expected.push([src.slice(0, -1), dst]);
}

const distExists = (url) => existsSync(join(root, 'dist', url.replace(/^\//, ''), 'index.html'))
  || (url === '/' && existsSync(join(root, 'dist/index.html')));

let ok = 0, fail = 0;
console.log('ORIGEN → DESTINO  (esperado | real | 200? | 1 salto?)');
for (const [src, want] of expected) {
  const got = applyRules(src);
  const oneHop = got !== null && applyRules(got.replace(/^\//, '')) === null; // el destino NO re-matchea
  const is200 = got !== null && distExists(got);
  const pass = got === want && oneHop && is200;
  console.log(`${pass ? '✓' : '✗'} /${src}  →  esperado ${want} | real ${got} | 200:${is200} | 1salto:${oneHop}`);
  pass ? ok++ : fail++;
}

// --- Chequeo global de bucles: ningún destino es origen de otra regla ---
const targets = [...new Set(expected.map(([, d]) => d))];
const loops = targets.filter((t) => applyRules(t.replace(/^\//, '')) !== null);

console.log('\n---');
console.log(`Reglas parseadas: ${rules.length}`);
console.log(`Casos: ${ok} OK, ${fail} FALLO`);
console.log(`Bucles/cadenas detectados: ${loops.length}${loops.length ? ' → ' + loops.join(', ') : ' (ninguno)'}`);
process.exit(fail === 0 && loops.length === 0 ? 0 : 1);
