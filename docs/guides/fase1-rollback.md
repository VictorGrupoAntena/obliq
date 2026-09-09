# Fase 1 — Plan de reversión

> **Se escribe ANTES de abrir la ventana SSH. Sin esto no se sube nada.**
>
> Contexto que fija el margen de error: **el cutover se hizo el 28-jul-2026**. Producción
> sirve el SSG de `redesign` desde `~/httpdocs` y el auto-rebuild de WordPress apunta a
> producción. No hay staging de por medio.

## Lo que hace única a esta fase: la base de datos no se toca

| | Fase 1 | Fases 2-4 |
|---|---|---|
| Campos nuevos | **ninguno** | 14 · 24 · 8 |
| `OBLIQ_CONTENIDO_SEED_VERSION` | **no sube** (sigue en `'4'`) | v5 · v6 · v7 |
| ¿Corre el seed? | **no** — el guard corta | sí |
| ¿Se escribe en la BD? | **no** | sí, `wp_insert_post` + `update_post_meta` |
| Ficheros de `src/` | **ninguno** | varios |
| Reversión | devolver un fichero | fichero **y** datos sembrados |

**Consecuencia práctica: revertir la fase 1 es devolver un fichero a su sitio.** No hay
datos que restaurar, ni entradas que borrar, ni build que rehacer. Es la reversión más
limpia de todo el encargo, y por eso esta fase es la primera.

**Consecuencia sobre el riesgo de despliegue accidental:** como el seed no corre, no hay
`wp_insert_post`, luego no hay `transition_post_status` y **el deploy-hook no se dispara
solo al subir el fichero**. Aun así el procedimiento hook-off es obligatorio — ver el aviso
del paso 2.

## 1 · Copia de seguridad del fichero que hoy corre en el servidor

**Antes de sobrescribir nada.** El fichero vivo es el del servidor, y **no es idéntico al
del repositorio**: le falta `hm_hero_wait_image` (91 campos frente a 92).

```bash
ssh <USUARIO>@<HOST_PLESK>
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/

# Nombre fijo y reconocible: identifica la fase, no solo la fecha.
cp obliq-cpts.php "obliq-cpts.php.bak.pre-fase1.$(date +%Y%m%d-%H%M%S)"
ls -l obliq-cpts.php.bak.pre-fase1.*
sha256sum obliq-cpts.php            # ← ANOTAR en la ficha de abajo
```

Y **descargarla a la máquina local**, no dejarla solo en el servidor: si el problema fuera
del servidor, una copia que solo vive allí no sirve de nada.

```bash
# desde la máquina local, en la raíz del repo
mkdir -p ~/Backups/obliq/fase1
scp <USUARIO>@<HOST_PLESK>:~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php \
    ~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1
shasum -a 256 ~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1
```

| | |
|---|---|
| **Ruta en el servidor** | `~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php.bak.pre-fase1.<AAAAMMDD-HHMMSS>` |
| **Ruta local** | `~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1` |
| **Verificación** | los dos `sha256` coinciden entre sí y con el del fichero vivo antes de tocarlo |

> No se borra hasta que la fase 2 esté cerrada y verificada. El housekeeping de `.bak.*`
> ya listado en `MEMORY.md` **no incluye este fichero** hasta entonces.

### Segunda red: el commit exacto que corre hoy en el servidor

Si la copia se perdiera o se corrompiera, el fichero es reconstruible desde el repositorio.
**Identificado y verificado el 8-sep-2026**, no supuesto:

```bash
git show b75495d:scripts/obliq-cpts.php > /tmp/obliq-cpts.servidor.php
```

`b75495d` es el padre de `191f8c1` («imagen de espera opcional»), que es el commit que
introdujo `hm_hero_wait_image` y nunca llegó a subirse. Contrastado contra el servidor:

| | `b75495d` | Servidor (REST, hoy) |
|---|---|---|
| Campos en `field_defs` | 91 | 91 |
| `hm_hero_wait_image` | no | no |

