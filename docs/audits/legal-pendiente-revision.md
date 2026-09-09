# Textos legales — pendientes de revisión

> Auditoría del 13-ago-2026, durante el sprint del banner de cookies.
> Documento pensado para reenviar al cliente y a su asesoría.

---

## 🔄 ESTADO A 14-AGO-2026 — leer esto primero

| Página | Estado |
|---|---|
| **Política de cookies** | ✍️ **REESCRITA.** Puntos 1, 2, 3, 4, 5, 6, 7, 8, 9 y 11 resueltos. **Pendiente de validación por la asesoría.** |
| **Política de privacidad** | ✍️ **COMPLETADA.** Puntos 5, 6, 9 y 10 resueltos. **Pendiente de validación por la asesoría.** Arrastra la identidad del Bloque 1. |
| **Aviso legal** | ✅ **CORREGIDO (9-sep-2026).** Titular y domicilio social ya son los registrales. Pendiente solo lo aplazado: tomo, folio y hoja. Ver abajo. |

**Lo que se reescribió está basado en datos verificados en producción**, no en supuestos: nombres y duraciones reales de cookie, categorías reales del panel, comportamiento medido del mapa. Lo que exigía un dato externo **no se ha inventado** (ver «Qué sigue abierto» al final).

Redactado por el equipo técnico para que el texto **deje de ser falso**, que era lo urgente. No sustituye a la revisión jurídica: **la asesoría debe validarlo antes de darlo por bueno.**

---

## ⚠️ BLOQUE 1 — URGENTE, NO ES DE COOKIES: la razón social del aviso legal

**Qué pasa.** El aviso legal y la política de privacidad publicados identifican al titular como:

> **Obliq Audiovisual SL** — CIF **B19377019** — C/ Pintor Navarro Llorens bajo 3, 46008 Valencia

El sitio anterior (artefacto de build de febrero de 2026, conservado en el repositorio en `.vercel/output/`) identificaba al titular como:

> **ACMG AGENCY S.L.** — CIF **B19377019**

**El CIF es el mismo. La denominación social, no.** Solo una de las dos puede ser la vigente en el Registro Mercantil.

**Por qué importa.** El art. 10 de la LSSI obliga a publicar la denominación social **exacta** del prestador. Una razón social incorrecta en el aviso legal de una web con subvención pública —que además exhibe los emblemas del Gobierno de España, red.es y la Unión Europea— es un incumplimiento por sí solo, con independencia del asunto de las cookies.

**Qué hace falta.** Confirmación documental de la denominación registral vigente: nota simple del Registro Mercantil, o escritura de cambio de denominación si lo hubo. Con ese dato se corrige el texto en un commit.

**Además falta** en el mismo aviso legal: los **datos de inscripción registral** (tomo, folio, hoja), también exigidos por el art. 10 LSSI.

### ✅ RESUELTO el 9-sep-2026 — con un pendiente aplazado

**La nota simple llegó y la denominación publicada era la incorrecta.** La vigente en el Registro
Mercantil es:

> **AC MG AGENCY, S.L.** — CIF **B19377019** — Calle Pintor Navarro Llorens 3, bajo izquierda ·
> 46008 Valencia

Ninguna de las dos que circulaban era exacta: la web decía «Obliq Audiovisual SL» y el sitio
anterior «ACMG AGENCY S.L.». La inscrita lleva **espacio entre «AC» y «MG»** y **coma antes de
«S.L.»**, y así se ha publicado, sin normalizar.

⚠️ **Sigue faltando, APLAZADO por decisión de Víctor con el riesgo asumido:** los **datos de
inscripción registral** (tomo, folio, hoja), que el art. 10.1.a exige igual que la denominación.
**La línea se omite del aviso legal mientras no estén** — no se publica un «pendiente»: esa línea
nunca ha estado publicada, así que omitirla mantiene el estado actual, mientras que anunciarla
convertiría una ausencia invisible en una declaración pública de trabajo a medias. En cuanto se
rellenen en `src/data/legal-entity.ts`, la línea aparece sola.

### La mitad estructural, que es la que impedía arreglarlo antes

