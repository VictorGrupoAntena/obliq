# Fase 1 — Plan de ejecución · Alquiler siempre con operador

> Continuación de [docs/audits/alquiler-operador-fase0.md](../audits/alquiler-operador-fase0.md). Rama `redesign`. Fecha: 23-jul-2026.
> **Este documento propone. No ejecuta.** Formato: por cada decisión, recomendación + alternativa descartada + por qué. Al final: orden de ejecución y qué queda tras `git diff` en cada paso. **Parada obligatoria para aprobación antes de la Fase 2.**

## 0. Gates resueltos por Dirección (23-jul)

| Gate | Respuesta | Efecto |
|---|---|---|
| **R1** | **Aditivo**: `TOTAL = material + operador` (300 €/jornada · 200 €/media, + IVA). No es precio cerrado. | R1 y R5 se mantienen. El Schema `Product` se corrige (D4), no se rehace de raíz. |
| **DISC-1** | Se trata como **alquiler** (vertical propia), **no** se crea un `servicio` slug `alquiler`. | La "página de servicio de alquiler" = `/alquiler/index`. Ahí va el mensaje de vertical y el Schema `Service` (D4). |
| **DISC-5** | **Sí** se puede tocar la página de presupuesto y `send-quote.php`. | `modalidad` vive en el presupuesto; validación en `send-quote.php`. |

Modelo de negocio consolidado: **el operador es obligatorio por solicitud, mínimo media jornada.** Toda solicitud de alquiler lleva una línea de operador. `TOTAL = Σ(material · días · descuento) + operador(modalidad)`. Entrega de brutos incluida en la tarifa de operador.

---

## D1 — Dónde vive la tarifa de operador

**Recomendación: un singleton nuevo en el CPT `contenido`, `_obliq_key = 'alquiler'`.**

Campos nuevos (prefijo `op_`, bilingües donde aplica), definidos en `obliq_contenido_field_defs()` y sembrados en `obliq_contenido_seed()`:

| Campo | Tipo | Etiqueta metabox | Valor provisional sembrado |
|---|---|---|---|
| `op_jornada_price` | string(num) | Operador · jornada (€) | `300` |
| `op_media_price` | string(num) | Operador · media jornada (€) | `200` |
| `op_includes_es` / `op_includes_en` | string | Qué incluye (una línea por ítem) | `Operador profesional cualificado\nEntrega de brutos` / `Qualified operator\nRaw footage delivery` |
| `op_terms_es` / `op_terms_en` | string | Condiciones (provisional — revisar con cliente) | `Sin edición, etalonaje ni subtitulado. Formato y plazo de entrega de brutos a confirmar. Desplazamiento y límite de media jornada a confirmar.` / EN equivalente |

**Por qué:**
- Es el **patrón establecido** para ajustes globales editables en este backend. No hay Options Page de JetEngine (no existe JetEngine); el CPT `contenido` es el mecanismo que ya usan los datos globales de contacto.
- El cliente lo edita en una **pantalla WP nativa**, sin tocar código — cumple el criterio de D1.
- **Una sola entidad global** (el operador es por-solicitud, no por-producto): no hay que replicar la tarifa en cada producto ni pack.
- El **deploy hook ya cubre `contenido`** → cambiar el precio en WP dispara el rebuild sin tocar `obliq-deploy-hook.php`.
- Anónimamente legible para el SSG y consumible con el `getContenido()` existente (una petición, ya cacheada).

**Alternativa descartada — campos en `alquiler_pack`:** semánticamente incorrecto (la tarifa de operador no es un pack ni es por-bundle; aplica a cualquier solicitud, tenga packs o no). Obligaría a duplicar la tarifa por cada pack y no cubriría solicitudes sin pack.

**Alternativa descartada — CPT nuevo `tarifa`:** máximo trabajo (7 sitios de meta + metabox + transform), requeriría añadirlo a `OBLIQ_DEPLOY_CPTS`, y es sobredimensionado para una única entidad global.

---

## D2 — Presentación del precio en la ficha (que no induzca a error)

**Recomendación: mantener el precio/día del material bien visible (R5) pero re-etiquetarlo como "equipo" y añadir un aviso persistente de "siempre con operador".**

Microcopy nuevo (claves i18n, ES / EN):

| Clave | ES | EN |
|---|---|---|
| `RENTAL.WITH_OPERATOR_BADGE` | `Siempre con operador` | `Always with an operator` |
| `RENTAL.MATERIAL_LABEL` | `Equipo` | `Equipment` |
| `RENTAL.OPERATOR_NOTICE` | `El alquiler incluye siempre operador. Tarifa: {jornada} €/jornada · {media} €/media jornada (+ IVA). Entrega de brutos incluida.` | `Rental always includes an operator. Rate: {jornada} €/full day · {media} €/half day (+ VAT). Raw footage delivery included.` |
| `RENTAL.INCLUDES_TITLE` | `Qué incluye` | `What's included` |