Coinciden, así que `b75495d` es la versión viva. Aun así **la copia del paso anterior manda**:
el servidor podría llevar una edición a mano que no esté en ningún commit, y solo la copia
literal la conserva.

## 2 · Estado a leer y anotar ANTES de tocar nada

Estos tres valores son el punto al que se vuelve. **Se leen del servidor, no se suponen.**

```bash
# a) La opción que gobierna si el seed corre. ES EL DATO CRÍTICO DE ESTA FASE.
wp option get obliq_contenido_seeded --path=~/admin.obliqproductions.com
wp option get obliq_servicio_seeded  --path=~/admin.obliqproductions.com

# b + c) Recuento y versión, en un solo comando. Sin SSH: vale desde cualquier sitio.
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d[0]
edit = [k for k in r if k.split('_')[0] in ('ab','ct','hm','op')]
solo = [k for k in r if k in ('_obliq_key','_obliq_cpts_version')]
print('entradas            :', len(d),        '(esperado 4)')
print('campos editables    :', len(edit),     '(antes 91 · después 92)')
print('campos solo lectura :', len(solo), solo, '(antes 1 · después 2)')
print('total del CPT       :', len(edit)+len(solo), '(antes 92 · después 94)')
print('version del plugin  :', r.get('_obliq_cpts_version','(ausente)'))
print()
ok = len(d)==4 and len(edit)==92 and len(solo)==2 and r.get('_obliq_cpts_version')=='2026.09.08'
prev = len(d)==4 and len(edit)==91 and len(solo)==1 and '_obliq_cpts_version' not in r
print('FASE 1 APLICADA' if ok else ('ESTADO PREVIO INTACTO' if prev else 'ESTADO INESPERADO — revisar'))
"
```

### El número exacto que se espera, y por qué «92» ya no basta

Desde esta fase el JSON de cada entrada trae **dos** claves de solo lectura, así que hay que
decir cuál de los tres números se mira. **Comprobado en PHP 8.3 antes de desplegar: el CPT
registra 94 campos REST.**

| | Antes (hoy) | Después de la fase 1 |
|---|---|---|
| Campos **editables** (`ab_` `ct_` `hm_` `op_`) | 91 | **92** |
| Campos **de solo lectura** | 1 — `_obliq_key` | **2** — `_obliq_key`, `_obliq_cpts_version` |
| **Total propio del CPT** | 92 | **94** |

El criterio de aceptación del gate G1 es **92 editables**, que es el que cuenta
`hm_hero_wait_image`. El 94 es el total y sirve para detectar que el campo de versión
también llegó. Las claves estándar de WordPress (`id`, `title`, `_links`…) quedan fuera de
los tres recuentos.

> `_obliq_cpts_version` **no** es una meta: se registra con `register_rest_field`, igual que
> `_obliq_key`, que lleva funcionando en producción desde marzo. Por eso el guion bajo no lo
> bloquea — `is_protected_meta()` solo interviene en `register_post_meta`, y ninguna clave
> con guion bajo pasa por ahí. Verificado en PHP 8.3 el 8-sep-2026: el campo se registra y
> su callback devuelve `2026.09.08` al invocarlo como lo invoca WordPress.

