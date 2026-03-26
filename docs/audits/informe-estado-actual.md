# OBLIQ â€” Informe de Estado Actual de la Web
**Fecha:** 18 de febrero de 2026
**Dominio:** obliq.es / obliqproductions.com
**PropÃ³sito:** Documento base para planificar el rediseÃ±o y reestructuraciÃ³n

---

## 1. IDENTIDAD Y POSICIONAMIENTO ACTUAL

### QuÃ© es Obliq
Productora audiovisual con sede en Valencia. La web actual funciona como:
- **Portfolio de vÃ­deo** â€” Escaparate de trabajos organizados por proyecto/director
- **CatÃ¡logo de alquiler** â€” Equipos audiovisuales con precios por dÃ­a
- **Punto de contacto** â€” Formulario + datos directos (telÃ©fono, email)

### Datos de la empresa (desde /legal)
- **RazÃ³n social:** ACMG AGENCY S.L.
- **CIF:** B19377019
- **DirecciÃ³n:** C/ Pintor Navarro Llorens, bajo 3, 46008 Valencia
- **Email:** info@obliqproductions.com
- **TelÃ©fono:** 675 489 980

### Marca visual actual
- **TipografÃ­a:** Montserrat Variable (pesos 100-900)
- **Paleta:** Blanco y negro puros. Sin color de acento. Gris #CCCCCC como secundario
- **Logo:** 2 variantes â€” SVG (fondo claro) y GIF animado (fondo oscuro)
- **Estilo visual:** Minimalista, cinematogrÃ¡fico, todo mayÃºsculas + cursiva + negra en titulares
- **Animaciones:** Muy presentes â€” transiciones de pÃ¡gina, cursor custom, parallax, text reveal

---

## 2. ARQUITECTURA DE LA INFORMACION

### Mapa del sitio actual

```
obliq.es/
â”œâ”€â”€ / .......................... Home (portfolio de vÃ­deos)
â”œâ”€â”€ /about .................... Nosotros (misiÃ³n + directores + marcas)
â”œâ”€â”€ /rental ................... Alquiler de equipos (catÃ¡logo con precios)
â”œâ”€â”€ /contact .................. Contacto (formulario + datos)
â”œâ”€â”€ /legal .................... Aviso legal + Privacidad + Cookies
â”œâ”€â”€ /videos/[slug] ............ Detalle de vÃ­deo (player Vimeo)
â”œâ”€â”€ /videos/director/[name] ... VÃ­deos filtrados por director
â””â”€â”€ /404 ...................... PÃ¡gina de error
```

**VersiÃ³n espaÃ±ola:** Estructura idÃ©ntica bajo `/es/` (pÃ¡ginas duplicadas)

### Navegacion
- **Desktop:** MenÃº horizontal fijo â€” "Work" (izq) | Logo (centro) | About, Rental, Contact (der)
- **Mobile:** Hamburguesa â†’ panel lateral con los mismos enlaces
- **Sin submenÃºs, sin dropdowns, sin breadcrumbs**

### Flujos de usuario principales

| Flujo | Recorrido | Objetivo |
|-------|-----------|----------|
| Portfolio | Home â†’ Scroll vÃ­deos â†’ Click vÃ­deo â†’ Player Vimeo | Ver trabajos |
| Alquiler | Nav â†’ Rental â†’ Ver producto â†’ "Alquilar" â†’ Contact (con producto) | Solicitar presupuesto |
| Director | About â†’ Scroll directores â†’ Hover â†’ Click â†’ VÃ­deos del director | Descubrir director |
| Contacto directo | Nav â†’ Contact â†’ Rellenar formulario â†’ Enviar | Contactar |
| Newsletter | Footer (cualquier pÃ¡gina) â†’ Email â†’ Enviar | Suscribirse |

---

## 3. INVENTARIO DE CONTENIDO

### Home
| SecciÃ³n | Contenido | Observaciones |
|---------|-----------|---------------|
| Hero | VÃ­deo Vimeo a pantalla completa (autoplay, muted, loop) | Sin texto, sin H1, sin CTA visible |
| Marquee | "Our work" / "Portfolio" en scroll infinito | Separador visual |
| Grid de vÃ­deos | Thumbnails dinÃ¡micos (2 columnas desktop, 1 mobile) | Datos de Google Sheets + Vimeo API |
| CTA | "Next one can be yours..." â†’ enlace a /contact | Ãšnico call-to-action de la pÃ¡gina |