Aplicación:
- **Tarjetas** (`ProductCard`, `PackCard`): un `Tag` "Siempre con operador" junto al precio. El precio se muestra como `Equipo · {price}€ /día + IVA` (prefijo `MATERIAL_LABEL`), de modo que se lee como el coste del equipo, no como el total.
- **Ficha** (`[category]/[product]`): el bloque de precio grande pasa a `Equipo · {price}€/día + IVA`, e inmediatamente debajo un **bloque "operador obligatorio"** alimentado desde `contenido.alquiler` (`OPERATOR_NOTICE` con los precios reales de WP interpolados + lista `op_includes_*` bajo `INCLUDES_TITLE`). La tabla de descuentos multi-día se mantiene, etiquetada como "descuento sobre el equipo".
- **Índice `/alquiler/`**: cabecera de la vertical con el mensaje "siempre con operador" + tarifa, también desde `contenido.alquiler`.

**Por qué:** cumple R5 (el precio del material sigue visible y correcto) y a la vez elimina la lectura "alquilo material solo": el prefijo `Equipo·` + el badge + el bloque de aviso hacen explícito el modelo sin que el usuario tenga que deducirlo.

**Alternativa descartada — mostrar en la tarjeta un total "material + operador" ya sumado:** imposible de hacer sin engañar, porque el operador es por-solicitud y depende de modalidad (jornada/media) y los días varían; una cifra sumada en la tarjeta sería tan engañosa como el precio pelado. Mejor material claramente etiquetado + aviso.

**Alternativa descartada — pasar el precio a "consultar":** viola R5.

---

## D3 — Operador multi-jornada (REPLANTEADO tras devolución de Dirección 23-jul)

### Respuesta desde el código: ¿la página de presupuesto tiene fechas o días? **SÍ.**

- **`startDate`** — `<input type="date">` **requerido** ([presupuesto.astro:113](../../src/pages/presupuesto.astro)), default hoy, `min=today` (líneas 231-235).
- **`days`** — existe, pero es **por ítem y derivado**: cada `CartItem` tiene `item.days ∈ {1,3,5,7}` (`DAY_OPTIONS`) con selector de días en el resumen (`buildDaysSelector`, líneas 251-265). El valor a nivel solicitud enviado al endpoint es `maxDays = Math.max(...cart.map(i => i.days))` (líneas 293, 426, 436). La **fecha de devolución** = `startDate + maxDays` (líneas 267-279).

⇒ Se toma la rama **"Si sí"**: se modela `n_jornadas` + `n_medias_jornadas`. **El selector binario desaparece.**

> Por qué el binario era insuficiente (razón de Dirección): con `startDate` + `days` una reserva es multi-día, y el operador puede trabajar un nº de jornadas distinto de los días de alquiler del equipo (p.ej. equipo 5 días, rodaje 2 jornadas + 1 media). Un radio jornada/media no puede expresar "2 jornadas completas + 1 media". Dos contadores sí.

### Recomendación

**Frontend** (`presupuesto.astro` + `en/quote.astro`) — dos contadores numéricos en el formulario, **independientes de los `days` del material**:
- `n_jornadas` — "Jornadas completas de operador ({jornada} €)" — `type=number`, `min=0`, entero.
- `n_medias_jornadas` — "Medias jornadas de operador ({media} €)" — `type=number`, `min=0`, entero.
- **Restricción R2:** `n_jornadas + n_medias_jornadas ≥ 1` (mínimo una media jornada). Validación con mensaje si es 0.
- Precios `{jornada}`/`{media}` inyectados en build desde `getContenido().alquiler` (`op_jornada_price`/`op_media_price`).
- **Resumen/total:** al material (`getTotal()`) se suma la **línea "Operador"** = `n·jornada + m·media`, recalculada en vivo al cambiar los contadores. Nueva fila desglosada en el resumen + gran total actualizado.
- **Default de los contadores:** ⏳ **pendiente de decisión del cliente** (Dirección: "el default en media jornada queda pendiente"). Hasta que se decida, arrancan en `0/0` y la restricción `≥1` obliga a una elección explícita — **sin default silencioso**. Marcado como decisión abierta.

**Carrito** (`cart-store.ts`): sin cambios de modelo (el operador es por-solicitud, no va en `CartItem`). La barra inferior de `/alquiler/*` muestra el total de material + nota `+ operador (se define en el presupuesto)`.

