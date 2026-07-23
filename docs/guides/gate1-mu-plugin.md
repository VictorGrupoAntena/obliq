# Gate 1 — Desplegar el mu-plugin al WordPress compartido

> Objetivo: publicar `scripts/obliq-cpts.php` (seed v3) en el WP compartido para que se **auto-siembre** el singleton «Alquiler · Tarifa de operador». Hasta que no esté, `npm run build` en modo WP **falla a propósito** (guard A2, verificado: exit 1). No toca `main`.

## ⚠️ AVISO CRÍTICO — subir el mu-plugin DISPARA un deploy a staging (Gate 3)

El seed hace `wp_insert_post(status=publish)` sobre el CPT **`contenido`**, que está en `OBLIQ_DEPLOY_CPTS` del deploy-hook (`scripts/obliq-deploy-hook.php`). Cadena:

```
subir obliq-cpts.php → seed publica el singleton en `contenido`
  → transition_post_status → obliq_deploy_dispatch (debounce 90 s)
  → repository_dispatch (wp-content-update) → deploy.yml → rsync a staging
```

Es decir, **subir el mu-plugin cruzaría el Gate 3 solo**. `deploy.yml` hace `checkout ref: redesign` + build con WP real, así que desplegaría el frontend nuevo de operador a staging **sin aprobación explícita**. Para evitarlo se **desactiva el deploy-hook durante el seed** y el Gate 3 se cruza a mano con `workflow_dispatch`.

> Red de seguridad adicional: mientras el singleton no exista, cualquier auto-deploy **falla en el build** (A2) y no publica nada. Aun así, sigue el procedimiento hook-off para que el cruce del Gate 3 sea deliberado.

El deploy-hook **no tiene** flag/constante de silenciado; por eso se desactiva por fichero (no se toca su código, que es un fichero gated).

## Contexto

- WP compartido (staging + producción): servidor Plesk, `~/admin.obliqproductions.com/`.
- mu-plugins: `~/admin.obliqproductions.com/wp-content/mu-plugins/` → `obliq-cpts.php` (destino) y `obliq-deploy-hook.php` (el hook a desactivar).
- Seed **create-if-missing + fill-only-empty**: crea el singleton si falta y **nunca** sobrescribe valores ya escritos. No altera about/contact/home.
- `OBLIQ_CONTENIDO_SEED_VERSION` sube `'2'→'3'`: sin ese salto el singleton no se crearía en el WP ya instalado.

## Procedimiento (hook-off → subir → sembrar → verificar → hook-on → Gate 3 a mano)

```bash
ssh <USUARIO>@<HOST_PLESK>
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/

# 1. Backups
cp obliq-cpts.php        "obliq-cpts.php.bak.$(date +%Y%m%d-%H%M%S)"
cp obliq-deploy-hook.php "obliq-deploy-hook.php.bak.$(date +%Y%m%d-%H%M%S)"

# 2. DESACTIVAR el deploy-hook (renombrar fuera del patrón *.php que auto-carga mu-plugins)
mv obliq-deploy-hook.php obliq-deploy-hook.php.OFF
```

```bash
# 3. Subir la versión nueva del mu-plugin (desde tu máquina, repo redesign)
scp scripts/obliq-cpts.php <USUARIO>@<HOST_PLESK>:~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php
# (alternativa: Plesk → Administrador de archivos, sobrescribir)
```

**4. Disparar el seed:** abre una vez el wp-admin del WP (hook `init`). Con el deploy-hook desactivado, la publicación del singleton **NO** programa ningún dispatch.

**5. Verificar en la REST** (ver siguiente sección). Debe existir `_obliq_key: 'alquiler'` con `op_jornada_price: '300'`.

```bash
# 6. REACTIVAR el deploy-hook
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/
mv obliq-deploy-hook.php.OFF obliq-deploy-hook.php
# (opcional) comprobar que no quedó un dispatch programado de antes:
#   wp cron event list | grep obliq_deploy_dispatch   → si aparece: wp cron event delete obliq_deploy_dispatch
```

**7. Cruzar el Gate 3 a mano** (deliberado, primer deploy controlado): GitHub → Actions → «Deploy (build + rsync a Plesk)» → **Run workflow** → rama `redesign`. (Requisito previo: ver «Antes de la E2E» abajo.)