### About
| SecciÃ³n | Contenido | Observaciones |
|---------|-----------|---------------|
| Texto misiÃ³n | PÃ¡rrafo animado char-by-char | AnimaciÃ³n pesada (SplitText) |
| VÃ­deo corporativo | about.mp4 (20.8 MB, loop) | Zoom + mask en scroll. Archivo pesado |
| Grid de contenido | 3 imÃ¡genes + 2 bloques de texto alternados | Animaciones de skew/scale en scroll |
| Directores | Lista con thumbnail en hover | Datos de Google Sheets |
| Marcas | Marquee con 13 nombres de clientes | Sin logos, solo texto |
| CTA | "Brands that have already trusted us" â†’ /contact | |

### Rental
| SecciÃ³n | Contenido | Observaciones |
|---------|-----------|---------------|
| Hero | TÃ­tulo + imagen de fondo (50% opacidad) | Ãšnico con H1 real y meta description |
| DescripciÃ³n | Texto introductorio del servicio | Valencia, Alicante, CastellÃ³n |
| CatÃ¡logo | 15 productos con precio, specs, botÃ³n "Alquilar" | Datos estÃ¡ticos (JSON) |
| CTA | "Si necesitas otro material, escrÃ­benos" | |

**Productos actuales (15):**
- Sony FX6 (110 EUR/dÃ­a), Sony FE 16-35mm F2.8 (40 EUR), Sony FE 28-135mm F4 (25 EUR)
- DZOFilm Pictor 20-55mm (45 EUR), DZOFilm Vespid 50mm (45 EUR)
- Zhiyun Crane 3S Pro (65 EUR), Tilta cage (10 EUR)
- Manfrotto trÃ­pode (25 EUR), SmallRig Magic Arm (3 EUR)
- FEELWORLD monitor (17 EUR), Atomos Ninja Ultra (35 EUR)
- SmallRig baterÃ­a V-mount (15 EUR)
- Sennheiser AVX-MKE2 (35 EUR), Audio-Technica AT897 (20 EUR), Rode Wireless Pro (25 EUR)

### Contact
| SecciÃ³n | Contenido | Observaciones |
|---------|-----------|---------------|
| Hero | "From sunny valencia with love" | Heading poco descriptivo para SEO |
| Info | TelÃ©fono + Email (clickables) | |
| Formulario | Nombre, Email*, Empresa, Mensaje, Legal*, Newsletter opt-in | EnvÃ­a via Resend API |

### Legal
- Aviso legal, PolÃ­tica de privacidad, PolÃ­tica de cookies
- Texto completo en ambos idiomas
- Estructura correcta con H1 y H2s

### VÃ­deo detalle (/videos/[slug])
- Player Vimeo a pantalla completa
- Thumbnail inicial â†’ click para reproducir
- Panel inferior desplegable con tÃ­tulo, cliente, fecha
- BotÃ³n cerrar (history.back)
- **Sin header ni footer** â€” layout independiente (Video.astro)

---

## 4. INTERNACIONALIZACION (i18n)

### Estado actual
- **Idiomas:** InglÃ©s (default, sin prefijo) + EspaÃ±ol (/es/)
- **ImplementaciÃ³n:** PÃ¡ginas duplicadas + archivos JSON de traducciones
- **DetecciÃ³n:** Middleware lee `Accept-Language` del navegador
- **RedirecciÃ³n:** Solo en `/` â€” si el navegador es espaÃ±ol, redirige a `/es/` (302)

### Problemas
1. **Mantenimiento doble** â€” Cada cambio se hace en 2 archivos de pÃ¡gina
2. **Redirect 302** â€” DeberÃ­a ser 301 (permanente) para SEO
3. **Sin cookie de preferencia** â€” No recuerda la elecciÃ³n del usuario
4. **Sin hreflang** â€” Google no sabe que las versiones EN/ES son alternativas
5. **DetecciÃ³n naive** â€” Solo lee el primer idioma del header Accept-Language
6. **Contenido mixto** â€” Algunos textos en espaÃ±ol aparecen en pÃ¡ginas EN (ej: tÃ­tulo "Condiciones generales" en /legal EN)