**Backend** (`send-quote.php`):
- Validar `n_jornadas` (int ≥0) y `n_medias_jornadas` (int ≥0); **rechazo 422 si `n+m < 1`**.
- `operator_jornada_price` / `operator_media_price` llegan del cliente (valor de WP visto por el visitante), saneados `(float) ≥ 0`, **informativos** — coherente con que el endpoint ya confía en `total`/`discount`; el email va a `info@` para revisión humana, no es transacción.
- Email: bloque **"Operador: {n} jornada(s) × {jornada} € + {m} media(s) × {media} € = {subtotal} €"** encima del total, con línea "Entrega de brutos incluida". El gran total ya incorpora el operador.

**Por qué:** expresa reservas multi-día reales (contadores independientes del alquiler de equipo), respeta R2 (mínimo media jornada, validado), usa el endpoint correcto (`send-quote`) y mantiene anti-spam/saneado existentes.

**Alternativa descartada — selector binario jornada/media (plan anterior):** devuelto por Dirección — no expresa reservas multi-día.

**Alternativa descartada — atar `n_jornadas` a los `days` del material:** incorrecto; las jornadas de operador y los días de alquiler del equipo son dimensiones distintas y deben poder diferir.

**Alternativa descartada — precios de operador hardcodeados en PHP:** rompería la editabilidad en WP (D1).

---

## D4 — Schema.org (no publicar un precio no contratable)

**Recomendación: quitar el `offers` con precio del `Product` de la ficha, y publicar el precio real y fijo (la tarifa de operador) como `Service` en `/alquiler/`.**

- **Ficha** (`productSchema`): emitir `Product` con `name`, `image` y `additionalProperty` (specs), **sin `offers` ni `price` ni `availability: InStock`**. Así no se anuncia un precio de producto que no se puede contratar.
- **`/alquiler/index`** (ES + EN): añadir un `Service` JSON-LD "Alquiler de equipos audiovisuales con operador", con `provider` → `#organization`, `areaServed` (Comunidad Valenciana), y `offers` con la **tarifa de operador** (precio fijo y realmente contratable) vía el `serviceSchema()` existente (que ya acepta `price` opcional y hoy no se usa con precio). Se publican los 300/200 € desde `contenido.alquiler`, no un precio de producto ficticio.

**Por qué:** con operador obligatorio, `Product/Offer/price:110 + InStock` anuncia un precio no honrable (riesgo de rich snippet engañoso y mismatch en Google, en ES y EN). Lo único que es un precio fijo y contratable es la **tarifa de operador** → es lo que debe ir estructurado. Además, el `Service` en `/alquiler/` da a la vertical el marcado que habría tenido la inexistente `/servicios/alquiler/` (coherente con la resolución de DISC-1).

**Alternativa descartada — recalcular `offers.price = material + 200` (suelo con media jornada obligatoria):** sigue siendo difuso (el material escala con los días) y sigue anunciando una cifra que no es el total real; más piezas móviles por menos honestidad.

---

## D5 — i18n

**Recomendación: microcopy fijo de UI en claves JSON nuevas (bloque `RENTAL`, ES+EN en el mismo commit); contenido editable por el cliente (precios, "qué incluye", condiciones/brutos) en `contenido.alquiler` como campos bilingües `*_es`/`*_en`.**

- Claves JSON nuevas (`src/i18n/es.json` + `en.json`): `WITH_OPERATOR_BADGE`, `MATERIAL_LABEL`, `OPERATOR_NOTICE`, `INCLUDES_TITLE`, `MODALITY_LABEL`, `MODALITY_FULL`, `MODALITY_HALF`, `MODALITY_REQUIRED`, `OPERATOR_LINE_LABEL`, `BRUTOS_INCLUDED`.
- Contenido variable (300/200, lista de inclusiones, condiciones provisionales) → WP, bilingüe, patrón `*_es`/`*_en` con fallback al ES (idéntico a `al_description_es/_en` etc.).
- **Nada hardcodeado en español.** Las páginas ES fijan `locale='es'` y las EN `locale='en'`, como el resto del catálogo.

**Por qué:** respeta la separación existente (JSON = chrome fijo; WP = contenido de cliente) y garantiza paridad ES/EN sin duplicar datos.

**Alternativa descartada — meter los precios/condiciones en las claves JSON:** los haría no editables por el cliente (rompe D1).

---

## D6 — Orden de ejecución y `git diff` por paso

Un commit por bloque. **Gates de parada** marcados 🔒 (brief §5).

