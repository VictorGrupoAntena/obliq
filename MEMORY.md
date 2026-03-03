# Obliq Productions — Project Memory

## Fase actual: REDISEÑO — Sprint 2.5 (bugs + polish) completado

### Sprint 0 (Fundamentos) ✅ 2-Mar-2026
- Rama `redesign` — i18n invertido, tokens, atoms, organisms, sections
- BaseLayout SEO, GSAP utils, Schema.org, Home ES+EN
- Build: 2 páginas, 0 errores

### Migración Plesk ✅ 2-Mar-2026
- Rama `plesk-migration` — Vercel→Node.js, Passenger, LIVE
- SSH: `obliqproductions.com_zbt88qx0mpj@obliqproductions.com`
- WP root: `~/admin.obliqproductions.com/`

### Sprint 1A+1B (Páginas + Polish) ✅ 2-Mar-2026
- 76 páginas SSG (9 servicios, 6 cat alquiler, 15 productos, portfolio, contacto, legal)
- Animaciones GSAP, packs alquiler, descuentos multidía, custom cursor

### Sprint 2 (WordPress Headless CMS) ✅ 2-Mar-2026
**Fase A — Credenciales:** App Password + SFTP en `.env.local`
**Fase B — Esquema WP:** mu-plugin `obliq-cpts.php` → 6 CPTs + 2 taxonomías + meta fields
**Fase C — Capa Astro:** `wp-client.ts` + `wp-types.ts` + 5 facades async con mock fallback
**Fase D — Migración:** 16 páginas (8 ES + 8 EN) de mock → async WP data
**Fase E — Seed:** 63 items creados vía PHP CLI (9 serv, 15 prod, 3 packs, 12 cats, 9 portfolio, 4 team, 13 clientes)
**Auditoría:** Tipos defensivos (optional chaining), 76 páginas build 0 errores
**Pendiente Fase F:** Webhook auto-rebuild (diferido)

#### Archivos clave Sprint 2
| Archivo | Función |
|---------|---------|
| `src/lib/wp-client.ts` | Cliente REST API + transformers + helpers JetEngine |
| `src/lib/wp-types.ts` | Tipos TS para respuestas WP REST (campos top-level) |
| `src/data/services.ts` | Facade async — getServicesAsync(), getServiceBySlugAsync() |
| `src/data/rental.ts` | Facade async — getCategoriesAsync(), getPacksAsync(), etc. |
| `src/data/portfolio.ts` | Facade async — getPortfolioProjectsAsync() |
| `src/data/team.ts` | Facade async — getTeamAsync() |
| `src/data/clients.ts` | Facade async — getClientsAsync(), getClientNamesAsync() |
| `scripts/obliq-cpts.php` | mu-plugin WP: register CPT + taxonomy + rest_field |
| `scripts/obliq-seed.php` | Script seed (auto-eliminado tras ejecución) |

#### Patrón técnico WP: register_rest_field (NO register_post_meta)
- Los campos meta aparecen en **top level** de la REST response (no en `meta:{}`)
- `register_rest_field()` con `get_callback`/`update_callback` para TODOS los campos
- `register_post_meta()` funciona para la DB pero no expone en REST con este WP
- Taxonomías sí usan `register_term_meta()` con `show_in_rest` (funciona)

#### WordPress estado actual
- URL: `admin.obliqproductions.com`
- WP REST API: pública sin auth para lectura
- JetEngine 3.8.4 instalado (endpoints MCP disponibles)
- mu-plugins/obliq-cpts.php: activo, registra todo el esquema
- 63 items publicados, contenido bilingüe ES+EN
- Sin imágenes reales (placeholder /hero.jpg) — pendiente subida por cliente
- 7/9 servicios sin pricing (solo streaming y redes tienen packs productizados)

