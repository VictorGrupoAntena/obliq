# Implementation Plan
Project: Obliq Productions — Carrito de Alquiler + Mejoras UX/UI
Briefing: BRIEFING-SUMMARY.md + UX-UI-REVIEW.md
Date: 2026-03-18
Status: IN PROGRESS

---

## Milestones overview

| # | Milestone | Tasks | Complejidad | Human gate |
|---|-----------|-------|-------------|------------|
| M1 | Design System — Contraste y tokens | 3 | S | No | ✅ |
| M2 | UX/UI — Cards y componentes | 5 | S-M | Sí — revisión visual | ✅ |
| M3 | UX/UI — Layout y navegación | 3 | S | No | ✅ |
| M4 | Cart Store — Lógica de negocio | 2 | M | No | ✅ |
| M5 | Cart UI — Botones de producto | 2 | M | Sí — revisión interacción | ✅ |
| M6 | Cart UI — Bottom Bar | 2 | L | Sí — revisión UX completa | ✅ |
| M7 | Cart UI — Header Button | 2 | M | No | ✅ |
| M8 | Cart — Mailto CTA + i18n | 2 | M | Sí — revisión email output | ✅ |
| M9 | Integración y QA | 3 | M | Sí — validación final |

**Total: 24 tareas**

---

## M1 — Design System: Contraste y Tokens de Color

Objetivo: Establecer las bases del sistema de diseño mejorado antes de tocar componentes.

### T-001: ✅ Añadir nuevos tokens de color a global.css
- **Specs:** UX-REVIEW 3 (sistema colores mejorado)
- **Input:** global.css actual con 8 tokens
- **Output:** global.css con 3 tokens nuevos: `--color-dim: #AAAAAA`, `--color-border-emphasis: #555555`, `--color-surface-elevated: #1A1A1A`
- **Complejidad:** S
- **Dependencias:** ninguna
- **Done:** Los 3 tokens existen en `@theme` y son utilizables como `text-dim`, `border-emphasis`, `bg-surface-elevated` en Tailwind

### T-002: ✅ Añadir :focus-visible global para fondos oscuros
- **Specs:** UX-REVIEW 5.2
- **Input:** global.css sin estilos focus custom
- **Output:** Regla `:focus-visible { outline: 2px solid white; outline-offset: 2px; }` en global.css
- **Complejidad:** S
- **Dependencias:** ninguna
- **Done:** Focus ring blanco visible en todos los elementos interactivos sobre fondos oscuros

### T-003: ✅ Documentar reglas de uso de tokens en comentarios CSS
- **Specs:** UX-REVIEW 3 (tabla de reglas)
- **Input:** T-001 completado
- **Output:** Comentario en global.css explicando cuándo usar cada token (text-white, text-secondary, text-dim, text-muted)
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** Reglas documentadas como comentario en el archivo

---

## M2 — UX/UI: Cards y Componentes
**[HUMAN GATE: Revisión visual de las cards modificadas antes de continuar]**

### T-004: ✅ Fix contraste en ProductCard (dark theme)
- **Specs:** UX-REVIEW 1.2, 1.1
- **Input:** ProductCard.astro actual (bg-black sin borde, text-muted en specs)
- **Output:** (1) `bg-black` → `bg-surface-dark border border-white/20 hover:border-white/40` para tema dark. (2) Texto specs: `text-muted` → `text-dim` en ambos temas. (3) Texto /día y IVA: `text-muted` → `text-dim`
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** ProductCard dark tiene borde visible, contraste AA en todos los textos

### T-005: ✅ Fix contraste en PackCard
- **Specs:** UX-REVIEW 2.1, 1.1
- **Input:** PackCard.astro (sin borde, border-border/30 interno, text-muted en múltiples líneas)
- **Output:** (1) Añadir `border border-white/20` al contenedor. (2) `border-border/30` → `border-border` en lista de productos. (3) `text-muted` → `text-dim` en nombre pack (l.41), /día (l.51), "incluye" (l.66), precios unitarios (l.73)
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** PackCard con borde visible, separadores internos visibles, textos WCAG AA

### T-006: ✅ Fix contraste en PricingCard
- **Specs:** UX-REVIEW 1.5
- **Input:** PricingCard.astro con text-muted en periodo facturación
- **Output:** `text-muted` → `text-dim` en periodo de facturación (línea 38) y otros textos secundarios
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** PricingCard cumple WCAG AA en todos los textos