| # | Paso | Ficheros que cambian (`git diff`) | Gate |
|---|---|---|---|
| 1 | **WP: singleton `contenido.alquiler`** — field defs, keys, seeder, `register_post_meta`, `register_rest_field`, metabox, save-map | `scripts/obliq-cpts.php` | 🔒 antes de crear meta en WP. **No** toca deploy-hook (contenido ya cubierto) — se confirma en el gate. |
| 2 | **Deploy mu-plugin a WP + seed** de `alquiler` con textos provisionales; verificar en REST que `contenido?_obliq_key=alquiler` responde | (ninguno en repo) | — |
| 3 | **Data layer**: exponer `alquiler` en `getContenido()` + tipos; **assert build-fail si falta precio (A2)** | `src/lib/wp-client.ts`, `src/lib/wp-types.ts` | — |
| 4 | **i18n**: claves nuevas ES+EN | `src/i18n/es.json`, `src/i18n/en.json` | — |
| 5 | **D2 — fichas/tarjetas/índice**: badge + `Equipo·` + bloque operador | `src/components/cards/ProductCard.astro`, `PackCard.astro`, `src/pages/alquiler/index.astro` + EN, `src/pages/alquiler/[category]/[product].astro` + EN | — |
| 6 | **D3 — presupuesto + endpoint**: contadores `n_jornadas`/`n_medias_jornadas` + total operador + validación `n+m≥1` | `src/pages/presupuesto.astro`, `src/pages/en/quote.astro`, `public/api/send-quote.php` (+ nota en barra `cart-store.ts`) | 🔒 antes de tocar `send-quote.php` |
| 7 | **D4 — schema + titles/meta (A1)**: quitar `offers` del `Product`; **verificar y retirar cualquier precio en title/description/OG** | `src/lib/schema.ts`, `[category]/[product].astro` + EN, `alquiler/index.astro` + EN | — |
| 8 | **Build + deploy a staging + verificación** | `MEMORY.md`, `docs/` | 🔒 verificar `npm run build` verde, cambio de precio en WP reflejado en staging, paridad ES/EN, `DEPLOY_TARGET` = staging |

Gates que **no** aplican: `send-contact.php` no se toca (el alquiler va por `send-quote.php`). `main` no se toca en ningún paso.

---

## Addenda de Dirección (23-jul) — incorporadas al plan

**D4 — aclaración aceptada:** se acepta la pérdida del rich snippet de precio en las fichas. **No se añade `Service` a las fichas** (páginas de producto). El `Service` va **solo** en la landing de la vertical `/alquiler/` (no es una ficha) — coherente con DISC-1. Si Dirección también quiere cero `Service` en la landing, se elimina ese sub-paso; en caso contrario se mantiene.

**A1 — Titles y meta descriptions.** Estado desde el código: el título de ficha es `{product.name} — Alquiler | Obliq Productions` ([BaseLayout.astro:40](../../src/layouts/BaseLayout.astro), `fullTitle = title + ' | Obliq Productions'`) y la description = `product.description.es`. **No hay precio de material en ningún `title`, `meta description`, `og:*` ni `twitter:*`** del código `redesign` (grep `€` en title/description/OG = 0; el formato "... - 110€/día | Obliq" pertenece al `main` viejo). → En el paso 7 se **verifica** OG/twitter/description y se retira cualquier precio si apareciera (p.ej. si un editor lo escribió en la description de WP); en el código actual no hay nada que retirar.

**A2 — Build FALLA si `op_jornada_price`/`op_media_price` no resuelven.** El data layer, tras leer `contenido.alquiler`, hace `assert` de que ambos precios están presentes y son numéricos `> 0`; si no → `throw` que rompe `npm run build`. **Sin fallback a vacío ni a 0.** Excepción deliberada al patrón general de fallback-a-mock: si WP no responde en build, el build falla (es preferible a publicar el alquiler sin tarifa de operador).

**A3 — Singleton `contenido.alquiler` inequívoco y localizable por el cliente.** El seed fija un `post_title` claro — **"Alquiler · Tarifa de operador"** — para que aparezca identificable en el listado de "Contenido de páginas" del admin de WP sin ayuda. Metaboxes con etiquetas explícitas (§D1).

**A4 — Provisional, no inventado.** `op_terms_es`/`op_terms_en` se siembran con texto **explícitamente marcado provisional y sin datos inventados**:
> `[PENDIENTE DE CONFIRMAR CON CLIENTE] Entrega de brutos: formato y plazo por definir. Media jornada: límite horario por definir. Desplazamiento: cobertura y radio por definir. Incluye operador y entrega de brutos; sin edición, etalonaje ni subtitulado.`