> **`obliq_contenido_seeded` es DIAGNÓSTICO, no barrera.**
>
> Si vale `'4'` —lo esperado— el guard corta y el seed no corre: no se escribe en la base de
> datos y no hay nada que pudiera disparar el hook. Si valiera otra cosa, el seed correría y
> publicaría entradas. **Pero eso no es motivo para abortar**, porque la barrera contra el
> despliegue accidental no es esta lectura: es el hook-off del paso 3, que ya está puesto
> cuando esto se lee.
>
> Verificado el 8-sep-2026 leyendo `scripts/obliq-deploy-hook.php`: el hook engancha
> `transition_post_status`, `before_delete_post` y los hooks de taxonomía. **No engancha
> `update_post_meta`.** Es decir, con el hook desactivado ni siquiera un seed inesperado
> puede programar un dispatch.
>
> **Si no vale `'4'`: diagnosticar, no abortar.** Qué mirar, en este orden:
>
> 1. ¿Vale menos de `'4'` (`'2'`, `'3'`)? El seed correrá y **rellenará solo lo que esté
>    vacío**. Comprobar antes por REST cuántos campos tienen valor; si son los 91 de hoy,
>    el seed no cambiará nada aunque corra.
> 2. ¿Vale `'5'` o más? Alguien subió una versión posterior a la del repositorio: **parar
>    de verdad**, porque el fichero que íbamos a subir sería un retroceso.
> 3. ¿Está vacía o no existe? WordPress la creará. Revisar que las 4 entradas existan por
>    REST antes de continuar, no vaya a duplicarlas.
>
> En los casos 1 y 3 se continúa con el hook-off puesto y se verifica el resultado por REST
> antes de reactivarlo. En el caso 2 se cierra la ventana y se avisa.

## 3 · Disparador de rollback

| # | Señal concreta | Plazo | Decide | Acción |
|---|---|---|---|---|
| **S1** | wp-admin devuelve error 500 o pantalla en blanco en cualquier pantalla | inmediato, 0-5 min | Víctor | **Rollback ya** (§4) |
| **S2** | El recuento por REST no da **92** campos, o falta un campo en alguna de las 4 pantallas | 0-15 min | Víctor | **Rollback** (§4) |
| **S3** | `obliq_contenido_seeded` no valía `'4'` | inmediato | Víctor | **No es rollback y no se aborta.** Con el hook-off puesto (paso 4) un seed inesperado no puede programar ningún dispatch. Se diagnostica según §2 y se decide: continuar (casos 1 y 3) o cerrar la ventana (caso 2, versión más nueva en el servidor) |
| **S4** | Tras la edición real **no aparece** ningún run por `repository_dispatch` en ~90 s | 0-30 min | Víctor | **No es rollback.** Es el `.OFF` sin restaurar: revisar `mu-plugins/` (§4 de `gate1-mu-plugin.md`) |
| **S5** | El cliente dice que ya no encuentra un campo que antes encontraba | 24-72 h | Víctor, oído el cliente | **No es rollback.** Una etiqueta mal elegida se corrige con otra subida, no volviendo atrás |

**Quién decide: Víctor.** En su ausencia no se despliega y no se revierte. El criterio que
separa S1-S2 de S4-S5: **se revierte cuando algo está roto, no cuando algo no gusta.**

## 4 · Procedimiento de vuelta atrás

> **Regla de diseño de esta sección: la reversión NO puede depender de que WordPress
> responda.** Un mu-plugin con un error fatal tumba wp-admin *y* la REST *y* WP-CLI —que
> carga WordPress igual que el panel— y **no se puede desactivar desde el panel**, porque
> los mu-plugins no tienen interruptor. En ese estado, todo comando `wp …` y todo `curl` a
> la REST son inútiles. Por eso el camino de vuelta es siempre **mover ficheros**, y los
> tres niveles de abajo se pueden ejecutar enteros por **SSH o por FTP / Gestor de archivos
> de Plesk**, que son independientes de WordPress.

### Nivel 0 — Cortafuegos: recuperar el panel en segundos

**Solo si wp-admin no carga.** Renombrar el mu-plugin fuera del patrón `*.php` lo desactiva:

```bash
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/
mv obliq-cpts.php obliq-cpts.php.ROTO
```

*Equivalente por FTP: renombrar el fichero a `obliq-cpts.php.ROTO`.* Nada más. wp-admin
vuelve al instante.