### T-007: ✅ Fix ServiceCard — borde + CTA visible
- **Specs:** UX-REVIEW 2.2
- **Input:** ServiceCard.astro (sin borde en variante sin imagen, CTA opacity-0)
- **Output:** (1) Variante sin imagen: añadir `border border-white/20`. (2) CTA: `opacity-0` → `opacity-60` (siempre visible, se enfatiza en hover)
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** ServiceCard sin imagen tiene borde visible y CTA perceptible sin hover

### T-008: ✅ Fix atoms — Tag, Input, Textarea, Paragraph
- **Specs:** UX-REVIEW 1.1 (Tag), 1.3 (Input/Textarea), 5.1 (Paragraph)
- **Input:** Cuatro archivos atoms con problemas de contraste
- **Output:** (1) Tag.astro: `text-muted` → `text-dim`. (2) Input.astro: `bg-black/10 border-b` → `bg-surface-dark border border-border focus:border-white`. (3) Textarea.astro: mismo cambio que Input. (4) Paragraph.astro: evaluar `font-light` → `font-normal` (verificar impacto visual global antes de aplicar)
- **Complejidad:** M
- **Dependencias:** T-001
- **Done:** Tags legibles, inputs visibles con borde completo, focus state claro

---

## M3 — UX/UI: Layout y Navegación

### T-009: ✅ Fix Header — contraste links inactivos + separadores mobile
- **Specs:** UX-REVIEW 2.3, 5.4
- **Input:** Header.astro con opacity-80 en links inactivos y menú mobile sin separadores
- **Output:** (1) Links inactivos: `opacity-80` → `opacity-60` (desktop y mobile). (2) Menú mobile: añadir `border-b border-border` entre items de navegación
- **Complejidad:** S
- **Dependencias:** ninguna
- **Done:** Links inactivos distinguibles de activos, menú mobile con separación visual

### T-010: ✅ Fix Footer — títulos y copyright
- **Specs:** UX-REVIEW 2.4, 2.5
- **Input:** Footer.astro con text-[10px] text-muted en títulos, text-[12px] text-muted en copyright
- **Output:** (1) Títulos sección: `text-[10px] text-muted` → `text-[11px] text-dim`. (2) Copyright: `text-muted` → `text-dim`
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** Títulos y copyright del footer legibles sobre fondo negro

### T-011: ⏭️ Fix QuoteCartPreview + CategoryCard (nice-to-have) — SKIPPED
- **Specs:** UX-REVIEW 2.1 (QuoteCartPreview), 5.3 (CategoryCard)
- **Input:** QuoteCartPreview sin borde; CategoryCard con hover sutil
- **Output:** (1) QuoteCartPreview: añadir `border border-white/20` si fondo oscuro. (2) CategoryCard: añadir `hover:border-black hover:shadow-md` para feedback más claro
- **Complejidad:** S
- **Dependencias:** T-001
- **Done:** QuoteCartPreview con borde, CategoryCard con hover más visible
- **Skip reason:** Neither QuoteCartPreview.astro nor CategoryCard.astro exist in the codebase. These components were referenced in UX-UI-REVIEW.md but haven't been created yet. Will be applied when the components are created (QuoteCartPreview is part of cart UI, M6+).

---

## M4 — Cart Store: Lógica de Negocio

### T-012: ✅ Crear cart-store.ts — módulo de estado del carrito
- **Specs:** F-1 (Cart State Management), F-5 (Selector de días)
- **Input:** Interfaz RentalProduct de rental.ts, discountTiers y getDiscountedPrice
- **Output:** Archivo `src/lib/cart-store.ts` con:
  - Interface `CartItem` (productSlug, productName, categorySlug, price, days, image)
  - Funciones: `addToCart(item)`, `removeFromCart(slug)`, `updateDays(slug, days)`, `getCart()`, `getTotal()`, `getCount()`, `clearCart()`, `isInCart(slug)`
  - Persistencia en localStorage (key: `obliq-quote-cart`)
  - Sistema de eventos custom (`cart:updated`) para que los componentes UI reaccionen
  - Lógica de descuento multidía integrada (replica getDiscountedPrice para client-side)
- **Complejidad:** M
- **Dependencias:** ninguna (módulo independiente)
- **Done:** cart-store.ts exporta todas las funciones, persiste en localStorage, emite eventos en cada cambio

