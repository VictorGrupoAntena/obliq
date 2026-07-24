# Obliq Productions — Project Memory

## Fase actual: REDISEÑO — P1–P4 + CMS de páginas fijas + hero de vídeo CERRADOS (todo validado E2E en staging); pendiente solo cutover a producción (22-Jul-2026)

> Rama de trabajo `redesign` (limpia, pusheada). Producción sigue sirviendo `main` (SSR Node en `~/httpdocs`), intacta. Staging: **staging.obliqproductions.com** (Basic Auth user `obliq` + robots Disallow).

### ⏭️ PENDIENTE PRÓXIMA SESIÓN — retomar aquí

**P4 fase 2 ✅ CERRADO Y VALIDADO E2E (17-Jul-2026).** Todo montado en el servidor (PAT + constantes `OBLIQ_DEPLOY_PAT`/`OBLIQ_DEPLOY_REPO` + mu-plugin con `trim` + `DISABLE_WP_CRON` + cron de sistema cada minuto) y probado de punta a punta. Detalle en «Sprint P4» abajo. Lo único que queda del auto-deploy es el **cutover**.

**Bloqueantes de CUTOVER a producción** (no dependen de código):

- Títulos/años/clientes **reales** de los 11 proyectos (hoy «Proyecto {cat} {n}»).
- Diagnóstico **DNS/correo** del dominio (dónde están los DNS; MX está en **Google Workspace**).
- **SPF/DKIM/DMARC** del servidor: `mail()` entrega, pero revisar que no caiga en spam (envío server→Google en nombre de obliqproductions.com).
- **🔴 `OBLIQ_MAIL_TO` en producción (bloqueante).** `send-quote.php` lee el destinatario de la env `OBLIQ_MAIL_TO` (fail-closed: sin ella → 500). En el cutover hay que definir `OBLIQ_MAIL_TO=info@obliqproductions.com` en el PHP-FPM del dominio de **producción** (en staging = buzón de pruebas). `send-contact.php` **sigue** con `info@` hardcodeado (fuera del alcance de este sprint; revisar aparte si se quiere el mismo patrón).
- **✅ Tarifa de operador — condiciones CONFIRMADAS por el cliente (23-Jul-2026), bloqueante CERRADO.** El seed de `op_terms_es`/`op_terms_en` ya trae el texto definitivo (media jornada 4 h, jornada 8 h, brutos en 24 h, servicio en toda la Comunitat Valenciana; desplazamientos fuera → consultar). Sin marcador `[PENDIENTE…]` → el build en modo WP deja de avisar de estos campos. Como el seed v3 **nunca se subió**, el texto entra en la primera creación del singleton (sin bump de versión). ⚠️ El **mock de `src/data/operator.ts`** (fallback dev, WP-disabled) **aún conserva** el marcador → `WP_API_URL='' npm run build` seguiría avisando; irrelevante para los builds desplegados (deploy.yml usa WP real). Sincronizarlo es opción de una línea (pendiente de OK).
- **Default de los contadores de operador = 0/0 (decisión del cliente, sin cambio de código).** `n_jornadas`/`n_medias_jornadas` arrancan en 0/0 con restricción ≥1: el usuario elige siempre, sin default comercial. Es lo ya implementado.
- **Detalles comerciales ABIERTOS (no bloqueantes, editables desde WP en «Alquiler · Tarifa de operador»):** (1) **formato** de entrega de brutos (el plazo —24 h— está confirmado, el soporte disco/nube/transferencia no); (2) si el **desplazamiento dentro de la Comunitat** está incluido en la tarifa. Ambos se pueden matizar en `op_terms_*` cuando se cierren, sin tocar código.

**Backlog restante:**

- **P5:** auditoría visual página a página + **imágenes reales** (subir a WP Media / `pf_image`) + revisión de **seguridad** pre-entrega.
- `pc_name_en` (term meta) para nombres EN distintos en los filtros de portfolio (hoy ES=EN).
- **Cutover:** cambiar la Variable `DEPLOY_TARGET` de staging → producción y **quitar `--exclude='robots.txt'`** del `deploy.yml` (para publicar el robots real `Allow`).
- **Backups del servidor a limpiar en el cutover** (conservados a propósito): `wp-content/mu-plugins/obliq-deploy-hook.php.bak*`, `wp-content/mu-plugins/obliq-cpts.php.bak*`, `wp-config.php.bak*`, `staging.obliqproductions.com/.htpasswd.bak*`, `crontab.bak*` (en `~/`).
- **Credencial staging** (Basic Auth nginx): user `obliq`, pass reseteada 17-Jul (guardada aparte, NO en repo).

> ⚠️ **Todo lo listado en este MEMORY vive en la rama `redesign` y NO está en producción.** Producción sigue sirviendo `main` (SSR Node en `~/httpdocs`) y el auto-deploy apunta a staging (`DEPLOY_TARGET`). Esto incluye el CMS de páginas fijas (CPT `contenido`) y el hero de vídeo editable: **salen a producción en el cutover, no antes**. El mu-plugin `obliq-cpts.php` sí está ya activo en el WP compartido (`~/admin.obliqproductions.com`), que es único para staging y producción: los campos existen en wp-admin aunque la web pública todavía no los use.