> ⚠️ `workflow_dispatch` es el **botón manual** y funciona **igual con el hook muerto**: NO prueba que la automatización (P4) siga viva. La reactivación del paso 6 hay que verificarla aparte (paso 8).

**8. VERIFICAR QUE EL HOOK REVIVIÓ (obligatorio).** Un hook desactivado en silencio invalida P4 y el síntoma es que *no pasa nada*. Comprobación:

1. Edita cualquier contenido de un CPT de `OBLIQ_DEPLOY_CPTS` en wp-admin (p. ej. abre «Alquiler · Tarifa de operador» y **Actualizar** sin cambiar nada).
2. En GitHub → Actions, en ~90 s (debounce) debe aparecer un run **disparado por `repository_dispatch`** (evento `wp-content-update`), **no** `workflow_dispatch`. La columna de evento del run lo distingue.
3. Si **no aparece** ningún run por `repository_dispatch`: el hook quedó muerto (¿te dejaste `obliq-deploy-hook.php.OFF`? ¿error en el fichero?). Revisa `wp-content/mu-plugins/` y `error_log` (`[obliq-deploy]`).

Solo tras ver el run por `repository_dispatch` se da por bueno el Gate 1 (P4 intacto).

## Comprobar el singleton en la REST

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); a=[x for x in d if x.get('_obliq_key')=='alquiler']; print('OK' if a else 'FALTA'); print({k:a[0].get(k) for k in ('id','_obliq_key','op_jornada_price','op_media_price','op_includes_es','op_terms_es')} if a else 'no encontrado')"
```

**Respuesta esperada:**

```
OK
{'id': <n>, '_obliq_key': 'alquiler', 'op_jornada_price': '300', 'op_media_price': '200',
 'op_includes_es': 'Operador profesional cualificado\nEntrega de brutos',
 'op_terms_es': '[PENDIENTE DE CONFIRMAR CON CLIENTE] Entrega de brutos: formato y plazo por definir...'}
```

Si sale `FALTA`: abre el wp-admin una vez (dispara `init`) y repite. Confirma también la entrada «Alquiler · Tarifa de operador» en **wp-admin → Contenido de páginas**.

## Verificar que el build en modo WP pasa (camino feliz — hoy sin verificar)

Con el singleton ya en la REST, desde el repo:

```bash
npm run build          # usa WP_API_URL de .env (WP real)
```

**Esperado:** `Complete!`, `78 page(s) built`, **exit 0**, y un WARNING (no error):

```
[operator] ⚠️  Tarifa de operador con contenido PROVISIONAL sin confirmar por el cliente
en los campos: op_terms_es, op_terms_en. ...
```

Ese warning es correcto y esperado hasta que el cliente sustituya `op_terms_*` (bloqueante de cutover). Si el build **falla** con `[operator] No se encontró el singleton…` o `El campo «op_jornada_price»…`, la REST del paso anterior no está bien.

> Antes de este despliegue, `npm run build` en modo WP **falla a propósito** (verificado: exit 1). Es la garantía A2.

## Antes de la E2E del Gate 3 — destinatario del correo

`send-quote.php` ya lee el destinatario de la variable de entorno **`OBLIQ_MAIL_TO`** (fail-closed: sin ella devuelve 500, no envía al buzón real). **Antes de cruzar el Gate 3**, define en Plesk (PHP-FPM env del dominio de **staging**) `OBLIQ_MAIL_TO=<buzón de pruebas>` — **NO** `info@obliqproductions.com`. El valor real (`info@`) se define solo en el dominio de **producción**, en el cutover.

## Revertir

```bash
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/
cp "obliq-cpts.php.bak.<TIMESTAMP>" obliq-cpts.php
# y asegúrate de que el deploy-hook está activo (no .OFF)
```

- La entrada singleton creada **permanece** en la BD (el CPT bloquea el borrado por diseño). Es inofensiva.
- **No cruces el Gate 3 si has revertido el mu-plugin:** el build en modo WP volvería a fallar (A2) al no resolver la tarifa.

## Después

Continúa con la **validación E2E del Gate 3** — ver `docs/guides/gate3-e2e-validation.md`.
