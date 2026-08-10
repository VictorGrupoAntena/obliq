# Obliq Productions — Project Memory

## Fase actual: EN PRODUCCIÓN — cutover hecho el 28-Jul-2026; en revisión con cliente (10-Ago-2026)

> ⚠️ **CORREGIDO 10-Ago-2026:** este bloque decía que producción seguía sirviendo `main` (SSR Node). **Es falso desde el 28-Jul.** El cutover se hizo ese día (`DEPLOY_TARGET = httpdocs/`, run 30348922546) y **producción sirve el SSG de `redesign`**. La afirmación obsoleta hizo perder tiempo en el diagnóstico del correo; se deja el aviso para que nadie vuelva a fiarse de la versión vieja.
>
> Rama de trabajo `redesign` (limpia, pusheada). Producción: **obliqproductions.com** → `~/httpdocs` (SSG estático + 2 endpoints PHP en `api/`). Staging: **staging.obliqproductions.com** (Basic Auth user `obliq` + robots Disallow). WP headless compartido: `~/admin.obliqproductions.com`.

---

### 🔴→✅ INCIDENCIA — 1.014 enlaces internos rotos por i18n (28-Jul → 10-Ago-2026)

**Síntoma reportado:** crawl de Screaming Frog con **131 enlaces internos rotos**. Toda ruta EN se construía prefijando `/en/` a la ruta **española** sin traducir el slug: `/en/contacto/` en vez de `/en/contact/`, `/en/servicios/consultoria/` en vez de `/en/services/consulting/`.

**CAUSA RAÍZ — de diseño, no un olvido puntual.** `localizedUrl()` y `alternateUrl()` en `src/lib/i18n.ts` eran puramente sintácticas: concatenaban o recortaban el prefijo `/en`. **Ningún punto del código consultaba un mapa de rutas**, porque ese mapa no existía como dato: vivía implícito en los nombres de fichero de `src/pages/en/`. El build nunca falló porque `localizedUrl` siempre devuelve un string plausible.

**Las páginas EN existían y eran correctas.** 38 URLs EN reales, todas 200, todas en el sitemap — y **ni una sola enlazada desde el sitio**. Para 119 de los 131 el fallo era de enlazado, no de rutas ausentes.

**🔑 LO GRAVE ESTABA EN EL `<head>`, y el crawl solo vio un tercio.** Medido con el script nuevo sobre un build limpio: **1.014 referencias rotas, 109 de ellas en el `<head>`** (el crawl reportó 37). Las 36 páginas `/en/` que sí existen emitían `hreflang="es"` **y `x-default`** hacia rutas inexistentes en ES. Screaming Frog no llegó a ellas porque eran **inalcanzables desde el menú**: el crawler no puede reportar lo que no puede visitar. `x-default` es justo la señal que Google usa como fallback.

**Reconciliación:** los 47 destinos rotos del subconjunto crawlable contienen los 45 del informe con recuento idéntico uno a uno. Los 2 extra: `/en/404/` (la 404 no está enlazada) y `/en/presupuesto/` (el crawl se lo dejó, y no es `noindex`).

**ARREGLO — vocabulario canónico ES traducido en el borde.**
- **`src/lib/routes.ts` (nuevo)** — fuente única de verdad del mapa ES↔EN. `SECTIONS`/`PAGES` para el segmento de sección; `translateSegment()` síncrono para los enlaces; `translatePath()` async que resuelve los slugs dinámicos **contra el dato** (`getServicesAsync`/`getCategoriesAsync`, es decir WordPress), no contra literales.
- **Convenio:** el código escribe siempre las rutas en **español**; la traducción ocurre en `localizedUrl`. Los segmentos hijos ya vienen en el idioma destino porque salen de `slug: { es, en }`. Consecuencia deliberada: **`Header.astro` no necesitó ni un cambio**.
- `translatePath` devuelve **`null`** cuando no hay contraparte → `BaseLayout` **omite** el `alternate` en lugar de inventarlo.
- `Footer.astro` deriva ahora los 9 servicios del dato (antes: 9 literales ES). Elimina la deriva: un servicio nuevo en WP no aparecía en el footer.
- Fachadas async memoizadas (cache de **promesa**, no de resultado). Efecto colateral medido: **build de 13,4 s → 7,2 s**.
- `public/.htaccess` sección 3: 301 de lo ya indexado. **Resultado: 1.014 → 0 referencias rotas.**

**⚠️ Trampa del `.htaccess` que casi se cuela:** la forma `^en/alquiler/camaras(/.*)?$ → /en/rental/cameras$1` deja el destino **sin barra final** cuando la entrada tampoco la trae, y Apache encadena entonces un segundo 301 hacia el directorio. Se parte en dos reglas por categoría (ficha + raíz) con la barra escrita en el destino. **Un solo salto.**

**🔑 LECCIÓN: un enlace roto en el `<head>` no se ve navegando.** Ni el build ni el crawler externo lo detectan — el primero porque no valida, el segundo porque no llega. Por eso **`scripts/check-links.mjs` es infraestructura, no una herramienta de sesión**: corre en CI **entre el build y el rsync** y **bloquea el despliegue**. Valida `<a href>`, todos los `hreflang` **incluido `x-default`**, y el `canonical`, cada uno contra el propio `dist/`. Junto a `check:redirects`, que ya existía y verifica offline la invariante «ningún destino es origen de otra regla».

**✅ RESUELTO — `tilta-ts-t20-b-v` despublicado A PROPÓSITO (10-Ago-2026).** El producto desapareció de la API de WP entre las 17:49 y las 20:55, y el build pasó de 78 a **76 páginas**. Se aisló con `git stash` de todos los cambios del sprint: el build con el **código original da también 76**, luego no era una regresión. **El cliente confirma que lo despublicó él. 76 es el recuento correcto.**

> 🎉 **Primera evidencia de que el cliente usa el CMS de forma autónoma y de que el auto-deploy responde a sus ediciones.** El circuito WordPress → `repository_dispatch` → build → rsync funciona en manos del cliente, no solo en las nuestras. A partir de aquí, **una variación en el recuento de páginas entre builds es contenido, no necesariamente un bug** — pero se verifica antes de asumirlo, y el `--delete` del rsync hace que borrar en WP borre en producción.

---

### 🔴→✅ INCIDENCIA — los formularios no entregaban correo a `info@` (28-Jul → 10-Ago-2026)

**Síntoma:** ningún formulario llegaba a `info@obliqproductions.com`. El cliente reportó «me llegó UNO de prueba y a partir de ahí, ninguno más». Fallaban **los dos** endpoints (carrito y contacto).

**CAUSA RAÍZ — no era el código, ni DNS, ni spam.** Postfix del servidor tenía `obliqproductions.com` dado de alta como **dominio de correo LOCAL** (`virtual_mailbox_domains`) **sin ningún buzón creado**, así que rechazaba en local con `550 5.1.1 User unknown in virtual mailbox table` y **nunca consultaba el MX de Google Workspace**. `mail()` devolvía `true` (sendmail encola y sale 0), el endpoint respondía **200 `success:true`**, y el mensaje moría en la entrega. Patrón **«200 pero no llega»**.

**🔑 LECCIÓN TRANSVERSAL: el 200 de estos endpoints MIENTE.** `mail()` solo confirma que el binario aceptó el mensaje, no que se haya entregado. **Ningún envío se da por bueno con un HTTP 200** — se cierra con evidencia de entrega (Track Email Delivery de Plesk / maillog) y confirmación del buzón receptor.

**Hipótesis descartadas por medición** (todas parecían plausibles y todas eran falsas):
- ❌ `OBLIQ_MAIL_TO` ausente/revertida → **estaba**, correcta, en el pool de producción.
- ❌ Fail-closed de `send-quote.php` → **0 ocurrencias** del mensaje de aborto en el error_log; todos los POST reales dieron **200**, ninguno 500.
- ❌ `send-contact.php` con `info@` hardcodeado → apuntaba al buzón **correcto**; deuda real pero **ortogonal** a la avería.
- ❌ Deliverability / DNS → MX, SPF, DKIM y DMARC correctos en zona. El correo **no salía del servidor**.
- ❌ «Llegó uno y luego ninguno» → el dir `mailnames` no cambia desde 26-Feb-2026 (`links=2`, cero buzones): **`info@` nunca fue entregable desde este servidor**. El correo que sí llegó no viajó por esta ruta.

**Leads perdidos (irrecuperables, el payload no se registra):** 31-Jul 12:48 (presupuesto), 04-Ago 14:47 y 07-Ago 11:02 (contacto). Los 4 POST desde el cutover fueron todo el tráfico de formularios.

**ARREGLO (Opción A) — Plesk 18.0.79:**
```
Sitios web y dominios → obliqproductions.com → Correo → Configuración de correo
  → «Mail service on this domain» = «Disabled for incoming mail»
```
Es la solución **documentada por Plesk** para este síntoma exacto (KB *«Emails sent to a domain with external mail service are delivered locally to the Plesk server»*). El estado deja el dominio **enviando por Sendmail** y **mantiene la firma DKIM** (verificado: el TXT `default._domainkey` quedó idéntico carácter por carácter). Estado introducido en Plesk 18.0.51.

- ❌ **NO usar «Not configured»** — borra permanentemente los buzones del dominio.
- ❌ **NO usar «Disabled»** — «Plesk will not provide any mail services», se llevaría por delante el envío.
- ❌ **NO tocar «Redirect to an external mail server with the IP address»** — está bajo *mail para usuarios inexistentes*, suena a «MX externo» y **no lo es**: el dominio seguiría siendo local.
- ✅ **«What to do for non-existent users» se deja en Reject.** Solo aplica al entrante y solo mientras el dominio sea local; **cambiarlo no arregla nada**.

