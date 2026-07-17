# Redirecciones 301 — migración de URLs del rediseño

La web antigua tenía **inglés por defecto** (sin prefijo) y **español bajo `/es/`**.
El rediseño invierte la lógica: **español en la raíz**, **inglés bajo `/en/`**.
Sin 301 permanentes se pierde el posicionamiento y se generan 404 en cada URL indexada.

## Mecanismo elegido: `.htaccess` (Apache mod_rewrite)

El rediseño es **SSG puro** (Astro sin adaptador → `dist/` estático). Se despliega como
sitio estático en Plesk (docroot = `dist/`, Apache tras nginx). El fichero
[`public/.htaccess`](../../public/.htaccess) se copia a `dist/.htaccess` en cada build,
por lo que las reglas quedan **versionadas en el repo** y se despliegan atómicamente con
el sitio. Apache emite **301 reales** a nivel de servidor para las rutas antiguas (que ya
no existen como fichero en el nuevo `dist/`, de modo que nginx las delega a Apache).

### Por qué este y no otro

| Alternativa | Descartada porque |
|---|---|
| **Astro `redirects` config (SSG)** | Con `output: 'static'` genera páginas HTML con `<meta refresh>`, **no** 301 reales. Google las trata como redirección blanda (equity degradada) — justo lo que hay que evitar. |
| **Astro `redirects` + adaptador Node (`output: 'server'`)** | Daría 301 reales, pero obliga a reintroducir SSR y un proceso Node vivo solo para redirigir un sitio que es estático. Complejidad y superficie de fallo innecesarias. |
| **Directivas nginx en el panel Plesk** | 301 reales y rápidas, pero **no versionadas** (viven en el panel, no en el repo), no revisables en el diff y requieren acceso al panel para cada cambio. Se documentan abajo como *fallback*. |
| **`.htaccess` (elegido)** | 301 reales, **versionado** en `public/.htaccess`, revisable como diff, desplegado con el build. Encaja con un SSG servido por Apache. |

## Tabla de reglas (origen → destino final, 301)

| # | URL antigua (main) | URL nueva (200) | Notas |
|---|---|---|---|
| 1 | `/es/` · `/es` | `/` | Home ES pasa de `/es/` a la raíz |
| 2 | `/es/about/` | `/nosotros/` | |
| 3 | `/es/contact/` | `/contacto/` | |
| 4 | `/es/rental/` | `/alquiler/` | |
| 5 | `/es/legal/` | `/aviso-legal/` | |
| 6 | `/es/videos/*` | `/portfolio/` | slug y director → grid (no hay detalle aún) |
| 7 | `/about/` | `/en/about/` | inglés antiguo → `/en/` |
| 8 | `/contact/` | `/en/contact/` | |
| 9 | `/rental/` | `/en/rental/` | |
| 10 | `/legal/` | `/aviso-legal/` | no existe `/en/legal/`; legal es única (ES) |
| 11 | `/videos/*` | `/en/portfolio/` | slug y director → grid EN |

**Raíz `/` — excepción deliberada (NO se redirige):** antes servía la home en inglés,
ahora sirve la home en español con 200. Un `301 / → /en/` rebotaría a todos los visitantes
españoles al inglés, destruyendo la estrategia ES-first. El vínculo con la antigua home
inglesa se preserva vía **hreflang** (`/` ↔ `/en/`) + autodetección de idioma JS en la
primera visita (§4.1 de la memoria técnica).

Todas las reglas toleran barra final (`/?$`) y apuntan **directamente** al destino final:
ningún destino es a su vez origen de otra regla → **sin cadenas ni bucles**.

## Fallback: equivalente nginx

Si el dominio sirviera el estático directamente por nginx (sin pasar por Apache), pegar
esto en Plesk → Dominio → Apache & nginx Settings → *Additional nginx directives*:

```nginx
# ES antiguo (/es/*) → ES nuevo (raíz)
location = /es/            { return 301 /; }
location = /es             { return 301 /; }
location = /es/about/      { return 301 /nosotros/; }
location = /es/contact/    { return 301 /contacto/; }
location = /es/rental/     { return 301 /alquiler/; }
location = /es/legal/      { return 301 /aviso-legal/; }
location ^~ /es/videos/    { return 301 /portfolio/; }

# EN antiguo (sin prefijo) → EN nuevo (/en/*)
location = /about/         { return 301 /en/about/; }
location = /contact/       { return 301 /en/contact/; }
location = /rental/        { return 301 /en/rental/; }
location = /legal/         { return 301 /aviso-legal/; }
location ^~ /videos/       { return 301 /en/portfolio/; }
```

> Nota: en nginx conviene replicar cada regla con y sin barra final si el dominio no
> normaliza `trailingSlash`. Las variantes `location =` exactas evitan colisiones.

## Cómo se ha verificado (sin desplegar)

1. `pnpm build` → confirmado que `.htaccess` se copia a `dist/.htaccess`.
2. Simulador (`scripts/verify-redirects.mjs`) que aplica el ruleset con la semántica
   de Apache (primer match gana) sobre las 22 URLs antiguas (con y sin barra final):
   - cada origen resuelve a su destino esperado en **un solo salto**;
   - cada destino existe como página **200** en el `dist/` nuevo;
   - ningún destino coincide con un patrón de origen → **0 cadenas, 0 bucles**.