Lo que impedía corregir esto en cinco minutos no era el dato: era que **la razón social estaba escrita a mano en cinco sitios de tres ficheros** (`aviso-legal.astro` ×3, `politica-privacidad.astro` y `schema.ts`) y el domicilio en cuatro más. Por eso pudo estar un mes mal sin que nadie lo viera: no había un sitio donde mirar, había cinco donde no mirar.

**Ya está consolidado.** Los cuatro datos de la entidad —denominación, NIF, domicilio social y datos registrales— viven en **`src/data/legal-entity.ts`** y los tres ficheros leen de ahí. Se añadió además la línea de **datos registrales**, que nunca había estado publicada.

**Lo que queda es sustituir tres valores en ese fichero y reconstruir.** Está medido, no supuesto: se construyó con valores de prueba y el cambio quedó confinado exactamente a los mismos sitios.

Dos decisiones que conviene que la asesoría conozca:

1. **El domicilio social y la dirección de contacto son ahora datos distintos.** Es habitual que una sociedad esté domiciliada en su gestoría y no donde trabaja. Hoy coinciden; si la nota simple trae otra dirección, la web puede publicar las dos sin contradecirse. La de contacto (`/contacto/`, y el `PostalAddress` de Google) sigue editándose en wp-admin.
2. **En los párrafos de propiedad intelectual y responsabilidad se pasa a usar la marca** «Obliq Productions» en vez de la razón social. La identificación que exige el art. 10 se cumple en la lista de datos del titular, que es donde va.

⚠️ **Sigue pendiente, del mismo tipo y no incluido:** el **correo** aparece a mano en cuatro sitios de las páginas legales y el **teléfono** en uno, cuando los dos viven en WordPress (`ct_email`, `ct_phone`). No se ha tocado por no ampliar el alcance de una corrección jurídica, pero es el mismo defecto y merece su propio cambio.

Ficheros afectados: `src/pages/aviso-legal.astro`, `src/pages/politica-privacidad.astro`.

---

## BLOQUE 2 — Política de cookies y de privacidad

Contexto: la web incorpora desde este sprint un banner de consentimiento propio. Los textos legales actuales no describen lo que el sitio hace, ni antes ni después del banner.

### 1. Cookies mal identificadas

La política declara «Google Analytics (`_ga`, `_gid`)». Verificado en producción con navegación limpia (13-ago-2026):

| Declarado | Realidad |
|---|---|
| `_ga` | ✅ existe |
| `_gid` | ❌ **no existe** — es una cookie de Universal Analytics, plataforma discontinuada |
| — | ⚠️ `_ga_896V9YZVME` **se instala y no está declarada** |

Los nombres reales se derivan ahora de `GA_COOKIE_NAMES` en `src/data/analytics.ts`, para que no se vuelvan a desincronizar.

### 2. Plazos ambiguos

Dice «Duración: 2 años / 24 horas» sin indicar qué plazo corresponde a qué cookie. Ambas cookies reales duran 24 meses (el navegador las recorta a ~13 por su límite para cookies escritas por script).

### 3. El mecanismo declarado no es válido

El único que ofrece es «configure su navegador para rechazar las cookies». La AEPD lo rechaza expresamente como vía de obtención del consentimiento. Con el banner en marcha es además **falso**: hay un mecanismo en la propia web y el texto sigue remitiendo al navegador.

### 4. No se menciona el consentimiento

El documento no habla de aceptar, rechazar, configurar ni revocar. Hay que describir lo que ahora existe:

- Tres acciones con el mismo peso: **Aceptar · Rechazar · Configurar**.
- Granularidad por categorías (desde el 14-ago-2026: necesarias, analíticas y **mapas** — ver el punto 11).
- **Revocación permanente** desde «Preferencias de cookies», en el pie de todas las páginas.
- **Vigencia del consentimiento: 24 meses.** Pasado ese plazo se vuelve a preguntar.
- La decisión se guarda en el navegador del usuario (`localStorage`, clave `obliq-consent`), **no en una cookie de terceros**. Nada del consentimiento sale del dispositivo.

### 5. Falta el destinatario y las transferencias

No se identifica a **Google Ireland Ltd.** como encargado del tratamiento, ni se mencionan las transferencias internacionales a Estados Unidos ni el marco que las ampara.

### 6. Falta la base jurídica

La del art. 22.2 LSSI, y la distinción entre cookies exentas y no exentas. La AEPD exige informar también de las exentas.