### Traducciones disponibles (claves principales)
| Clave | EN | ES |
|-------|----|----|
| HOME.TITLE | Home | Principal |
| ABOUT.TITLE | About | Nosotros |
| RENTAL.TITLE | Audiovisual equipment and film gear rental in Valencia | Alquiler de equipos audiovisuales y material de cine en Valencia |
| CONTACT.TITLE | Let's talk! | Hablemos |
| CONTACT.HEADING | From sunny valencia with love | Con amor desde la soleada valencia |
| HOME.CTA | Next one can be yours... | El siguiente puedes ser tu... |

---

## 5. AUDITORIA SEO

### Resumen ejecutivo

| Aspecto | Estado | Puntuacion |
|---------|--------|------------|
| Titles | Solo /rental optimizado | 2/10 |
| Meta descriptions | Solo /rental tiene | 1/10 |
| H1 tags | Faltan en Home y About | 4/10 |
| Open Graph | Inexistente | 0/10 |
| Twitter Cards | Inexistente | 0/10 |
| Canonical URLs | Inexistente | 0/10 |
| Hreflang | Inexistente | 0/10 |
| Structured Data | Solo /rental (LocalBusiness) | 2/10 |
| Sitemap.xml | No existe | 0/10 |
| Robots.txt | No existe | 0/10 |
| GA4 | Implementado | 10/10 |
| Search Console | Verificado | 10/10 |

### Detalle pagina por pagina

| Pagina | Title | Meta Desc | H1 | Schema | OG |
|--------|-------|-----------|-----|--------|----|
| / | "Obliq \| Home" | NO | NO | NO | NO |
| /about | "Obliq \| About" | NO | NO | NO | NO |
| /rental | Optimizado con keywords | SI | SI | LocalBusiness | NO |
| /contact | "Obliq \| Let's talk!" | NO | SI (poco descriptivo) | NO | NO |
| /legal | "Obliq \| Condiciones generales" | NO | SI | NO | NO |
| /videos/[slug] | "Obliq \| {titulo}" | NO | NO | NO | NO |
| /videos/director/[name] | "Obliq \| {titulo}" | NO | NO | NO | NO |
| /es/* | Mismo patron que EN | Igual | Igual | Igual | Igual |

### Hallazgos criticos SEO
1. **Homepage sin H1 ni meta description** â€” La pagina mas importante no tiene senales SEO basicas
2. **Sin sitemap.xml** â€” Google no puede descubrir las paginas de video dinamicas
3. **Sin robots.txt** â€” Sin instrucciones para crawlers
4. **Sin hreflang** â€” Riesgo de contenido duplicado EN/ES sin senalizar
5. **Sin canonical** â€” URLs sin canonicalizar
6. **Sin Open Graph** â€” Compartir en redes muestra contenido generico
7. **Paginas de video sin SEO** â€” El layout Video.astro no soporta meta description
8. **Titles no optimizados** â€” "Obliq | Home", "Obliq | About" no aportan keywords
9. **/rental es la unica pagina bien optimizada** â€” Tiene title con keywords, meta description, H1 semantico y schema LocalBusiness

---

## 6. AUDITORIA TECNICA

### Stack tecnologico
| Componente | Tecnologia | Version |
|------------|------------|---------|
| Framework | Astro | 5.9.2 |
| Styling | Tailwind CSS | 4.1.8 |
| Animaciones | GSAP (ScrollTrigger, SplitText) | 3.13.0 |
| Email | Resend | 4.6.0 |
| Fuente | Montserrat Variable (@fontsource) | 5.2.6 |
| Deploy | Vercel (SSR) | adapter 9.0.3 |
| Datos | Google Sheets + Vimeo API v2 | - |

### Fuente de datos: Google Sheets + Vimeo

**Flujo actual:**
```
Cada request â†’ Fetch Google Sheets (200-800ms)
            â†’ Para cada video: Fetch Vimeo API (100-300ms, paralelo)
            â†’ Parsear datos â†’ Renderizar HTML
```

