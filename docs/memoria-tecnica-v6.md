# MEMORIA TÉCNICA — Rediseño y reestructuración web

**OBLIQ PRODUCTIONS** · obliqproductions.com
Preparado por Grupo Antena · Febrero 2026

---

## 1. Resumen ejecutivo

Obliq Productions es una productora audiovisual multidisciplinar con sede en Valencia que necesita una web a la altura de la calidad de sus trabajos. La web actual, aunque construida con tecnología moderna (Astro + Tailwind), presenta carencias estructurales graves: SEO prácticamente inexistente, servicios invisibles para Google y para los usuarios, y una arquitectura que no refleja todo lo que Obliq puede ofrecer.

Este documento propone un rediseño integral que transforma la web de un simple portfolio de vídeos en una plataforma comercial completa, con páginas de servicio dedicadas, un catálogo de alquiler potenciado, un sistema de packs y tarifas para servicios productizados, y una estrategia SEO que permita competir con las productoras audiovisuales de referencia en la Comunitat Valenciana.

El sistema de gestión de contenidos se basará en WordPress headless, lo que permitirá al equipo de Obliq gestionar de forma autónoma las páginas de servicios, el catálogo de alquiler, los packs comerciales y el portfolio de proyectos, sin necesidad de tocar código ni depender de un desarrollador para cada actualización.

**El objetivo es claro:** que cuando alguien busque "productora audiovisual Valencia", "streaming eventos Valencia", "alquiler equipo audiovisual Valencia" o "contenido para redes sociales Valencia", Obliq aparezca en los primeros resultados y la web convierta visitas en solicitudes de presupuesto o contratación directa de packs.

---

## 2. Análisis del estado actual

### 2.1 Qué funciona bien

- Estética visual fuerte y coherente: blanco y negro cinematográfico, animaciones sofisticadas con GSAP, aspecto profesional
- Stack tecnológico moderno: Astro 5 + Tailwind 4, rendimiento superior al WordPress que usan la mayoría de competidores
- Portfolio con 24 proyectos y 14 directores organizados por nombre
- Catálogo de alquiler funcional con 15 productos, precios transparentes y flujo de solicitud integrado con el formulario de contacto
- Bilingüismo implementado (EN/ES) con estructura de traducciones
- Accesibilidad base correcta: ARIA labels, semántica HTML, contraste alto
- Analytics GA4 y Search Console verificados

### 2.2 Qué necesita mejorar

**SEO: la carencia más crítica**

De las 4 secciones principales, solo /rental tiene titles optimizados, meta description, H1 semántico y datos estructurados. La homepage no tiene H1 ni meta description. No existe sitemap.xml, robots.txt, etiquetas hreflang, canonical URLs ni Open Graph. Google no puede descubrir las páginas dinámicas de vídeo ni diferenciar las versiones en español e inglés.

**Servicios invisibles**

Obliq ofrece retransmisiones en streaming, rodajes, edición, cobertura de eventos, contenido para redes sociales y alquiler de equipos, pero la web actual no tiene ni una sola página de servicio. Los competidores mejor posicionados tienen entre 8 y 17 subpáginas de servicios optimizadas individualmente.

**Problemas técnicos**

- Sin caché de datos: cada visita dispara fetch a Google Sheets + Vimeo API (500-800ms de latencia)
- Vimeo API v2 deprecada: puede dejar de funcionar sin previo aviso
- Vulnerabilidades XSS en templates de email y mensajes de error
- GSAP (~60KB) se carga en cada página sin deduplicación
- Vídeo corporativo de 20.8 MB sin compresión ni lazy loading
- Logo animado GIF de 813 KB (excesivo para web)

**Idioma por defecto incorrecto**

La web actual usa inglés como idioma por defecto (sin prefijo) y español bajo /es/. Dado que Obliq es una empresa valenciana, su mercado principal es España y sus keywords objetivo son en español, esta configuración penaliza el SEO local. Google da más peso a las URLs sin prefijo.

---

## 3. Análisis de la competencia

Se han analizado 9 productoras audiovisuales y 5 rental houses que compiten en la Comunitat Valenciana.

### 3.1 Competidores como productora audiovisual

| Competidor | Servicios | Streaming | Rental | Blog | SEO |
|---|---|---|---|---|---|
| Caudiovisual | 7 (podcast, gastronomía) | No | No | No | ★★★★ |
| Producciones GDP | 14+ (DCP, e-learning) | Sí (flagship) | No | Sí (activo) | ★★★★★ |
| InGame Producciones | 6 (deportes) | Sí (flagship) | No | No | ★★★ |
| Quatre Films | 8 (educación, cine) | Sí | Sí (plató) | Sí | ★★★★ |
| Savinelli Films | 12 (cine, subtitulado) | Sí | No | Sí (activo) | ★★★★★ |
| Storytellers | ~8 (aftermovies) | No explícito | No | No | ★ |
| Streaming Valencia | 1 (solo streaming) | Sí (único) | No | No | ★★ |
| Oroneta Audiovisuals | 17+ (foto, web) | Sí | No | No | ★★★★ |
| L'Andana Audiovisual | 6 (vídeo interactivo) | Sí (medicina) | Sí (activo) | Sí (activo) | ★★★★ |

