# Fase 0 — Auditoría del código real · Alquiler siempre con operador

> Encargo: *el alquiler de equipos se realiza **siempre con operador*** (300 € jornada / 200 € media jornada, entrega de brutos incluida).
> Rama auditada: `redesign` · Fecha: 23-jul-2026 · Emisor: Dirección IT (Grupo Antena).
> **Naturaleza de este documento: solo auditoría. No se ha escrito ni una línea de código de producción.** Fuente de verdad: el repo (`redesign`) y la API REST viva de `admin.obliqproductions.com`, no la documentación del proyecto.

---

## 0. Método y entorno

- **Repo real:** el proyecto Astro vive en `obliq/obliq/` (repo git con rama `redesign`, árbol limpio). La carpeta contenedora `Proyectos web/obliq/` es **otro** repo git distinto (solo screenshots, rama `main`, sin ficheros trackeados) — irrelevante para el encargo. Todo lo de abajo es relativo a la raíz del repo real (`obliq/obliq/`).
- **Rama:** trabajado y auditado sobre `redesign`. `main` (web vieja en producción) **no** se ha tocado. Ramas presentes: `main`, `redesign`, `plesk-migration`, `origin/develop`.
- **Verificación en vivo:** consultada la API REST pública `https://admin.obliqproductions.com/wp-json/wp/v2` (lectura anónima) para contrastar el mu-plugin contra la instalación real.
- **Cobertura:** frontend Astro (rutas, datos, precios, i18n), WordPress (CPTs, taxonomías, meta, endpoints), flujo de conversión (CTA → carrito → formulario → email) y SEO (JSON-LD).

## 1. Veredicto de arranque: **MODIFICAR**, no construir

El catálogo de alquiler **ya está construido** en `redesign`: estructura de fichas de tres niveles (índice → categoría → producto), datos servidos desde WordPress vía CPT, carrito de presupuesto funcional y schema `Product`. El encargo es por tanto **modificar un catálogo existente** para inyectar el modelo "siempre con operador", no partir de cero.

**Aviso de viabilidad (ZONA ROJA):** ninguna de las decisiones R1–R5 resulta *inviable* por el código. Pero **dos premisas del brief no se corresponden con el código** y obligan a replantear D3 y D4 (detalle en §7). No son bloqueos; son correcciones de rumbo antes de la Fase 1.

---

## 2. Frontend Astro — catálogo de alquiler

### 2.1 Rutas (fichas por producto, no scroll único)

| Ruta | Fichero | Qué genera |
|---|---|---|
| Índice ES | [src/pages/alquiler/index.astro](src/pages/alquiler/index.astro) | Landing: categorías + packs + destacados + CTA |
| Categoría ES | [src/pages/alquiler/[category].astro](src/pages/alquiler/[category].astro) | Grid de productos de la categoría |
| Ficha ES | [src/pages/alquiler/[category]/[product].astro](src/pages/alquiler/[category]/[product].astro) | Detalle de producto |
| Índice EN | `src/pages/en/rental/index.astro` | idem, `locale='en'` |
| Categoría EN | `src/pages/en/rental/[category].astro` | idem |
| Ficha EN | `src/pages/en/rental/[category]/[product].astro` | idem |

`getStaticPaths` de la categoría usa el slug **localizado** (`cat.slug.es` en ES, `cat.slug.en` en EN); el producto usa un `product.slug` **único no localizado**. Los dos árboles de idioma son **ficheros físicamente duplicados**, no una ruta dinámica `[lang]`.

### 2.2 Origen de los datos: WordPress (con fallback mock)

El catálogo se sirve desde WP en build time, a través de una fachada async en [src/data/rental.ts](src/data/rental.ts):

```js
// src/data/rental.ts:436
export async function getCategoriesAsync() {
  if (!isWPEnabled()) return categories;          // mock local (fallback)
  const wpCats = await wpGetCategories();
  return wpCats.length > 0 ? wpCats : categories;
}
```

`isWPEnabled()` es `true` porque `.env` define `WP_API_URL=https://admin.obliqproductions.com/wp-json/wp/v2`. Los arrays hardcodeados de `rental.ts` (6 categorías, 3 packs) son **solo fallback** si WP no responde.

- **`src/data/products.json` (29 KB) está muerto:** cero imports en `src/`. No es la fuente de datos.
- **Sin Google Sheets residual** en ninguna parte.

**Modelo de datos** (`RentalProduct`, [src/data/rental.ts](src/data/rental.ts):14):

