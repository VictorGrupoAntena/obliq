# Obliq — Animation Specification

**Referencia para desarrollo** · Catálogo de animaciones de la web actual (obliq.es)
Fecha: 2 de marzo de 2026

---

## Resumen

La web actual tiene **17 animaciones** distribuidas en 3 categorías:

| Categoría | Cantidad | Tecnología |
|-----------|----------|------------|
| GSAP (core + plugins) | 10 | gsap 3.13 + ScrollTrigger + SplitText |
| CSS Transitions | 5 | Tailwind classes + custom |
| CSS @keyframes | 2 | View Transitions API + Tailwind animate |

**Plugins GSAP utilizados:** ScrollTrigger, SplitText
**Peso total estimado:** ~60KB gzipped (cargado en cada página sin deduplicación)

---

## Decisiones para el rediseño

### Mantener (identidad de marca)
- Transition mask entre páginas (GSAP)
- Marquee infinito (GSAP)
- Text reveal con SplitText (GSAP)
- Custom cursor en portfolio (GSAP)
- Scroll-triggered fade-in (GSAP + ScrollTrigger)

### Optimizar
- Deduplicar carga de GSAP (actualmente se incluye por separado en cada página)
- Lazy load de plugins (SplitText solo en páginas que lo usan)
- Respetar `prefers-reduced-motion` en TODAS las animaciones
- Mobile: reducir/desactivar animaciones pesadas (video zoom, image sequence)

### Evaluar
- Video zoom + mask collapse (About) — ¿se mantiene en la nueva About?
- Image sequence con skew (About) — muy pesada, ¿alternativa más ligera?
- View Transitions CSS (slide-out/slide-in) — ¿redundante con transition mask GSAP?

---

## Catálogo completo

### 1. Transition Mask (navegación entre páginas)

- **Archivo:** `src/layouts/Layout.astro` (líneas 59-126)
- **Tipo:** GSAP Timeline
- **Trigger:** Click en enlaces internos (same-origin)
- **Target:** `#transition-mask` (div fixed, z-[999])
- **Efecto:** Máscara a pantalla completa que desliza desde arriba, cambia color según página destino, y vuelve a subir
- **Propiedades:**
  - Slide in: `y: "0%"` → visible · 1s · `ease: "power2.inOut"`
  - Color: `backgroundColor` cambia en 0.5s
  - Slide out: `y: "-100%"` → fuera · 1s · `ease: "power2.inOut"`
- **Notas:** Pointer events desactivados durante transición. Soporta dos colores de página (black/white)

### 2. View Transitions CSS (página entrante/saliente)

- **Archivo:** `src/styles/global.css` (líneas 19-52)
- **Tipo:** CSS @keyframes + View Transition API
- **Trigger:** Navegación (Astro `<ClientRouter>`)
- **Efecto:** Página saliente desliza a la izquierda, entrante desde la derecha
- **Propiedades:**
  - `slide-out-left`: `translateX(0%)` → `translateX(-100%)` · 0.5s · ease-in-out
  - `slide-in-right`: `translateX(100%)` → `translateX(0%)` · 0.5s · ease-in-out
- **Notas:** Se combina con la transition mask GSAP. Evaluar si ambas son necesarias

### 3. Marquee infinito

- **Archivo:** `src/components/organisms/Marqee.astro` (líneas 52-77)
- **Tipo:** GSAP Tween con `modifiers`
- **Trigger:** Page load (evento `astro:after-swap`)
- **Target:** `.marquee-track` (contenedor flex)
- **Efecto:** Scroll horizontal infinito seamless
- **Propiedades:**
  - `x: -=distance` (mitad del ancho total)
  - Duration: 8s
  - Ease: `linear`
  - Repeat: `-1` (infinito)
  - `modifiers`: wrap para loop seamless
- **Variantes:** Large (títulos 260px) y Small (textos menores)
- **Usos:** Home (portfolio), About (marcas), posiblemente servicios

### 4. Video Items — Scroll fade-in

- **Archivo:** `src/pages/index.astro` (líneas 24-47)
- **Tipo:** GSAP Timeline + ScrollTrigger
- **Trigger:** Scroll (sección videos entra en viewport)
- **Target:** `.video-item` (thumbnails de vídeo)
- **Efecto:** Cards aparecen escalonadas desde abajo
- **Propiedades:**
  - `opacity: 0 → 1`
  - `y: 30px → 0px`
  - Duration: 0.2s por item
  - Ease: `power2.out`
  - Stagger: 0.1s entre items
- **ScrollTrigger:**
  - Trigger: `#videos`
  - Start: `-=300 center`
  - End: `bottom center`
  - toggleActions: `play reverse play reverse`
  - Scrub: 0.5s
- **Notas:** Se revierte al hacer scroll hacia arriba

### 5. Custom Cursor