### 3.2 Competidores en alquiler de equipo audiovisual

Se han analizado los 5 principales rental houses con presencia digital en Valencia. El hallazgo principal es que el mercado está sorprendentemente poco profesionalizado digitalmente: ninguno combina una ejecución técnica impecable con buena estrategia SEO y funcionalidades de conversión completas.

| Competidor | Precios | Carrito | Fichas producto | Catálogo aprox. | SEO |
|---|---|---|---|---|---|
| Visual Rent | Sí (€/24h) | Sí + fechas | Sí (~100+) | 80-150 productos | ★★★ |
| Polo Rental | Sí (€/día) | No (email) | Sí (~100-130) | 100-130 productos | ★★★★★ |
| Video-Rent | No (consulta) | No | Sí (~150-200) | 150-200 productos | ★★ |
| Miracor Films | Sí (€/jornada) | No (formulario) | Sí (~100-120) | 100-120 productos | ★★★ |
| DHC Rental | Sí (€/jornada) | Sí (WooCommerce) | Sí (~200+) | 200+ productos | ★★ |
| Obliq (actual) | Sí (€/día) | No | No | 15 productos | ★ |

**Debilidades detectadas en los competidores:**
- Visual Rent: errores PHP visibles, contenido duplicado de Madrid, titles keyword-stuffed
- Polo Rental: mejor SEO del mercado pero sin reservas online ni carrito funcional
- Video-Rent: catálogo más amplio pero precios ocultos y flujo solo por teléfono/email
- Miracor Films: buenas fichas de producto pero Squarespace limita funcionalidades, meta descriptions duplicadas en todas las páginas
- DHC Rental: migración de dominio reciente (dhcfilms.com → dhcrental.com) destruyó su SEO con redirecciones 301 mal configuradas

### 3.3 Conclusiones del análisis competitivo global

- Ningún competidor combina streaming + rental con catálogo online + portfolio de directores + bilingüismo + packs productizados. Esta combinación es la propuesta de valor única de Obliq.
- Obliq es el único con precios públicos transparentes en un modelo híbrido productora + rental. Los rental houses especializados tienen catálogos más amplios pero ninguno integra el portfolio de producción como social proof.
- "Streaming Valencia" tiene baja competencia cualificada. Es la mayor oportunidad SEO para servicios.
- Ningún competidor de alquiler utiliza datos estructurados Schema.org Product correctamente. Ser el primero en mostrar rich snippets con precios en Google es una ventaja de primer movedor.
- Ningún competidor tiene reseñas reales en fichas de alquiler. Integrar social proof es una oportunidad de diferenciación inmediata.
- Ningún competidor de alquiler ofrece packs de contenido para redes sociales con precios públicos. Es un nicho sin explotar en el mercado local.
- 4 de 9 productoras tienen blog activo. Los que lo tienen se posicionan mejor. Línea recomendable a futuro.

---

## 4. Propuesta de arquitectura

### 4.1 Estrategia de idiomas

Se invierte completamente la lógica de idiomas para priorizar el SEO local en español:

| Elemento | Web actual | Nueva web |
|---|---|---|
| Idioma por defecto | Inglés (sin prefijo) | Español (sin prefijo) |
| Idioma secundario | Español bajo /es/ | Inglés bajo /en/ |
| URL homepage ES | obliqproductions.com/es/ | obliqproductions.com/ |
| URL homepage EN | obliqproductions.com/ | obliqproductions.com/en/ |
| URLs en español | /es/rental/, /es/contact/ | /alquiler/, /contacto/ (sin prefijo) |
| URLs en inglés | /rental/, /contact/ | /en/rental/, /en/contact/ |
| Hreflang | No implementado | Bidireccional ES/EN en todas las páginas |
| Language switcher | No visible | Visible en header |
| Cookie preferencia | No | Sí, recuerda elección del usuario |
| Detección automática | Solo / con 302 | Solo primera visita a /, con 301 |

Se implementarán redirecciones 301 permanentes para todas las URLs existentes que cambian, tanto las de inglés (de raíz a /en/) como las de español (de /es/ a raíz con slugs en español). Esto incluye las páginas de alquiler: /rental/ → /en/rental/ y /es/rental/ → /alquiler/.

### 4.2 Navegación principal

La nueva web tendrá 5 secciones principales en la navegación (frente a las 4 actuales):