### T-013: ✅ Añadir claves i18n del carrito a es.json y en.json
- **Specs:** F-7 (Soporte i18n)
- **Input:** es.json y en.json actuales con bloque RENTAL
- **Output:** Nuevas claves en RENTAL (o bloque CART nuevo): títulos, labels, CTA, email subject/body templates, selector de días, mensajes vacío/lleno, badge, etc.
- **Complejidad:** S
- **Dependencias:** ninguna
- **Done:** Todas las strings del carrito disponibles en ambos idiomas

---

## M5 — Cart UI: Botones de Producto
**[HUMAN GATE: Revisión de la interacción añadir/quitar antes de construir las barras]**

### T-014: ✅ ProductCard — botón "Añadir al presupuesto" funcional
- **Specs:** F-2 (Botón funcional)
- **Input:** ProductCard.astro actual (botón con pointer-events-none, enlace `<a>`)
- **Output:** (1) Separar el botón "Añadir" del enlace de la card (el botón no debe navegar, la card sí). (2) Añadir `data-product-slug`, `data-product-name`, `data-product-price`, `data-product-image`, `data-category-slug` al botón. (3) Script que: escucha click → llama `addToCart()` / `removeFromCart()` → feedback visual (texto cambia a "Añadido ✓" con toggle). (4) En `astro:after-swap`: re-check si el producto ya está en el carrito y actualizar estado visual
- **Complejidad:** M
- **Dependencias:** T-004 (ProductCard ya modificado para UX), T-012 (cart-store)
- **Done:** Click en "Añadir" añade al carrito con feedback visual. Click de nuevo lo quita. Estado persiste entre navegaciones

### T-015: ✅ Ficha de producto [product].astro — botón añadir
- **Specs:** F-2
- **Input:** [product].astro ES y EN (botón CTA existente)
- **Output:** (1) Botón "Añadir al presupuesto" funcional con misma lógica que T-014. (2) Mismo sistema de data-attributes + script. (3) Aplicar en ambas versiones: `/alquiler/[category]/[product].astro` y `/en/rental/[category]/[product].astro`
- **Complejidad:** M
- **Dependencias:** T-012 (cart-store)
- **Done:** Botón funcional en ficha de producto en ambos idiomas

---

## M6 — Cart UI: Bottom Bar (Directorio de Alquiler)
**[HUMAN GATE: Revisión UX completa de la barra — comportamiento, animaciones, responsive]**

### T-016: ✅ Crear CartBottomBar.astro — barra inferior anclada
- **Specs:** F-3 (Bottom bar), F-5 (Selector de días)
- **Input:** cart-store.ts, diseño definido en BRIEFING (fondo negro, compacta ~64px, expandible)
- **Output:** Componente `src/components/organisms/CartBottomBar.astro` con:
  - **Modo colapsado** (~64px): icono carrito + "X productos" + total + CTA "Solicitar presupuesto"
  - **Modo expandido**: lista de productos con nombre + precio/día + selector días (1/3/5/7) + botón eliminar + subtotales + total
  - Selector de días: `<select>` o botones con los 4 tramos, muestra descuento (ej: "3 días -10%")
  - Recalcula total en tiempo real al cambiar días
  - Se oculta si carrito vacío
  - **Visible SOLO si** URL empieza por `/alquiler/` o `/en/rental/`
  - Animación GSAP slide-up/down para expandir/colapsar
  - Responsive: full-width en mobile, max-width en desktop
  - Escucha evento `cart:updated` para re-renderizar
  - Re-inicializa en `astro:after-swap` con detección de sección
  - Touch targets ≥ 44x44px
  - Estilo: `bg-black border-t border-white/20` (alineado con patrón de cards)
- **Complejidad:** L
- **Dependencias:** T-012 (cart-store), T-013 (i18n), T-001 (tokens)
- **Done:** Barra inferior funcional, visible solo en alquiler, con selector de días y total

### T-017: ✅ Integrar CartBottomBar en BaseLayout
- **Specs:** F-3
- **Input:** BaseLayout.astro, CartBottomBar.astro
- **Output:** (1) Importar y renderizar `<CartBottomBar />` antes de `</body>` en BaseLayout. (2) Pasar locale como prop. (3) El componente se auto-oculta si no estamos en /alquiler/. (4) Ajustar padding-bottom del `<main>` dinámicamente cuando la barra está visible (para que no tape contenido)
- **Complejidad:** S
- **Dependencias:** T-016
- **Done:** CartBottomBar renderizado globalmente, visible solo donde corresponde