### Sprint 2.5 (Bugs críticos + Polish) ✅ 3-Mar-2026
- **Commit:** `5f3f9d7` en rama `redesign`
- **GSAP no pre-bundleaba en Vite:** Añadido `optimizeDeps.include` en `astro.config.mjs`
- **TransitionMask cubría toda la página (pantalla negra):** Tailwind 4 `translate-y-full` usa CSS `translate` (no `transform`). JS usaba `style.transform` → propiedades separadas que se apilaban. Fix: inline `style="translate: 0 100%;"` + JS usa `style.translate` + animaciones por opacity
- **Elementos invisibles tras scroll:** GSAP `toggleActions: 'play none none reverse'` → cambiado a `'play none none none'` en `gsap.ts` y ambos `index.astro`
- **Spacing tokens rotos (0px):** En Tailwind 4, `--spacing-section` genera `py-section` (no `py-spacing-section`). Renombradas ~40 clases en 30 archivos
- **Header rediseñado:** Grid 3 columnas con `navLeft | logo.gif centrado | navRight + LangSwitcher`
- **TransitionMask:** Simplificada a fade negro limpio (sin logo/slash)
- **logo.svg copiado a public/** — eliminado residuo `public/logo 2.svg`

#### Lecciones aprendidas (Tailwind 4)
- `--spacing-X: Npx` en `@theme` → genera utility `py-X`, NO `py-spacing-X`
- CSS `translate` y `transform` son propiedades SEPARADAS que se apilan — no mezclar clases Tailwind `translate-*` con JS `style.transform`

### Backlog Sprint 3+ (próximas sesiones)

**PRIORIDAD ALTA — Revisión visual página por página:**
1. Auditoría visual completa: recorrer cada página verificando espaciados, elementos, responsividad
2. Imágenes reales: subir fotos producto/servicio a WP Media Library
3. Deploy redesign a producción (rama redesign → build → httpdocs)
4. Redirecciones 301 de URLs antiguas (EN default → ES default)

**PRIORIDAD ALTA — Funcionalidad:**
5. Webhook auto-rebuild: WP publish → GitHub Actions → build → SFTP a Plesk
6. Formulario contacto: integrar Resend email
7. Formulario alquiler: solicitud presupuesto con productos pre-rellenados

**PRIORIDAD MEDIA:**
8. Portfolio: URLs Vimeo reales + thumbnails (cliente proporciona)
9. WhatsApp mensaje contextual según página
10. Carrito de presupuesto alquiler (lista productos + fechas)

**PRIORIDAD BAJA:**
11. Schema.org VideoObject en portfolio (cuando haya URLs Vimeo reales)
12. Optimizar GSAP deduplication
13. Migrar logo.gif → WebP/Lottie
14. DNS/MX migration planning
15. i18n admin WP (Polylang si cliente lo necesita — ahora campos `_es/_en`)

**DEUDA TÉCNICA:**
- Merge pendiente: plesk-migration → main → seguir con redesign
- `public/favicon 2.svg` residuo — eliminar

## Project Overview

- **Cliente:** Obliq Productions — productora audiovisual multidisciplinar, Valencia
- **Dominio:** obliqproductions.com / obliq.es
- **Repo:** VictorGrupoAntena/obliq.git
- **Working dir:** /Users/victormedina/Documents/Proyectos web/obliq/obliq
- **Deploy:** Plesk (Grupo Antena) — web actual LIVE en obliqproductions.com
- **Stack redesign:** Astro 5.x SSG + Tailwind 4 + GSAP 3.13 + WordPress headless (CMS)
- **WP Admin:** https://admin.obliqproductions.com (JetEngine 3.8.4, mu-plugin obliq-cpts.php)

## Documentación estratégica

Estos documentos contienen las decisiones de negocio y el contexto que no se puede inferir del código. Léelos antes de planificar:

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Memoria técnica v6 | `docs/memoria-tecnica-v6.md` | Visión completa del rediseño: arquitectura, servicios, alquiler, SEO, fases |
| Análisis competitivo rental | `docs/analisis-competitivo-rental.md` | 5 rental houses Valencia analizados, oportunidades de mercado |
| Informe estado actual | `docs/informe-estado-actual.md` | Auditoría completa de la web actual (SEO, técnica, contenido, seguridad) |

## Decisiones estratégicas ya tomadas

Estas decisiones son **zona roja** — no se cambian sin consultar al responsable del proyecto:

### Idioma
- **Español como idioma por defecto** (sin prefijo de URL). Inglés bajo `/en/`
- La web actual tiene inglés como default — esto se invierte completamente
- URLs en español: `/servicios/`, `/alquiler/`, `/contacto/`, `/nosotros/`, `/portfolio/`
- URLs en inglés: `/en/services/`, `/en/rental/`, `/en/contact/`, `/en/about/`, `/en/portfolio/`
- Hreflang bidireccional ES↔EN en todas las páginas
- Redirecciones 301 de todas las URLs antiguas (ver tabla completa en memoria técnica)

### Arquitectura
- **WordPress headless como CMS** — WordPress solo como backend (API), Astro como frontend
- **Hosting: Plesk (Grupo Antena)** — decisión tomada. Todo en un servidor: Astro (Node.js) + WordPress. Motivos: unificar clientes bajo nuestro sistema de dominios/hosting, malas experiencias con Vercel para gestión de correos electrónicos
- Conexión al servidor vía **SSH** (ADA ya conoce el flujo de deploy en Plesk)
- El cliente gestiona contenido desde WordPress: servicios, portfolio, directores, productos alquiler, packs, logos clientes
- Plugin bilingüe (WPML o Polylang) para gestionar ES/EN desde WordPress
- Webhook WordPress → rebuild Astro en cada publicación/edición
- WordPress en subdominio no público (admin.obliqproductions.com)

### Migración DNS y correo electrónico
- **Estado actual: DESCONOCIDO** — investigar dónde están los DNS de obliqproductions.com/obliq.es, qué registros MX existen, qué proveedor de correo usan actualmente
- Planificar transferencia de DNS al servidor Plesk sin interrumpir el servicio de email
- Configurar registros MX, SPF, DKIM, DMARC en Plesk
- El dominio tiene correo activo (info@obliqproductions.com) — la migración de DNS debe ser coordinada para evitar downtime de email

### Servicios (9 páginas)
1. `/servicios/streaming/` — Servicio estrella, baja competencia SEO
2. `/servicios/contenido-redes-sociales/` — Packs productizados (Starter/Growth/Premium)
3. `/servicios/video-corporativo/` — Mayor volumen de búsqueda tras "productora audiovisual"
4. `/servicios/spots-publicitarios/` — EN: `advertising-spots`
5. `/servicios/videoclips/` — EN: `music-videos`
6. `/servicios/eventos/`
7. `/servicios/fotografia/` — EN: `photography`
8. `/servicios/postproduccion/` — EN: `post-production`
9. `/servicios/consultoria/` — EN: `consulting`

### Packs y tarifas (precios del cliente)

**Packs contenido redes sociales:**
- Starter: 400€/mes (1 filmmaker, 4h, 5 reels)
- Medium: 600€/mes (1 filmmaker, 8h, 10 reels)
- Expert: 1.200€/mes (1 filmmaker + 1 fotógrafo, 8h+4h, 15 reels, 1 vídeo resumen, 100 fotos)

**Tarifas streaming:**
- Básica: 1.000€ (1 realizador, 2 cámaras fijas, media-jornada completa)
- Media: 1.500€ (1 realizador, 2 cámaras fijas, 1 operador cámara)
- A medida: presupuesto personalizado

**Extras redes sociales:** Guionización 5 reels 100€, filmmaker media jornada extra 200€, jornada completa extra 250€

**Edición para redes:** Reel/Short 40€, vídeo largo YouTube 200€, vídeo resumen 150€

### Alquiler — arquitectura de URLs
- Landing general: `/alquiler/`
- Categorías: `/alquiler/camaras/`, `/alquiler/opticas/`, `/alquiler/soporte/`, `/alquiler/monitores/`, `/alquiler/audio/`, `/alquiler/accesorios/`
- Fichas producto: `/alquiler/camaras/sony-fx6/`, `/alquiler/audio/rode-wireless-pro/`
- Cada ficha con Schema.org Product (ningún competidor lo hace — ventaja de primer movedor)
- Meta titles con precio: "Alquiler Sony FX6 en Valencia — 110€/día | Obliq"
- 15 productos actuales (ver lista completa en memoria técnica)

### Conversión
- Módulo pricing con tarjetas comparativas (componente reutilizable para servicios con packs)
- Botón "Estoy interesado" → formulario contacto con pack/producto pre-rellenado (?servicio=X&pack=Y)
- WhatsApp flotante en todas las páginas con mensaje pre-rellenado según contexto
- Formulario específico de alquiler (separado del genérico de contacto)
- Carrito de presupuesto para alquiler (lista de productos + fechas → enviar solicitud)

### SEO
- Meta titles y descriptions únicos para cada página (ver propuestas en memoria técnica)
- Schema.org: LocalBusiness, VideoObject, Product, Service, Offer, BreadcrumbList
- Sitemap.xml automático (incluye vídeos y productos)
- Robots.txt configurado
- Canonical URLs + Open Graph + Twitter Cards en todas las páginas
- Google Business Profile optimizado para "alquiler audiovisual"

## Contexto competitivo clave

- **Productoras:** 9 competidores analizados. Ninguno combina streaming + rental + portfolio directores + bilingüismo + packs productizados
- **Rental houses:** 5 competidores analizados. Obliq no existe en Google para alquiler (web en inglés, sin fichas individuales). Ningún competidor usa Schema.org Product correctamente. Visual Rent es el más avanzado técnicamente pero con errores PHP y contenido duplicado
- **Oportunidades:** "streaming Valencia" tiene baja competencia, packs contenido redes es nicho sin explotar, rich snippets con precios en alquiler (nadie lo hace)
- **Ventaja Obliq:** único que combina productora + rental con precios públicos transparentes. Stack Astro superior al WordPress de 8/9 competidores

## Documentación de diseño (2-Mar-2026)

Análisis completo del diseño en Pencil (`obliq-design-system.pen`) completado:

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Design Spec | `docs/design-spec.md` | Tokens, componentes, estructura de 10 páginas, assets |
| Animation Spec | `docs/animation-spec.md` | 17 animaciones catalogadas del código actual |
| Memoria técnica v6 | `docs/memoria-tecnica-v6.md` | Visión completa del rediseño |
| Análisis competitivo | `docs/analisis-competitivo-rental.md` | 5 rental houses analizados |
| Informe estado actual | `docs/informe-estado-actual.md` | Auditoría web actual |

### Componentes del Design System (22 únicos)
- **Navigation:** Header, Footer, Breadcrumbs, Marquee/Large, Marquee/Small, WhatsApp FAB/Expanded
- **Buttons:** Primary, Dark, Outline, Ghost (52px alto, 11px/600, 3px spacing)
- **Cards:** Service-Text, Service, Category, Product (dark), Product-Light, Product-Compact, Pricing (×3 variantes), Portfolio
- **Patterns:** Section-Header (dark/light), Spec-Row, Hero (variantes), Quote Cart Preview
- **Form:** Form + Info layout (contacto)
- **Filter:** Tabs de filtro (portfolio)

### Tokens clave para Tailwind @theme
- Colores: #000, #FFF, #111 (surface-dark), #F5F5F5 (surface-light), #333, #888, #CCC, #DDD
- Font: Montserrat Variable (ya en uso)
- H1: 72px/900/italic/-3, H2: 48px/900/italic/-2, Body: 18px/300/1.6
- Sección padding: 80px, gaps: 24-48px

### Assets a reutilizar
- favicon.ico ✅ (barra inclinada Obliq, 16KB — referenciado en ambos layouts)
- logo.svg ✅ (4KB — duplicado en src/assets/ y public/, unificar)
- logo.gif ✅ (796KB — evaluar WebP/Lottie)
- 15 fotos producto PNG (~13MB — pasar por <Image> Astro)
- 7 fotos about/contact/video JPG
- favicon.svg NO SE USA (no referenciado en ningún layout)

## Historial completado (fase anterior — mantenimiento)
- Google Analytics GA4 (G-896V9YZVME) — Layout.astro + Video.astro ✅
- Google Search Console verification ✅
- SEO + H1 fix for /rental pages ✅
- Vimeo API thumbnails ✅
- Google Sheets parsing fix ✅
- Migración infraestructura a repo y deploy propios ✅

## Notas técnicas
- Git repo is inside `obliq/obliq/` (not the parent `obliq/`)
- **Branch `main`:** web actual (Vercel SSR, EN default, Google Sheets + Vimeo API v2)
- **Branch `redesign`:** nueva web (SSG, ES default, tokens, i18n invertido)
- Stack main: Astro 5.x + @astrojs/vercel + Tailwind 4 + GSAP + Resend
- Stack redesign: Astro 5.x + @astrojs/sitemap + Tailwind 4 + GSAP (sin Vercel adapter)
- **Hosting:** Plesk ✅ (migración completada, LIVE)
- Vulnerabilidades XSS en templates de email y mensajes de error — pendiente corregir
- about.mp4 (20.8 MB) y logo.gif (813 KB) — pendiente optimizar
- GSAP (~60KB) se carga en cada página sin deduplicación — pendiente optimizar
- Vimeo API v2 deprecada — migración a v3 obligatoria

## Datos empresa (para Schema.org y legal)
- **Razón social:** Obliq Audiovisual SL
- **CIF:** B19377019
- **Dirección:** C/ Pintor Navarro Llorens, bajo 3, 46008 Valencia
- **Email:** info@obliqproductions.com
- **Teléfono:** 675 489 980
- **GA4:** G-896V9YZVME
