# Spec: Formulario de Solicitud de Presupuesto

**Fecha:** 2026-03-26
**Estado:** Aprobado
**Rama:** redesign

## Problema

El botón "Solicitar presupuesto" del carrito de alquiler genera un `mailto:` link que abre el cliente de email del usuario. Esto produce una experiencia inconsistente (depende del cliente de email configurado) y no captura datos estructurados del cliente.

## Solución

Sustituir el flujo `mailto:` por un **formulario integrado** en una página dedicada que:

1. Muestra el resumen de productos del carrito (precargado de localStorage)
2. Recoge datos de contacto del cliente
3. Envía un email profesional a Obliq vía PHP server-side

## Decisiones de arquitectura

| Decisión | Valor | Razón |
|----------|-------|-------|
| Backend | PHP en `public/api/send-quote.php` | Plesk ejecuta PHP nativo, sin cambiar Astro SSG |
| UX | Página dedicada `/presupuesto` y `/en/quote` | Más espacio, mejor UX móvil |
| Fechas | `<input type="date">` nativo + días del carrito | Sin dependencias, funciona bien en móvil |
| Email destino | info@obliqproductions.com | Email principal de contacto |
| Email sender | `mail()` de PHP (fallback: PHPMailer) | Disponible en Plesk por defecto |

## Flujo de usuario

```
Carrito → clic "Solicitar presupuesto"
  → Navega a /presupuesto (o /en/quote)
    → Página lee carrito de localStorage
      → Si vacío: mensaje + link a /alquiler
      → Si tiene productos:
          ┌─────────────────┬──────────────────┐
          │ Resumen productos│ Formulario       │
          │ (izquierda)     │ (derecha)        │
          └─────────────────┴──────────────────┘
        → Usuario rellena datos + envía
          → fetch() POST a /api/send-quote.php
            → Éxito: confirmación + vaciar carrito
            → Error: mensaje + opción reintentar
```

## Campos del formulario

### Precargados (del carrito)

- Lista de productos (nombre, cantidad, precio/día, subtotal)
- Días de alquiler por producto
- Descuento multidía aplicado (10%/15%/20%)
- Total estimado (IVA no incluido)

### Datos del cliente (requeridos)

| Campo | Tipo | Validación |
|-------|------|-----------|
| Nombre de empresa | `text` | Requerido, min 2 chars |
| Email | `email` | Requerido, formato email válido |
| Teléfono | `tel` | Requerido, min 6 chars |
| Fecha de inicio | `date` | Requerido, >= hoy |

### Opcionales

| Campo | Tipo |
|-------|------|
| Notas adicionales | `textarea` |

### Anti-spam

| Campo | Tipo | Comportamiento |
|-------|------|---------------|
| `website` (honeypot) | `text` hidden | Si tiene valor → rechazar silenciosamente |

## Payload JSON (POST a /api/send-quote.php)

```json
{
  "products": [
    {
      "name": "Sony FX6",
      "slug": "sony-fx6",
      "price": 120,
      "days": 3,
      "subtotal": 324,
      "packName": null
    }
  ],
  "company": "Mi Productora SL",
  "email": "cliente@empresa.com",
  "phone": "+34 600 123 456",
  "startDate": "2026-04-15",
  "days": 3,
  "notes": "Necesitamos entrega en estudio",
  "total": 472.50,
  "discount": 10,
  "lang": "es",
  "website": ""
}
```

## Seguridad

- **Honeypot**: campo `website` oculto, si tiene valor → rechazar (bot)
- **Rate limiting**: máx 5 envíos por IP en 10 min (sesión PHP)
- **Sanitización**: `htmlspecialchars()` en todos los inputs
- **Validación server-side**: email format, campos no vacíos, products array válido
- **CORS**: `Access-Control-Allow-Origin` restringido a `obliqproductions.com`
- **No ejecutar HTML del usuario** en el email (texto plano para campos libres)

## Email enviado a Obliq

- **From**: noreply@obliqproductions.com
- **Reply-To**: email del cliente
- **To**: info@obliqproductions.com
- **Subject**: "Solicitud de presupuesto — [Empresa]" (o EN: "Quote request — [Company]")
- **Formato**: HTML
- **Contenido**:
  - Header: "OBLIQ PRODUCTIONS" (texto bold, sin imagen)
  - Tabla de productos (nombre, cantidad, días, precio/unidad, subtotal)
  - Línea de descuento si aplica
  - Total (IVA no incluido)
  - Datos del cliente (empresa, email, teléfono)
  - Fechas (inicio → devolución calculada)
  - Notas del cliente
  - Footer con timestamp

## Layout de la página

### Desktop (2 columnas)

| Columna izquierda | Columna derecha |
|-------------------|-----------------|
| Título: "Tu presupuesto" | Título: "Datos de contacto" |
| Lista de productos con precios | Campo: Empresa |
| Descuento multidía | Campo: Email |
| Subtotal | Campo: Teléfono |
| Total (IVA no incluido) | Campo: Fecha inicio |
| | Días: N (info del carrito) |
| | Devolución: calculada |
| | Campo: Notas (opcional) |
| | Botón: Solicitar presupuesto |

### Móvil

Stack vertical: resumen arriba, formulario abajo.

## Archivos

### Nuevos

- `src/pages/presupuesto.astro` — Página ES
- `src/pages/en/quote.astro` — Página EN
- `public/api/send-quote.php` — Backend PHP
- `docs/specs/2026-03-26-quote-form.md` — Este archivo

### Modificados

- `src/lib/cart-store.ts` — Eliminar `generateMailtoLink()`, añadir helpers
- `src/components/organisms/CartBottomBar.astro` — Botón → link a /presupuesto
- `src/components/organisms/CartHeaderButton.astro` — Botón → link a /presupuesto
- `src/i18n/es.json` — Claves `QUOTE.*`
- `src/i18n/en.json` — Claves `QUOTE.*`

## Entorno de pruebas

- **Vercel Preview**: Deploy automático de rama `redesign` para que el cliente pruebe
- El formulario es interactivo pero el envío PHP no funciona en Vercel
- Detección de entorno: si no es `obliqproductions.com`, mostrar "Envío simulado"
- El envío real se verifica en Plesk (producción)

## Criterios de aceptación

1. El botón "Solicitar presupuesto" navega a `/presupuesto` (ES) o `/en/quote` (EN)
2. La página muestra el resumen de productos del carrito con precios y descuentos
3. Si el carrito está vacío, muestra mensaje con enlace a `/alquiler`
4. El formulario valida campos requeridos antes de enviar
5. El honeypot rechaza envíos de bots
6. El email llega a info@obliqproductions.com con formato profesional
7. Tras envío exitoso, se vacía el carrito y se muestra confirmación
8. La página es responsive (desktop 2 columnas, móvil stack)
9. Las traducciones ES y EN funcionan correctamente
10. Los descuentos multidía se muestran correctamente (1d=0%, 3d=10%, 5d=15%, 7d=20%)