### 7. Almacenamiento local no declarado

La web usa `localStorage` para dos cosas, ninguna declarada:

- El **carrito de presupuesto** (`obliq-quote-cart`, `obliq-quote-half-days`).
- La **decisión sobre cookies** (`obliq-consent`, 24 meses).

No son cookies técnicamente, pero el art. 22.2 LSSI cubre cualquier dispositivo de almacenamiento y recuperación de datos en el terminal del usuario.

### 8. Vimeo

El hero y las fichas de portfolio incrustan vídeos de Vimeo con el parámetro `dnt=1` (do not track), de modo que **no instalan cookies de seguimiento**. Conviene mencionarlo: es un punto a favor que hoy no está escrito. Vimeo sí puede escribir cookies técnicas propias del reproductor.

### 9. Falta fecha de última actualización

En las tres páginas legales.

### 10. La política de privacidad no menciona la analítica

Su finalidad declarada se limita a «los formularios de contacto». El tratamiento analítico vía Google Analytics —que ocurre en todas las páginas, cuando hay consentimiento— no está declarado ni tiene base jurídica asignada. También le faltan: destinatarios, transferencias internacionales y el derecho a reclamar ante la AEPD.

### 11. Mapa de Google en /contacto/ — categoría nueva sin declarar (14-ago-2026)

Añadido en el sprint del mapa. Hasta esa fecha el hueco de `/contacto/` era un rectángulo gris sin conectar; ahora hay un mapa de Google Maps que **carga únicamente con consentimiento**, bajo una categoría propia.

Lo que la política tiene que recoger:

- **Categoría «Mapas»**, independiente de la de analíticas. Aceptar una no concede la otra, en ninguna de las dos direcciones (verificado).
- **Destinatario: Google Ireland Ltd.**, el mismo que ya habría que declarar por Analytics (punto 5). Y la **transferencia internacional** a Estados Unidos, con su marco de amparo.
- **Sin consentimiento no se carga nada**: no hay iframe, no hay petición a ningún dominio de Google, y en su lugar se muestran la dirección y un enlace para abrir Maps en una pestaña nueva. Ese enlace no instala nada hasta que el usuario lo pulsa, y al pulsarlo ya está en el sitio de Google.
- **Al revocar, el iframe se elimina del DOM** —no se oculta— y cesan las peticiones.
- **Cookies concretas a declarar: medidas, no supuestas.** En la verificación con perfil limpio (Chromium, build real), el embed **no escribió ninguna cookie**: ni al cargar, ni tras arrastrar y hacer zoom sobre el mapa. Se comprobó contra un control —con analíticas aceptadas sí aparecían `_ga` y `_ga_896V9YZVME`—, así que el cero no es un fallo de medición.

  ⚠️ **Matiz que la asesoría debe conocer, porque condiciona cómo se redacta.** Ese cero es el comportamiento observado, no una garantía que el sitio pueda dar. Las cookies que Google pusiera desde dentro del iframe serían de **otro dominio** (`google.com`), y el JavaScript de obliqproductions.com **no puede borrarlas** — a diferencia de `_ga`, que es de primera parte y sí se barre al revocar. Si Google cambia ese comportamiento, la web seguiría cumpliendo la obligación de **consentimiento previo**, que es lo que exige el art. 22.2 LSSI, pero no podría prometer un borrado retroactivo. Conviene que el texto no afirme lo segundo.
- **Vigencia y revocación**: las mismas que el resto, 24 meses y «Preferencias de cookies» en el pie. Además, el propio bloque del mapa incluye un enlace que abre el panel.
- **Los consentimientos anteriores quedaron invalidados** al añadir la categoría (esquema `v1` → `v2`): quien ya había decidido volvió a ver el banner una vez. Es deliberado — una decisión tomada sobre un panel de dos categorías no dice nada sobre una tercera que no existía.

---

## Contexto histórico relevante

El sitio **anterior** (`/es/legal`, build de febrero de 2026) afirmaba literalmente:

> «Al acceder por primera vez al sitio, se te mostrará un banner de consentimiento de cookies desde el cual podrás aceptar, rechazar o configurar el uso de cookies no esenciales. Puedes modificar tus preferencias en cualquier momento accediendo al panel de configuración de cookies de esta web.»