| Sección | URL | Función |
|---|---|---|
| Inicio | / | Landing principal con showreel, servicios, proyectos destacados, logos clientes |
| Servicios | /servicios/ | 9 subpáginas de servicios con SEO individual |
| Portfolio | /portfolio/ | Grid filtrable por categoría y director, con case studies |
| Alquiler | /alquiler/ | Catálogo expandido con fichas de producto, categorías y precios |
| Contacto | /contacto/ | Formulario completo, WhatsApp, mapa, teléfono y email |

Páginas secundarias (fuera de la navegación principal): About/Nosotros (equipo interno, historia, valores), Legal (aviso legal, privacidad, cookies) y página 404 personalizada.

### 4.3 Mapa del sitio completo

Todas las páginas marcadas como "gestionable" se administran desde WordPress:

| URL | Sección | Gestionable WP |
|---|---|---|
| / | Inicio | Parcial |
| /servicios/ | Servicios (landing) | Sí |
| /servicios/streaming/ | Streaming y retransmisiones | Sí |
| /servicios/produccion-audiovisual/ | Producción audiovisual | Sí |
| /servicios/video-corporativo/ | Vídeo corporativo | Sí |
| /servicios/spots-publicitarios/ | Spots publicitarios | Sí |
| /servicios/videoclips/ | Videoclips musicales | Sí |
| /servicios/postproduccion/ | Postproducción y edición | Sí |
| /servicios/eventos/ | Cobertura de eventos | Sí |
| /servicios/contenido-redes-sociales/ | Contenido para redes sociales | Sí |
| /servicios/alquiler/ | Alquiler (servicio) | Sí |
| /portfolio/ | Portfolio (landing) | Sí |
| /portfolio/[slug]/ | Proyecto detalle / Case study | Sí |
| /portfolio/director/[nombre]/ | Página de director | Sí |
| /alquiler/ | Catálogo de alquiler (landing) | Sí |
| /alquiler/[categoria]/ | Categoría de productos | Sí |
| /alquiler/[categoria]/[producto]/ | Ficha individual de producto | Sí |
| /contacto/ | Contacto | No (formulario fijo) |
| /nosotros/ | About / Equipo | Sí |
| /legal/ | Aviso legal, privacidad, cookies | No |

Todas las URLs tendrán su equivalente en inglés bajo /en/ (ejemplo: /en/services/streaming/). Se implementará hreflang bidireccional en todas las páginas.

---

## 5. Detalle de servicios

Cada servicio tendrá una subpágina propia optimizada para SEO. Todas seguirán un template reutilizable con: descripción del servicio, vídeo ejemplo del portfolio, proyectos relacionados, equipamiento destacado y CTA específico. Las páginas con packs comerciales incluirán además un módulo de pricing con tarjetas comparativas. El contenido de cada página será editable desde WordPress.

| # | Servicio | URL | Keyword objetivo |
|---|---|---|---|
| 1 | Streaming y retransmisiones | /servicios/streaming/ | streaming eventos Valencia |
| 2 | Producción audiovisual | /servicios/produccion-audiovisual/ | productora audiovisual Valencia |
| 3 | Vídeo corporativo | /servicios/video-corporativo/ | vídeos corporativos Valencia |
| 4 | Spots publicitarios | /servicios/spots-publicitarios/ | spot publicitario Valencia |
| 5 | Videoclips musicales | /servicios/videoclips/ | videoclip Valencia |
| 6 | Postproducción y edición | /servicios/postproduccion/ | edición vídeo Valencia |
| 7 | Cobertura de eventos | /servicios/eventos/ | cobertura eventos Valencia |
| 8 | Contenido para redes sociales | /servicios/contenido-redes-sociales/ | contenido redes sociales Valencia |
| 9 | Alquiler de equipos | /servicios/alquiler/ | alquiler equipo audiovisual Valencia |

### 5.1 Streaming y retransmisiones (servicio estrella)

El cliente identifica el streaming como su especialidad y diferenciador principal. En el análisis competitivo, la keyword "streaming Valencia" tiene baja competencia cualificada. Esta página debe ser la más completa y mejor optimizada de toda la web.

Contenido propuesto: descripción detallada del servicio (plataformas soportadas: YouTube, Twitch, Instagram, plataformas privadas), grafismos y rótulos para ponentes, control de pantallas LED y proyectores, vídeo explicativo del servicio, case study de MasterChef World, galería de eventos retransmitidos, especificaciones técnicas del equipamiento de streaming, y formulario de presupuesto específico.

**Tarifas de retransmisión:**

| Plan | Incluye | Precio |
|---|---|---|
| Básica | 1 realizador, 2 cámaras fijas, material FX6. Media jornada a jornada completa | 1.000 € |
| Media | 1 realizador, 2 cámaras fijas, 1 operador de cámara | 1.500 € |
| A medida | Contactar con el equipo de producción para proyectos complejos | Presupuesto personalizado |