**Lo que cuesta, y hay que saberlo antes de usarlo:** sin el mu-plugin no se registran los
CPT, así que la REST deja de exponer `contenido`, `servicio` y el resto. Es una medida de
segundos para recuperar el panel, no un estado en el que quedarse: se sigue con el nivel 1
de inmediato.

#### Por qué un build en Nivel 0 falla — y por qué esa seguridad es más frágil de lo que parece

Es importante entender **cuál** es la pieza que protege, porque no es la que uno esperaría.
Con el mu-plugin desactivado, un despliegue recorre esta cadena:

| Paso | Qué hace ante un WordPress sin CPT | ¿Detiene el deploy? |
|---|---|---|
| `pnpm check:services` | La REST devuelve 0 servicios. El script trata ese caso **explícitamente**: `if (servicios.length === 0) … process.exit(0)` (líneas 81-83) | **No.** Sale con 0 a propósito |
| `src/data/services.ts` | `catch` → `console.warn('[services] WP fetch failed, using mock data')` y devuelve el array de ejemplo del repo | **No.** Degrada en silencio |
| `src/data/about.ts`, `home.ts`, `site.ts` | Mismo patrón: fallback campo a campo a `src/i18n` | **No** |
| `src/data/operator.ts` | `getContenido()` devuelve vacío → `alquiler` es `null` → **`throw`** (líneas 107-113) | **Sí. Es la única** |

Es decir: **lo único que impide publicar el sitio entero con los datos de ejemplo del
repositorio es una guarda escrita para otra cosa** — asegurar que la tarifa de operador
nunca saliera a 0 €, decisión A2 del sprint de alquiler (23-jul-2026). El resto de la
cadena está diseñado para degradar sin romper, que es lo correcto para un fallo pasajero de
WordPress y justo lo contrario de lo que hace falta aquí.

**Consecuencias que hay que respetar:**

1. **Si alguien relaja `operator.ts`** —le pone un fallback al mock, envuelve el `throw` en
   un `try`— el Nivel 0 deja de ser seguro **y nadie se entera**, porque el síntoma es un
   deploy en verde. Antes de tocar ese fichero, léase esta sección.
2. **La fase 4 dice «no copies el patrón de `operator.ts`»** y sigue siendo correcto: los
   campos nuevos no deben romper el build. Pero eso **no autoriza a ablandar `operator.ts`
   mismo**. Son dos cosas distintas: el patrón nuevo es permisivo, esta guarda concreta se
   queda estricta.
3. **Durante la ventana no se construye**, así que mientras dure no hay riesgo. Si hiciera
   falta un despliegue con el mu-plugin caído, se restaura primero (Nivel 1) y se construye
   después. Nunca al revés.

> **Lo que hace peligroso al fallback de `services.ts` no es que exista, sino que no se
> distingue.** Un build hecho con el mu-plugin caído produce un sitio **completo y en verde**,
> con las nueve páginas de servicio pintando el array de `src/data/services.ts` en lugar del
> contenido de WordPress. No hay aviso en el HTML, ni en el sitemap, ni en el recuento de
> páginas: el único rastro es una línea `[services] WP fetch failed, using mock data` en el
> registro de un runner que nadie mira. Por eso la guarda de `operator.ts` no es un detalle
> del sprint de alquiler: es lo único que convierte ese escenario en un fallo visible.

### Nivel 1 — Restaurar la copia (el caso normal)

```bash
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/

# 1. Desactivar el deploy-hook si no lo estaba ya (mover fichero, no tocar su código)
[ -f obliq-deploy-hook.php ] && mv obliq-deploy-hook.php obliq-deploy-hook.php.OFF

# 2. Devolver el fichero de antes
cp "obliq-cpts.php.bak.pre-fase1.<TIMESTAMP>" obliq-cpts.php

# 3. Comprobación que NO necesita WordPress: el hash debe coincidir con el de §1
sha256sum obliq-cpts.php
```

*Por FTP: subir `~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1` como
`obliq-cpts.php`, y renombrar `obliq-deploy-hook.php` a `.OFF` antes de hacerlo.*