```ts
interface RentalProduct {
  slug: string; name: string;              // no localizados
  description: { es: string; en: string };
  price: number;                           // €/día, SIN IVA
  image: string;
  specs: { es: string[]; en: string[] };
  category: string;
}
```

> **⚠️ Confirmado el punto crítico del encargo:** el modelo `RentalProduct` **no tiene ningún campo de operador** (`operator`, `operario`, `con operador`) ni lógica de obligatoriedad. `grep operator|operario|obligatorio` en `rental.ts` y las páginas: **cero resultados**. Todo el modelo actual asume alquiler de material pelado.

### 2.3 Precios en pantalla

El precio se muestra como entero + `€` literal + etiqueta i18n de "/día" + tag i18n de IVA. Componentes:

- [src/components/cards/ProductCard.astro](src/components/cards/ProductCard.astro):59 → `{price}€` + `{perDay}` + `{vat}` (grids índice/categoría).
- Ficha, [src/pages/alquiler/[category]/[product].astro](src/pages/alquiler/[category]/[product].astro):70 → `{product.price}€` a 32px + `/día` + `+ IVA`, más **tabla de descuentos multi-día** (1/3/5/7 días → 0/10/15/20 %).
- [src/components/cards/ProductCompactCard.astro](src/components/cards/ProductCompactCard.astro):19 → precio + /día, **sin** tag IVA (productos relacionados).
- [src/components/cards/PackCard.astro](src/components/cards/PackCard.astro) → `dailyPrice`, ahorro %, precio individual tachado.

Etiquetas (bloque `RENTAL` de [src/i18n/es.json](src/i18n/es.json) / [src/i18n/en.json](src/i18n/en.json)):

| Clave | ES | EN |
|---|---|---|
| `PER_DAY` | `/día` | `/day` |
| `VAT` | `+ IVA` | `+ VAT` |
| `ADD_TO_QUOTE` | `AÑADIR AL PRESUPUESTO` | `ADD TO QUOTE` |

> `PricingCard.astro` / `PricingSection.astro` **no son de alquiler** — los usa la vertical de Servicios (etiqueta `/mes`). No tocar por este encargo.

### 2.4 i18n: híbrido de dos sistemas

1. **Microcopy de UI → claves JSON.** [src/lib/i18n.ts](src/lib/i18n.ts) importa `es.json`/`en.json`; `t(locale).RENTAL` da las etiquetas. Cada página fija `const locale = 'es'|'en'` **hardcodeado** (no runtime).
2. **Contenido del catálogo → datos bilingües.** Los objetos de `rental.ts`/WP llevan `.es` y `.en` inline; las páginas eligen rama con `.es`/`.en`. Los transformadores WP rellenan `.en` desde meta `*_en` con fallback al ES.

Implicación para el encargo: **nada de texto ES hardcodeado** — todo texto nuevo va a claves nuevas del bloque `RENTAL` (ambos idiomas) o a campos bilingües en WP.

---

## 3. WordPress / mu-plugin

> **Corrección de nomenclatura:** pese al framing "JetEngine", el backend **no** usa JetEngine. Es un mu-plugin escrito a mano ([scripts/obliq-cpts.php](scripts/obliq-cpts.php), ~45 KB) con `register_post_type` / `register_post_meta` / `register_rest_field` + metaboxes nativos. **No hay capa de UI JetEngine que extender: se edita PHP.** El único rastro "jet" son helpers de nombre en el frontend (`jetBool`, `jetNum`, `jetRepeater`) heredados de vertex-web.

### 3.1 CPTs (7) y su meta — verificados en la API viva

| CPT | rest_base | Rol | Meta clave |
|---|---|---|---|
| `servicio` | `servicio` | Servicios | `sv_pricing_es/_en` (repeater tarifas JSON), `sv_long_description_*`, `sv_features_*` |
| `portfolio` | `portfolio` | Proyectos | `pf_vimeo_url`, `pf_client`, `pf_year`, `pf_image` |
| `director` | `director` | Equipo | `dr_role_*`, `dr_photo` |
| **`alquiler`** | `alquiler` | **Producto de alquiler** | `al_slug`, `al_description_*`, **`al_price`** (€/día), `al_order`, `al_specs_*`, `al_image` |
| **`alquiler_pack`** | `alquiler_pack` | **Pack/bundle** | `ap_slug`, `ap_name_en`, `ap_description_*`, **`ap_daily_price`**, `ap_savings`, `ap_items` |
| `cliente` | `cliente` | Logos | `cl_order`, `cl_logo` |
| **`contenido`** | `contenido` | **Textos globales de página (singleton)** | 49 campos por `_obliq_key` (`about`/`contact`/`home`) |