### 5.2 Producción audiovisual

Rodajes multicámara con equipamiento de cine. Desde pequeños anunciantes hasta campañas nacionales. Se centra exclusivamente en producciones profesionales de medio y alto presupuesto, diferenciándose del servicio de contenido para redes sociales. Contenido: showreel 2025, equipamiento propio, directores disponibles, galería de fotos en rodaje, proceso de trabajo.

### 5.3 Vídeo corporativo

Vídeos para marca, comunicación interna, presentaciones. Keyword con mayor volumen de búsqueda después de "productora audiovisual Valencia". Contenido: ejemplos del portfolio, proceso de trabajo, testimonios de clientes.

### 5.4 Spots publicitarios

Producción de spots para campañas publicitarias. Contenido: selección de spots del portfolio, casos de éxito, proceso creativo desde briefing hasta entrega final.

### 5.5 Videoclips musicales

Una de las categorías más fuertes del portfolio actual, con múltiples directores especializados (Shake it!, Colectivo Toque, Santi Gómez). Contenido: selección de videoclips, directores destacados con enlace a sus perfiles, proceso de producción.

### 5.6 Postproducción y edición

Edición, etalonaje, subtitulado de proyectos audiovisuales completos. Enfocada en postproducción profesional (spots, corporativos, largometrajes), diferenciándose de la edición rápida para redes sociales. Contenido: vídeo del proceso, antes/después, herramientas utilizadas, tiempos de entrega.

### 5.7 Cobertura de eventos

Bodas, galas de premios, presentaciones, networking. Cobertura completa: vídeo, foto, redes sociales, presentadores. Contenido: aftermovie Premios Yummy como caso destacado, galería de eventos, paquetes de servicios.

### 5.8 Contenido para redes sociales (servicio nuevo)

Servicio integral de creación de contenido audiovisual para redes sociales corporativas. Incluye todo el ciclo de producción —guión, grabación y postproducción— empaquetado en formatos recurrentes diseñados para marcas que necesitan contenido constante y profesional para sus canales digitales.

Este servicio responde a una demanda creciente del mercado que ningún competidor analizado cubre con una página específica.

**Packs de producción para redes:**

| | Starter Pack | Medium Pack | Expert Pack |
|---|---|---|---|
| Equipo | 1 Filmmaker | 1 Filmmaker | 1 Filmmaker + 1 Fotógrafo |
| Grabación | 1 día (4h) | 1 día (8h) | 1 grabación 8h + 1 grabación 4h |
| Reels/Shorts | 5 reels mensuales | 10 reels mensuales | 15 reels mensuales |
| Vídeo resumen | No incluido | No incluido | 1 vídeo resumen |
| Fotos editadas | No incluido | No incluido | 100 fotos editadas |
| Precio | **400 €/mes** | **600 €/mes** | **1.200 €/mes** |

**Servicios extra:**

| Servicio | Detalle | Precio |
|---|---|---|
| Guionización | Guionización de 5 reels | 100 € |
| Filmmaker media jornada | 1 filmmaker, media jornada adicional | 200 € |
| Filmmaker jornada completa | 1 filmmaker, jornada completa adicional | 250 € |

**Tarifas de edición para redes sociales:**

| Tipo de pieza | Duración | Precio |
|---|---|---|
| Reel / Short | Hasta 40 segundos | 40 € |
| Vídeo largo (YouTube) | Hasta 10 minutos | 200 € |
| Vídeo resumen | 60-120 segundos | 150 € |

Flujo de conversión: cada tarjeta de pack incluye botón "Estoy interesado" → formulario de contacto con pack pre-rellenado (?servicio=contenido-redes&pack=Expert).

Contenido adicional de la página: ejemplos de reels producidos, proceso de trabajo, plataformas cubiertas (Instagram, TikTok, YouTube Shorts, LinkedIn), FAQ. Packs gestionables desde WordPress.

### 5.9 Alquiler de equipos

Página de servicio que describe la propuesta de alquiler y enlaza al catálogo completo en /alquiler/. Destaca la inspección del equipo, asesoramiento técnico y logística para rodajes en Valencia, Alicante y Castellón.

---

## 6. Alquiler de equipos

El catálogo de alquiler es uno de los principales diferenciadores de Obliq. El análisis de los 5 rental houses con presencia digital en Valencia (Visual Rent, Polo Rental, Video-Rent, Miracor Films y DHC Rental) revela un mercado sorprendentemente poco profesionalizado digitalmente, con oportunidades claras para quien ejecute correctamente la estrategia digital.

### 6.1 Posición competitiva actual

Obliq no existe en Google para búsquedas de alquiler audiovisual en Valencia. La sección actual /rental/ está íntegramente en inglés, contiene los 15 productos en scroll infinito sin URLs individuales, y no tiene fichas de producto indexables. Los competidores cuentan con catálogos de 100-200+ productos con fichas individuales optimizadas para SEO.