**El rollback está hecho aquí.** Lo que sigue es confirmación y limpieza, y sí requiere que
WordPress vuelva a responder:

```bash
# 4. Abrir wp-admin una vez: debe cargar sin error
# 5. Reactivar el deploy-hook
mv obliq-deploy-hook.php.OFF obliq-deploy-hook.php
# 6. Comprobar que no quedó un dispatch programado (requiere WP vivo)
wp cron event list --path=~/admin.obliqproductions.com | grep obliq_deploy_dispatch
#    si aparece:  wp cron event delete obliq_deploy_dispatch --path=...
```

### Nivel 2 — Sin copia utilizable

Reconstruir desde el repositorio (§1, «segunda red») y subir por SSH o FTP:

```bash
git show b75495d:scripts/obliq-cpts.php > /tmp/obliq-cpts.servidor.php
scp /tmp/obliq-cpts.servidor.php <USUARIO>@<HOST_PLESK>:~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php
```

### Verificación final — solo cuando WordPress ya responde

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)[0]; \
      print('editables:', len([k for k in d if k.split('_')[0] in ('ab','ct','hm','op')])); \
      print('versión:  ', d.get('_obliq_cpts_version','(ausente)'))"
```

Revertido correctamente devuelve **91 editables** y versión **`(ausente)`**: es el estado
del 4-sep-2026.

## 5 · Qué NO deshace este rollback

- **Nada en la web pública.** Esta fase no toca `src/`, así que el HTML de las 76 páginas
  no cambia ni al subir ni al revertir. No hace falta rebuild ni deploy.
- **Nada en la base de datos**, porque no se escribe nada (§ tabla de arriba).
- **Los commits del repositorio.** El rollback es del servidor. En el repo se revierte,
  si hace falta, con `git revert` del commit de la fase — decisión aparte.

## 6 · Checklist de la ventana — en este orden

El orden importa: **la barrera contra el despliegue accidental es el hook-off, y va antes de
leer nada.** Las lecturas de estado son diagnóstico y se hacen con la barrera ya puesta.

| # | Paso | Valor / ☐ |
|---|---|---|
| 0 | Fecha y hora de apertura · quién ejecuta | |
| 1 | `sha256` del fichero vivo **antes** de tocarlo | |
| 2 | Copia en el servidor — nombre exacto | |
| 3 | Copia descargada a local y hash contrastado | ☐ |
| 4 | **Deploy-hook a `.OFF`** ← la barrera, antes de lo que sigue | ☐ |
| 5 | `obliq_contenido_seeded` (diagnóstico, §2) | esperado `4` |
| 6 | `obliq_servicio_seeded` (diagnóstico) | esperado `1` |
| 7 | Estado ANTES por REST | 91 editables · 1 solo lectura · sin versión |
| 8 | Subir `obliq-cpts.php` · `sha256` posterior | |
| 9 | Abrir wp-admin una vez — debe cargar | ☐ |
| 10 | Estado DESPUÉS por REST | **92** editables · **2** solo lectura · `2026.09.08` |
| 11 | Pie de wp-admin muestra `Obliq CPTs 2026.09.08` | ☐ |
| 12 | Capturas de las **4** pantallas + del menú lateral | ☐ |
| 13 | **Deploy-hook restaurado** (fuera el `.OFF`) | ☐ |
| 13b | **GATE · ¿qué desplegaría el dispatch?** Ver recuadro | ☐ |
| 14 | Edición real → run por `repository_dispatch` (no `workflow_dispatch`) | ☐ · run n.º |
| 15 | **`MEMORY.md` actualizado** con lo desplegado, la versión y el resultado | ☐ |
| 16 | Hora de cierre | |

El paso 15 no es papeleo: `MEMORY.md` es lo que la próxima sesión lee para saber qué versión
corre en el servidor. Dejarlo sin escribir reintroduce exactamente la ceguera que la
constante de versión viene a eliminar.

## 7 · Los comandos, en orden

**Todos son re-ejecutables sin efecto destructivo.** Repetir cualquiera deja el sistema en el
mismo sitio: las copias usan `cp -n` (nunca sobrescriben), los `mv` van con guarda de
existencia, y las lecturas no escriben nada.

> ⚠️ **El `-n` del paso 0 es lo que impide el peor accidente**: repetir el paso 0 *después*
> de subir el fichero nuevo sobrescribiría la copia buena con el fichero nuevo, dejándote sin
> punto de retorno. Con `-n` la primera copia es la que manda y las repeticiones no hacen nada.

### Antes de empezar — variables (LOCAL y SERVIDOR)

```bash
USUARIO='obliqproductions.com_zbt88qx0mpj'
HOST='obliqproductions.com'
MU=~/admin.obliqproductions.com/wp-content/mu-plugins
WPP=~/admin.obliqproductions.com
```

### Paso 0 — Copia y hash, antes de tocar nada · SERVIDOR

```bash
ssh "$USUARIO@$HOST"
cd "$MU"
cp -n obliq-cpts.php obliq-cpts.php.bak.pre-fase1     # -n: no pisa si ya existe
ls -l obliq-cpts.php.bak.pre-fase1
sha256sum obliq-cpts.php obliq-cpts.php.bak.pre-fase1  # deben coincidir → anotar (paso 1)
```

### Pasos 2-3 — Copia a local y contraste de hash · LOCAL

```bash
mkdir -p ~/Backups/obliq/fase1
scp "$USUARIO@$HOST:$MU/obliq-cpts.php.bak.pre-fase1" \
    ~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1
