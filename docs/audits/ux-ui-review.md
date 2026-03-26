# Revisión UX/UI — Obliq Productions
Generated: 2026-03-18

---

## Resumen ejecutivo

El sitio tiene una estética oscura premium coherente con una productora audiovisual, pero sufre de **3 problemas recurrentes**: contraste insuficiente en textos secundarios, falta de separación visual entre cards sobre fondos oscuros, y estados interactivos poco visibles. A continuación se detallan los hallazgos organizados por severidad.

---

## 1. Hallazgos Críticos (WCAG AA fallidos)

### 1.1 `text-muted` (#888) sobre fondos oscuros — Ratio 3.5-4:1
**Afecta a:** Tag.astro, PackCard, PricingCard, Footer, Header labels
**Problema:** `#888888` sobre `#111111` da ratio 3.6:1 y sobre `#000000` da 4:1. WCAG AA exige 4.5:1 para texto normal y 3:1 para texto grande (≥18px bold o ≥24px). Muchos usos de `text-muted` son en texto de 10-12px, donde falla WCAG AA claramente.

**Archivos y líneas afectadas:**

| Archivo | Línea | Uso |
|---------|-------|-----|
| `atoms/Tag.astro` | 12 | Labels de sección |
| `cards/PackCard.astro` | 41, 51, 66, 73 | Nombre pack, /día, "incluye", precios unitarios |
| `cards/PricingCard.astro` | 38 | Periodo de facturación |
| `cards/ProductCard.astro` | 45, 57, 59 | Specs, /día, IVA |
| `organisms/Footer.astro` | 80, 99, 115, 128 | Títulos de columna, copyright |
| `organisms/Header.astro` | 45, 71 | Links inactivos (via opacity-80) |