Sin embargo, Obliq tiene ventajas competitivas reales que ningún rental house especializado puede replicar:

- Precios públicos transparentes en un mercado donde Video-Rent aún opera bajo consulta
- Identidad de productora + rental: "No solo alquilamos el equipo, lo usamos cada día en nuestras producciones". Miracor Films intenta este posicionamiento pero sin aprovechar su portfolio
- Stack tecnológico superior: Astro genera páginas estáticas ultrarrápidas frente al WordPress/WooCommerce de Visual Rent (con errores PHP) o el Squarespace limitado de Miracor Films
- Ningún competidor usa Schema.org Product correctamente: ser el primero en mostrar rich snippets con precios en Google es una ventaja de primer movedor

### 6.2 Arquitectura de URLs del catálogo

La estructura de URLs es el factor más determinante para el posicionamiento en Google. Estructura de 3 niveles:

| Nivel | Estructura URL | Ejemplo | Keyword objetivo |
|---|---|---|---|
| Landing general | /alquiler/ | /alquiler/ | alquiler equipo audiovisual Valencia |
| Categoría | /alquiler/[categoría]/ | /alquiler/camaras/ | alquiler cámaras cine Valencia |
| Ficha producto | /alquiler/[categoría]/[producto]/ | /alquiler/camaras/sony-fx6/ | alquiler Sony FX6 Valencia |

Categorías propuestas (mínimo 6, ampliables desde WordPress):

- /alquiler/camaras/ — Cámaras de cine y vídeo
- /alquiler/opticas/ — Ópticas de cine y fotografía
- /alquiler/soporte/ — Trípodes, gimbals, grip
- /alquiler/monitores/ — Monitores de campo y grabadores
- /alquiler/audio/ — Micrófonos e inalámbricos
- /alquiler/accesorios/ — Baterías, jaulas, brazos articulados

Cada categoría tendrá su propia landing page con contenido introductorio optimizado para SEO (300-500 palabras), listado de productos y breadcrumbs navegables (Inicio > Alquiler > Cámaras > Sony FX6).

### 6.3 Fichas de producto individuales

Cada producto tendrá una página propia con URL indexable. Cada ficha incluirá:

- Fotografías de calidad del producto
- Especificaciones técnicas completas y verificadas
- Precio por día visible con indicación "+ IVA"
- Tabla de descuentos por múltiples días (1 día = precio base, 2-3 días = -10%, semana = -25%)
- Contexto de uso: en qué tipo de producciones se utiliza, enlace a proyectos del portfolio que han usado ese equipo
- Formulario de solicitud integrado en la ficha (sin redirigir a /contacto/)
- Botón de WhatsApp con mensaje pre-rellenado incluyendo nombre del producto
- Productos relacionados / sugerencia de pack
- Schema.org Product con name, description, offers (price, priceCurrency, availability), brand e image

Meta title recomendado: `Alquiler Sony FX6 en Valencia - 110€/día | Obliq Productions`

Nota: incluir el precio en el meta title es un diferenciador que ningún competidor aprovecha actualmente.

### 6.4 Página pilar /alquiler/

La landing general /alquiler/ será una página pilar con contenido SEO de 1.500+ palabras que cubra:

- Qué equipos se alquilan y para qué tipo de producciones
- Cómo funciona el proceso de alquiler (solicitud, recogida, devolución)
- Ventajas de alquilar en Obliq: productora que entiende las necesidades de rodaje
- Zona de servicio: Valencia, Alicante, Castellón
- FAQ con preguntas frecuentes
- Enlaces a todas las categorías de productos
- Logos de producciones que han usado el equipo (social proof)

### 6.5 Funcionalidades de conversión

- **Carrito de presupuesto:** sistema donde el usuario añade productos a una "lista de alquiler" y envía la solicitud como presupuesto. No necesita ser un e-commerce completo. Solo Visual Rent y DHC Rental ofrecen algo similar.
- **Formulario específico de alquiler:** campos adaptados (fechas de rodaje, lista de equipos pre-seleccionable, tipo de proyecto, ubicación). Ningún competidor tiene un formulario específico.
- **WhatsApp integrado en fichas:** solo Visual Rent lo ofrece actualmente. Botón con mensaje pre-rellenado con nombre del producto.
- **Social proof:** testimonios de clientes de alquiler y vínculos con producciones reales del portfolio. Ningún competidor tiene reseñas reales en sus fichas.
- **Breadcrumbs navegables:** mejoran UX y SEO. Polo Rental y DHC Rental los usan; Visual Rent y Miracor Films no.

### 6.6 Productos actuales y expansión