**VERIFICACIÓN (10-Ago-2026):**
- Sondeo SMTP: `info@obliqproductions.com` → **`554 5.7.1 Relay access denied`** (destino remoto). Antes: `550 … virtual mailbox table`. **Sin 550 de *alias table*** — un dominio puede seguir siendo local por `virtual_alias_domains` aunque salga de la de buzones; se comprobó que no es el caso. Control: `zzz@andresylajo.es` (dominio local del mismo servidor) sigue dando 550 → el cambio está acotado a este dominio.
- Tests reales 08:21:27 y 08:21:29 → **Track Email Delivery de Plesk: `Sent`**, `from=noreply@obliqproductions.com`, respuesta de Google `250 2.0.0 OK`. **Ya no pasan por `plesk_virtual`.**
- Contraste que documenta la avería: los envíos del 09-Ago figuran como *«delivered via plesk_virtual service»* (entrega LOCAL) con `from=obliqproductions.com_zbt88qx0mpj@obliqproductions.com`.
- 🔧 **Track Email Delivery del panel de Plesk es mejor que el `grep` al maillog y NO requiere root.** Usarlo por defecto para verificar entregas.

**Cambio de código asociado — commit `9152c4d` (`redesign`), desplegado a `httpdocs/` (run 31335346687):**
1. **Envelope sender explícito** en los DOS endpoints: `mail($to, $subject, $html, $headers, '-f noreply@obliqproductions.com')`. Verificado en el PHP 8.3 de Plesk (`mail.force_extra_parameters` vacío; el 5º parámetro llega a la línea de comandos de sendmail).
   > ⚠️ **Registro honesto del porqué:** se introdujo temiendo que desactivar el correo tumbara el DKIM y que el sobre saliera como `…@servidor2.grupoantena.com` (sin alinear) → DMARC `p=quarantine` a spam. **Ambas premisas resultaron falsas**: el DKIM se mantiene, y el sobre real ya era `…@obliqproductions.com`, **que sí alineaba**. El `-f` se queda porque hace el remitente **determinista y legible** en vez de depender de cómo Plesk componga `myorigin` — pero es **refuerzo, no rescate**. No inventar una causa DMARC que no hubo.
2. **`send-contact.php` unificado al patrón `OBLIQ_MAIL_TO`** (fail-closed), saldando la deuda nº9. El destino en producción no cambia (la variable del pool vale `info@obliqproductions.com`); cambia la fuente, de modo que **staging ya puede apuntar a un buzón de pruebas** en vez de escribir al buzón real del cliente. Regresión verificada en producción: POST real → 200 y **cero** líneas `[send-contact] OBLIQ_MAIL_TO no configurado`.

**Estado de correo por entorno (PHP-FPM `env[]`, NO en el repo):**
| Dominio | `OBLIQ_MAIL_TO` |
|---|---|
| `obliqproductions.com` (prod) | `info@obliqproductions.com` |
| `staging.obliqproductions.com` | `victor@grupoantena.com` |

**⏳ PENDIENTE DE CIERRE:** confirmación del cliente rellenando **los dos formularios desde la web** (cadena completa navegador → endpoint → Postfix → Google → bandeja) e indicando **Bandeja / Spam / Promociones**. Solo entonces se da por cerrado.
- Si cae en **Spam**: pedir la cabecera completa (Gmail → *Mostrar original*) y leer los `Authentication-Results` de Google para ver si rompe `spf`, `dkim` o el alineamiento `dmarc`.

---

### ⛔️ ADVERTENCIAS PERMANENTES — DNS y correo del dominio

- **⛔️ NADIE pulsa «Apply DNS Template» en Plesk.** Los NS del dominio (`ns1`/`ns2.obliqproductions.com`) resuelven a **82.165.150.120 — este mismo servidor**: Plesk **es el DNS autoritativo** y la zona que sirve es la **zona viva**. Aplicar la plantilla la reescribiría con el MX apuntando al servidor local → **corte total del correo del cliente en Google Workspace**, mucho peor que la avería original. La zona ya muestra el aviso *«The DNS zone was modified»*: es intencionado (MX de Google + registros de SES/Resend), no un error a «corregir».
- **Smarthost: NO configurado y no se toca.** Medido: `relayhost` vacío, `smtp_sasl_auth_enable = no`, `default_transport = smtp` (salida directa por MX). El propio Plesk avisa de que activarlo obliga a actualizar SPF y otros registros DNS a mano.
- **Zona DNS — MX de Google:** `aspmx.l.google.com` (pri 1) + `alt1/alt2` (5) + `alt3/alt4` (10). SPF `v=spf1 +a +mx +a:servidor2.grupoantena.com include:_spf.google.com include:amazonses.com ~all`. DKIM Plesk selector `default`. DMARC `p=quarantine; adkim=r; aspf=r`.

---

### ⏭️ PENDIENTE PRÓXIMA SESIÓN — retomar aquí

**P4 fase 2 ✅ CERRADO Y VALIDADO E2E (17-Jul-2026).** Todo montado en el servidor (PAT + constantes `OBLIQ_DEPLOY_PAT`/`OBLIQ_DEPLOY_REPO` + mu-plugin con `trim` + `DISABLE_WP_CRON` + cron de sistema cada minuto) y probado de punta a punta. Detalle en «Sprint P4» abajo. Lo único que queda del auto-deploy es el **cutover**.

**Bloqueantes de CUTOVER a producción** (no dependen de código):

- Títulos/años/clientes **reales** de los 11 proyectos (hoy «Proyecto {cat} {n}»).
- Diagnóstico **DNS/correo** del dominio (dónde están los DNS; MX está en **Google Workspace**).
- **SPF/DKIM/DMARC** del servidor: `mail()` entrega, pero revisar que no caiga en spam (envío server→Google en nombre de obliqproductions.com).
- **✅ `OBLIQ_MAIL_TO` en producción — RESUELTO.** Definida en el PHP-FPM del dominio de producción con `info@obliqproductions.com` (staging: `victor@grupoantena.com`). Desde el 10-Ago-2026 **los dos** endpoints la usan (`send-contact.php` dejó de tener `info@` hardcodeado). Ver «INCIDENCIA — los formularios no entregaban correo» arriba: **no era esta variable** la causa del fallo de entrega.
- **✅ Tarifa de operador — condiciones CONFIRMADAS por el cliente (23-Jul-2026), bloqueante CERRADO.** El seed de `op_terms_es`/`op_terms_en` ya trae el texto definitivo (media jornada 4 h, jornada 8 h, brutos en 24 h, servicio en toda la Comunitat Valenciana; desplazamientos fuera → consultar). Sin marcador `[PENDIENTE…]` → el build en modo WP deja de avisar de estos campos. Como el seed v3 **nunca se subió**, el texto entra en la primera creación del singleton (sin bump de versión). ⚠️ El **mock de `src/data/operator.ts`** (fallback dev, WP-disabled) **aún conserva** el marcador → `WP_API_URL='' npm run build` seguiría avisando; irrelevante para los builds desplegados (deploy.yml usa WP real). Sincronizarlo es opción de una línea (pendiente de OK).
- **🆕 NORMA DE NEGOCIO (cliente, 24-jul-2026): `n + m === días`.** El número de unidades de operador debe ser IGUAL al número de días de alquiler (el material no sale sin operador, luego no hay día sin operador asignado). **Implementación: campo ÚNICO** — se pregunta solo «¿cuántas de las N jornadas son de media jornada?» (`m`, acotado 0..N) y **`n = días − m` se deriva**, de modo que la norma no se puede violar (estado inválido inalcanzable, no validado a posteriori). Servidor: **deriva los días de `products[].days`, IGNORA cualquier `days` recibido** y devuelve **422** si `n+m ≠ días`. No es frontera de confianza (no hay carrito en servidor): es coherencia del payload para que el correo sea legible.
  - **Consecuencias:** desaparecen el estado `n+m=0`, el aviso «Indica las jornadas…», el submit deshabilitado por cero y la R2 «mínimo media jornada» (queda subsumida). Claves i18n retiradas: `OPERATOR_REQUIRED`, `OPERATOR_MIN_ERROR`, `OPERATOR_EACH`.
- **⏳ Default de `m` = 0 — PENDIENTE de decisión del cliente.** Con `m=0` todas las jornadas son completas (**ancla cara**); con `m=N`, todas medias. La consulta del default no desaparece: **cambia de forma** (ya no es 0/0 vs 0/1). Hoy queda en 0.
- **🔴 HALLAZGO CON IMPLICACIÓN COMERCIAL (auditoría, pendiente de cliente antes del cutover).** Los días de alquiler solo pueden ser **N ∈ {1, 3, 5, 7}**, porque el selector de duración **reutiliza los tramos del descuento multi-día** (`DAY_OPTIONS`/`discountTiers` en `src/lib/cart-store.ts`). Bajo la norma nueva eso implica que: (a) un rodaje de **4 días obliga a pagar 5 jornadas de operador**; (b) **subir los días de un accesorio arrastra la línea de operador** entera (los días de la solicitud son el **máximo** de las líneas). Decisión del cliente: si se debe poder alquilar **cualquier número de días**, desacoplar el selector de duración de los tramos de descuento es **un sprint aparte**.
- **Detalles comerciales ABIERTOS (no bloqueantes, editables desde WP en «Alquiler · Tarifa de operador»):** (1) **formato** de entrega de brutos (el plazo —24 h— está confirmado, el soporte disco/nube/transferencia no); (2) si el **desplazamiento dentro de la Comunitat** está incluido en la tarifa. Ambos se pueden matizar en `op_terms_*` cuando se cierren, sin tocar código.