**Solución propuesta:** Crear nuevo token `--color-text-dim: #AAAAAA` (ratio 5.2:1 vs #111, 6.3:1 vs #000). Reemplazar `text-muted` por `text-dim` en todos los textos que necesitan ser legibles. Mantener `text-muted` (#888) solo para elementos decorativos no informativos.

### 1.2 ProductCard (dark) — Card negra sobre fondo negro
**Archivo:** `cards/ProductCard.astro` línea 33
**Problema:** `bg-black` sin borde. Sobre fondos `bg-black` o `bg-surface-dark`, las cards se funden completamente. No hay separación visual.

**Solución propuesta:**
```diff
- isDark ? 'bg-black' : 'bg-white border border-border-light',
+ isDark ? 'bg-surface-dark border border-white/20' : 'bg-white border border-border-light',
```

### 1.3 Inputs/Textareas — Campo invisible
**Archivos:** `atoms/Input.astro` línea 13, `atoms/Textarea.astro` línea 13
**Problema:** `bg-black/10` con solo borde inferior. El campo de escritura es indistinguible del fondo. Los usuarios no saben dónde pueden escribir.

**Solución propuesta:**
```
bg-surface-dark border border-border focus:border-white
```

---

## 2. Hallazgos importantes (UX degradada)

### 2.1 PackCard — Sin borde, se funde con el fondo
**Archivo:** `cards/PackCard.astro` línea 40
**Problema:** `bg-surface-dark p-8` sin ningún borde. Sobre fondo negro, la card apenas se distingue. Las líneas divisorias internas usan `border-border/30` (línea 71) que es prácticamente invisible.

**Solución propuesta:**
```diff
- <div class="pack-card bg-surface-dark p-8 flex flex-col h-full">
+ <div class="pack-card bg-surface-dark border border-white/20 p-8 flex flex-col h-full">
```
Y cambiar `border-border/30` a `border-border` en línea 71.

### 2.2 ServiceCard (sin imagen) — CTA invisible hasta hover
**Archivo:** `cards/ServiceCard.astro` líneas 35, 40
**Problema:** El CTA tiene `opacity-0` por defecto, solo aparece en hover. Los usuarios no saben que la card es clickable. Además, la card sin imagen (`bg-surface-dark`) no tiene borde.

**Solución propuesta:**
```diff
- class="group bg-surface-dark p-6 flex flex-col justify-between"
+ class="group bg-surface-dark border border-white/20 p-6 flex flex-col justify-between"
```
Y cambiar CTA de `opacity-0 group-hover:opacity-100` a `opacity-60 group-hover:opacity-100`.

### 2.3 Header — Diferencia activo/inactivo demasiado sutil
**Archivo:** `organisms/Header.astro` líneas 44-45, 70-71
**Problema:** Links inactivos usan `opacity-80` vs activos `opacity-100`. La diferencia del 20% de opacidad es casi imperceptible. Solo `font-bold italic` distingue el activo.

**Solución propuesta:** Cambiar inactivos a `opacity-60` para mayor contraste. O usar `text-secondary` para inactivos y `text-white` para activo.

### 2.4 Footer — Títulos de sección ilegibles
**Archivo:** `organisms/Footer.astro` líneas 80, 99, 115
**Problema:** `text-[10px] text-muted uppercase tracking-widest`. El tamaño 10px combinado con #888 sobre negro es prácticamente ilegible.

**Solución propuesta:**
```diff
- text-[10px] font-semibold uppercase tracking-widest text-muted
+ text-[11px] font-semibold uppercase tracking-widest text-secondary
```

### 2.5 Copyright — Contraste insuficiente
**Archivo:** `organisms/Footer.astro` línea 128
**Problema:** `text-[12px] text-muted` sobre `bg-black`. Ratio 4:1, falla WCAG AA para texto de 12px.

**Solución propuesta:** Cambiar a `text-secondary` o al nuevo `text-dim`.

---

## 3. Propuesta del sistema de colores mejorado

### Tokens actuales vs propuestos

```css
@theme {
  /* === EXISTENTES (mantener) === */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-surface-dark: #111111;
  --color-surface-light: #F5F5F5;
  --color-border: #333333;
  --color-muted: #888888;           /* → solo decorativo */
  --color-secondary: #CCCCCC;
  --color-border-light: #DDDDDD;

  /* === NUEVOS (añadir) === */
  --color-dim: #AAAAAA;             /* texto legible secundario sobre dark */
  --color-border-emphasis: #555555; /* bordes más visibles sobre dark */
  --color-surface-elevated: #1A1A1A;/* cards elevadas sobre surface-dark */
}
```

### Reglas de uso

| Token | Ratio vs #000 | Ratio vs #111 | Usar para |
|-------|---------------|---------------|-----------|
| `text-white` | 21:1 | 17:1 | Títulos, texto primario |
| `text-secondary` (#CCC) | 13:1 | 10:1 | Descripciones, párrafos |
| `text-dim` (#AAA) **NUEVO** | 8:1 | 6.3:1 | Labels, metadata, specs |
| `text-muted` (#888) | 5:1 | 3.6:1 | Solo decorativo / tooltips |
| `border-white/20` | — | — | Bordes de cards sobre dark |
| `border-emphasis` (#555) **NUEVO** | — | — | Separadores internos |

---

## 4. Propuesta visual: Patrón "cajas grises con borde blanco"

Implementar de forma consistente en todas las cards sobre fondo oscuro:

### Patrón base
```css
/* Card elevada sobre fondo oscuro */
.card-elevated {
  background: var(--color-surface-dark);    /* #111 */
  border: 1px solid rgba(255, 255, 255, 0.2); /* blanco 20% */
  transition: border-color 0.3s ease;
}

.card-elevated:hover {
  border-color: rgba(255, 255, 255, 0.4);  /* blanco 40% en hover */
}
```

### Dónde aplicar

| Componente | Cambio |
|------------|--------|
| **ProductCard (dark)** | `bg-black` → `bg-surface-dark border border-white/20` |
| **PackCard** | `bg-surface-dark` → `bg-surface-dark border border-white/20` |
| **ServiceCard (sin imagen)** | `bg-surface-dark` → `bg-surface-dark border border-white/20` |
| **PricingCard (no highlighted)** | `bg-surface-dark` → `bg-surface-dark border border-white/20` |
| **QuoteCartPreview** | `bg-black` → `bg-surface-dark border border-white/20` |
| **Futuro CartBottomBar** | Aplicar mismo patrón |

### Variante enfatizada (para cards destacadas)
```css
/* Borde blanco sólido — para cards de oferta, packs destacados */
border: 2px solid white;
```

---

## 5. Sugerencias adicionales (nice to have)

### 5.1 Peso de fuente en párrafos
**Archivo:** `atoms/Paragraph.astro` — el `font-light` (300) global reduce legibilidad sobre fondos oscuros. Considerar subir a `font-normal` (400) como base.

### 5.2 Focus states
Los botones y links no tienen estilos `:focus-visible` personalizados. Astro genera `outline` por defecto pero no contrasta bien sobre fondos oscuros.

**Propuesta:** Añadir a `global.css`:
```css
:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
```

### 5.3 Hover en CategoryCard
**Archivo:** `cards/CategoryCard.astro` — sobre fondo blanco, la card tiene borde sutil. Añadir `hover:border-black` y `hover:shadow-md` para feedback interactivo más claro.

### 5.4 Mobile menu — Sin separadores
**Archivo:** `organisms/Header.astro` línea 103 — El menú mobile es una lista de links sin separación visual. Añadir `border-b border-border` entre items mejoraría la legibilidad.

---

## 6. Resumen de cambios por archivo

| Archivo | Cambios | Severidad |
|---------|---------|-----------|
| `styles/global.css` | +3 tokens color, +focus-visible | Crítico |
| `atoms/Tag.astro` | `text-muted` → `text-dim` | Crítico |
| `atoms/Input.astro` | Fondo + borde completo | Crítico |
| `atoms/Textarea.astro` | Fondo + borde completo | Crítico |
| `atoms/Paragraph.astro` | font-light → font-normal | Sugerencia |
| `cards/ProductCard.astro` | +borde, fix specs color | Crítico |
| `cards/PackCard.astro` | +borde card, fix bordes internos | Importante |
| `cards/ServiceCard.astro` | +borde, CTA siempre visible | Importante |
| `cards/PricingCard.astro` | Fix text-muted → text-dim | Crítico |
| `cards/CategoryCard.astro` | +hover:border-black + shadow | Sugerencia |
| `organisms/Header.astro` | opacity-80 → opacity-60 | Importante |
| `organisms/Footer.astro` | Fix títulos + copyright color | Importante |
| `sections/QuoteCartPreview.astro` | +borde, text fix | Importante |

---

**Siguiente paso:** Integrar estos cambios como parte del sprint del carrito, ya que muchos componentes afectados (ProductCard, PackCard) se modificarán también para la funcionalidad del carrito.