| Categoría | Producto | Precio/día |
|---|---|---|
| Cámara | Sony FX6 | 110 € |
| Óptica | Sony FE 16-35mm F2.8 GM | 40 € |
| Óptica | Sony FE 28-135mm F4 G | 25 € |
| Óptica | DZOFilm Pictor 20-55mm T2.8 | 45 € |
| Óptica | DZOFilm Vespid 50mm T2.1 | 45 € |
| Soporte | Zhiyun Crane 3S Pro | 65 € |
| Soporte | Tilta Cage | 10 € |
| Soporte | Manfrotto trípode | 25 € |
| Soporte | SmallRig Magic Arm | 3 € |
| Monitor | FEELWORLD monitor | 17 € |
| Monitor | Atomos Ninja Ultra | 35 € |
| Alimentación | SmallRig batería V-mount | 15 € |
| Audio | Sennheiser AVX-MKE2 | 35 € |
| Audio | Audio-Technica AT897 | 20 € |
| Audio | Rode Wireless Pro | 25 € |

**Packs temáticos recomendados** (precios cerrados que simplifican la decisión y aumentan ticket medio):

- Pack Documental: FX6 + zoom + trípode + micro + monitor = X€/día
- Pack Corporativo: FX6 + gimbal + micro wireless = X€/día
- Pack Videoclip: FX6 + óptica cine + gimbal + monitor = X€/día

**Expansión recomendada:** priorizar iluminación LED (Aputure, Godox) y grip (C-stands, banderas, reflectores) como categorías de mayor impacto. También equipamiento de streaming (switchers, encoders) para reforzar la especialidad.

---

## 7. Portfolio y directores

### 7.1 Evolución del portfolio

El portfolio actual es un grid plano de vídeos sin contexto. La nueva versión añade filtros, categorías y case studies. Todo gestionable desde WordPress:

- Grid filtrable por categoría (videoclip, corporativo, evento, streaming, spot, redes sociales) y por director
- Cada proyecto con página propia: vídeo embebido, cliente, director, categoría, fecha y párrafo de contexto
- Proyectos destacados en la home (selección editorial)
- Enlace bidireccional entre proyectos y páginas de servicio relacionadas
- Enlace bidireccional entre proyectos y productos de alquiler: "Este proyecto se rodó con Sony FX6 + DZOFilm Pictor" → enlace a fichas de producto

### 7.2 Directores

Los directores se trasladan de la página About al Portfolio, ya que son colaboradores creativos, no equipo interno. Cada director tendrá página individual con bio, foto, listado de trabajos y URL propia (/portfolio/director/[nombre]/). La página About/Nosotros queda reservada para el equipo interno de Obliq.

---

## 8. Blog: recomendación para fase posterior

Un blog técnico es una herramienta SEO potente que 4 de 9 competidores productoras y 2 de 5 rental houses (Polo Rental y Visual Rent) ya utilizan. Sin embargo, incluirlo en el alcance inicial no es recomendable por riesgo de canibalización con las páginas de servicio y la necesidad de contenido constante.

**Recomendación:** activar el blog 3-6 meses tras el lanzamiento, atacando keywords long-tail informacionales. Ejemplos: "qué cámara usar para streaming", "Sony FX6 para documentales: nuestra experiencia", "guía de alquiler de equipo audiovisual en Valencia". La arquitectura de WordPress headless lo permite sin modificaciones estructurales.

---

## 9. Estrategia SEO

### 9.1 SEO técnico

| Elemento | Estado actual | Nueva web |
|---|---|---|
| Meta titles | Genéricos ("Obliq \| Home") | Optimizados con keyword + marca por página |
| Meta descriptions | Solo /rental | Únicos para cada página |
| H1 semántico | Falta en Home y About | Presente en todas las páginas |
| Open Graph | Inexistente | Completo (título, descripción, imagen por página) |
| Twitter Cards | Inexistente | Implementado |
| Canonical URLs | Inexistente | En todas las páginas |
| Hreflang | Inexistente | Bidireccional ES/EN |
| Schema.org | Solo LocalBusiness en /rental | LocalBusiness, VideoObject, Product, Service, Offer, BreadcrumbList |
| Sitemap.xml | No existe | Generado automáticamente (vídeos, productos, categorías) |
| Robots.txt | No existe | Configurado correctamente |
| Imágenes | Sin alt, sin lazy, sin srcset | Alt text, lazy loading, WebP, srcset responsive |

### 9.2 Títulos propuestos por página