**Backlog restante:**

- **P5:** auditoría visual página a página + **imágenes reales** (subir a WP Media / `pf_image`) + revisión de **seguridad** pre-entrega.
  - **P5 / brain-design (hallado en la auditoría visual del 24-jul, NO tocar en el sprint de operador):** (1) en escritorio la página `/presupuesto/` tiene la **rejilla de 2 columnas desequilibrada** (la columna del resumen termina pronto y deja un gran vacío a la izquierda); (2) **hueco vertical amplio entre hero y contenido en 1440**. Son de maquetación y aplican a más páginas → van a la auditoría visual de P5, no a este sprint.
- `pc_name_en` (term meta) para nombres EN distintos en los filtros de portfolio (hoy ES=EN).
- **Cutover:** cambiar la Variable `DEPLOY_TARGET` de staging → producción y **quitar `--exclude='robots.txt'`** del `deploy.yml` (para publicar el robots real `Allow`).
- **Backups del servidor a limpiar en el cutover** (conservados a propósito): `wp-content/mu-plugins/obliq-deploy-hook.php.bak*`, `wp-content/mu-plugins/obliq-cpts.php.bak*`, `wp-config.php.bak*`, `staging.obliqproductions.com/.htpasswd.bak*`, `crontab.bak*` (en `~/`).
- **Credencial staging** (Basic Auth nginx): user `obliq`, pass reseteada 17-Jul (guardada aparte, NO en repo).

> ⚠️ **Todo lo listado en este MEMORY vive en la rama `redesign` y NO está en producción.** Producción sigue sirviendo `main` (SSR Node en `~/httpdocs`) y el auto-deploy apunta a staging (`DEPLOY_TARGET`). Esto incluye el CMS de páginas fijas (CPT `contenido`) y el hero de vídeo editable: **salen a producción en el cutover, no antes**. El mu-plugin `obliq-cpts.php` sí está ya activo en el WP compartido (`~/admin.obliqproductions.com`), que es único para staging y producción: los campos existen en wp-admin aunque la web pública todavía no los use.

---

### Sprint Alquiler siempre con operador — ✅ CÓDIGO EN `redesign` (23-Jul-2026); pendiente deploy mu-plugin a WP + staging

- **Qué:** el alquiler de equipos pasa a ser **siempre con operador** (modelo **aditivo**: `TOTAL = material + operador`). Tarifa confirmada por Dirección: **300 €/jornada · 200 €/media jornada (sin IVA)**, entrega de brutos incluida. Encargo `brain-it:it-brief`. Fase 0 (audit) + Fase 1 (plan) + Fase 2 (ejecución) en `docs/audits/alquiler-operador-fase0.md` y `docs/sprints/plan-alquiler-operador.md`.
- **R1 (modelo de precio) — DECISIÓN CERRADA por el cliente (24-Jul-2026): ADITIVO.** Las tarifas de operador (300 €/jornada, 200 €/media) se **SUMAN** al precio del material (`TOTAL = material + operador`). Es exactamente lo ya construido → **sin cambio de código**. Se descarta definitivamente la alternativa de «tarifa cerrada» (que habría obligado a rehacer precios y Schema).
- **Dónde vive la tarifa (D1):** **cuarta entrada singleton** del CPT `contenido`, `_obliq_key = 'alquiler'`, título «Alquiler · Tarifa de operador». Campos `op_jornada_price`, `op_media_price` (number), `op_includes_es/_en`, `op_terms_es/_en` (textarea). **🔑 `OBLIQ_CONTENIDO_SEED_VERSION` → `'3'`** (sin subirla no se crea en el WP ya instalado). Editable en WP nativo, sin código. El **deploy hook ya cubre `contenido`** → no se tocó `obliq-deploy-hook.php`. Se descartó Options Page (no existe) y CPT nuevo (sobredimensionado).
- **Data layer:** `src/data/operator.ts` → `getOperatorTariffAsync()` (memoizado). **A2: el build FALLA** (`throw`) si `op_jornada_price`/`op_media_price` no resuelven a >0 en modo WP — sin fallback a 0/vacío; sin WP usa mock 300/200 (build local/CI verde). **A2b: WARNING** (no error) listando campos con `[PENDIENTE DE CONFIRMAR CON CLIENTE]`.
- **Presentación (D2):** precio del material re-etiquetado `Equipo · {price}€/día + IVA` + badge «Siempre con operador» en tarjetas (`ProductCard`, `PackCard`), fichas y banda en las landings `/alquiler/`. Bloque de operador (aviso + qué incluye con brutos + condiciones) desde el singleton.
- **Formulario (D3):** el CTA «Alquilar» **añade al carrito** (no `?producto=`); el alquiler va por **`send-quote.php`** (no `send-contact.php`). Operador **por solicitud** → en la página de presupuesto (`presupuesto.astro` / `en/quote.astro`) **dos contadores** `n_jornadas` + `n_medias_jornadas` (independientes de los `days` del material; el selector binario se descartó por no expresar reservas multi-día). Total aditivo con línea de operador desglosada. **Con n+m=0 el resumen NO muestra importe**: texto «Indica las jornadas de operador…» + submit deshabilitado (validación cliente) + **422** en `send-quote.php` (`error_operator`). Precios inyectados en build desde WP (`data-*`), nunca hardcodeados. Email con bloque de operador + «Entrega de brutos incluida» + gran total material+operador. **Default de contadores pendiente de cliente** (hoy 0/0).
- **SEO (D4):** `productSchema()` **ya no emite `offers`/`price`** (con operador obligatorio, el precio pelado no es contratable → snippet engañoso; se acepta la pérdida en las fichas). El precio real y fijo se publica como **`Service`** en la landing `/alquiler/` (`rentalServiceSchema`): tarifa de operador desde el singleton, `areaServed` Valencia/Alicante/Castellón, provider el LocalBusiness existente. **NO** se añade `Service` a las fichas. A1 verificado: no había precio en title/meta/OG (nada que retirar).
- **✅ DECIDIDO por el cliente (26-jul): el alquiler vive SOLO como vertical propia `/alquiler/`; `/servicios/alquiler/` NO existe y su 404 es correcto.** No es un pendiente. ⚠️ **La memoria técnica v5 (`docs/specs/memoria-tecnica-v6.md` y planificación previa) queda desactualizada en este punto** (asumía `/servicios/alquiler/` como página de servicio). Confirmado con `curl` en la Fase 0 y en la verificación visual del 24-jul.
- **Gates:** 🔒 Gate 1 (crear meta en WP) y 🔒 Gate 3 (staging) → **handoff pendiente** (sin acceso de escritura a WP ni al pipeline desde la sesión). Gate 2 (`send-quote.php`) hecho en su commit. `send-contact.php` no se tocó. `main` intacto.
- **Commits en `redesign`:** `2412bf6` (mu-plugin) · `1966da4` (data layer) · i18n · `acfc7fa` (D2) · `d4bafc9` (D3) · `0c2bcac` (D4).
- **✅ GATES EJECUTADOS Y VERIFICADOS (24-Jul-2026):**
  - **Gate 1 — mu-plugin desplegado.** Seed v3 subido con el hook desactivado (`.OFF`) para no disparar deploy; singleton **ID 95** creado con 300/200 y textos definitivos (sin marcador). Hook restaurado y verificado con edición real (run por `repository_dispatch`, cancelado adrede para no cruzar el Gate 3). Sin bump: la opción valía `'2'`. PHP del dominio: **`/opt/plesk/php/8.3/bin/php`** (`.php-version` + pool FPM).
  - **Gate 3 — primer build real en modo WP.** `workflow_dispatch` run 30073893687 **success**: 78 páginas, `Complete!`, **sin warning `[operator]`** (A2 resolvió la tarifa; A2b calló). Snapshot previo del docroot por el `rsync --delete`.
  - **Gate 4 escenarios 1-3 ✅.** (1) **Ciclo automático de P4 probado de extremo a extremo**: precio 333 en WP → dispatch → build → staging, sin intervención (run 30075391083), y restauración a 300 igual (run 30075948679); staging y WP quedan en 300, 0 rastros de 333. (2) Estado `n+m=0` verificado en navegador sobre los artefactos desplegados: defaults 0/0, **total oculto**, aviso «Indica las jornadas de operador…», **submit deshabilitado**; con 1 jornada → total 410 € (110+300) y submit activo; **2 jornadas + 1 media = 800 €** operador (total 910 €). (3) Endpoint real: `n+m=0` → **422**; `n=1` sin `OBLIQ_MAIL_TO` → **500 fail-closed** (no envía a info@). Probado por el backend Apache con `--resolve`, **sin tocar nginx**.
- **⏭️ Pendiente:** **escenario 4** (envío real) — requiere definir `OBLIQ_MAIL_TO` en el PHP-FPM del dominio de staging (lo pone Dirección desde el panel). Sigue **bloqueante de cutover**: el envío real de `send-quote.php` nunca se ha validado contra un servidor (mail() en local devolviendo true no prueba entrega).
- **🧹 Housekeeping de cutover (no hacer antes):** retirar el tar `~/gate3-backups/staging-pre-gate3-*.tar.gz` y los `.bak.*` de `wp-content/mu-plugins/` cuando el sprint cierre.

---

### Sprint Hero de vídeo editable — ✅ CERRADO Y VALIDADO E2E (22-Jul-2026)