- **Archivo:** `src/pages/index.astro` (líneas 48-135)
- **Tipo:** GSAP Tween (set + to)
- **Trigger:** Pointer enter/leave en `.custom-cursor-target`
- **Target:** `#customCursor` (SVG plus icon, fixed position)
- **Efecto:** Cursor personalizado que aparece/desaparece al hover sobre vídeos
- **Propiedades:**
  - Show: `scale: 0 → 1` · 0.2s · `ease: "power3.out"`
  - Hide: `scale: 1 → 0` · 0.2s · `ease: "power3.inOut"`
  - Position: `gsap.set()` con RAF, offset de 37.5px (mitad del cursor de 75px)
- **Notas:** Timeouts de 100ms (show) y 50ms (hide) para evitar flickering. Solo en Home

### 6. About — Text Reveal (SplitText)

- **Archivo:** `src/pages/about.astro` (líneas 23-48)
- **Tipo:** GSAP Timeline + SplitText
- **Trigger:** Page load (1s delay)
- **Target:** `#about-text` (párrafo de misión)
- **Efecto:** Texto se revela línea por línea desde abajo
- **Propiedades:**
  - SplitText: `type: "words,lines"`, `linesClass: "line"`, `mask: "lines"`
  - `yPercent: 100 → 0`
  - `opacity: 0 → 1`
  - Duration: 1s por línea
  - Ease: `expo.out`
  - Stagger: 0.2s entre líneas
- **Notas:** Plugin SplitText requiere licencia GSAP Club/Business

### 7. About — Video Zoom + Mask Collapse

- **Archivo:** `src/pages/about.astro` (líneas 50-101)
- **Tipo:** GSAP Timeline + ScrollTrigger (2 instancias)
- **Trigger:** Scroll
- **Target:** `#about-video`, `#video-mask-1`, `#video-mask-2`
- **Efecto:** Vídeo corporativo se expande a fullscreen mientras máscaras blancas colapsan
- **Propiedades:**
  - Video: `width: 40dvw → 100dvw`, `height: 40dvh → 100dvh` · 8s + 5s
  - Masks: `height: 0% → 50%` · 5s (paralelo con "<")
- **ScrollTrigger 1:**
  - Trigger: `#about-video-section`
  - Start: `top 75%` / End: `bottom top`
  - Scrub: 0.5s
- **ScrollTrigger 2:** Pin del vídeo (`pin: true`, `pinSpacing: true`)
- **Notas:** about.mp4 pesa 20.8MB — necesita compresión o servir vía CDN

### 8. About — Image Sequence (skew + scale)

- **Archivo:** `src/pages/about.astro` (líneas 102-140)
- **Tipo:** Master GSAP Timeline + ScrollTrigger
- **Trigger:** Scroll
- **Target:** `.about-content-image` (imágenes de sección about)
- **Efecto:** Cada imagen sube, se escala+sesga, y sale disparada hacia arriba
- **Propiedades por imagen (3 fases):**
  1. `from()`: `y: 300px` · 1s
  2. `to()`: `scaleY: 2`, `skewX: -20deg`, `y: -100px` · 1s
  3. `to()`: `y: -500px` · 1s
- **Timeline stagger:** `index * 0.5s` entre cada imagen
- **ScrollTrigger:**
  - Trigger: `#about-content-section`
  - Start: `top center` / End: `bottom center`
  - Scrub: true (vinculado 1:1 con scroll)
- **Mobile:** `scaleY: 1` (sin escala), `y: 0` (sin movimiento vertical), stagger 0.6s

### 9. About — Director Names (char-by-char + underline)

- **Archivo:** `src/pages/about.astro` (líneas 141-191)
- **Tipo:** GSAP Timeline + SplitText + ScrollTrigger
- **Trigger:** Scroll
- **Target:** `.director-name`, `.director-name-hidden`, `.director-name-line`
- **Efecto:** Nombres de directores se revelan carácter a carácter con línea animada debajo
- **Propiedades:**
  - Characters: `opacity: 0 → 1` · 0.05s · stagger 0.05s
  - Line: `scaleX: 0 → 1` · 0.4s · `transformOrigin: "left center"`
- **Timeline defaults:** `ease: "power2.out"`
- **Timing:** 0.5s gap entre directores, line overlap -0.2s con chars
- **ScrollTrigger:**
  - Trigger: `#directors-section`
  - Start: `top center` / End: `bottom center`
  - Scrub: true
- **Notas:** Capa hidden como backup para SplitText

### 10. Menu Mobile — Slide in/out

- **Archivo:** `src/components/organisms/Menu.astro` (líneas 93-113)
- **Tipo:** GSAP Tween
- **Trigger:** Click (hamburguesa abre, X o link cierra)
- **Target:** `.main-menu` (overlay fullscreen)
- **Efecto:** Menú desliza desde la derecha
- **Propiedades:**
  - Open: `x: 0` (desde 100%) · 0.3s · `ease: "power2.out"`
  - Close: `x: "100%"` · 0.3s · `ease: "power2.in"`

### 11. Video Item — Thumbnail Hover