| Página | Title propuesto (ES) |
|---|---|
| Inicio | Obliq Productions \| Productora audiovisual en Valencia |
| Streaming | Streaming de eventos en Valencia \| Retransmisiones en directo \| Obliq |
| Producción | Producción audiovisual en Valencia \| Rodajes profesionales \| Obliq |
| Vídeo corporativo | Vídeos corporativos en Valencia \| Obliq Productions |
| Spots | Spots publicitarios en Valencia \| Obliq Productions |
| Videoclips | Videoclips musicales en Valencia \| Obliq Productions |
| Postproducción | Edición y postproducción de vídeo en Valencia \| Obliq |
| Eventos | Cobertura audiovisual de eventos en Valencia \| Obliq |
| Contenido redes | Contenido audiovisual para redes sociales en Valencia \| Reels y vídeos \| Obliq |
| Alquiler (landing) | Alquiler de equipo audiovisual en Valencia \| Cámaras, ópticas, audio \| Obliq |
| Alquiler (categoría) | Alquiler de [categoría] en Valencia \| Obliq Productions |
| Alquiler (producto) | Alquiler [Producto] en Valencia - [Precio]€/día \| Obliq Productions |
| Portfolio | Nuestros trabajos \| Portfolio audiovisual \| Obliq Productions |
| Contacto | Contacto \| Productora audiovisual en Valencia \| Obliq |

### 9.3 Datos estructurados (Schema.org)

- **LocalBusiness:** datos de empresa, horario, ubicación, teléfono, área de servicio, horarios de recogida/devolución de equipos
- **VideoObject:** cada vídeo del portfolio con título, descripción, thumbnail, duración, fecha
- **Product:** cada producto del catálogo de alquiler con nombre, precio, disponibilidad, marca, imagen
- **Service:** cada servicio con descripción, área geográfica, proveedor
- **Offer:** packs de contenido para redes y tarifas de streaming con precio, descripción y disponibilidad
- **BreadcrumbList:** navegación jerárquica en todas las páginas, especialmente en el catálogo de alquiler

---

## 10. Funcionalidades clave

### 10.1 Formulario de contacto mejorado

- Selector de servicio (dropdown: streaming, producción, edición, evento, contenido redes, alquiler, otro)
- Campos: nombre, email, teléfono, empresa, servicio, mensaje, legal, newsletter
- Pre-relleno desde páginas de producto y desde packs de servicio
- Validación, protección anti-spam (rate limiting, CSRF), sanitización de inputs

### 10.2 Formulario específico de alquiler

Separado del formulario genérico de contacto. Campos adaptados: nombre, email, teléfono, fechas de rodaje, lista de equipos (pre-seleccionable desde carrito), tipo de proyecto, ubicación del rodaje, observaciones. Ningún competidor de alquiler tiene un formulario específico.

### 10.3 Carrito de presupuesto (alquiler)

Sistema ligero donde el usuario añade productos a una "lista de alquiler", selecciona fechas y envía como solicitud de presupuesto. No es un e-commerce completo: la confirmación y el cobro se gestionan fuera de la web. Solo Visual Rent y DHC Rental ofrecen algo similar en el mercado valenciano.

### 10.4 Módulo de pricing / packs

Componente reutilizable de tarjetas de pricing para páginas de servicio (streaming, contenido redes). Tarjetas comparativas en columnas, opción de destacar pack recomendado, botón CTA que redirige a /contacto/ con parámetros pre-rellenados. Gestionable desde WordPress.

### 10.5 Integración WhatsApp

Botón flotante visible en todas las páginas. En fichas de producto de alquiler: mensaje pre-rellenado con nombre del producto. Solo Visual Rent lo ofrece actualmente en el mercado de alquiler.

### 10.6 Logos de clientes, newsletter y estadísticas

Carousel animado de logos en homepage y subpáginas relevantes. Newsletter en footer de todas las páginas. Contadores animados en homepage (proyectos, eventos, años, clientes).

---

## 11. Enfoque técnico

### 11.1 Stack tecnológico

| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | Astro 5 | Rendimiento superior, generación estática + SSR, SEO nativo |
| Estilos | Tailwind CSS 4 | Productividad y consistencia visual |
| Animaciones | GSAP (optimizado) | Se mantiene con deduplicación y lazy loading |
| CMS | WordPress headless | Panel de gestión para el cliente |
| Email | Resend | Formularios de contacto y newsletter |
| Tipografía | Montserrat Variable | Identidad de marca |
| Analytics | GA4 | Ya implementado, se mantiene |
| Vídeo | Vimeo (migrar a API v3) | Migración obligatoria (v2 deprecada) |

### 11.2 WordPress headless como CMS

WordPress funciona exclusivamente como backend (panel de administración + API), mientras que Astro se encarga de todo el frontend. Esto combina la facilidad de uso de WordPress para el cliente con el rendimiento y flexibilidad de Astro.

**Qué gestiona el cliente desde WordPress:**