Ese banner y ese panel **nunca se implementaron**. La política actual resolvió la contradicción eliminando la mención, no construyendo el banner.

Con este sprint la afirmación pasa a ser cierta por primera vez. Lo que queda pendiente es que el texto vuelva a decirlo.

---

## Decisión tomada sobre el despliegue

Víctor Medina, 13-ago-2026: **la desactualización del texto no bloquea el despliegue**. El banner ya mejora sustancialmente la situación anterior —hoy GA4 carga sin ningún consentimiento— y el texto se corrige después.

Queda constancia de que durante esa ventana la política describe un mecanismo distinto del real.

## Fuera de alcance, señalado

Las tres páginas legales existen **solo en español**, por decisión documentada (`src/lib/routes.ts:41`): no se publica texto jurídico traducido sin validación del cliente. Un usuario en `/en/` que pulse «Cookie policy» aterriza en castellano. El banner sí es bilingüe —y desde el 14-ago con la categoría «Maps» también en inglés—, así que la asimetría se hace más visible. **Decisión de Víctor (14-ago-2026): se mantiene así de momento**; pendiente de consultar con el cliente.

---

## ✅ QUÉ SIGUE ABIERTO — lista para la asesoría

Tras la reescritura del 14-ago-2026, esto es **todo** lo que queda. Tres cosas necesitan un dato que el equipo técnico no puede obtener, y una es una decisión de negocio.

### 🔴 1. Denominación social registral — BLOQUEANTE, y el más urgente

El aviso legal y la política de privacidad identifican al titular como **«Obliq Audiovisual SL»**. El sitio anterior decía **«ACMG AGENCY S.L.»**, con el **mismo CIF B19377019**. Solo una puede ser la vigente en el Registro Mercantil, y el art. 10 LSSI exige la denominación **exacta**.

**Hace falta:** nota simple del Registro Mercantil, o la escritura de cambio de denominación si lo hubo. Con ese dato se corrige en un commit.

Es independiente de las cookies y sigue **sin resolver**. El aviso legal no se ha tocado por este motivo.

### 🔴 2. Datos de inscripción registral

Tomo, folio y hoja. También exigidos por el art. 10 LSSI y también ausentes del aviso legal.

### 🟡 3. Plazo de conservación de los datos de formulario — decisión de negocio

La política de privacidad usa la formulación estándar («mientras se mantenga la relación comercial y, después, durante los plazos de prescripción legalmente aplicables»). **No se ha inventado ningún número.**

Un plazo concreto sería mejor y más defendible. Es una decisión de Obliq: ¿1 año desde el último contacto? ¿3? ¿Mientras dure la relación?

### 🟡 4. Identificar al encargado de alojamiento y correo

La política de privacidad menciona genéricamente «el proveedor de alojamiento y de correo electrónico». Nombrarlo es lo correcto, pero depende del contrato de encargo de tratamiento (art. 28 RGPD) firmado, que el equipo técnico no puede dar por supuesto.

### 🟡 5. Retención configurada en Google Analytics

La política dice que los datos analíticos se conservan «según el plazo de retención configurado en Google Analytics». Conviene mirar el valor real en la propiedad `G-896V9YZVME` y escribirlo (2 meses o 14 meses, que son las opciones de GA4).

---

## ⚠️ Un matiz que la asesoría debe conservar al revisar

La política de cookies dice, sobre el mapa, que si Google instalara cookies desde su propio dominio **nosotros no podemos eliminarlas** al revocar, y que habría que borrarlas desde el navegador.

**Eso no es una debilidad del texto: es exacto, y hay que dejarlo.** Las cookies `_ga` son de primera parte y sí se barren al revocar —verificado—. Las que pusiera `google.com` desde dentro del iframe son de otro dominio y el JavaScript del sitio no las alcanza. En las mediciones el mapa no instaló ninguna, pero eso es comportamiento observado, no una garantía que podamos dar.

**La obligación legal que sí cumplimos, y que es la que exige el art. 22.2 LSSI, es la de consentimiento previo:** sin aceptar, no se carga nada. Si al revisar el texto se sustituye ese matiz por una promesa de borrado retroactivo, estaríamos afirmando algo que no podemos sostener.