shasum -a 256 ~/Backups/obliq/fase1/obliq-cpts.php.servidor-pre-fase1
# Debe coincidir con el sha256sum del paso 0. Si no, PARAR.
```

### Paso 4 — LA BARRERA: deploy-hook a `.OFF` · SERVIDOR

```bash
cd "$MU"
[ -f obliq-deploy-hook.php ] && mv obliq-deploy-hook.php obliq-deploy-hook.php.OFF
ls -l obliq-deploy-hook.php*        # debe verse SOLO el .OFF
```

### Pasos 5-6 — Diagnóstico de los seeds · SERVIDOR

```bash
wp option get obliq_contenido_seeded --path="$WPP"   # esperado: 4
wp option get obliq_servicio_seeded  --path="$WPP"   # esperado: 1
```

Si `wp` no está disponible en el servidor, **anótalo y continúa**: es diagnóstico, no
barrera — la barrera ya está puesta en el paso 4. Si devuelve algo distinto de `4`, aplicar
el árbol de decisión de §2 antes de seguir.

### Paso 7 — Estado ANTES · desde CUALQUIER SITIO

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "
import sys, json
r = json.load(sys.stdin)[0]
edit = [k for k in r if k.split('_')[0] in ('ab','ct','hm','op')]
solo = [k for k in r if k in ('_obliq_key','_obliq_cpts_version')]
print('editables:', len(edit), '| solo lectura:', len(solo), '| version:', r.get('_obliq_cpts_version','(ausente)'))
"
# Esperado ANTES:  editables: 91 | solo lectura: 1 | version: (ausente)
```

### Paso 8 — Subir el fichero · LOCAL

```bash
cd "<raíz del repo>"
shasum -a 256 scripts/obliq-cpts.php          # anotar: es el hash que debe quedar arriba
scp scripts/obliq-cpts.php "$USUARIO@$HOST:$MU/obliq-cpts.php"
ssh "$USUARIO@$HOST" "sha256sum $MU/obliq-cpts.php"   # debe coincidir con el de arriba
```

### Pasos 9-11 — Comprobar que WordPress vive y el estado DESPUÉS