Ningún formato, plazo, nº de horas ni radio se inventa. Se marcará en el informe de cierre.

**A5 — Bilingüe = campos paralelos `_es`/`_en`, no WPML/Polylang.** Confirmado desde el código: grep `wpml|polylang|pll_|icl_|qtranslate` en `scripts` + `src` = **cero**. El backend usa exclusivamente meta paralelos `*_es`/`*_en`. D5 ya sigue ese patrón (`op_includes_es/_en`, `op_terms_es/_en`). No se abre ninguna decisión de plugin de i18n.

---

## Criterios de aceptación (traza)

- [ ] `/alquiler/`, `/alquiler/[cat]/[producto]/` explícitos en "siempre con operador" → D2, paso 5.
- [ ] Tarifa jornada/media + "qué incluye" (con brutos) editables desde WP, verificado en staging tras rebuild → D1, pasos 1-2, 8.
- [ ] Precio de material visible y bien etiquetado respecto al total (R1) → D2.
- [ ] Formulario recibe producto + modalidad; email a `info@obliqproductions.com` con ambos → D3, paso 6.
- [ ] Ningún `Product/offers` publica un precio no contratable → D4, paso 7.
- [ ] Paridad ES/EN → D5, todos los pasos.
- [ ] `npm run build` verde en staging; `DEPLOY_TARGET` = staging; sin cambios en `main`; sin secretos → paso 8.

## Pendiente de decisión (no bloquea la ejecución; se marca en el informe de cierre)

1. **Default de los contadores de operador** (Dirección): valor inicial de `n_jornadas`/`n_medias_jornadas`. Hasta decidir, arrancan en `0/0` con restricción `≥1` (elección explícita, sin default silencioso).
2. **`op_terms_*`** (cliente): formato/plazo de brutos, límite horario de media jornada, desplazamiento/radio — sembrados como PROVISIONAL (A4), editables en WP.
3. **`Service` en la landing `/alquiler/`** (Dirección): mantener o eliminar (ver addenda D4).

---

**Fin de Fase 1. Parada obligatoria: espera aprobación del plan antes de ejecutar la Fase 2.**

---

## Fase 2 — EJECUTADA (23-jul, `redesign`) + incorporaciones de Dirección

Aprobado D1/D2/D3/D4/D5/D6 + 3 incorporaciones. Ejecutado en 6 commits (un bloque lógico cada uno):

| Commit | Bloque |
|---|---|
| `2412bf6` | D1 — mu-plugin: singleton `contenido.alquiler` (seed v3), título «Alquiler · Tarifa de operador» (A3), condiciones PROVISIONALES (A4) |
| `1966da4` | Data layer — `getOperatorTariffAsync()`: A2 (build falla sin precio) + A2b (warning campos PENDIENTE) + mock 300/200 |
| (i18n) | Claves `RENTAL`/`QUOTE` ES+EN (D5, campos paralelos — A5) |
| `acfc7fa` | D2 — «Equipo ·» + badge en tarjetas/fichas/landings |
| `d4bafc9` | D3 — contadores `n_jornadas`/`n_medias_jornadas` + total aditivo + `send-quote.php` (422) |
| `0c2bcac` | D4 — `Product` sin `offers` + `Service` en landing (precio del singleton, areaServed Valencia/Alicante/Castellón) |

**Incorporaciones de Dirección aplicadas:**
1. Con `n+m=0` el resumen **no muestra importe** («Indica las jornadas de operador…») + submit deshabilitado en cliente, además del 422. Sin default comercial (0/0).
2. Build emite **WARNING** (no error) listando campos `[PENDIENTE DE CONFIRMAR CON CLIENTE]`; añadido como **ítem bloqueante de cutover** en MEMORY.md.
3. **Sí `Service`** en la landing `/alquiler/` (precio del singleton, areaServed Valencia/Alicante/Castellón, provider LocalBusiness existente). Fichas: `Product` sin `offers`.

**Verificación:** `npm run build` en modo mock → **verde, 78 páginas**; A2b **warning confirmado** (`op_terms_es/_en`); A2 **confirmado** (build en modo WP sin singleton → falla con exit 1 y el mensaje de operador); HTML generado verificado (badge, contadores, `Product` sin `Offer`). `main` intacto. `send-contact.php` no tocado.

**Pendiente (handoff — sin acceso desde la sesión):** 🔒 Gate 1 desplegar `scripts/obliq-cpts.php` al WP (auto-siembra el singleton) · 🔒 Gate 3 deploy a staging + validación E2E · cliente rellena `op_terms_*` reales.