**Taxonomías (2):** `rental_category` (sobre `alquiler`, con term-meta `rc_slug_en`/`rc_name_en`/`rc_description_*`/`rc_icon`) y `portfolio_category` (sobre `portfolio`).

### 3.2 Dónde puede vivir la tarifa de operador (insumo para D1)

- **No existe** CPT "tarifa", ni concepto operador/proveedor (grep `tarifa|rate|operator|bundle` → solo `alquiler_pack` y código de carrito).
- **No hay Options Page**, ni ACF, ni `register_setting`, ni `add_options_page` (grep → cero). El único `get_option` es un flag interno del seeder.
- **El patrón establecido para "ajustes globales editables" es el CPT `contenido`:** singletons de solo-lectura anónima ([scripts/obliq-cpts.php](scripts/obliq-cpts.php):695) discriminados por `_obliq_key`. Ahí ya viven los **datos globales de contacto** del sitio (`ct_email`, `ct_phone`, `ct_whatsapp`, `ct_address_*`) que consumen footer, WhatsApp FAB y el JSON-LD LocalBusiness. Es el hueco natural para una **tarifa de operador global** (una sola entidad, editable en WP, sin URL pública).

Candidatos reales para D1, en orden de menor fricción: **(a) nuevo `_obliq_key` en `contenido`** (p.ej. `alquiler`) · **(b) campos nuevos en `alquiler_pack`** (si la tarifa se modela como "pack de servicio") · **(c) CPT nuevo** (máximo trabajo). Se decide en Fase 1.

### 3.3 Coste de añadir un meta field

Cada campo nuevo debe declararse en **5 sitios sincronizados a mano** por CPT: `register_post_meta` · lista REST (`register_rest_field`) · HTML del metabox · mapa de guardado (`save_post`) · interfaz TS (`wp-types.ts`) — más su `transform*` en `wp-client.ts`. Verboso pero muy pautado.

### 3.4 Deploy hook — ya cubre todo

[scripts/obliq-deploy-hook.php](scripts/obliq-deploy-hook.php):24 dispara rebuild (debounce 90 s → `repository_dispatch`) para:

```php
OBLIQ_DEPLOY_CPTS  = array('portfolio','servicio','alquiler','alquiler_pack','director','cliente','contenido');
OBLIQ_DEPLOY_TAXOS = array('portfolio_category','rental_category');
```

> **Consecuencia:** si la tarifa de operador se aloja en `contenido` o `alquiler_pack` (opciones a/b), **no hay que tocar el deploy hook**. Solo un CPT *nuevo* (opción c) obligaría a añadirlo a la lista — uno de los gates de la Fase 2.

### 3.5 Endpoints que consume el frontend

[src/lib/wp-client.ts](src/lib/wp-client.ts) → core WP REST (`/wp-json/wp/v2/<rest_base>`, `per_page=100&_embed=1`). Relevantes al encargo:

- `getRentalCategories()` → term `rental_category` + CPT `alquiler`, unidos por `p.rental_category?.includes(term.id)`.
- `getRentalPacks()` → CPT `alquiler_pack`.
- `getContenido()` → CPT `contenido`, devuelve `{about, contact, home}` discriminado por `_obliq_key`.

Los campos custom llegan **a nivel raíz** del objeto post (no bajo `meta`) por el `register_rest_field`. Números como string → `jetNum`; media como URL/objeto → `jetMediaUrl`; repeaters como array/objeto → `jetRepeater`.

---

## 4. Flujo de conversión — **es un carrito, no un `?producto=X`**

### 4.1 El CTA "Alquilar" añade al carrito

En tarjetas y ficha, el CTA primario es un `<button class="cart-add-btn">` con `data-*` del producto que llama a `toggleCart()`:

```js
// src/components/cards/ProductCard.astro:113  y  [product].astro:178
const item = { productSlug, productName, categorySlug, price: parseFloat(...), image, days: 1 };
const added = toggleCart(item);   // toggle add/remove en localStorage
```

**No existe ningún flujo `?producto=X` en la sección de alquiler.** El único `?producto=`/`?pack=` del código alimenta el campo oculto `interest` del **formulario de contacto genérico** ([src/lib/contact-form.ts](src/lib/contact-form.ts):36), que **no** es la vía de conversión del alquiler.

### 4.2 El carrito de presupuesto