**Problemas:**
- **Sin cache** â€” Cada visita dispara fetch a Google Sheets + Vimeo
- **Vimeo API v2 deprecada** â€” Puede dejar de funcionar sin aviso
- **Latencia critica** â€” 500-800ms antes de que la pagina empiece a renderizar
- **Sin fallback** â€” Si Google Sheets cae, la web devuelve 500
- **N+1 en /api/videos/[slug]** â€” Descarga TODOS los videos para buscar uno

### Rendimiento

**JavaScript enviado al cliente:**
- GSAP core + ScrollTrigger + SplitText: ~60KB gzipped por pagina
- GSAP se incluye en CADA pagina por separado (sin deduplicacion)
- Sin `client:visible` ni `client:idle` â€” todo se carga eager
- Video about.mp4: 20.8 MB (sin lazy loading)

**Estimacion de metricas:**
- TTFB: 800ms - 1.2s (bloqueado por Google Sheets)
- LCP: 1.5 - 2.5s
- Bundle JS por pagina: ~60-80KB (paginas con animaciones)

### Seguridad

| Problema | Severidad | Ubicacion |
|----------|-----------|-----------|
| XSS en templates de email | CRITICA | /api/send.ts, /actions/index.ts |
| XSS en mensajes de error | ALTA | Contact.astro (innerHTML con datos del API) |
| Sin rate limiting en endpoints POST | MEDIA | /api/send, /api/newsletter |
| Sin validacion de formato email | MEDIA | /api/send.ts |
| Sin CSRF tokens | MEDIA | Endpoints POST |
| Email hardcoded en actions | BAJA | actions/index.ts ("albert.esc@gmail.com") |
| Dependencia obsoleta | BAJA | @tailwindcss/typography v0.5 (incompatible con TW4) |

### Accesibilidad

**Bien implementado:**
- ARIA labels en botones del menu, logo, play button
- Roles semanticos (banner, region, menu, menuitem)
- aria-required, aria-invalid, aria-describedby en formularios
- Texto sr-only para screen readers
- HTML semantico (header, footer, section, nav, article)
- Contraste alto en combinaciones principales (blanco/negro)

**Pendiente:**
- Gris #CCCCCC sobre negro â€” borderline WCAG AA
- Sin skip links visibles
- Cursor custom puede confundir a usuarios con necesidades especiales
- Animaciones pesadas sin `prefers-reduced-motion`

---

## 7. FORMULARIOS Y CONVERSIONES

### Formulario de contacto
- **Campos:** Nombre, Email (requerido), Empresa, Mensaje
- **Checkboxes:** Legal (requerido), Newsletter (opcional)
- **Producto:** Campo oculto, se rellena via query param `?product=X` desde /rental
- **Envio:** POST a /api/send â†’ email via Resend a info@obliqproductions.com
- **Feedback:** Mensaje verde (exito, 5s) o rojo (error)
- **Validacion:** Solo email requerido + checkbox legal. Sin validacion de formato

### Newsletter (Footer)
- **Campo:** Email unico
- **Envio:** POST a /api/newsletter â†’ email de confirmacion via Resend
- **Ubicacion:** Footer de todas las paginas (excepto paginas de video)
- **Feedback:** Mensaje exito/error, auto-hide 3s

### Flujo de conversion rental
1. Usuario ve producto en /rental
2. Click "Alquilar" â†’ redirige a /contact?product=Sony%20FX6
3. Formulario muestra "You are interested in: Sony FX6"
4. Usuario completa y envia
5. Email llega a info@obliqproductions.com con producto indicado

---

## 8. CONTENIDO TEXTUAL COMPLETO (para referencia en rediseno)

### Textos clave EN
- **Home CTA:** "Next one can be yours..."
- **About intro:** "We are an audiovisual production company formed by a versatile and experienced team. We specialize in creating original content for brands and agencies."
- **About directors intro:** "We work for the top directors on the market:"
- **About brands:** "Brands that have already trusted us"
- **Rental intro:** "Professional rental catalogue of cinema cameras, lighting and grip in the Valencian Community. Inspected gear, technical advice and logistics for your shoot in Valencia."
- **Contact heading:** "From sunny valencia with love"
- **Contact CTA:** "Let's talk!"
- **Newsletter:** "Subscribe to our newsletter"
- **Footer tagline:** "Where dreams live"