- **Qué:** el fondo de la cabecera de la portada (`/` y `/en/`) pasa de `/hero.jpg` **hardcodeado en el JSX de las dos homes** a editable desde WordPress, con vídeo de Vimeo opcional. Commit `bec46b3` en `redesign`.
- **Dónde:** **tercera entrada singleton** del CPT `contenido` ya existente, `_obliq_key = 'home'`, título «Inicio». Hereda gratis la protección del CPT (`create_posts => do_not_allow` + filtro `map_meta_cap` contra borrado). Dos campos, **sin sufijo ES/EN** (mismo vídeo en ambos idiomas, como `ab_story_image` o `ct_email`):
  - `hm_hero_vimeo_url` (text) — **vacío = modo imagen**. Es el ÚNICO interruptor: se descartó un `hm_hero_video_enabled` para que no pueda quedar incoherente con la URL.
  - `hm_hero_fallback_image` (media) — póster mientras carga, fondo en móvil y fallback sin vídeo. Default `/hero.jpg`.
- **🔑 `OBLIQ_CONTENIDO_SEED_VERSION` → `'2'` (clave, no olvidar al añadir campos):** el guard `get_option('obliq_contenido_seeded')` ya valía `'1'` en el WP instalado. Sin subir la versión, la entrada «Inicio» **nunca se habría creado** y el campo no aparecería jamás en wp-admin. El seed nace con la URL **vacía** a propósito → instalar la versión nueva no cambia ni un byte del HTML.
- **Modo fondo ≠ lightbox:** `getVimeoBackgroundUrl()` es función NUEVA en `src/lib/vimeo.ts` sobre el `parseVimeoUrl` ya existente (conserva el hash de privacidad como `h=`). NO reutiliza `getVimeoEmbedUrl`, cuyos parámetros son los del lightbox del portfolio (con sonido y controles). Params: `background=1 autoplay=1 loop=1 muted=1 autopause=0 controls=0 title=0 byline=0 portrait=0 dnt=1`.
- **Rendimiento — el iframe NO entra en la ruta crítica:** el póster se pinta siempre en el HTML y es el elemento LCP; el iframe lo inyecta JS tras `load` + `requestIdleCallback`, con fundido. **`loading="lazy"` no sirve** para un iframe above-the-fold: el navegador lo considera visible y no lo difiere.
- **A11y:** botón de pausa/play (WCAG 2.2.2 «Pausar, detener u ocultar» — un bucle automático >5s sin control lo incumple), con `aria-label` i18n que cambia de estado y foco visible por el `:focus-visible` global. `prefers-reduced-motion: reduce` → el iframe no se monta. El iframe va `aria-hidden` + `tabindex="-1"` (decorativo).
- **Móvil:** por debajo de **768px** o con `navigator.connection.saveData` tampoco se monta (solo póster). El autoplay muted inline sí funcionaría en iOS/Android; se descarta por consumo de datos, no por incompatibilidad.
- **⚠️ Tres decisiones de implementación que NO hay que «corregir»** (rompen la no-regresión si se tocan):
  1. El `<script>` va con **`is:inline`**. Uno normal lo empaqueta Astro y acaba inyectado en las **16 páginas** que usan `HeroSection`, tengan vídeo o no.
  2. La geometría va en atributos **`style`**, no en clases Tailwind nuevas: Tailwind 4 escanea el código fuente, así que una clase nueva entra en el CSS global y **cambia el hash del bundle de las 78 páginas** aunque el vídeo esté apagado. Solo se usan clases ya presentes en `src/`.
  3. Las expresiones `{videoEmbedUrl && …}` van **PEGADAS a la etiqueta anterior**: separadas por un salto de línea añaden un nodo de texto y con él **+2 bytes de espacio** al HTML de todas las páginas con hero (fallo real detectado y corregido en la primera versión).
- **«Cover» sin `object-fit`** (que no aplica a iframes): caja 16:9 centrada con `min-width/min-height:100%` que desborda por el lado que haga falta. Medido en staging: iframe **1600×900** sobre hero **1440×900**.
- **🐛 Hallazgo — el build de Astro NO es determinista:** dos builds del MISMO código cambian los hashes de los bundles `_category_` y `CustomCursor` (72 ficheros difieren en crudo). **Para verificar no-regresión hay que normalizar `\.[A-Za-z0-9_-]{8}\.js` y usar un doble build del mismo código como control.** Resultados: sin WP 0/78 HTML, con WP 0/78, con el CPT sembrado y campo vacío 0/78 + las dos portadas idénticas byte a byte (`cmp`).
- **✅ VALIDADO E2E en staging (22-Jul), con el dominio real:** guardar la URL en WP → dispatch a los **90s exactos** de debounce → deploy verde → hero en **modo fondo limpio, sin UI del player** ⇒ **la cuenta de Vimeo NO es Basic** y **el embed no está restringido por dominio** (no hubo que tocar privacidad en Vimeo). Póster a **305ms** vs player a **620ms** (póster primero). **El botón detiene el fotograma de verdad**, probado por hash de capturas: reproduciendo t0≠t+7s, pausado t0==t+5s (byte a byte). Guards verificados contra el servidor: reduced-motion y móvil 390px → sin iframe, sin botón, **0 peticiones al player**. EN monta el vídeo con etiqueta «Pause background video».
- **Para volver a imagen:** vaciar el campo en «Inicio» y guardar (~2min). Documentado para el cliente en `docs/guides/wp-editar-nosotros-contacto.md`, que ya recoge las **tres** fichas.

### Sprint P4 — Auto-rebuild WP→GitHub Actions→Plesk — ✅ CERRADO Y VALIDADO E2E (17-Jul-2026)

