# Prompt para Claude CLI en VSCode

> Copia todo el contenido del bloque de abajo y pégalo en Claude CLI (terminal de VSCode).
> Asegúrate de estar en la raíz del proyecto Obliq Productions antes de ejecutar.

---

```
Lee CLAUDE.md, MEMORY.md, PLAN.md, BRIEFING-SUMMARY.md, UX-UI-REVIEW.md y .spec-engine/decisions.jsonl antes de hacer nada. Estos archivos contienen la identidad del agente ADA, la memoria del proyecto, el plan de desarrollo aprobado, el briefing del carrito de alquiler, la revisión UX/UI y las decisiones arquitecturales tomadas.

## CONTEXTO DEL PROYECTO

Obliq Productions — web de productora audiovisual. Stack: Astro 5.x SSG + Tailwind CSS 4 + GSAP + WordPress headless + i18n ES/EN custom.

## QUÉ HAY QUE HACER

Hay 2 líneas de trabajo integradas en un plan de 9 milestones (PLAN.md):

### Línea 1: Mejoras UX/UI de contraste
El sitio es demasiado oscuro. Hay que mejorar contraste sin cambiar la estética. Los cambios concretos están en UX-UI-REVIEW.md:
- Añadir 3 tokens de color a global.css: --color-dim:#AAA, --color-border-emphasis:#555, --color-surface-elevated:#1A1A1A
- Añadir :focus-visible global (outline blanco)
- Aplicar patrón "cajas grises con borde blanco" → bg-surface-dark + border border-white/20 en todas las cards sobre fondo oscuro (ProductCard dark, PackCard, ServiceCard sin imagen, PricingCard no highlighted)
- Reemplazar text-muted por text-dim en todo texto que debe ser legible (tags, specs, precios secundarios, footer)
- Fix inputs/textareas: bg-surface-dark + border completo + focus:border-white
- Fix header: opacity-80 → opacity-60 en links inactivos
- Fix footer: títulos text-[10px] text-muted → text-[11px] text-dim

### Línea 2: Carrito de presupuesto de alquiler
Sistema de carrito client-side para solicitar presupuesto de equipos de alquiler. Decisiones clave (en decisions.jsonl):
- 100% client-side con localStorage (SSG, no hay server)
- 1 unidad por producto, sin cantidades
- Selector de días por tramos (1/3/5/7) con descuentos existentes en rental.ts
- Bottom bar anclada visible SOLO en /alquiler/* y /en/rental/*
- Botón en header con badge visible SOLO fuera del directorio de alquiler (y solo si hay items)
- CTA genera mailto: con productos + días + precios pre-rellenados
- Packs excluidos del carrito en esta fase
- Scripts deben reinicializarse en astro:after-swap (View Transitions)
- Evento custom cart:updated para comunicar cambios entre componentes

## ORDEN DE EJECUCIÓN

Sigue PLAN.md estrictamente. El orden es:

M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9

Ejecuta milestone por milestone. Dentro de cada milestone, respeta las dependencias entre tareas.

## REGLAS DE EJECUCIÓN

1. Lee SIEMPRE el archivo antes de modificarlo. No asumas el estado actual.
2. Ejecuta directamente con Read, Edit, Write, Bash. No ofrezcas copiar/pegar.
3. Aplica los 6 pilares de calidad de ADA automáticamente (UX, UI, A11y, Performance, SEO, Forms).
4. Tras cada milestone, haz build (npm run build) y verifica que no hay errores.
5. Actualiza PLAN.md marcando las tareas completadas.
6. Actualiza .spec-engine/decisions.jsonl si tomas decisiones nuevas.
7. En los HUMAN GATES (M2, M5, M6, M9), para y muéstrame qué has hecho antes de continuar.

## ARCHIVOS CLAVE

### A modificar (UX/UI):
- src/styles/global.css → tokens + focus-visible
- src/components/atoms/Tag.astro → text-muted → text-dim
- src/components/atoms/Input.astro → fondo + borde completo
- src/components/atoms/Textarea.astro → fondo + borde completo
- src/components/cards/ProductCard.astro → borde + contraste + botón funcional
- src/components/cards/PackCard.astro → borde + contraste
- src/components/cards/ServiceCard.astro → borde + CTA visible
- src/components/cards/PricingCard.astro → contraste
- src/components/organisms/Header.astro → opacity links + botón carrito
- src/components/organisms/Footer.astro → títulos + copyright
- src/components/sections/QuoteCartPreview.astro → borde
- src/layouts/BaseLayout.astro → incluir CartBottomBar

### A crear (Carrito):
- src/lib/cart-store.ts → estado del carrito + localStorage + eventos
- src/components/organisms/CartBottomBar.astro → barra inferior anclada
- src/components/organisms/CartHeaderButton.astro → botón header + mini-panel

### i18n:
- src/i18n/es.json → nuevas claves CART
- src/i18n/en.json → nuevas claves CART

### Referencia (solo lectura):
- src/data/rental.ts → interfaces, discountTiers, getDiscountedPrice
- src/lib/i18n.ts → helpers t(), localizedUrl(), getLocale()

## EMPIEZA

Comienza con M1 (T-001, T-002, T-003). Lee global.css, aplica los cambios, verifica. Después continúa con M2.
```

---

## Notas de uso

1. **Abre el terminal en VSCode** en la raíz del proyecto Obliq
2. **Ejecuta `claude`** para iniciar Claude CLI
3. **Pega el prompt completo** del bloque de arriba
4. Claude CLI leerá automáticamente CLAUDE.md (que ya tiene la identidad ADA)
5. En los Human Gates, Claude parará y te pedirá aprobación
6. Si necesitas retomar en otra sesión, Claude CLI leerá PLAN.md y .spec-engine/session-state.md para recuperar contexto