### Marcas/Clientes listados
MasterChef World, Geekom, Samsung, Womenalia, Nacavi, Espanola de la Montagna, Verdejo, Clandestina, Sarao, Amasable, OFFF Barcelona, Arroz Dacsa, Valencia CF

### Directores
Dinamicos desde Google Sheets (no hardcoded)

---

## 9. ASSETS Y RECURSOS

### Imagenes estaticas
- hero.jpg (62 KB) â€” Hero homepage
- about.mp4 (20.8 MB) â€” Video corporativo
- logo.svg (2 KB) â€” Logo fondo claro
- logo.gif (813 KB) â€” Logo animado fondo oscuro
- favicon.ico + favicon.svg
- ~25 imagenes de productos (PNG)
- ~6 imagenes de about/campana (JPG)
- Thumbnails de video: dinamicos desde Vimeo API

### Observaciones sobre assets
- **about.mp4 (20.8 MB)** â€” Muy pesado para web, deberia comprimirse o servirse via CDN/Vimeo
- **logo.gif (813 KB)** â€” Excesivo para un logo, considerar WebP animado o Lottie
- **Sin <Image> de Astro** â€” Todas las imagenes usan `<img>` nativo, sin optimizacion automatica
- **Sin srcset/sizes** â€” No hay imagenes responsive
- **Sin lazy loading nativo** â€” Las imagenes cargan todas al inicio

---

## 10. DEPLOY E INFRAESTRUCTURA

- **Hosting:** Vercel (auto-deploy on push to main)
- **Modo:** SSR (output: 'server')
- **Dominio:** obliq.es / obliqproductions.com
- **Analytics:** GA4 (G-896V9YZVME)
- **Search Console:** Verificado
- **Git:** 20 commits en main, ultimo: GA4 + Search Console
- **CI/CD:** Sin tests, sin linting, sin pre-commit hooks

---

## 11. RESUMEN DE FORTALEZAS Y DEBILIDADES

### Fortalezas
- Estetica visual fuerte y coherente (B&W cinematografico)
- Animaciones sofisticadas que transmiten calidad
- Stack moderno (Astro 5, Tailwind 4)
- Rental page bien optimizada para SEO local
- Formularios funcionales con feedback al usuario
- Accesibilidad base implementada (ARIA, semantica)
- i18n funcional (EN/ES)
- Deploy automatico en Vercel

### Debilidades criticas
- **SEO casi inexistente** fuera de /rental (sin titles, descriptions, OG, sitemap, robots)
- **Sin cache de datos** â€” Cada visita = fetch a Google Sheets + Vimeo
- **Vulnerabilidades XSS** en formularios de email
- **Performance comprometido** por GSAP pesado + about.mp4 (20.8MB) + logo.gif (813KB)
- **Fuente de datos fragil** â€” Google Sheets como "CMS" sin fallback
- **Vimeo API v2 deprecada** â€” Riesgo de rotura sin aviso
- **Duplicacion de codigo i18n** â€” Cada pagina existe 2 veces
- **Sin sitemap ni robots.txt** â€” Google no descubre paginas dinamicas
- **Sin Open Graph** â€” Compartir en redes no muestra preview util

### Oportunidades para el rediseno
1. Implementar SEO completo (titles, descriptions, OG, hreflang, sitemap, schema)
2. Migrar datos a CMS real o al menos anadir capa de cache
3. Optimizar assets (comprimir video, responsive images, lazy loading)
4. Unificar i18n para evitar duplicacion de paginas
5. Anadir paginas/secciones nuevas segun necesidades del cliente
6. Mejorar conversion con CTAs mas claros y landing pages especificas
7. Implementar prefers-reduced-motion para accesibilidad
8. Considerar prerender para paginas estaticas (mejor TTFB)

---

*Este documento es el punto de partida para el rediseno. Combinarlo con: necesidades del cliente, analisis de competidores y keyword research para definir la nueva arquitectura.*