- **Pipeline:** WordPress (edición CPT/taxonomía) → mu-plugin `scripts/obliq-deploy-hook.php` (debounce 90s vía `wp_schedule_single_event` único) → `repository_dispatch [wp-content-update]` → `.github/workflows/deploy.yml` (runner Ubuntu: pnpm install + build WP-real + `rsync -avz --delete` a Plesk). GitHub Actions elegido por: build fuera del server (Plesk sin Node en PATH), runner limpio (mata el bug iCloud `" 2"` y el 403 de perms), versionado, secretos fuera del repo.
- **Workflow en la RAMA POR DEFECTO (main):** GitHub solo activa `workflow_dispatch`/`repository_dispatch` si el `.yml` está en main. Está en main (`195a27e`+`edd6170`) Y en redesign; GitHub ejecuta el de main, que hace `checkout ref: redesign` para construir.
- **⚠️ El workflow NO tiene trigger `push`** (solo `repository_dispatch` + `workflow_dispatch`): **pushear a `redesign` NO despliega nada**. Tras un push de código hay que lanzarlo a mano (`gh workflow run "Deploy (build + rsync a Plesk)" --ref redesign`, o Actions → Run workflow). Solo las ediciones en WordPress despliegan solas. Fácil de olvidar: se queda uno esperando un deploy que nunca se programó.
- **✅ VALIDADO E2E (17-Jul):** ciclo completo de punta a punta — editar un proyecto de portfolio en WP → auto-deploy a staging en **~2min40** (run #29575296560, success). Tramos medidos: **edición→dispatch 115s** (debounce 90s + cron wp-cron ≤1min), **dispatch→build+rsync 40s**, **rsync→visible 6s**. Antes se validó también `workflow_dispatch` en verde (run 29568662097, 40s).
- **🐛 Bug resuelto — `\n` final en el PAT (clave, no repetir):** el PAT pegado en `wp-config.php` arrastraba un salto de línea DENTRO de las comillas. Ese `\n` cortaba las cabeceras HTTP del `repository_dispatch` a la mitad → **403 «missing User-Agent»** o **422 «Invalid request… nil is not an object»** (body sin Content-Length) según qué cabecera cayera tras el corte. Muy enmascarado: por SSH funcionaba porque bash `$(...)` recorta el `\n`, pero PHP leía la constante intacta. **Fix: `trim( OBLIQ_DEPLOY_PAT )`** en el mu-plugin (commit `d1d6586`, redesign) + `\n` limpiado en el `wp-config.php` del servidor (define en 1 línea, verificado len 93). **Lección general: cualquier secreto leído de una constante PHP y metido en una cabecera HTTP → `trim()` defensivo.** No es un fallo de `wp_remote_post` (que funciona perfecto con el PAT limpio).
- **Triggers (mu-plugin):** **7 CPTs** (portfolio, servicio, alquiler, alquiler_pack, director, cliente, **contenido**) vía transition_post_status + before_delete_post; 2 taxonomías (portfolio_category, rental_category) vía created/edited/delete_term. Ignora autosaves/revisiones. `contenido` se añadió con el CMS de páginas fijas, así que editar «Nosotros», «Datos de contacto» o «Inicio» ya dispara rebuild sin tocar nada.
- **TARGET = staging** (Variable `DEPLOY_TARGET`). Excludes rsync: `.php-ini`, `.php-version`, `robots.txt`, `.htpasswd` (preservan ficheros del server que `--delete` borraría; robots y htpasswd = protección de staging).
- **Secretos/config fuera del repo:** GitHub Secrets `SSH_DEPLOY_KEY` (ed25519 CI dedicada, **rotada**; pública en `authorized_keys` del server) + `SSH_KNOWN_HOSTS`; Variables `WP_API_URL`/`DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_TARGET`. WP `wp-config.php`: `OBLIQ_DEPLOY_PAT`/`OBLIQ_DEPLOY_REPO` (✅ puestos, limpios y verificados) + `DISABLE_WP_CRON=true`.
- **Deuda iCloud `" 2"`:** resuelta de facto por el build en CI (runner limpio).

### Mejora UX admin — campos de imagen con selector nativo wp.media ✅ (17-Jul-2026)

- **Qué:** los 6 campos de imagen de los CPTs (`sv_image`, `sv_case_study_image`, `pf_image`, `dr_photo`, `al_image`, `cl_logo`) pasan de input-de-texto-pega-URL a **selector de la Biblioteca de medios de WordPress** (`wp.media`): botón «Seleccionar imagen» + vista previa + botón «Quitar». En `scripts/obliq-cpts.php` (mu-plugin del WP).
- **Cómo (sin romper nada):** helper nuevo `obliq_media_field()` que guarda la URL en el **mismo meta key** → `obliq_save_meta_fields`, `wp-client.ts` y el frontend **intactos**. El input sigue visible/editable (fallback pegar URL) → compat total con URLs ya guardadas. `wp_enqueue_media()` + JS `wp.media` encolados **solo** en `post.php`/`post-new.php` de esos 6 CPTs (guard por `get_current_screen()->post_type`).
- **Validado:** lint PHP 8.3 + render del metabox en contexto WP real (estados con/sin imagen, guards negativos ok, enqueue ok) + **clic en admin confirmado por el cliente** (abre Biblioteca, guarda, muestra preview). Desplegado al servidor (backup `obliq-cpts.php.bak-*`). Commit en `redesign`.

### Staging desplegado, validado y PROTEGIDO ✅ (17-Jul-2026)

- **Live:** `staging.obliqproductions.com` (subdominio estático Plesk, docroot `~/staging.obliqproductions.com/`). Producción (`~/httpdocs` main + `~/admin.*` WP) intactas. SIN cutover DNS/MX.
- **Validaciones (en servidor real):** 301 `.htaccess` ✅ (disparan en Plesk, 1 salto, destinos 200) · Vimeo ✅ reproduce bajo el subdominio (segmentos vod-adaptive 200 en ES+EN → incógnita embed-por-dominio resuelta) · nav WP-real ✅ (16 URLs 200, 0 404) · email ✅ `mail()` entrega (confirmado a victor@grupoantena.com).
- **Protección ✅ Basic Auth a nivel nginx:** `.htpasswd` bcrypt (`$2y$`, user `obliq`) en el docroot + directivas `auth_basic` + `location = /.htpasswd { deny all; }` en «Additional nginx directives» de Plesk. Verificado: `/`, subpágina y `/api/*.php` → **401** sin credenciales, **200** con `obliq:<pass>`; `/.htpasswd` → **403**. Robusto: aplica en la capa que sirve (nginx), el `.htpasswd` está **excluido del rsync** (`--delete` no lo borra), fuera del `.htaccess` versionado. Credencial guardada aparte (NO en repo). `robots.txt` = `Disallow` (no indexable).
- **Diagnóstico Plesk clave:** nginx sirve estáticos directo (bypassa Apache y su Protected-Dir de Plesk) → por eso el Basic Auth de Apache no aplicaba; la solución robusta fue **auth a nivel nginx**. Las 301 sí funcionan porque las rutas viejas no existen como fichero → nginx las delega a Apache.

### Sprint P3 Redirecciones 301 ✅ CERRADO (17-Jul-2026)

### Sprint P3 — Redirecciones 301 de la migración de URLs ✅ 17-Jul-2026

- **Mecanismo elegido: `.htaccess` (Apache mod_rewrite)** en `public/.htaccess` → Astro lo copia a `dist/.htaccess` en cada build (versionado, revisable, desplegado con el sitio). Justificación en `docs/guides/redirects-301.md`
- **Por qué .htaccess y no otro:** redesign es SSG puro (sin adaptador) → se sirve estático (docroot=dist, Apache tras nginx). Astro `redirects` en SSG solo emite `<meta refresh>` (redirección blanda, NO 301 real). Node adapter = reintroducir SSR solo para redirigir un sitio estático (complejidad innecesaria). nginx panel = no versionado. `.htaccess` da 301 reales, versionadas y revisables. Las rutas antiguas no existen como fichero en el nuevo dist → nginx las delega a Apache → mod_rewrite aplica
- **11 reglas** (origen→destino final, 1 salto): `/es/`→`/`, `/es/about/`→`/nosotros/`, `/es/contact/`→`/contacto/`, `/es/rental/`→`/alquiler/`, `/es/legal/`→`/aviso-legal/`, `/es/videos/*`→`/portfolio/`; y EN sin prefijo→`/en/*`: `/about/`→`/en/about/`, `/contact/`→`/en/contact/`, `/rental/`→`/en/rental/`, `/legal/`→`/aviso-legal/`, `/videos/*`→`/en/portfolio/`. Toleran barra final (`/?$`)
- **Raíz `/` NO se redirige (excepción deliberada):** antes home EN, ahora home ES con 200; un 301 `/`→`/en/` rebotaría a todo visitante ES al inglés y destruiría la estrategia ES-first. Vínculo con la vieja home EN vía hreflang + autodetección JS 1ª visita
- **Detalle vídeo/director:** el sitio nuevo no tiene `/portfolio/[slug]/` ni páginas de director → los slugs viejos van al grid `/portfolio/` (evita 301→404)
- **Verificado (sin deploy):** `.htaccess` copiado a dist ✓; `scripts/verify-redirects.mjs` simula Apache (primer match, [L]) sobre 27 URLs (con/sin barra) → 27/27 al destino esperado en 1 salto, todos 200 en dist, **0 cadenas, 0 bucles**
- **Fallback documentado:** bloque nginx equivalente para «Additional nginx directives» de Plesk si el estático se sirviera nginx-directo. SIN deploy

## Historial rediseño — Sprint P2 Formulario Contacto ✅ CERRADO (17-Jul-2026)

### Sprint P2 — Formulario de contacto con email ✅ 17-Jul-2026

- **Backend:** `public/api/send-contact.php` replica el patrón de `send-quote.php` — anti-spam 4 capas (honeypot, token SHA-256 con secret `obliq_contact_{fecha}`, tiempo mínimo 3s, rate limiting 5/10min por IP), validación email (filter_var) + teléfono opcional (6-15 dígitos), sanitización XSS de TODO input (`htmlspecialchars ENT_QUOTES`), anti header-injection en Subject (`headerSafe`), caps de longitud. Email HTML dark → info@obliqproductions.com
- **Campos:** nombre*, email*, teléfono, empresa, servicio (select), mensaje* + campo oculto `interest` (producto/pack pre-rellenado). Required: nombre/email/mensaje
- **Frontend:** lógica extraída a `src/lib/contact-form.ts` (compartida ES/EN). Estados UX loading/success/error idénticos al quote; banner modo simulado fuera de obliqproductions.com. Pre-relleno desde query: `?servicio=`/`?service=` (select) y `?producto=`/`?product=`/`?pack=` (interest). A11y: role=alert/status, aria-live, foco a success
- **i18n:** +7 claves CONTACT_PAGE (FORM_COMPANY, FORM_SENDING, SUCCESS_*, ERROR, SIMULATED) en es/en
- **Bug corregido de paso:** el `pattern` del teléfono se rompía en los 4 forms (quote+contacto ES/EN) — Astro colapsaba `[\d\s\+\-\.\(\)]` a `[ds+-.()]` (regex inválida → checkValidity lanzaba). Fijado a `pattern={'[0-9\\s+.\\(\\)\\-]{6,20}'}`. Afectaba también a presupuesto.astro/en/quote.astro que estaban rotos desde Sprint Quote Form
- **Verificado (Playwright, preview):** build 78 págs 0 errores; ES+EN modo simulado → success + foco; prefill servicio+interest desde URL; required bloquea vacío; email inválido rechazado; consola sin errores; teléfono válido
- **Pendiente producción:** test email real con PHP mail() en Plesk (igual que quote, aún sin validar en server). SIN deploy

## Historial rediseño — Sprint P1 Portfolio Real ✅ CERRADO (17-Jul-2026)

### Sprint P1 — Portfolio Real ✅ 17-Jul-2026

- **WP conectado en serio:** `WP_API_URL` persistida en `.env` VERSIONADO (URL pública de solo lectura; `.gitignore` ajustado — los secretos siguen en `.env.local`, ignorado). Fallback mock intacto para dev offline (catch → mock con warning)
- **Contenido real en WP:** script one-off `scripts/obliq-portfolio-reset.php` ejecutado en servidor → 6 categorías (Gastro 2, Marcas 3, Branded content 1, Entrevistas 2, Eventos 1, Spots 2) + 11 proyectos con `pf_vimeo_url` (8 con hash de privacidad). Featured provisional: Gastro 1, Marcas 1, Spots 1
- **Filtros dinámicos:** derivados de términos WP con count>0 en orden term_id asc — el cliente añade categorías sin tocar código. Corregido bug EN preexistente (filtros hardcodeados nunca matcheaban)
- **Lightbox Vimeo accesible:** Esc, focus trap, foco restaurado, aria-modal, iframe vaciado al cerrar, `dnt=1`, hash `h=` conservado
- **Thumbnails oEmbed** en build con caché por módulo; si el cliente sube `pf_image` en WP, su imagen gana
- **Build final contra WP real:** 78 págs, 0 errores, 0 fallbacks; 11 thumbnails i.vimeocdn.com; 6 dominios WP verificados (servicios 12 págs, alquiler 22 con precios+multidía, packs, equipo, 13 clientes reales en marquee — Samsung/MasterChef World son clientes REALES, no placeholder)
- **Acceso servidor:** clave SSH dedicada `~/.ssh/id_ed25519_obliq` + alias `obliq-plesk` en ~/.ssh/config. PHP CLI del servidor: `/opt/plesk/php/8.3/bin/php` (¡`php` NO está en PATH — causa del primer intento fallido del script!). Docroot WP: `~/admin.obliqproductions.com/`
- **Pendiente del cliente:** títulos/años/clientes reales de los 11 proyectos (ahora «Proyecto {cat} {n}»); imágenes propias si quieren sustituir thumbnails
- **Pendiente técnico:** term meta `pc_name_en` en portfolio_category (mu-plugin) si el cliente quiere nombres EN distintos en filtros (hoy: mismo nombre ES/EN)
- **Commits:** `9ccd93a` (retoma), `355462d` (feat portfolio), este cierre. SIN deploy — la web pública sigue sirviendo main

## Historial rediseño (fase REANUDADA 16-Jul-2026)

### Retoma Julio 2026 (16/17-Jul-2026)

**Estado al reanudar tras 4 meses parado (desde 26-Mar-2026):**
- Rama `redesign` intacta, working tree limpio. WP headless VIVO (admin.obliqproductions.com, HTTP 200)
- Contenido WP seguía siendo 100% placeholder del seed de marzo (MasterChef, Loewe…) — el cliente no subió nada
- **Validación P0.5 ✅ (16-Jul):** build contra WP real (`WP_API_URL` inline) → 78 páginas, exit 0, los 6 transformers de `wp-client.ts` (servicios, portfolio, alquiler, packs, directores, clientes) procesan JetEngine sin fallback. Evidencia: 0 warnings `WP fetch failed` en log completo
- Build mock (sin `WP_API_URL`): también 78 páginas OK. `WP_API_URL` aún NO persistida — se hará al final de P1 (flip WP)
- Incidente entorno: iCloud había desalojado `node_modules` (ficheros dataless) → `rm -rf node_modules && pnpm install` lo resuelve. pnpm 10 ignora build scripts de oxide/esbuild/sharp (funciona con binarios precompilados; pendiente `pnpm approve-builds`)

**Decisiones tomadas en la retoma (cliente):**
1. **6 categorías de portfolio definidas por el cliente:** Gastro, Marcas, Branded content, Entrevistas, Eventos, Spots (sustituyen a las 6 del placeholder)
2. **Lanzamiento completo** (no soft-launch): el redesign sale a producción íntegro cuando el contenido esté listo
3. **Auto-rebuild:** se implementará webhook WP publish → rebuild (sube de prioridad media a comprometida)

**Sprint P1 — Portfolio Real (en curso):**
- 11 vídeos Vimeo reales del cliente, títulos provisionales «Proyecto {categoría} {n}» hasta recibir títulos definitivos
- Filtros dinámicos derivados de las categorías presentes en WP (el cliente puede añadir categorías sin tocar código)
- Reproducción en lightbox accesible (iframe player.vimeo.com, conserva hash de privacidad)
- Thumbnails vía Vimeo oEmbed en build (NO API v2 deprecada, sin API key), con caché
- Orden obligatorio: 1º contenido WP (script PHP one-off ejecutado por Víctor en servidor), 2º flip `WP_API_URL`
- Bug preexistente detectado: filtros EN hardcodeados ('Corporate') no matchean `data-category` (nombre ES del término WP) — los filtros EN nunca funcionaron con datos WP; la derivación dinámica lo corrige

### Sprint 0 (Fundamentos) ✅ 2-Mar-2026
- Rama `redesign` — i18n invertido, tokens, atoms, organisms, sections
- BaseLayout SEO, GSAP utils, Schema.org, Home ES+EN
- Build: 2 páginas, 0 errores

### Migración Plesk ✅ 2-Mar-2026
- Rama `plesk-migration` — Vercel→Node.js, Passenger, LIVE
- SSH: `obliqproductions.com_zbt88qx0mpj@obliqproductions.com`
- WP root: `~/admin.obliqproductions.com/`

### Sprint 1A+1B (Páginas + Polish) ✅ 2-Mar-2026
- 76 páginas SSG (9 servicios, 6 cat alquiler, 15 productos, portfolio, contacto, legal)
- Animaciones GSAP, packs alquiler, descuentos multidía, custom cursor

### Sprint 2 (WordPress Headless CMS) ✅ 2-Mar-2026
**Fase A — Credenciales:** App Password + SFTP en `.env.local`
**Fase B — Esquema WP:** mu-plugin `obliq-cpts.php` → 6 CPTs + 2 taxonomías + meta fields
**Fase C — Capa Astro:** `wp-client.ts` + `wp-types.ts` + 5 facades async con mock fallback
**Fase D — Migración:** 16 páginas (8 ES + 8 EN) de mock → async WP data
**Fase E — Seed:** 63 items creados vía PHP CLI (9 serv, 15 prod, 3 packs, 12 cats, 9 portfolio, 4 team, 13 clientes)
**Auditoría:** Tipos defensivos (optional chaining), 76 páginas build 0 errores
**Pendiente Fase F:** Webhook auto-rebuild (diferido)

#### Archivos clave Sprint 2
| Archivo | Función |
|---------|---------|
| `src/lib/wp-client.ts` | Cliente REST API + transformers + helpers JetEngine |
| `src/lib/wp-types.ts` | Tipos TS para respuestas WP REST (campos top-level) |
| `src/data/services.ts` | Facade async — getServicesAsync(), getServiceBySlugAsync() |
| `src/data/rental.ts` | Facade async — getCategoriesAsync(), getPacksAsync(), etc. |
| `src/data/portfolio.ts` | Facade async — getPortfolioProjectsAsync() |
| `src/data/team.ts` | Facade async — getTeamAsync() |
| `src/data/clients.ts` | Facade async — getClientsAsync(), getClientNamesAsync() |
| `scripts/obliq-cpts.php` | mu-plugin WP: register CPT + taxonomy + rest_field |
| `scripts/obliq-seed.php` | Script seed (auto-eliminado tras ejecución) |

#### Patrón técnico WP: register_rest_field (NO register_post_meta)
- Los campos meta aparecen en **top level** de la REST response (no en `meta:{}`)
- `register_rest_field()` con `get_callback`/`update_callback` para TODOS los campos
- `register_post_meta()` funciona para la DB pero no expone en REST con este WP
- Taxonomías sí usan `register_term_meta()` con `show_in_rest` (funciona)

#### WordPress estado actual
- URL: `admin.obliqproductions.com`
- WP REST API: pública sin auth para lectura
- JetEngine 3.8.4 instalado (endpoints MCP disponibles)
- mu-plugins/obliq-cpts.php: activo, registra todo el esquema
- 63 items publicados, contenido bilingüe ES+EN
- Sin imágenes reales (placeholder /hero.jpg) — pendiente subida por cliente
- 7/9 servicios sin pricing (solo streaming y redes tienen packs productizados)

### Sprint 2.5 (Bugs críticos + Polish) ✅ 3-Mar-2026
- **Commit:** `5f3f9d7` en rama `redesign`
- **GSAP no pre-bundleaba en Vite:** Añadido `optimizeDeps.include` en `astro.config.mjs`
- **TransitionMask cubría toda la página (pantalla negra):** Tailwind 4 `translate-y-full` usa CSS `translate` (no `transform`). JS usaba `style.transform` → propiedades separadas que se apilaban. Fix: inline `style="translate: 0 100%;"` + JS usa `style.translate` + animaciones por opacity
- **Elementos invisibles tras scroll:** GSAP `toggleActions: 'play none none reverse'` → cambiado a `'play none none none'` en `gsap.ts` y ambos `index.astro`
- **Spacing tokens rotos (0px):** En Tailwind 4, `--spacing-section` genera `py-section` (no `py-spacing-section`). Renombradas ~40 clases en 30 archivos
- **Header rediseñado:** Grid 3 columnas con `navLeft | logo.gif centrado | navRight + LangSwitcher`
- **TransitionMask:** Simplificada a fade negro limpio (sin logo/slash)
- **logo.svg copiado a public/** — eliminado residuo `public/logo 2.svg`

#### Lecciones aprendidas (Tailwind 4)
- `--spacing-X: Npx` en `@theme` → genera utility `py-X`, NO `py-spacing-X`
- CSS `translate` y `transform` son propiedades SEPARADAS que se apilan — no mezclar clases Tailwind `translate-*` con JS `style.transform`

### Sprint Cart+UX ✅ 24-Mar-2026
- Carrito interactivo con selector de días por producto y pack
- Descuentos multidía (1d=0%, 3d=10%, 5d=15%, 7d=20%)
- CartBottomBar + CartHeaderButton con desplegables
- Commit: `506525e`

### Sprint Quote Form ✅ 26-Mar-2026
- **Formulario presupuesto:** Página dedicada `/presupuesto` (ES) y `/en/quote` (EN)
- **Backend PHP:** `public/api/send-quote.php` — email HTML, validación, anti-spam
- **Anti-spam (4 capas):** honeypot, JS token SHA-256, tiempo mínimo 3s, rate limiting 5/10min
- **Validación:** email (filter_var), teléfono (6-15 dígitos), fecha (no pasada)
- **UX:** 2 columnas desktop (resumen + formulario), stack móvil, selector días por producto, eliminar productos, estados vacío/form/loading/success/error
- **Cart store:** eliminado `generateMailtoLink()`, añadidos `getQuotePageUrl()` y `getCartDataForQuote()`
- **i18n:** 35 claves QUOTE.* en es.json y en.json
- **Detección entorno:** si no es obliqproductions.com → modo simulado (banner amarillo)
- **Docs reorganizados:** `docs/specs/`, `docs/audits/`, `docs/guides/`, `docs/sprints/`
- **Limpieza:** 39 duplicados " 2" eliminados, legacy pages/components eliminados
- **Commit:** `b68741d`
- **Vercel preview:** Desplegado en proyecto existente `grupo-antena/obliq`, URL de producción activa
- **Estado:** En revisión por cliente, esperando feedback

#### Archivos clave Sprint Quote Form
| Archivo | Función |
|---------|---------|
| `src/pages/presupuesto.astro` | Página formulario ES |
| `src/pages/en/quote.astro` | Página formulario EN |
| `public/api/send-quote.php` | Backend PHP: validación + email HTML |
| `src/lib/cart-store.ts` | Store carrito (sin mailto, con helpers quote) |
| `src/components/organisms/CartBottomBar.astro` | Barra carrito inferior |
| `src/components/organisms/CartHeaderButton.astro` | Botón carrito header |
| `docs/specs/2026-03-26-quote-form.md` | Spec formal completa |

### Backlog (próximas sesiones)

**PENDIENTE FEEDBACK CLIENTE (Quote Form):**
- Validar flujo completo de presupuesto con el cliente
- Ajustes de diseño/UX según feedback
- Test envío email real en Plesk (PHP mail())

**PRIORIDAD ALTA:**
1. Auditoría visual página por página (espaciados, responsividad)
2. Formulario contacto: integrar envío email (PHP en Plesk, misma solución que quote)
3. Imágenes reales: subir fotos producto/servicio a WP Media Library
4. Deploy redesign a producción Plesk (rama redesign → build → httpdocs)
5. Redirecciones 301 de URLs antiguas (EN default → ES default)

**PRIORIDAD MEDIA:**
6. Webhook auto-rebuild: WP publish → GitHub Actions → build → SFTP a Plesk
7. Portfolio: URLs Vimeo reales + thumbnails (cliente proporciona)
8. WhatsApp mensaje contextual según página
9. ~~**Deuda técnica — destinatario de correo inconsistente entre endpoints.**~~ **✅ SALDADA 10-Ago-2026** (commit `9152c4d`): `send-contact.php` usa el mismo patrón `OBLIQ_MAIL_TO` fail-closed que `send-quote.php`. Staging ya puede redirigir el contacto a un buzón de pruebas.
10. **Deuda técnica — fuente de descuentos por tramos DUPLICADA front/back (26-Jul-2026).** Al eliminar la fila global «Descuento multidía» (mentía en carritos de días mixtos) y pasar la etiqueta `(-X%)` a **por línea**, el correo (`send-quote.php`) necesitó su propio cálculo de tramo: `obliq_discount_percent($days)` es **gemelo** de `getDiscountPercent()` en `src/lib/cart-store.ts` (tramos 1/3/5/7 = 0/10/15/20). La regla vive en **dos sitios**. ⚠️ **Si el cliente edita un tramo y solo se toca uno, la página y el correo divergen.** No se unificó a propósito (sería un refactor aparte). Ambos ficheros llevan comentario que apunta a su gemelo. Pendiente: fuente única (p. ej. exponer los tramos desde WP o un JSON compartido) si los descuentos dejan de ser fijos.
11. **Deuda técnica — `send-contact.php` sin RFC 2047 en el asunto (detectada 09-Ago-2026).** Usa `headerSafe()`, que solo quita CR/LF; **no codifica la cabecera**. Cualquier acento, ñ o el propio guion largo llega mangled en el asunto (capturado: `Nuevo mensaje de contacto ? QA`). `send-quote.php` ya lo resolvió con `mb_encode_mimeheader()`. **Es una línea**: aplicar el mismo tratamiento. → **sprint de idioma/editabilidad**, junto al punto 12.
12. **OPCIÓN B — enviar por Resend/SES en vez de `mail()` (evaluada 09-Ago-2026, NO implementada).** La infraestructura **ya está provisionada y verificada en la zona**: `send.obliqproductions.com` MX → `feedback-smtp.eu-west-1.amazonses.com`, TXT `v=spf1 include:amazonses.com ~all`, selector `resend._domainkey`, y el SPF principal ya trae `include:amazonses.com`. La web VIEJA usaba Resend.
    - **A favor:** **logs de entrega** (delivered/bounced/spam) — que es la deuda real que destapó esta incidencia; DKIM propio alineado; mejor reputación que una IP compartida con 33 dominios bajo `p=quarantine`.
    - **En contra:** requiere recuperar **acceso a la cuenta de Resend** (¿de quién es?) + API key en el pool; ~20 líneas por endpoint (POST por curl, sin dependencias nuevas) + manejo de errores; **no arregla el servidor** (WordPress y cualquier otro `mail()` hacia `@obliqproductions.com` seguirían dependiendo de la config de Plesk).
    - **Criterio: complementaria, no alternativa.** La Opción A era el arreglo (un clic, cero código, arregla el dominio entero). B entra como sprint propio **por la observabilidad**, condicionada al acceso a Resend. Si se hace, el `-f` queda inerte pero inofensivo.
13. **Limpieza DNS — restos de correo local (no urgente).** Con el correo ya en Google, los SRV `_imaps`/`_pop3s`/`_smtps` y los hosts `mail.`/`webmail.` siguen apuntando al Plesk → **autodiscover incorrecto** en clientes de correo. Retirar cuando se toque la zona. ⚠️ Hacerlo **a mano, registro a registro** — ver la advertencia de «Apply DNS Template».

**PRIORIDAD BAJA:**
9. Schema.org VideoObject en portfolio (cuando haya URLs Vimeo reales)
10. Optimizar GSAP deduplication
11. Migrar logo.gif → WebP/Lottie
12. DNS/MX migration planning
13. i18n admin WP (Polylang si cliente lo necesita)

**DEUDA TÉCNICA:**
- Merge pendiente: plesk-migration → main → seguir con redesign

## Project Overview

- **Cliente:** Obliq Productions — productora audiovisual multidisciplinar, Valencia
- **Dominio:** obliqproductions.com / obliq.es
- **Repo:** VictorGrupoAntena/obliq.git
- **Working dir:** /Users/victormedina/Documents/Proyectos web/obliq/obliq
- **Deploy:** Plesk (Grupo Antena) — web actual LIVE en obliqproductions.com
- **Stack redesign:** Astro 5.x SSG + Tailwind 4 + GSAP 3.13 + WordPress headless (CMS)
- **WP Admin:** https://admin.obliqproductions.com (JetEngine 3.8.4, mu-plugin obliq-cpts.php)

## Documentación estratégica

Estos documentos contienen las decisiones de negocio y el contexto que no se puede inferir del código. Léelos antes de planificar:

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Memoria técnica v6 | `docs/specs/memoria-tecnica-v6.md` | Visión completa del rediseño |
| Design Spec | `docs/specs/design-spec.md` | Tokens, componentes, estructura |
| Quote Form Spec | `docs/specs/2026-03-26-quote-form.md` | Formulario presupuesto alquiler |
| Análisis competitivo | `docs/audits/analisis-competitivo-rental.md` | 5 rental houses analizados |
| Informe estado actual | `docs/audits/informe-estado-actual.md` | Auditoría web actual |
| UX/UI Review | `docs/audits/ux-ui-review.md` | Auditoría UX/UI con hallazgos WCAG |
| Animation Spec | `docs/guides/animation-spec.md` | 17 animaciones GSAP catalogadas |
| Claude CLI Guide | `docs/guides/prompt-claude-cli.md` | Guía de uso Claude CLI |
| Cart+UX Briefing | `docs/sprints/briefing-cart-ux.md` | Briefing carrito + UX |
| Cart+UX Plan | `docs/sprints/plan-cart-ux.md` | Plan implementación M1-M9 |

## Decisiones estratégicas ya tomadas

Estas decisiones son **zona roja** — no se cambian sin consultar al responsable del proyecto:

### Idioma
- **Español como idioma por defecto** (sin prefijo de URL). Inglés bajo `/en/`
- La web actual tiene inglés como default — esto se invierte completamente
- URLs en español: `/servicios/`, `/alquiler/`, `/contacto/`, `/nosotros/`, `/portfolio/`
- URLs en inglés: `/en/services/`, `/en/rental/`, `/en/contact/`, `/en/about/`, `/en/portfolio/`
- Hreflang bidireccional ES↔EN en todas las páginas
- Redirecciones 301 de todas las URLs antiguas (ver tabla completa en memoria técnica)
- **El mapa de rutas ES↔EN vive en `src/lib/routes.ts`, y solo ahí.** No se escriben rutas EN a mano en ningún sitio: el código las escribe en español y `localizedUrl()` traduce. Un slug nuevo se añade al mapa, no a un literal. Esta regla existe porque su ausencia costó 1.014 enlaces rotos (ver incidencia de i18n arriba).

#### Páginas legales: solo en español (decisión consciente, 10-Ago-2026)
- `/aviso-legal/`, `/politica-privacidad/` y `/politica-cookies/` **no tienen versión inglesa**. Desde `/en/` se enlazan a la ES sin prefijo, y el `.htaccess` redirige `/en/aviso-legal/` → `/aviso-legal/`.
- **Motivo:** no se publica traducción de texto jurídico (LSSI, RGPD, cookies) sin validación del cliente o su asesoría. Las tres son `noindex`, luego el impacto SEO es **nulo**. Coherente con lo que ya asumía el `.htaccess` desde la migración («No existe /en/legal/»).
- **Consecuencia técnica:** esas tres rutas **no emiten `hreflang` alterno**. La ausencia es deliberada, no un hueco del mapa — está codificada en `ES_ONLY` de `src/lib/routes.ts`. No "arreglar" añadiéndoles hreflang.
- **⏳ PENDIENTE — consultar a Jordi** si quiere las legales en inglés. Si dice que sí: 3 ficheros en `src/pages/en/`, claves `LEGAL_*` en `en.json`, y sacar los 3 slugs de `ES_ONLY`. El resto del mapa ya lo soporta.

#### ⏳ DEUDA ABIERTA CON EL CLIENTE — spec §4.1 sin implementar
La memoria técnica (`docs/specs/memoria-tecnica-v6.md` §4.1) promete dos cosas que **nunca se construyeron** y que siguen pendientes a 10-Ago-2026:
- **Cookie de preferencia de idioma** («Sí, recuerda elección del usuario»).
- **Autodetección de idioma en la primera visita a `/`** («Solo primera visita a /, con 301»).

Hoy el `LangSwitcher` cambia de idioma pero **no recuerda la elección**, y un visitante anglófono que llega a `/` recibe la home en español. Está prometido en la memoria entregada al cliente: es deuda con él, no una mejora opcional. La nota del propio `.htaccess` sobre la raíz `/` **da por hecha** esa autodetección («se preserva vía hreflang + autodetección de idioma JS»), así que ese comentario describe un diseño incompleto.

### Arquitectura
- **WordPress headless como CMS** — WordPress solo como backend (API), Astro como frontend
- **Hosting: Plesk (Grupo Antena)** — decisión tomada. Todo en un servidor: Astro (Node.js) + WordPress. Motivos: unificar clientes bajo nuestro sistema de dominios/hosting, malas experiencias con Vercel para gestión de correos electrónicos
- Conexión al servidor vía **SSH** (ADA ya conoce el flujo de deploy en Plesk)
- El cliente gestiona contenido desde WordPress: servicios, portfolio, directores, productos alquiler, packs, logos clientes
- Plugin bilingüe (WPML o Polylang) para gestionar ES/EN desde WordPress
- Webhook WordPress → rebuild Astro en cada publicación/edición
- WordPress en subdominio no público (admin.obliqproductions.com)

### Migración DNS y correo electrónico
- **Estado actual: DESCONOCIDO** — investigar dónde están los DNS de obliqproductions.com/obliq.es, qué registros MX existen, qué proveedor de correo usan actualmente
- Planificar transferencia de DNS al servidor Plesk sin interrumpir el servicio de email
- Configurar registros MX, SPF, DKIM, DMARC en Plesk
- El dominio tiene correo activo (info@obliqproductions.com) — la migración de DNS debe ser coordinada para evitar downtime de email

### Servicios (9 páginas)
1. `/servicios/streaming/` — Servicio estrella, baja competencia SEO
2. `/servicios/contenido-redes-sociales/` — Packs productizados (Starter/Growth/Premium)
3. `/servicios/video-corporativo/` — Mayor volumen de búsqueda tras "productora audiovisual"
4. `/servicios/spots-publicitarios/` — EN: `advertising-spots`
5. `/servicios/videoclips/` — EN: `music-videos`
6. `/servicios/eventos/`
7. `/servicios/fotografia/` — EN: `photography`
8. `/servicios/postproduccion/` — EN: `post-production`
9. `/servicios/consultoria/` — EN: `consulting`

### Packs y tarifas (precios del cliente)

**Packs contenido redes sociales:**
- Starter: 400€/mes (1 filmmaker, 4h, 5 reels)
- Medium: 600€/mes (1 filmmaker, 8h, 10 reels)
- Expert: 1.200€/mes (1 filmmaker + 1 fotógrafo, 8h+4h, 15 reels, 1 vídeo resumen, 100 fotos)

**Tarifas streaming:**
- Básica: 1.000€ (1 realizador, 2 cámaras fijas, media-jornada completa)
- Media: 1.500€ (1 realizador, 2 cámaras fijas, 1 operador cámara)
- A medida: presupuesto personalizado

**Extras redes sociales:** Guionización 5 reels 100€, filmmaker media jornada extra 200€, jornada completa extra 250€

**Edición para redes:** Reel/Short 40€, vídeo largo YouTube 200€, vídeo resumen 150€

### Alquiler — arquitectura de URLs
- Landing general: `/alquiler/`
- Categorías: `/alquiler/camaras/`, `/alquiler/opticas/`, `/alquiler/soporte/`, `/alquiler/monitores/`, `/alquiler/audio/`, `/alquiler/accesorios/`
- Fichas producto: `/alquiler/camaras/sony-fx6/`, `/alquiler/audio/rode-wireless-pro/`
- Cada ficha con Schema.org Product (ningún competidor lo hace — ventaja de primer movedor)
- Meta titles con precio: "Alquiler Sony FX6 en Valencia — 110€/día | Obliq"
- 15 productos actuales (ver lista completa en memoria técnica)

### Conversión
- Módulo pricing con tarjetas comparativas (componente reutilizable para servicios con packs)
- Botón "Estoy interesado" → formulario contacto con pack/producto pre-rellenado (?servicio=X&pack=Y)
- WhatsApp flotante en todas las páginas con mensaje pre-rellenado según contexto
- Formulario específico de alquiler (separado del genérico de contacto)
- Carrito de presupuesto para alquiler (lista de productos + fechas → enviar solicitud)

### SEO
- Meta titles y descriptions únicos para cada página (ver propuestas en memoria técnica)
- Schema.org: LocalBusiness, VideoObject, Product, Service, Offer, BreadcrumbList
- Sitemap.xml automático (incluye vídeos y productos)
- Robots.txt configurado
- Canonical URLs + Open Graph + Twitter Cards en todas las páginas
- Google Business Profile optimizado para "alquiler audiovisual"

## Contexto competitivo clave

- **Productoras:** 9 competidores analizados. Ninguno combina streaming + rental + portfolio directores + bilingüismo + packs productizados
- **Rental houses:** 5 competidores analizados. Obliq no existe en Google para alquiler (web en inglés, sin fichas individuales). Ningún competidor usa Schema.org Product correctamente. Visual Rent es el más avanzado técnicamente pero con errores PHP y contenido duplicado
- **Oportunidades:** "streaming Valencia" tiene baja competencia, packs contenido redes es nicho sin explotar, rich snippets con precios en alquiler (nadie lo hace)
- **Ventaja Obliq:** único que combina productora + rental con precios públicos transparentes. Stack Astro superior al WordPress de 8/9 competidores

## Documentación de diseño (2-Mar-2026)

Análisis completo del diseño en Pencil (`obliq-design-system.pen`) completado.
Toda la documentación está reorganizada en `docs/` (specs, audits, guides, sprints).

### Componentes del Design System (22 únicos)
- **Navigation:** Header, Footer, Breadcrumbs, Marquee/Large, Marquee/Small, WhatsApp FAB/Expanded
- **Buttons:** Primary, Dark, Outline, Ghost (52px alto, 11px/600, 3px spacing)
- **Cards:** Service-Text, Service, Category, Product (dark), Product-Light, Product-Compact, Pricing (×3 variantes), Portfolio
- **Patterns:** Section-Header (dark/light), Spec-Row, Hero (variantes), Quote Cart Preview
- **Form:** Form + Info layout (contacto)
- **Filter:** Tabs de filtro (portfolio)

### Tokens clave para Tailwind @theme
- Colores: #000, #FFF, #111 (surface-dark), #F5F5F5 (surface-light), #333, #888, #CCC, #DDD
- Font: Montserrat Variable (ya en uso)
- H1: 72px/900/italic/-3, H2: 48px/900/italic/-2, Body: 18px/300/1.6
- Sección padding: 80px, gaps: 24-48px

### Assets a reutilizar
- favicon.ico ✅ (barra inclinada Obliq, 16KB — referenciado en ambos layouts)
- logo.svg ✅ (4KB — duplicado en src/assets/ y public/, unificar)
- logo.gif ✅ (796KB — evaluar WebP/Lottie)
- 15 fotos producto PNG (~13MB — pasar por <Image> Astro)
- 7 fotos about/contact/video JPG
- favicon.svg NO SE USA (no referenciado en ningún layout)

## Historial completado (fase anterior — mantenimiento)
- Google Analytics GA4 (G-896V9YZVME) — Layout.astro + Video.astro ✅
- Google Search Console verification ✅
- SEO + H1 fix for /rental pages ✅
- Vimeo API thumbnails ✅
- Google Sheets parsing fix ✅
- Migración infraestructura a repo y deploy propios ✅

## Notas técnicas
- Git repo is inside `obliq/obliq/` (not the parent `obliq/`)
- **Branch `main`:** web actual (Vercel SSR, EN default, Google Sheets + Vimeo API v2)
- **Branch `redesign`:** nueva web (SSG, ES default, tokens, i18n invertido, quote form, limpia)
- Stack redesign: Astro 5.x + @astrojs/sitemap + Tailwind 4 + GSAP + PHP (email)
- **Hosting producción:** Plesk ✅ (migración completada, LIVE con main)
- **Preview cliente:** Vercel `grupo-antena/obliq` — deploy prod desde redesign branch
- **Vercel Deployment Protection:** activada — necesita desactivarse en dashboard para acceso público
- about.mp4 (20.8 MB) y logo.gif (813 KB) — pendiente optimizar
- GSAP (~60KB) se carga en cada página sin deduplicación — pendiente optimizar
- Vimeo API v2 deprecada — migración a v3 obligatoria

## Datos empresa (para Schema.org y legal)
- **Razón social:** Obliq Audiovisual SL
- **CIF:** B19377019
- **Dirección:** C/ Pintor Navarro Llorens, bajo 3, 46008 Valencia
- **Email:** info@obliqproductions.com
- **Teléfono:** 675 489 980
- **GA4:** G-896V9YZVME