---

### Sprint Alquiler siempre con operador — ✅ CÓDIGO EN `redesign` (23-Jul-2026); pendiente deploy mu-plugin a WP + staging

- **Qué:** el alquiler de equipos pasa a ser **siempre con operador** (modelo **aditivo**: `TOTAL = material + operador`). Tarifa confirmada por Dirección: **300 €/jornada · 200 €/media jornada (sin IVA)**, entrega de brutos incluida. Encargo `brain-it:it-brief`. Fase 0 (audit) + Fase 1 (plan) + Fase 2 (ejecución) en `docs/audits/alquiler-operador-fase0.md` y `docs/sprints/plan-alquiler-operador.md`.
- **Dónde vive la tarifa (D1):** **cuarta entrada singleton** del CPT `contenido`, `_obliq_key = 'alquiler'`, título «Alquiler · Tarifa de operador». Campos `op_jornada_price`, `op_media_price` (number), `op_includes_es/_en`, `op_terms_es/_en` (textarea). **🔑 `OBLIQ_CONTENIDO_SEED_VERSION` → `'3'`** (sin subirla no se crea en el WP ya instalado). Editable en WP nativo, sin código. El **deploy hook ya cubre `contenido`** → no se tocó `obliq-deploy-hook.php`. Se descartó Options Page (no existe) y CPT nuevo (sobredimensionado).
- **Data layer:** `src/data/operator.ts` → `getOperatorTariffAsync()` (memoizado). **A2: el build FALLA** (`throw`) si `op_jornada_price`/`op_media_price` no resuelven a >0 en modo WP — sin fallback a 0/vacío; sin WP usa mock 300/200 (build local/CI verde). **A2b: WARNING** (no error) listando campos con `[PENDIENTE DE CONFIRMAR CON CLIENTE]`.
- **Presentación (D2):** precio del material re-etiquetado `Equipo · {price}€/día + IVA` + badge «Siempre con operador» en tarjetas (`ProductCard`, `PackCard`), fichas y banda en las landings `/alquiler/`. Bloque de operador (aviso + qué incluye con brutos + condiciones) desde el singleton.
- **Formulario (D3):** el CTA «Alquilar» **añade al carrito** (no `?producto=`); el alquiler va por **`send-quote.php`** (no `send-contact.php`). Operador **por solicitud** → en la página de presupuesto (`presupuesto.astro` / `en/quote.astro`) **dos contadores** `n_jornadas` + `n_medias_jornadas` (independientes de los `days` del material; el selector binario se descartó por no expresar reservas multi-día). Total aditivo con línea de operador desglosada. **Con n+m=0 el resumen NO muestra importe**: texto «Indica las jornadas de operador…» + submit deshabilitado (validación cliente) + **422** en `send-quote.php` (`error_operator`). Precios inyectados en build desde WP (`data-*`), nunca hardcodeados. Email con bloque de operador + «Entrega de brutos incluida» + gran total material+operador. **Default de contadores pendiente de cliente** (hoy 0/0).
- **SEO (D4):** `productSchema()` **ya no emite `offers`/`price`** (con operador obligatorio, el precio pelado no es contratable → snippet engañoso; se acepta la pérdida en las fichas). El precio real y fijo se publica como **`Service`** en la landing `/alquiler/` (`rentalServiceSchema`): tarifa de operador desde el singleton, `areaServed` Valencia/Alicante/Castellón, provider el LocalBusiness existente. **NO** se añade `Service` a las fichas. A1 verificado: no había precio en title/meta/OG (nada que retirar).
- **Gates:** 🔒 Gate 1 (crear meta en WP) y 🔒 Gate 3 (staging) → **handoff pendiente** (sin acceso de escritura a WP ni al pipeline desde la sesión). Gate 2 (`send-quote.php`) hecho en su commit. `send-contact.php` no se tocó. `main` intacto.
- **Commits en `redesign`:** `2412bf6` (mu-plugin) · `1966da4` (data layer) · i18n · `acfc7fa` (D2) · `d4bafc9` (D3) · `0c2bcac` (D4).
- **⏭️ Para cerrar:** (1) desplegar `scripts/obliq-cpts.php` (seed v3) al WP compartido → auto-siembra el singleton; verificar `contenido?_obliq_key=alquiler` en REST. (2) `npm run build` (ya en modo WP resuelve la tarifa). (3) deploy a staging + validar E2E (cambiar precio en WP → verlo tras rebuild; probar 422 y el estado n+m=0). (4) cliente rellena `op_terms_*` reales (bloqueante de cutover).

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
9. **Deuda técnica — destinatario de correo inconsistente entre endpoints.** Desde el sprint «Alquiler con operador» (23-Jul-2026), `public/api/send-quote.php` lee el destinatario de la env **`OBLIQ_MAIL_TO`** (fail-closed, configurable por entorno), pero `public/api/send-contact.php` **mantiene `info@obliqproductions.com` hardcodeado**. Quedó **fuera del alcance** de ese sprint (el brief prohibía tocar `send-contact.php`). Pendiente: unificar `send-contact.php` al mismo patrón `OBLIQ_MAIL_TO` si se quiere consistencia y poder redirigir el contacto a un buzón de pruebas en staging.

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
