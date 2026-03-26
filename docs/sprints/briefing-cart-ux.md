# Briefing Summary — Carrito de Presupuesto de Alquiler
Generated: 2026-03-18

## Objetivo

Implementar un sistema de carrito de presupuesto interactivo para el directorio de alquiler de equipos audiovisuales de Obliq Productions. El carrito permite al usuario seleccionar productos, configurar días de alquiler por producto (con descuentos multidía), y enviar una solicitud de presupuesto vía email con toda la información pre-rellenada. El comportamiento del carrito cambia según la sección de la web donde se encuentre el usuario.

## Target audience

Profesionales audiovisuales (directores de fotografía, productoras, realizadores) que necesitan alquilar equipos de cámara, ópticas, audio, estabilización, monitores y accesorios para producciones específicas. Buscan configurar un kit personalizado y solicitar presupuesto rápidamente.

## Core features (MVP)

### F-1: Cart State Management (client-side)
Store de carrito en JavaScript client-side con persistencia en localStorage. Cada item del carrito contiene: `productSlug`, `productName`, `categorySlug`, `price`, `days` (1/3/5/7), `image`. Una sola unidad por producto (no cantidades). Funciones: add, remove, updateDays, getTotal, clear, getCount.

### F-2: Botón "Añadir al presupuesto" funcional
Transformar los botones decorativos actuales (`pointer-events-none`) en ProductCard, PackCard y la ficha de producto [product].astro en botones interactivos que añadan el producto al carrito. Feedback visual al añadir (animación breve, cambio de estado). Si el producto ya está en el carrito, indicarlo visualmente y permitir quitarlo.

### F-3: Barra de carrito anclada (bottom bar) en directorio de alquiler
Franja fija en la parte inferior visible SOLO dentro de las páginas del directorio de alquiler (`/alquiler/*` y `/en/rental/*`). Muestra: número de productos, listado compacto con nombre + precio/día + selector de días, precio total calculado con descuentos, CTA "Solicitar presupuesto". Permite eliminar productos individuales. Se oculta si el carrito está vacío. Colapsa/expande con click.

### F-4: Botón de carrito en header (fuera del directorio)
Cuando el usuario navega fuera del directorio de alquiler (home, servicios, portfolio, contacto, etc.), la barra inferior desaparece y aparece un icono/botón de carrito en la zona superior derecha del Header, junto al LangSwitcher. Muestra badge con número de items. Al hacer click, despliega un mini-panel flotante con resumen del carrito y CTA.

### F-5: Selector de días por producto
Dentro de la barra de carrito (F-3) y el mini-panel (F-4), cada producto tiene un selector para elegir tramo de días: 1 día, 3 días (-10%), 5 días (-15%), 7 días (-20%). El precio se recalcula automáticamente usando la lógica existente de `getDiscountedPrice()` y `discountTiers`.

### F-6: CTA → mailto con presupuesto pre-rellenado
El botón principal del carrito genera un enlace `mailto:` que abre el cliente de email del usuario. El email va pre-rellenado con: destinatario (email de Obliq), asunto ("Solicitud de presupuesto — Obliq Productions"), cuerpo con lista de productos + días + precio unitario + subtotal por producto + total estimado. El usuario solo necesita añadir las fechas deseadas y enviar.

### F-7: Soporte i18n (ES/EN)
Todos los textos del carrito, barra, mini-panel y email deben soportar español e inglés, usando el sistema i18n existente (`src/i18n/es.json` y `en.json`).

## Out of scope

- Pasarela de pago / checkout con transacción económica
- Creación de cuentas de usuario / autenticación
- Historial de presupuestos o pedidos
- Carrito guardado en servidor (se usa localStorage)
- Cantidades múltiples del mismo producto (1 unidad por producto)
- Calendario con selección de fechas concretas (solo selector de tramos de días)
- Packs como item de carrito (los packs siguen enlazando a contacto directamente; se puede añadir en una fase posterior)
- Notificaciones push o email automático al equipo (el usuario envía email manualmente)

## Technical constraints

### Stack existente (no cambiar)
- **Framework:** Astro 5.x SSG (`output: 'static'` implícito, no hay `output: 'server'`)
- **CSS:** Tailwind CSS 4 (via Vite plugin)
- **Animaciones:** GSAP + ScrollTrigger
- **CMS:** WordPress headless (REST API) con fallback mock
- **i18n:** Sistema custom con `es.json` / `en.json` + helpers `t()`, `localizedUrl()`
- **Deploy:** SSG → Plesk vía Node.js + Passenger
- **Transiciones:** Astro ClientRouter (View Transitions) con TransitionMask custom