---

## M7 — Cart UI: Header Button (Fuera del Directorio)

### T-018: ✅ Crear CartHeaderButton.astro — botón + mini-panel
- **Specs:** F-4 (Botón header)
- **Input:** cart-store.ts, diseño definido en BRIEFING
- **Output:** Componente `src/components/organisms/CartHeaderButton.astro` con:
  - **Botón:** Icono SVG carrito + badge con número de items
  - **Visible SOLO si:** (1) hay items en carrito Y (2) URL NO empieza por `/alquiler/` ni `/en/rental/`
  - **Mini-panel flyout:** Al click, despliega panel con lista compacta de productos + total + CTA
  - Cierra al click fuera o en Escape
  - Responsive: en mobile, el panel es overlay fullscreen
  - Escucha `cart:updated` y `astro:after-swap`
  - Animación GSAP fade+slide para el panel
- **Complejidad:** M
- **Dependencias:** T-012 (cart-store), T-013 (i18n)
- **Done:** Botón visible en header fuera de alquiler, panel desplegable funcional

### T-019: ✅ Integrar CartHeaderButton en Header.astro
- **Specs:** F-4
- **Input:** Header.astro actual (navRight con LangSwitcher)
- **Output:** (1) Importar y renderizar `<CartHeaderButton />` junto al `<LangSwitcher />` en desktop. (2) En mobile: renderizar antes del burger button. (3) Pasar locale como prop
- **Complejidad:** S
- **Dependencias:** T-018, T-009 (Header ya modificado para UX)
- **Done:** Botón carrito integrado en header, alineado con el diseño existente

---

## M8 — Cart: Mailto CTA + i18n Final

### T-020: ✅ Implementar generación de mailto con presupuesto
- **Specs:** F-6 (CTA mailto)
- **Input:** cart-store.ts con datos del carrito
- **Output:** Función `generateMailtoLink(locale)` en cart-store.ts (o módulo aparte) que:
  - Construye `mailto:info@obliqproductions.com` (o email configurable)
  - Subject: "Solicitud de presupuesto — Obliq Productions" / "Quote request — Obliq Productions"
  - Body: lista de productos formateada (nombre + días + precio unitario + subtotal), total estimado, placeholder para fechas
  - Encoda correctamente para URI (`encodeURIComponent`)
  - Maneja límite de caracteres (si > 2000, formato resumido)
- **Complejidad:** M
- **Dependencias:** T-012, T-013
- **Done:** CTA en bottom bar y header panel genera mailto funcional con toda la info

### T-021: ✅ Conectar CTA en CartBottomBar y CartHeaderButton
- **Specs:** F-6
- **Input:** T-016 (bottom bar), T-018 (header button), T-020 (mailto)
- **Output:** (1) El botón CTA de ambos componentes llama a `generateMailtoLink(locale)` y abre el email. (2) Verificar que el email se genera correctamente en ES y EN. (3) Verificar que funciona en mobile (mailto en iOS/Android)
- **Complejidad:** S
- **Dependencias:** T-016, T-018, T-020
- **Done:** Click en CTA abre email con presupuesto completo en ambos idiomas

---

## M9 — Integración y QA
**[HUMAN GATE: Validación final completa antes de merge/deploy]**