| Contenido | Custom Post Type | Campos editables |
|---|---|---|
| Páginas de servicio | Servicios | Título, descripción, vídeo, galería, icono, orden |
| Packs comerciales | Packs | Nombre, precio, características, servicio asociado, estado |
| Proyectos del portfolio | Portfolio | Título, vídeo Vimeo, cliente, director, categoría, fecha, descripción |
| Directores | Directores | Nombre, bio, foto, enlace a proyectos |
| Productos de alquiler | Alquiler | Nombre, categoría, precio/día, specs, fotos, estado, descuentos multi-día |
| Categorías de alquiler | Taxonomía | Nombre, slug, descripción SEO, imagen de cabecera |
| Packs de alquiler | Packs Alquiler | Nombre, productos incluidos, precio pack, descripción |
| Logos de clientes | Clientes | Nombre, logo SVG, orden de aparición |
| Página Nosotros | Página (nativa) | Contenido libre con editor de bloques |

Se utilizará WPML o Polylang para gestionar las versiones bilingües. El flujo de actualización: publicar en WordPress → webhook → rebuild en Astro (30s-2min) → cambios visibles.

### 11.3 Hosting

**Decisión tomada: Plesk (servidor Grupo Antena).** Astro (Node.js) y WordPress en el mismo servidor. Motivos: unificación de clientes bajo sistema propio de dominios/hosting y gestión de correos integrada.

WordPress se instala en un subdominio no público (admin.obliqproductions.com).

---

## 12. Mejoras de rendimiento y seguridad

### 12.1 Rendimiento

- Eliminar dependencia de Google Sheets (sustituido por WordPress headless con caché)
- Migrar a Vimeo API v3 (v2 deprecada)
- Comprimir vídeo corporativo (de 20.8 MB a <5 MB) o servirlo vía Vimeo/CDN
- Sustituir logo.gif (813 KB) por WebP animado o animación CSS/Lottie
- Implementar componente `<Image>` de Astro (WebP, srcset, lazy loading)
- Deduplicar carga de GSAP y usar `client:visible` / `client:idle`
- Generación estática de páginas (mejor TTFB que SSR)

### 12.2 Seguridad

- Corregir vulnerabilidades XSS en templates de email y mensajes de error
- Rate limiting en endpoints POST
- Validación de formato de email en servidor
- Tokens CSRF en formularios
- Sanitización de todos los inputs
- WordPress headless no accesible desde la web pública

### 12.3 Accesibilidad

- Implementar `prefers-reduced-motion`
- Corregir contraste del gris #CCCCCC sobre negro
- Añadir skip links visibles
- Revisar cursor personalizado

---

## 13. Fases del proyecto

El desarrollo se organiza en tres fases para entregar valor progresivamente:

### Fase 1: Fundamentos y estructura

Configuración del proyecto, diseño y estructura base.

- Instalación y configuración de WordPress headless con Custom Post Types y campos personalizados
- Configuración de CPTs para Servicios, Packs, Portfolio, Directores, Alquiler (productos, categorías, packs)
- Configuración del repositorio Astro y entorno de desarrollo
- Definición del diseño visual (wireframes + diseño final de home y subpágina de servicio)
- Desarrollo del layout principal (header, footer, navegación, language switcher)
- Implementación de i18n con español como idioma por defecto
- SEO técnico base: sitemap, robots.txt, meta tags, hreflang, Schema.org
- Conexión Astro ↔ WordPress API (fetching de datos, webhook de rebuild)
- Desarrollo de componentes reutilizables: pricing/packs, ficha de producto, carrito de presupuesto

### Fase 2: Contenido principal y servicios

Desarrollo de las páginas principales y sistema de servicios.

- Homepage completa con todas las secciones
- 9 subpáginas de servicios (template reutilizable + contenido individual)
- Página de contenido para redes sociales con módulo de packs integrado
- Página de streaming con tarifas de retransmisión
- Página About/Nosotros
- Página de contacto mejorada con selector de servicio, pre-relleno de packs y WhatsApp
- Integración de logos de clientes (carousel)
- Carga del contenido inicial en WordPress (servicios, packs, nosotros)

### Fase 3: Portfolio, alquiler y lanzamiento

Sistema de portfolio, catálogo de alquiler y puesta en marcha.

- Portfolio con grid filtrable, páginas de proyecto y páginas de director
- Catálogo de alquiler completo: landing pilar, landing por categoría, fichas individuales de producto
- Carrito de presupuesto y formulario específico de alquiler
- Packs temáticos de alquiler con precios cerrados
- Migración de datos existentes a WordPress (portfolio, directores, productos, packs)
- Migración a Vimeo API v3
- Optimización de rendimiento (compresión, lazy loading, caché)
- Corrección de vulnerabilidades de seguridad
- Testing completo (responsive, cross-browser, formularios, carrito, packs, i18n)
- Configuración de hosting y dominio
- Redirecciones 301 de URLs antiguas (incluidas las de /rental/ y /es/rental/)
- Google Business Profile optimizado para "alquiler audiovisual"
- Formación al cliente en uso de WordPress (incluyendo gestión de productos, categorías, packs y tarifas)
- Lanzamiento