- **Store:** [src/lib/cart-store.ts](src/lib/cart-store.ts), `localStorage` key `obliq-quote-cart`, evento `cart:updated`.
- **`CartItem`:** `{ productSlug, productName, categorySlug, price, image, days, packName? }`. **Sin `quantity`** (dedup por slug), **sin fechas por ítem**, y **sin `modalidad`**. La única dimensión de alquiler por ítem es `days ∈ {1,3,5,7}` con descuentos 0/10/15/20 %.
- **Visibilidad:** barra inferior solo en `/alquiler/*` y `/en/rental/*` cuando hay ítems.
- **Handoff:** el carrito no envía; su CTA enlaza a la página de presupuesto (`/presupuesto` ES, `/en/quote` EN), que serializa `getCartDataForQuote()` y hace POST.

### 4.3 Endpoints PHP

**El alquiler va por [public/api/send-quote.php](public/api/send-quote.php)** (basado en carrito), NO por `send-contact.php`.

| | `send-quote.php` (ALQUILER) | `send-contact.php` (contacto genérico) |
|---|---|---|
| Campos | `company*`, `email*`, `phone*`, `startDate*`, `days`, `notes`, `total`, `discount`, `products[]*` | `name*`, `email*`, `message*`, `phone?`, `company?`, `service?`, `interest?` |
| `products[]` | cada uno: `name`, `days`, `price`, `subtotal`, `packName` | — |
| Destino | `info@obliqproductions.com` | `info@obliqproductions.com` |
| Email | tabla de productos + descuento + **total + "IVA no incluido"** + datos + fechas | tabla de contacto + mensaje |
| Anti-spam | honeypot + token SHA-256 + min-3s + rate 5/600s | idéntico |
| `clean()` | `htmlspecialchars(trim, ENT_QUOTES, UTF-8)` | idem + `headerSafe()` en Subject |

Página de presupuesto [src/pages/presupuesto.astro](src/pages/presupuesto.astro): campos `company/email/phone/startDate/notes` + honeypot; `days` derivado del carrito; POST a `/api/send-quote.php` y `clearCart()` al éxito. Gemela EN `src/pages/en/quote.astro` → mismo endpoint.

> **Implicación mayúscula para D3:** el campo `modalidad` **no** viaja como query param desde la ficha (ese flujo no existe) ni se sanea en `send-contact.php` (endpoint equivocado). Como R2 fija el operador **por solicitud** (no por producto), el sitio natural del selector `jornada / media jornada` es **la página de presupuesto**, y su validación va en **`send-quote.php`**. El carrito es por-solicitud → encaja 1:1 con "una modalidad por solicitud".

---

## 5. SEO / JSON-LD

Inventario de `@type` emitidos ([src/lib/schema.ts](src/lib/schema.ts)):

| @type | Builder | Rutas |
|---|---|---|
| `LocalBusiness` (`#organization`, address, geo) | `localBusinessSchema()` | **Todas** ([src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro):89) |
| `Product` (+ `Offer`) | `productSchema()` :88 | Ficha de producto ES + EN |
| `BreadcrumbList` | `breadcrumbSchema()` :57 | Ficha, categoría, servicio (ES + EN) |
| `Service` (+ provider `@id`, `areaServed`) | `serviceSchema()` :70 | `/servicios/[slug]` (ES + EN) |

No hay `WebSite`, `Organization` suelto, `SearchAction`, `ItemList`/`OfferCatalog`, ni `AggregateRating`.

**El riesgo D4, confirmado.** La ficha emite:

```js
// src/pages/alquiler/[category]/[product].astro:38
const schema = productSchema(product.name, String(product.price), product.image);
```

```ts
// src/lib/schema.ts:88 → produce:
'@type': 'Product', name, image,
offers: { '@type':'Offer', price /* "110" */, priceCurrency:'EUR',
          availability:'https://schema.org/InStock' }
```

Es decir, publica `Offer.price = "110" EUR` + `InStock` (el precio pelado del material, p.ej. Sony FX6). **Con operador obligatorio, ese es un precio que no se puede contratar** → rich snippet engañoso, riesgo de mismatch en Google. Presente en ES y EN. `serviceSchema()` acepta `price` opcional pero **nunca** se le pasa, así que hoy no emite `offers` en Servicios.

---

## 6. Estado de las decisiones ZONA ROJA (R1–R5) frente al código