### T-022: Test de integración — flujo completo del carrito
- **Specs:** Success metrics del briefing (todos)
- **Input:** Todo el sistema implementado
- **Output:** Verificación manual del flujo completo:
  - [ ] Añadir producto desde listado de categoría
  - [ ] Añadir producto desde ficha de producto
  - [ ] Navegar entre páginas del directorio — carrito persiste
  - [ ] Bottom bar visible SOLO en /alquiler/*
  - [ ] Cambiar días — precio se recalcula con descuentos
  - [ ] Eliminar producto del carrito
  - [ ] Navegar fuera de /alquiler/ — bottom bar desaparece, header button aparece
  - [ ] Click en CTA — email se genera correctamente (ES y EN)
  - [ ] Recargar página — carrito persiste (localStorage)
  - [ ] View Transitions — carrito sobrevive a navegaciones
  - [ ] Mobile — touch targets, bottom bar, panel header
- **Complejidad:** M
- **Dependencias:** Todos los milestones anteriores
- **Done:** Todos los checkpoints verificados sin errores

### T-023: Auditoría de contraste y accesibilidad
- **Specs:** UX-REVIEW completo, Success metrics (Lighthouse)
- **Input:** Sitio con todos los cambios aplicados
- **Output:** (1) Verificar WCAG AA en todos los textos modificados. (2) Verificar navegación por teclado del carrito (Tab, Enter, Escape). (3) ARIA labels en botones del carrito, bottom bar, mini-panel. (4) Screen reader: carrito anuncia cambios (aria-live region). (5) Verificar que no hay regresiones en componentes no modificados
- **Complejidad:** M
- **Dependencias:** T-022
- **Done:** Todos los textos pasan WCAG AA, carrito navegable por teclado, ARIA completo

### T-024: Build final y verificación de deploy
- **Specs:** Constraint técnica (SSG + Plesk)
- **Input:** Todo implementado y verificado
- **Output:** (1) `npm run build` sin errores ni warnings. (2) Verificar que el dist/ incluye los scripts del carrito. (3) Verificar que no hay errores de TypeScript. (4) Verificar tamaño del bundle (no regresión significativa). (5) Si el proyecto tiene CI, verificar que pasa
- **Complejidad:** S
- **Dependencias:** T-022, T-023
- **Done:** Build limpio, listo para deploy
- **⚠️ Known blockers (pre-existing, must resolve before this task):**
  1. `src/pages/es/videos/director/[name].astro` — missing `getStaticPaths()` export, causes build failure in SSG mode. Must add getStaticPaths or remove the route.
  2. Server-side code moved to `_actions.disabled/` and `_api.disabled/` (project root) — restore when `@astrojs/node` adapter is installed for server output mode.
  3. Duplicate macOS ' 2' files in `src/pages/` (e.g. `legal 2.astro`, `contact 2.astro`, `rental 2.astro`, etc.) — must be deleted before production build. They generate broken routes and may cause import errors.

---

## Diagrama de dependencias

```
M1 (Tokens)
 ├── T-001 ──┬── T-004 (ProductCard) ──── T-014 (Botón funcional)
 │           ├── T-005 (PackCard)
 │           ├── T-006 (PricingCard)
 │           ├── T-007 (ServiceCard)
 │           ├── T-008 (Atoms)
 │           ├── T-010 (Footer)
 │           └── T-011 (QuoteCart+Category)
 ├── T-002
 └── T-003

T-009 (Header UX) ──── T-019 (Integrar CartHeaderButton)

T-012 (Cart Store) ──┬── T-014 (Botón ProductCard)
                     ├── T-015 (Botón [product])
                     ├── T-016 (Bottom Bar)
                     ├── T-018 (Header Button)
                     └── T-020 (Mailto)

T-013 (i18n) ──┬── T-016
               ├── T-018
               └── T-020

T-016 + T-018 + T-020 ──── T-021 (Conectar CTAs)
                           └── T-022 (QA) ── T-023 (A11y) ── T-024 (Build)
```

---

## Estimación de esfuerzo

| Milestone | Sesiones estimadas | Notas |
|-----------|--------------------|-------|
| M1 | 0.5 | Cambios en 1 archivo |
| M2 | 1 | 5 componentes, cambios puntuales |
| M3 | 0.5 | 3 componentes, cambios menores |
| M4 | 1 | cart-store.ts es la pieza clave |
| M5 | 1 | Lógica de interacción + View Transitions |
| M6 | 1.5-2 | Componente más complejo del plan |
| M7 | 1 | Similar a bottom bar pero más simple |
| M8 | 0.5-1 | Mailto + encoding |
| M9 | 1 | Testing manual completo |
| **Total** | **~8-9 sesiones** | |

---

## Ruta crítica

**M1 → M2 → M4 → M5 → M6 → M8 → M9**

M3 (Header/Footer UX) y M7 (Header Button) pueden ejecutarse en paralelo con M5-M6 si se desea.

---

## Notas

- **No hay PROJECT-SPEC.md formal** — Este plan se basa directamente en BRIEFING-SUMMARY.md y UX-UI-REVIEW.md. Si se desea formalizar specs antes de ejecutar, correr `spec-writer` primero.
- **Packs excluidos del carrito** — Decisión registrada en decisions.jsonl. PackCard solo recibe mejoras de UX (T-005), no funcionalidad de carrito.
- **Email destino** — Asumo `info@obliqproductions.com`. Confirmar antes de T-020.
- **Vaciar carrito** — Se incluirá un botón "vaciar todo" en la bottom bar expandida (T-016). Es barato de implementar y mejora la UX.