```bash
# 9 · abrir wp-admin en el navegador — debe cargar sin error
# 11 · el pie de cualquier pantalla debe decir:  Obliq CPTs 2026.09.08 · WordPress 6.x

# 10 · mismo comando del paso 7. Esperado DESPUÉS:
#      editables: 92 | solo lectura: 2 | version: 2026.09.08
```

### Paso 12 — Capturas (manual)

Las **cuatro** pantallas de «Contenido de páginas» —Inicio, Nosotros, Datos de contacto,
Alquiler · Tarifa de operador— y el menú lateral, donde «Contenido de páginas» debe quedar
por encima de «Servicios».

### Paso 13 — Restaurar el deploy-hook · SERVIDOR

```bash
cd "$MU"
[ -f obliq-deploy-hook.php.OFF ] && mv obliq-deploy-hook.php.OFF obliq-deploy-hook.php
ls -l obliq-deploy-hook.php*        # NO debe quedar ningún .OFF
```

### Paso 13b — GATE: ¿qué desplegaría el dispatch? · desde LOCAL

**Obligatorio desde la fase 2.** En la fase 1 fue una precaución; a partir de aquí es un gate,
y por un motivo concreto: **la fase 1 no podía tocar el HTML público y las siguientes sí.** El
dispatch del paso 14 no publica «el cambio del mu-plugin»: hace `checkout` de `redesign` y
reconstruye el sitio entero. Cualquier commit que esté esperando en la rama sin desplegar
**sale a producción de rebote**, mezclado con lo de esta ventana y sin que nadie lo haya
decidido. Y como el workflow no tiene trigger `push`, es perfectamente normal que haya commits
esperando: es el estado por defecto de la rama, no una anomalía.

```bash
# 1. ¿Coincide la rama local con lo que hay publicado?
git log --oneline -1                     # commit que se construiría
git status --porcelain                   # el working tree NO viaja: solo viaja lo commiteado

# 2. ¿Hay commits en redesign posteriores al último desplegado?
gh run list --repo VictorGrupoAntena/obliq --limit 5 \
  --json databaseId,event,conclusion,createdAt,headSha \
  --template '{{range .}}{{printf "%.0f" .databaseId}} {{.event}} {{.conclusion}} {{.createdAt}} {{.headSha}}
{{end}}'
git log --oneline <headSha del último run success>..redesign    # vacío = nada pendiente
```

**Si el rango NO está vacío: PARAR.** No se dispara la edición del paso 14 hasta decidir
explícitamente si esos commits salen o no. Un dispatch con commits pendientes no es un
despliegue del mu-plugin: es un despliegue de todo lo que hubiera en la rama.

> Comprobación equivalente por comportamiento, útil como segunda opinión: verificar en la web
> pública un rasgo que introduzca el último commit. En la ventana del 8-sep se comprobó que
> `d5ef91d` ya estaba publicado mirando que el sitemap no tuviera las tres páginas legales y
> que `/nosotros/` emitiera `hreflang="x-default"`.

### Paso 14 — Confirmar que el hook revivió (obligatorio)

En wp-admin, abrir cualquier entrada de «Contenido de páginas» y pulsar **Actualizar** sin
cambiar nada. En ~90 s debe aparecer en GitHub → Actions un run **disparado por
`repository_dispatch`**, no por `workflow_dispatch`. La columna de evento los distingue.

```bash
# Si el deploy no está autorizado todavía, cancelar el dispatch antes de que expire:
ssh "$USUARIO@$HOST" "wp cron event list --path=$WPP | grep obliq_deploy_dispatch"
ssh "$USUARIO@$HOST" "wp cron event delete obliq_deploy_dispatch --path=$WPP"
```

**Si no aparece ningún run por `repository_dispatch`:** el hook quedó muerto. No es un
rollback — revisar que no haya quedado un `.OFF` en `mu-plugins/` y el `error_log` de WP por
líneas `[obliq-deploy]`. Señal S4 de §3.