| # | Decisión | ¿Viable en el código? | Nota |
|---|---|---|---|
| R1 | Aditivo: `TOTAL = material + operador` | ✅ | El carrito ya suma subtotales; añadir una línea de operador al total de `send-quote` es directo. **Sujeto a confirmación de Víctor** (si "tarifa cerrada", replantear R1/R5/D4). |
| R2 | Operador por solicitud, mín. media jornada | ✅ y **alineado** | El carrito es por-solicitud → una `modalidad` por presupuesto. |
| R3 | 300 € / 200 € **+ IVA** | ✅ | Todo el catálogo ya es sin IVA ("IVA no incluido" en el email). |
| R4 | Entrega de brutos incluida | ✅ | Copy + campo editable. Sin campo hoy. |
| R5 | Precios de catálogo siguen visibles | ✅ | No requiere cambio; sí re-etiquetado (D2). |

**Ninguna R es inviable.** No hay bloqueo que obligue a parar el encargo por el lado técnico.

---

## 7. Discrepancias contra la sección 1 del brief

| # | El brief asume | La realidad del código | Severidad |
|---|---|---|---|
| **DISC-1** | Aplica a **`/servicios/alquiler/`** (página de servicio) | **No existe** ningún `servicio` con slug `alquiler`. Los 9 servicios son consultoría, postproducción, fotografía, eventos, videoclips, spots, vídeo corporativo, RRSS, streaming. El alquiler es su **propia vertical** (`/alquiler/`), no un servicio. Confirmado en datos y en la API viva. | **Alta** — hay que decidir en Fase 1: (a) crear un `servicio` slug `alquiler`, o (b) tratar `/alquiler/index` como la "página de servicio" y poner ahí el mensaje de vertical. |
| **DISC-2** | El botón "Alquilar" pasa **`?producto=X&modalidad=jornada`** y se valida en **`send-contact.php`** | El CTA **añade al carrito** (localStorage); el alquiler se envía por **`send-quote.php`**. `send-contact.php` es el contacto genérico y no interviene. | **Alta** — reescribe D3: `modalidad` va en la página de presupuesto y se valida en `send-quote.php`. |
| **DISC-3** | Fase 0 lista `/alquiler/`, `/alquiler/[producto]/` | La ficha real es de **dos niveles**: `/alquiler/[category]/[product]/`. Los slugs de categoría son localizados. | Media — solo precisión de rutas. |
| **DISC-4** | "JetEngine, Options Page disponible" | Backend **sin JetEngine** y **sin Options Page**. El patrón de ajustes globales es el CPT `contenido`. | Media — cambia D1: no hay Options Page que usar; se replica el patrón `contenido`. |
| **DISC-5** | El carrito de presupuesto está **fuera de alcance** (§7) | El carrito **es** el mecanismo de conversión del alquiler. Añadir el selector `modalidad` y la línea de operador **toca** la página de presupuesto y `send-quote.php`. | Media — hay que acotar: "no construir un carrito nuevo" (eso sí está fuera) ≠ "no añadir un campo al carrito existente" (necesario). Confirmar con Víctor. |
| DISC-6 | Repo `VictorGrupoAntena/obliq` | El repo real es el anidado `obliq/obliq/` (la carpeta contenedora es otro repo con solo screenshots). | Baja — solo entorno. |

---

## 8. Lo que NO sabemos (campos a dejar editables con texto provisional en WP)

Del propio brief §2, pendiente de cliente — **no inventar**:

- Formato y plazo de entrega de brutos (disco físico / nube / transferencia; nº de días).
- Si la media jornada tiene límite horario (¿4 h?) y si hay tarifa de hora extra.
- Si hay desplazamiento incluido y en qué radio (la web menciona Valencia, Alicante, Castellón).

## 9. Decisiones abiertas que la Fase 1 debe resolver (sin proponer plan aquí)

1. **R1 — confirmación de Víctor:** ¿aditivo (material + operador) o tarifa cerrada? Si cerrada → cambian R1, R5 y todo el Schema `Product/offers`, y se vuelve a Fase 1 a replantear.
2. **DISC-1:** ¿crear servicio `alquiler` o usar `/alquiler/index` como página de vertical?
3. **DISC-5:** confirmar que "añadir un campo al carrito existente" está permitido pese al §7.
4. **D1:** `contenido` (nuevo `_obliq_key`) vs. `alquiler_pack` vs. CPT nuevo para la tarifa.
5. **D3:** forma del selector `modalidad` en la página de presupuesto y su validación en `send-quote.php`.
6. **D4:** cómo rehacer el `Product/offers` para no publicar un precio no contratable (p.ej. `Service` + `priceSpecification`, u `offers` compuesta).

---

**Fin de Fase 0. Parada obligatoria: espera aprobación antes de la Fase 1 (plan).** No se ha modificado ningún fichero de producción; el único cambio en el árbol es este documento de auditoría.
