# Obliq — Design Specification

**Extraído del archivo Pencil:** `obliq-design-system.pen`
**Fecha:** 2 de marzo de 2026

---

## 1. Design Tokens

### Paleta de colores

**Primarios:**

| Token | Nombre | Hex | Uso |
|-------|--------|-----|-----|
| black | Black Primary | `#000000` | Fondos principales, texto sobre claro |
| white | White | `#FFFFFF` | Texto sobre oscuro, fondos claros |
| surface-dark | Surface Dark | `#111111` | Fondos alternativos (cards, secciones) |
| surface-light | Surface Light | `#F5F5F5` | Fondos claros alternativos |

**Escala de grises:**

| Token | Hex | Uso |
|-------|-----|-----|
| border | Border / Divider | `#333333` |
| muted | Text Muted | `#888888` |
| secondary | Text Secondary | `#CCCCCC` |
| border-light | Border Light | `#DDDDDD` |

**Fondos de sección (patrón alternante):**
- Negro (#000) → Surface Dark (#111) → Blanco (#FFF) → Surface Light (#F5F5F5)
- Las páginas de alquiler usan más fondo claro (#F5F5F5 para grids de producto)
- Las páginas de servicio usan más fondo oscuro (#000/#111)

### Tipografía — Montserrat Variable

| Token | Tamaño | Peso | Estilo | Tracking | Line-height | Uso |
|-------|--------|------|--------|----------|-------------|-----|
| h1 | 72px | Black 900 | Italic | -3 | — | Titulares principales |
| h2 | 48px | Black 900 | Italic | -2 | — | Títulos de sección |
| h3 | 32px | Bold 700 | Normal | — | — | Subtítulos |
| h4 | 24px | SemiBold 600 | Normal | — | — | Títulos menores |
| body | 18px | Light 300 | Normal | — | 1.6 | Texto principal |
| small | 14px | Regular 400 | Normal | — | — | Texto auxiliar |
| caption | 12px | Medium 500 | Normal | 3 | — | Navegación, etiquetas |
| label | 11px | SemiBold 600 | Uppercase | 4 | — | Botones, badges |
| accent | 24px | Light 300 | Italic | — | — | Taglines, citas |
| hero-title | 120px | Black 900 | Italic | — | — | Solo Hero Home |
| tag | 10px | SemiBold 600 | Uppercase | — | — | Etiquetas de sección (SERVICIOS, PORTFOLIO, etc.) |

### Spacing

| Contexto | Valor |
|----------|-------|
| Padding de sección | 80px |
| Gap entre secciones | 48-80px |
| Gap dentro de sección | 24-48px |
| Padding Hero | 0 80 100 80 |
| Gap card internos | 8-16px |
| Grid gap | 16-24px |

### Botones

| Variante | Fill | Texto | Borde | Uso |
|----------|------|-------|-------|-----|
| Primary | #FFF | #000 | — | CTAs principales sobre fondo oscuro |
| Dark | #000 | #FFF | — | CTAs sobre fondo claro |
| Outline | transparent | #FFF | #FFF 1px | Secundario sobre fondo oscuro |
| Ghost | transparent | #FFF | — | Enlaces de navegación ("VER MÁS →") |

Specs comunes: altura 52px, padding-x 32px, Montserrat 11px/600, letter-spacing 3px, uppercase.

---

## 2. Componentes

### Navigation

**Header**
- Layout: Logo izq + nav center/right + lang switcher (ES/EN)
- Nav items: Servicios, Portfolio, Alquiler, Nosotros, Contacto
- Fixed top, fondo negro
- Mobile: hamburguesa → panel lateral (GSAP slide)

**Footer**
- 3 columnas: Brand (logo + contacto) | Servicios (9 links) | Empresa + Legal
- Copyright: "© 2026 Obliq Productions. Todos los derechos reservados."
- Fondo negro

**Breadcrumbs**
- Formato: Inicio → Alquiler → Cámaras → Sony FX6
- Fondo #111, padding 16px 80px
- Usado en: páginas de servicio, alquiler (3 niveles)

**Marquee/Large**
- Texto grande (H1-like) en scroll infinito
- GSAP: x: -=distance, 8s, linear, repeat: -1, modifiers wrap
- Usado en: Home ("NUESTRO TRABAJO"), Streaming

**Marquee/Small**
- Texto más pequeño (caption-like) en scroll infinito
- Mismo GSAP que Large
- Usado en: Home (marcas), Streaming (plataformas)

**WhatsApp FAB**
- Botón flotante circular (60×60), fixed bottom-right
- Versión expandida al hover con texto "¿Necesitas ayuda?"
- z-index máximo

### Cards

**Card/Service-Text** (151px altura fija)
- Fondo: #111 (surface dark)
- Contenido: título (16px/700) + descripción (13px/300) + CTA ghost
- Uso: Home grid 3×3

**Card/Service** (con imagen)
- Imagen placeholder arriba + contenido abajo sobre fondo oscuro
- Contenido: título + descripción + "VER SERVICIO →"
- Uso: páginas interiores con más espacio

**Card/Category**
- Icono/imagen + nombre categoría (18px/700) + count + "VER CATEGORÍA →"
- Uso: Alquiler landing (grid de categorías)

**Card/Product** (dark)
- Fondo negro, imagen arriba
- Categoría tag + nombre (18px/700) + specs (12px/300) + precio (20px/800) + "+ IVA" + botón "ALQUILAR"
- Uso: sección equipo en páginas de servicio

**Card/Product-Light**
- Fondo blanco/claro, misma estructura
- Texto en negro, botón Dark "AÑADIR AL PRESUPUESTO"
- Uso: Alquiler landing (featured), categoría (grid)

**Card/Product-Compact**
- Mínimo: nombre (16px/700) + precio (13px/600)
- Uso: "También te puede interesar" en ficha producto

**Card/Pricing** (3 variantes)
- Starter / Featured (recomendado) / Expert
- Precio grande (48px/900), features list, botón "ESTOY INTERESADO"
- Featured tiene fondo más claro y borde destacado
- Uso: Streaming (tarifas), Contenido Redes (packs)

**Card/Portfolio**
- Imagen a sangre con overlay gradient
- Título (bold/italic) + categoría + "VER PROYECTO →"
- Uso: Home, Portfolio grid

### Patterns (secciones reutilizables)

**Pattern/Section-Header**
- Etiqueta tag (10px/600, #888) + H2 (48px/900/italic)
- Variante dark (texto blanco sobre negro) y light (texto negro sobre blanco)

**Pattern/Spec-Row**
- Fila: propiedad (izq) : valor (der)
- Separador línea entre filas
- Uso: ficha producto (specs técnicas), extras redes sociales (tarifas)

**Quote Cart Preview**
- Fondo negro
- Título "MONTA TU KIT A MEDIDA" + descripción
- Lista de productos añadidos con precio
- Botón "ENVIAR SOLICITUD DE PRESUPUESTO"
- Uso: 3 páginas de alquiler (landing, categoría, ficha)

**Hero Section** (variantes por página)
- Con imagen de fondo: Home, Streaming, Alquiler landing
- Solo fondo negro: Portfolio, Nosotros, Contacto, Redes Sociales
- Con fondo #111: Alquiler categoría
- Siempre incluye: tag + H1 + subtítulo/descripción + CTA(s)

---

## 3. Estructura de páginas

### Home (`/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | imagen (h=900) | tag + H1 "WHERE DREAMS LIVE" (120px) + subtítulo + 2 CTAs |
| 3 | Services | #000 | Section-Header + grid 3×3 Card/Service-Text (9 servicios) |
| 4 | Marquee Large | — | "NUESTRO TRABAJO" |
| 5 | Portfolio | #000 | Section-Header + grid 3 cols Card/Portfolio |
| 6 | Marquee Small | — | Marcas (MasterChef, Loewe, Samsung, Estrella Damm...) |
| 7 | About Teaser | #111 | Section-Header + descripción + botón Outline |
| 8 | CTA | #000 | H2 "¿TIENES UN PROYECTO?" + botón Primary |
| 9 | Footer | — | ref Footer |

### Streaming — Template servicio estándar (`/servicios/streaming/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | imagen | Breadcrumbs + H1 + subtítulo + CTA |
| 3 | Marquee Large | — | nombre del servicio |
| 4 | Service Description | #000 | Section-Header + texto + imagen/vídeo |
| 5 | Features Grid | #111 | Section-Header + grid features |
| 6 | Pricing | #000 | Section-Header + 3x Card/Pricing (opcional) |
| 7 | Case Study | #111 | Imagen + título + descripción |
| 8 | Marquee Small | — | contexto (plataformas, etc.) |
| 9 | Equipment | #000 | Section-Header + Card/Product |
| 10 | CTA | #111 | H2 + botones |
| 11 | Footer | — | ref Footer |

**Secciones opcionales por servicio:** Pricing (solo Streaming y Redes), Case Study, Equipment, Marquees.

### Contenido Redes Sociales (`/servicios/contenido-redes-sociales/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | #000 | H1 grande + subtítulo (sin imagen) |
| 3 | Service Detail | #FFF | Texto + bullets + imagen lateral |
| 4 | Pricing | #000 | Section-Header + 3x Card/Pricing (400€/600€/1.200€) |
| 5 | Extras | #FFF | Section-Header + tablas Spec-Row (tarifas edición + extras) |
| 6 | CTA | #000 | H2 + botón |
| 7 | Footer | — | ref Footer |

### Alquiler — Landing (`/alquiler/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | imagen | H1 + descripción + breadcrumbs |
| 3 | Categories | #FFF | Section-Header + grid Card/Category |
| 4 | Featured Products | #F5F5F5 | Section-Header + grid Card/Product-Light |
| 5 | Quote Cart Preview | #000 | Carrito de presupuesto |
| 6 | CTA | #FFF | "¿NO ENCUENTRAS LO QUE BUSCAS?" |
| 7 | Footer | — | ref Footer |

### Alquiler — Categoría (`/alquiler/[categoria]/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | #111 | H1 categoría + descripción + breadcrumbs |
| 3 | Products Grid | #F5F5F5 | Grid Card/Product-Light |
| 4 | Quote Cart Preview | #000 | Carrito |
| 5 | CTA | #FFF | Contacto |
| 6 | Footer | — | ref Footer |

### Alquiler — Ficha Producto (`/alquiler/[categoria]/[producto]/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Breadcrumbs | #111 | Inicio > Alquiler > Cat > Producto |
| 3 | Product Detail | #F5F5F5 | Galería (izq) + Info: nombre, precio, specs (Spec-Row), botón |
| 4 | Related Products | #F5F5F5 | 3x Card/Product-Compact |
| 5 | Quote Cart Preview | #000 | Carrito con productos |
| 6 | CTA | #FFF | Contacto |
| 7 | Footer | — | ref Footer |

### Portfolio (`/portfolio/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | #000 | H1 "NUESTRO TRABAJO" + subtítulo |
| 3 | Filter + Grid | #FFF | Tabs filtro (Todos, Spots, Corporativo, Videoclips, Streaming, Eventos) + grid 3 cols + "CARGAR MÁS" |
| 4 | Footer | — | ref Footer |

### Nosotros (`/nosotros/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | #000 | H1 "CREAMOS HISTORIAS QUE IMPORTAN" + subtítulo |
| 3 | Story | #FFF | H2 + texto + imagen |
| 4 | Values | #000 | H2 + 3 columnas numeradas (01, 02, 03) |
| 5 | Team | #FFF | H2 + grid miembros (foto + nombre) |
| 6 | Clients | #000 | Logos marquee/grid |
| 7 | Footer | — | ref Footer |

### Contacto (`/contacto/`)

| # | Sección | Fondo | Componentes |
|---|---------|-------|------------|
| 1 | Header | — | ref Header |
| 2 | Hero | #000 | H1 "HABLEMOS DE TU PROYECTO" + subtítulo |
| 3 | Form + Info | #FFF | Formulario (izq) + datos contacto (der) |
| 4 | Map | #E8E8E8 | Google Maps embed |
| 5 | Footer | — | ref Footer |

---

## 4. Assets existentes a reutilizar

### Marca

| Asset | Ubicación | Estado |
|-------|-----------|--------|
| Logo SVG (blanco) | `src/assets/logo.svg` | Reutilizar, unificar (eliminar duplicado en public/) |
| Logo GIF (animado) | `public/logo.gif` (796KB) | Reutilizar, evaluar WebP/Lottie |
| Favicon ICO | `public/favicon.ico` (16KB) | Reutilizar tal cual (barra inclinada sobre negro) |
| Favicon SVG | `public/favicon.svg` | NO SE USA — no referenciado en layouts |

### Iconos UI

| Asset | Ubicación | Nota |
|-------|-----------|------|
| burger.svg | `src/assets/icons/` | Reutilizar (currentColor) |
| close.svg | `src/assets/icons/` | Reutilizar (cambiar stroke hardcoded a currentColor) |
| plus.svg | `src/assets/icons/` | Reutilizar (cursor custom) |

### Fotos producto (15 PNG, ~13MB total)

Todas en `public/images/product-*.png`. Reutilizar pasándolas por `<Image>` de Astro (WebP auto, srcset).

### Fotografías

| Asset | Tamaño | Uso |
|-------|--------|-----|
| hero.jpg | 64KB | Hero homepage |
| about-1/2/3.jpg | 52-64KB | Galería About |
| about-video.jpg | 824KB | Poster vídeo |
| contact.jpg | 1.3MB | Fondo contacto |
| video-2..8.jpg | 88-272KB | Thumbnails |
| where-dreams-live*.jpg | 64-72KB | CTA |

### Vídeo

| Asset | Tamaño | Acción |
|-------|--------|--------|
| about.mp4 | 20MB | Comprimir a <5MB o servir vía Vimeo/CDN |