### Implicaciones técnicas clave
1. **SSG = sin server-side state.** El carrito DEBE ser 100% client-side (JavaScript en el navegador). Astro components son estáticos; toda la interactividad requiere `<script>` tags o islands con `client:*` directives.
2. **View Transitions activas.** Los scripts deben reinicializarse en `astro:after-swap`. El carrito debe sobrevivir a navegaciones client-side (el DOM se reemplaza pero localStorage persiste).
3. **Detección de sección.** Para decidir si mostrar la barra inferior o el botón en header, el JS debe detectar si la URL actual empieza por `/alquiler/` o `/en/rental/`.
4. **Datos de productos disponibles en build-time.** Los datos de `rental.ts` se renderizan estáticamente. El carrito client-side necesitará o bien data-attributes en el HTML renderizado, o bien un JSON estático generado en build que el JS pueda consumir.

### Archivos que se modificarán
| Archivo | Cambio |
|---------|--------|
| `src/components/cards/ProductCard.astro` | Botón "añadir" funcional con data-attributes |
| `src/components/cards/PackCard.astro` | Evaluar si los packs se añaden al carrito o se mantiene el CTA actual |
| `src/pages/alquiler/[category]/[product].astro` | Botón "añadir" en ficha de producto |
| `src/pages/en/rental/[category]/[product].astro` | Ídem en inglés |
| `src/components/organisms/Header.astro` | Añadir botón carrito con badge |
| `src/layouts/BaseLayout.astro` | Incluir componente de barra de carrito + script de inicialización |
| `src/i18n/es.json` | Nuevas claves para carrito |
| `src/i18n/en.json` | Ídem en inglés |

### Archivos nuevos a crear
| Archivo | Propósito |
|---------|-----------|
| `src/lib/cart-store.ts` | Lógica del carrito: add, remove, updateDays, getTotal, eventos |
| `src/components/organisms/CartBottomBar.astro` | Barra inferior anclada (HTML + script) |
| `src/components/organisms/CartHeaderButton.astro` | Botón + mini-panel en header |
| `public/data/products.json` | (Opcional) JSON estático con datos de productos para consumo client-side |

## Design direction

- **Estilo:** Minimalista, alineado con el diseño actual (blanco/negro, tipografía Montserrat, uppercase tracking en labels)
- **Bottom bar:** Fondo negro, texto blanco, altura compacta colapsada (~64px), expandible para ver lista de productos
- **Header button:** Icono de carrito minimalista (SVG), badge con número, alineado con el estilo del menú
- **Mini-panel:** Dropdown/flyout desde el header button, mismo estilo que las cards existentes
- **Animaciones:** GSAP para abrir/cerrar la barra y el panel, consistente con las transiciones existentes
- **Responsive:** Mobile-first. En móvil, la bottom bar ocupa todo el ancho; el mini-panel del header es fullscreen overlay
- **Touch targets:** Mínimo 44x44px en todos los botones interactivos

## Success metrics

- El usuario puede añadir productos al carrito desde cualquier página del directorio de alquiler
- El carrito persiste al navegar entre páginas del directorio
- El carrito persiste al navegar a otras secciones y volver
- La barra inferior aparece SOLO en páginas de `/alquiler/*` y `/en/rental/*`
- El botón en header aparece SOLO fuera del directorio de alquiler (y solo si hay items en el carrito)
- El CTA genera un email correctamente formateado con todos los productos, días y precios
- Los descuentos multidía se aplican correctamente al cambiar el selector de días
- Los textos funcionan en español e inglés
- No hay regresiones en Lighthouse (performance, a11y)
- El carrito sobrevive a las View Transitions de Astro

## Open questions

1. **Packs en el carrito:** ¿Los packs (Documental, Corporativo, Videoclip) deberían poder añadirse al carrito como un solo item con precio de pack, o se mantiene el CTA actual que lleva a contacto? (Diferido a fase posterior por alcance.)
2. **Email destino:** ¿A qué dirección de email se envía la solicitud? ¿`info@obliqproductions.com`? ¿O la misma que usa el formulario de contacto?
3. **Límite de productos:** ¿Hay un número máximo de productos en el carrito o es ilimitado?
4. **Vaciar carrito:** ¿Debería haber un botón "vaciar todo" además de eliminar productos uno a uno?

---

**Next step:** Ejecutar `spec-writer` para convertir este briefing en especificaciones técnicas formales y testeables.