- **Archivo:** `src/components/organisms/VideoItem.astro` (líneas 16-41)
- **Tipo:** CSS Transition (Tailwind)
- **Trigger:** Hover (`.group-hover`)
- **Target:** Imagen thumbnail, gradient overlay, info text
- **Efecto:** Zoom en imagen, overlay aparece, info se muestra
- **Propiedades:**
  - Image: `scale-100 → scale-110` · 300ms
  - Overlay: `opacity-0 → opacity-100` · 300ms
  - Info: `opacity-0 → opacity-100` · 300ms

### 12. Rental — Title + Products Scroll

- **Archivo:** `src/pages/rental.astro` (líneas 60-107)
- **Tipo:** GSAP Timeline + SplitText + ScrollTrigger
- **Trigger:** Load (título) + Scroll (productos)
- **Target:** `#rental-title`, `#rental-description`, `.product-item`
- **Efecto:** Título se revela por líneas, productos aparecen escalonados
- **Propiedades:**
  - Title lines: `opacity: 0→1`, `y: 30→0` · 0.3s · `power2.out` · delay 1s
  - Description: `opacity: 0→1`, `y: 20→0` · 0.4s · `power2.out`
  - Products: `opacity: 0→1`, `y: 100→0` · 0.2s · `power2.out` · stagger 0.1s
- **ScrollTrigger (products):**
  - Trigger: `#products`
  - Scrub: 0.5s

### 13. Plus Icon — Enlarge

- **Archivo:** `src/components/VideoItem.astro` (línea 20-25)
- **Tipo:** Tailwind @keyframes (`animate-enlarge`)
- **Trigger:** Page load
- **Target:** SVG plus icon (rotado 45° = close)
- **Propiedades:** `scale: 0 → 1` · 0.5s · ease-in-out

### 14. Video Page — Info Panel

- **Archivo:** `src/components/VideoItem.astro` (líneas 93-144)
- **Tipo:** CSS Transition + JS class toggle
- **Trigger:** Click en chevron
- **Target:** `#videoInfo`, `#videoSection`, `.showMoreBtn`
- **Efecto:** Panel de info sube desde abajo, vídeo se reposiciona, chevron rota
- **Propiedades:**
  - Info: `translate-y-full → translate-y-0` · 300ms
  - Video: `md:-translate-y-[178px]` · 300ms
  - Chevron: `rotate-0 → rotate-180` · 300ms

### 15-16. Páginas ES (duplicadas)

Las versiones españolas (`/es/index.astro`, `/es/about.astro`) tienen animaciones idénticas a las inglesas, con una optimización mobile adicional en about:
- Mobile: `y: 0` (sin movimiento vertical en images)
- Mobile: `scaleY: 1` (sin escala vertical)
- Mobile: stagger 0.6s (vs 0.5s en desktop)

### 17. Button Arrow — Hover

- **Archivo:** `src/components/atoms/Button.astro` (línea 24)
- **Tipo:** CSS Transition (Tailwind)
- **Trigger:** Hover
- **Target:** SVG arrow dentro del botón
- **Efecto:** Flecha se desplaza 2px a la derecha
- **Propiedad:** `group-hover:translate-x-2`

---

## Mapping: Animaciones → Páginas nuevas

| Animación | Home | Servicios | Portfolio | Alquiler | Nosotros | Contacto |
|-----------|:----:|:---------:|:---------:|:--------:|:--------:|:--------:|
| Transition mask | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marquee | ✅ | ✅ | ✅ | — | ✅ | — |
| Scroll fade-in | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Custom cursor | ✅ | — | ✅ | — | — | — |
| Text reveal (SplitText) | ✅ | ✅ | — | — | ✅ | — |
| Video zoom + mask | — | — | — | — | ✅? | — |
| Image sequence | — | — | — | — | ✅? | — |
| Director names reveal | — | — | ✅ | — | — | — |
| Menu slide | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Card hover (CSS) | ✅ | ✅ | ✅ | ✅ | — | — |
| Button arrow (CSS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Products scroll | — | — | — | ✅ | — | — |

---

## Requisitos técnicos para el rediseño

### GSAP
- **Versión:** 3.13+ (mantener)
- **Plugins requeridos:** ScrollTrigger, SplitText
- **Licencia:** SplitText requiere GSAP Club o Business (verificar estado de licencia)
- **Carga:** Deduplicar — un único import en el layout, no en cada página
- **Tree-shaking:** Registrar solo los plugins necesarios por página

### Accesibilidad
- **`prefers-reduced-motion`:** OBLIGATORIO en todas las animaciones
  - GSAP: comprobar `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
  - CSS: usar `@media (prefers-reduced-motion: reduce)` para desactivar transitions
- **Duración máxima:** Las animaciones de scroll no deben impedir la lectura del contenido
- **Cursor custom:** Mantener cursor nativo como fallback

### Performance
- **Mobile:** Reducir/desactivar animaciones pesadas (video zoom, image sequence, SplitText)
- **Lazy init:** Inicializar ScrollTrigger solo cuando la sección entra en viewport
- **Cleanup:** Matar timelines y ScrollTriggers al navegar (`astro:before-swap`)
