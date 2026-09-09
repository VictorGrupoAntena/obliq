# Fase 2 — Ventana y reversión

> **El radio de explosión ya no es cero.** La fase 1 no podía tocar el HTML público: solo
> cambiaba PHP de wp-admin. La fase 2 **sí toca Astro y sí escribe en la base de datos**
> (seed v5). Por eso esta ventana tiene dos diferencias de fondo respecto a la anterior:
>
> 1. **El diff byte a byte se produce y se revisa ANTES de la ventana, no después.** Después
>    del `rsync` ya no sería una verificación: sería un parte de daños.
> 2. **La reversión tiene dos mitades** —fichero y datos— y una de ellas, la del seed, no se
>    deshace sola.

## Qué cambia respecto a la fase 1

| | Fase 1 | Fase 2 |
|---|---|---|
| Ficheros de `src/` | ninguno | **7** |
| Campos nuevos | ninguno | **14** (`sp_`) |
| `OBLIQ_CONTENIDO_SEED_VERSION` | `'4'`, sin tocar | **`'4'` → `'5'`** |
| ¿Corre el seed? | no | **sí**: crea la entrada «Servicios · Página» |
| ¿Escribe en la BD? | no | **sí**: `wp_insert_post` + 14 `update_post_meta` |
| ¿Cambia el HTML público? | no | **sí, en 4 de 78 páginas** |
| Reversión | devolver un fichero | fichero **+** decidir qué hacer con la entrada sembrada |

## El estado que se espera por REST tras la ventana

Mismo formato de veredicto que el paso 10 de la fase 1. **Ejecutable desde cualquier sitio,
sin SSH.**

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d[0]
edit = [k for k in r if k.split('_')[0] in ('ab','ct','hm','sp','op')]
solo = [k for k in r if k in ('_obliq_key','_obliq_cpts_version')]
claves = sorted(x.get('_obliq_key') for x in d)
print('entradas            :', len(d), claves, '(esperado 5, con servicios)')
print('campos editables    :', len(edit), '(antes 92 · después 106)')
print('campos solo lectura :', len(solo), '(2, sin cambio)')
print('total del CPT       :', len(edit)+len(solo), '(antes 94 · después 108)')
print('version del plugin  :', r.get('_obliq_cpts_version','(ausente)'), '(esperado 2026.09.09)')
sp = [x for x in d if x.get('_obliq_key')=='servicios']
print('entrada servicios   :', 'existe id=%s' % sp[0]['id'] if sp else 'NO EXISTE')
if sp:
    v = sp[0]
    llenos = [k for k in v if k.startswith('sp_') and str(v[k] or '').strip()]
    print('campos sp_ con valor:', len(llenos), '(esperado 14 — los siembra el seed v5)')
print()
ok = (len(d)==5 and len(edit)==106 and len(solo)==2 and sp
      and r.get('_obliq_cpts_version')=='2026.09.09'
      and len([k for k in sp[0] if k.startswith('sp_') and str(sp[0][k] or '').strip()])==14)
prev = len(d)==4 and len(edit)==92 and len(solo)==2
print('FASE 2 APLICADA' if ok else ('ESTADO PREVIO INTACTO' if prev else 'ESTADO INESPERADO — revisar'))
"
```

### El número exacto

| | Antes (fase 1) | Después de la fase 2 |
|---|---|---|
| Entradas de `contenido` | 4 | **5** (`+ servicios`) |
| Campos **editables** (`ab_` `ct_` `hm_` **`sp_`** `op_`) | 92 | **106** |
| Campos **de solo lectura** | 2 | 2 (sin cambio) |
| **Total propio del CPT** | 94 | **108** |
| Campos `sp_` con valor en la entrada nueva | — | **14 de 14** |

El criterio de aceptación es **106 editables y 5 entradas**. Que los 14 `sp_` nazcan con valor
—y no vacíos— es lo que garantiza que `/servicios/` se reconstruya idéntica: si el seed no
corriera, los campos caerían al texto de `src/i18n` y el HTML también saldría igual, pero el
cliente encontraría la pantalla en blanco.

> ✅ **`OBLIQ_CPTS_VERSION` — regla aprobada el 9-sep-2026.** La constante dice qué versión
> corre en el servidor, así que su fecha es **la del despliegue**, nunca la del commit: fecharla
> con el commit la haría mentir en cuanto la ventana se abriera otro día, que es justo lo
> contrario de para lo que se creó. **Se ajusta y se linta justo antes del paso 8.**
> Aplicado en esta ventana: `2026.09.08b` → **`2026.09.09`**, lintado en PHP 8.3.

## Gate obligatorio antes del paso 14

El paso **13b** de `fase1-rollback.md` §7 —comprobar qué desplegaría el dispatch— es obligatorio
desde esta fase. Pero **el comando que lo documenta está mal**, y se descubrió al prepararlo.

### El `headSha` de un run NO es el de `redesign`

`fase1-rollback.md` propone `git log <headSha del último run success>..redesign`. Medido el
9-sep-2026, los **tres** últimos runs con éxito declaran el mismo `headSha`:

| Run | Evento | `headSha` |
|---|---|---|
| 34195744376 | `repository_dispatch` | `767dca17…` |
| 33755314508 | `workflow_dispatch` | `767dca17…` |
| 33487343195 | `repository_dispatch` | `767dca17…` |

`767dca17` **no es un commit de `redesign`: es la punta de `main`.** GitHub sella los runs de
`repository_dispatch` y `workflow_dispatch` con el SHA de la rama por defecto, mientras el workflow
hace `checkout` con `ref: redesign` (línea 38 de `deploy.yml`). El rango del comando documentado
compara contra la rama equivocada y da un resultado sin sentido.

**El gate correcto** pregunta lo que de verdad importa —¿qué hay en `redesign` en GitHub, que es lo
que el runner va a construir?— y lo contrasta con lo que sirve producción:

```bash
# 1. La punta REAL de redesign en GitHub (autoritativa; no depende del estado local)
gh api repos/VictorGrupoAntena/obliq/git/ref/heads/redesign --jq '.object.sha'

# 2. ¿Coincide con la rama local? Lo que viaja es lo COMMITEADO y PUSHEADO, no el working tree.
git rev-parse HEAD
git status --porcelain

# 3. ¿Qué hay entre lo desplegado y esa punta?  Vacío = nada inesperado.
#    En la fase 2 NO estará vacío: debe contener EXACTAMENTE el commit de la fase, y nada más.
git log --oneline <sha desplegado>..<punta de redesign>
```

**El gate cambia de sentido en esta fase.** En la fase 1 preguntaba «¿hay algo pendiente de
desplegar que se cuele?». Aquí el commit lo ponemos nosotros en el paso 12, así que la pregunta es
la contraria: **confirmar que en `redesign` está ese commit y nada más.**

**Si aparece cualquier otra cosa: PARAR.** El dispatch no despliega «el cambio del mu-plugin»:
reconstruye el sitio entero desde `redesign`, así que cualquier commit que estuviera esperando sale
a producción de rebote, mezclado con lo nuestro y sin que nadie lo haya decidido. Y como el
workflow no tiene trigger `push`, tener commits esperando es el estado **por defecto** de la rama,
no una anomalía.

> Segunda opinión por comportamiento, la que se usó el 8-sep: comprobar en la web pública un rasgo
> que introduzca el último commit. Para `d5ef91d`: el sitemap sin las tres páginas legales y
> `/nosotros/` emitiendo `hreflang="x-default"`.

### iCloud se estaba comiendo el repositorio (detectado el 9-sep-2026)

Al preparar el gate salieron **dos averías locales con la misma causa**: este repositorio vive en
`~/Documents`, que iCloud sincroniza, y iCloud ha tratado `.git` como si fuera contenido del
usuario. Ninguna afecta a GitHub, ni al servidor, ni a lo que se construye — pero **una de las dos
impedía cerrar la fase**.

#### a) 654 de 1.013 objetos sueltos, expulsados a la nube

`git diff` se quedaba colgado indefinidamente sin emitir ni una traza. La causa:

```
$ ls -laO .git/objects/f4/a54dfe14b90e7b507bbf39ece17a54dc0facc0
-r--r--r--@ 1 victormedina staff hidden,compressed,dataless 1241 Aug 11 09:31
```

**`dataless`**: el fichero existe, declara su tamaño y **no tiene contenido**; macOS lo descarga al
leerlo. `git status`, `git log` y `git rev-parse` iban rápidos porque leen el índice y objetos ya
residentes; en cuanto algo tenía que leer un *blob* evictado, el proceso se quedaba esperando una
descarga que no llegaba. **654 objetos sueltos de 1.013 estaban así**, y el `.pack` de 41 MB también.

Un `git commit` o un `git push` habría hecho exactamente lo mismo: **colgarse**. Es decir, la fase 2
no se podía cerrar desde esta máquina.

**Reparado antes de abrir la ventana**, con una operación no destructiva —solo devuelve contenido:

```bash
cd .git/objects
# brctl sobre el directorio NO recursa: hay que ir fichero a fichero
find . -type f -not -path './pack/*' -print0 | xargs -0 -n1 -P8  brctl download
find . -type f -not -path './pack/*' -print0 | xargs -0 -n1 -P16 -I{} sh -c 'cat "{}" >/dev/null'
ls -laO $(find . -type f -not -path './pack/*') | grep -c dataless    # → 0
```

Verificado después: `git fsck --connectivity-only` no reporta ningún objeto ausente ni corrupto
(solo 7 *dangling*, inocuos), `git diff --stat` responde al instante y
`git push --dry-run origin redesign` contesta **`Everything up-to-date`**.

> **Esto volverá a pasar.** Materializar los objetos es un parche, no un arreglo: mientras el
> repositorio siga en `~/Documents` con «Optimizar almacenamiento» activo, macOS puede volver a
> expulsarlos cuando quiera. El arreglo de verdad es sacar el proyecto de la carpeta sincronizada
> —o excluirlo— y es **decisión de Víctor**, fuera del alcance de esta fase. `MEMORY.md` ya
> documentaba el mismo patrón para `node_modules`; ahora sabemos que también alcanza a `.git`.

#### b) Un ref duplicado por el sistema de archivos rompe `git fetch`

```
fatal: bad object refs/heads/redesign 2
error: … did not send all necessary objects
```

`.git/refs/heads/redesign 2` (permisos `600`, del 14-ago) es un **duplicado de sincronización** —el
mismo patrón «` 2`» que aparece en `node_modules 2`—, y apunta a `7f1238a9`. Un nombre de referencia
**no puede llevar espacios**, así que git lo rechaza y aborta la operación entera. `git fsck` lo
confirma: `badRefName: invalid refname format`.

**Alcance real, medido:** rompe `git fetch`. **No rompe `git push`** —que solo enumera las
referencias que va a enviar—, y el `dry-run` lo demuestra. Por eso **el gate 13b consulta la punta
con `gh api`**, que va directo a GitHub y no pasa por los refs locales.

**No se toca durante la ventana** (regla 1: solo los pasos documentados). Se limpia después
borrando ese único fichero, y se comprueba con `git fetch` y `git fsck`.

## Checklist de la ventana — fase 2

Hereda el orden y los comandos de `fase1-rollback.md` §6 y §7 (todos re-ejecutables sin efecto
destructivo, con `cp -n` en la copia). **Dos diferencias de fondo respecto a la fase 1:**

1. **El mu-plugin va ANTES que el frontend.** Si el plugin fallara y hubiera que revertir (S1/S2),
   un commit ya pusheado se quedaría esperando en `redesign` y saldría a producción de rebote en
   la siguiente edición que hiciera el cliente. Subiendo primero el plugin, un rollback deja el
   repositorio exactamente como estaba.
2. **La evidencia de cierre es producción, no el build.** Que el build produjera X y que producción
   sirva X son dos afirmaciones distintas, y la que cuenta es la segunda.

| # | Paso | Valor esperado / ☐ |
|---|---|---|
| 0 | Fecha y hora de apertura · quién ejecuta | |
| 0b | `OBLIQ_CPTS_VERSION` a la fecha del despliegue + `php -l` en **8.3** | `2026.09.09` ✅ |
| 1 | `sha256` del fichero vivo **antes** de tocarlo | |
| 2 | Copia en el servidor (`cp -n obliq-cpts.php obliq-cpts.php.bak.pre-fase2`) | |
| 3 | Copia descargada a `~/Backups/obliq/fase2/` y hash contrastado | ☐ |
| 4 | **Deploy-hook a `.OFF`** ← la barrera, antes de leer nada | ☐ |
| 5 | `obliq_contenido_seeded` | esperado **`4`** · **`5` o más CIERRA la ventana** |
| 6 | `obliq_servicio_seeded` | esperado `1` |
| 7 | Estado ANTES por REST | 4 entradas · 92 editables · 2 solo lectura · `2026.09.08` |
| 8 | Subir `obliq-cpts.php` · `sha256` contrastado | |
| 9 | Abrir wp-admin — debe cargar · pie `Obliq CPTs 2026.09.09` | ☐ |
| 10 | Estado DESPUÉS por REST | **5 · 106 · 2 · 108 · 14 `sp_`** → `FASE 2 APLICADA` |
| 11 | Pantalla nueva «Servicios · Página» con sus 14 campos en orden | ☐ |
| 12 | **Frontend a `redesign`**: commit + push de **exactamente 13 ficheros** — *solo si 8-11 están en verde*. `git diff --stat` y el `sha` **antes** del dispatch. `main` no se toca | ☐ · sha |
| 13 | **Deploy-hook restaurado** (fuera el `.OFF`) | ☐ |
| 13b | **GATE · ¿qué hay en `redesign`?** Confirmar que la punta es el commit del paso 12 **y nada más** | ☐ |
| 14 | Edición real → run por `repository_dispatch` · gates 6 y 8 en verde antes del `rsync` | ☐ · run n.º |
| 15 | **Las 4 URLs pedidas a PRODUCCIÓN**, con sus tres etiquetas | ☐ |
| 16 | `MEMORY.md` actualizado | ☐ |
| 17 | Hora de cierre | |

## Evidencia de cierre — producción, no el build

Dos comprobaciones, y ninguna sustituye a la otra: **la REST dice qué puede editar el cliente; el
HTML público dice qué ve el visitante.**

### a) El veredicto por REST

El bloque de arriba. Criterio: `FASE 2 APLICADA`.

### b) Las cuatro URLs, pedidas a producción

```bash
for u in https://obliqproductions.com/nosotros/ \
         https://obliqproductions.com/contacto/ \
         https://obliqproductions.com/en/about/ \
         https://obliqproductions.com/en/contact/; do
  echo "  $u"
  curl -s "$u" | python3 -c "
import sys, re
t = sys.stdin.read()
pats = {'title': r'<title>(.*?)</title>',
        'og:title': r'<meta property=\"og:title\" content=\"(.*?)\"',
        'twitter:title': r'<meta name=\"twitter:title\" content=\"(.*?)\"'}
for k, p in pats.items():
    m = re.search(p, t, re.S)
    print(f'      {k:<14} {m.group(1) if m else \"(ausente)\"}')
"
done
```

**El «antes», leído de producción el 9-sep-2026 antes de abrir la ventana** — coincide con el lado
izquierdo del diff que se revisó en G2, que es lo que había que demostrar:

| URL | Las tres etiquetas, ANTES | DESPUÉS (esperado) |
|---|---|---|
| `/nosotros/` | `Sobre nosotros — Obliq Productions \| Obliq Productions` | `Sobre nosotros \| Obliq Productions` |
| `/contacto/` | `Contacto — Obliq Productions \| Obliq Productions` | `Contacto \| Obliq Productions` |
| `/en/about/` | `About us — Obliq Productions \| Obliq Productions` | `About us \| Obliq Productions` |
| `/en/contact/` | `Contact — Obliq Productions \| Obliq Productions` | `Contact \| Obliq Productions` |

**Doce diferencias en cuatro páginas, ni una más.**

### c) La página que NO debe cambiar, y por qué se comprueba igual

`/servicios/` y `/en/services/` son el caso interesante: **cambian de fuente sin cambiar de
contenido.** Antes del despliegue el título sale de `src/i18n`; después sale de WordPress. Leído en
producción el 9-sep, antes de abrir:

| URL | Las tres etiquetas |
|---|---|
| `/servicios/` | `Servicios de producción audiovisual \| Obliq Productions` |
| `/en/services/` | `Audiovisual production services \| Obliq Productions` |

Son **carácter por carácter** lo que siembra `obliq_contenido_seed_servicios()` en
`sp_seo_title_es` / `sp_seo_title_en`. Si tras la ventana cambiara aunque fuera un espacio, el seed
no coincide con `src/i18n` y hay que mirarlo antes de dar la fase por buena.

## Reversión

Todo lo de `fase1-rollback.md` §4 sigue valiendo para el fichero. **Lo que añade esta fase es
la mitad de datos.**

### Nivel 3 — Deshacer el push (lo que la fase 1 no necesitaba)

`fase1-rollback.md` se escribió para una fase que **no empujaba código**, y por eso sus tres niveles
terminan en «devolver un fichero al servidor». **Con push eso ya no basta:** el mu-plugin puede
estar revertido y el commit seguir en `redesign`, esperando a que **el siguiente dispatch lo
publique solo** —y el siguiente dispatch lo dispara el cliente al pulsar «Actualizar», sin ventana
y sin nadie mirando. Ese es el peor resultado posible, y por eso el push va **después** del
mu-plugin y **antes** del gate.

El disparador manda igual (S1/S2 de `fase1-rollback.md` §3). Lo que cambia es **cuándo** se dispara:

#### Caso A · S1 o S2 ANTES del paso 12 — no se ha empujado nada

**Nada que deshacer en el repositorio.** Se aplica `fase1-rollback.md` §4 tal cual (Nivel 0/1/2) y
se para. El working tree local conserva los 13 ficheros sin commitear, que es exactamente donde
estaban al abrir la ventana.

| Qué queda | Estado |
|---|---|
| Producción | **Intacta.** Sigue sirviendo `d5ef91d`: los 4 títulos duplicados y `/servicios/` desde `src/i18n` |
| WordPress | Mu-plugin anterior. La entrada «Servicios · Página», si el seed llegó a correr, queda **invisible e inofensiva** (§ siguiente) |
| `redesign` | Sin tocar |

#### Caso B · S1 o S2 DESPUÉS del paso 12 — el commit ya está en la rama

Aquí hay dos mitades y **el orden importa**, porque una de ellas se publica sola.

```bash
# 1. PRIMERO la rama, que es la que puede publicarse sin permiso.
#    git revert, NUNCA force-push: el sha desplegado tiene que seguir existiendo.
git revert --no-edit <sha del paso 12>
git push origin redesign
```

**Qué se está sirviendo mientras tanto**, según dónde se cortó:

| Momento | Producción sirve | Riesgo si no se revierte la rama |
|---|---|---|
| Entre el paso 12 y el 14 (dispatch **no** disparado) | Todavía **lo viejo**: títulos duplicados | **Alto.** La siguiente edición del cliente lo publica sola |
| Después del paso 14 (dispatch ya corrido) | **Lo nuevo**: 4 títulos corregidos | El revert exige `workflow_dispatch` manual para reconstruir |

```bash
# 2. Solo si el dispatch ya había corrido: reconstruir con el revert dentro.
gh workflow run deploy.yml --repo VictorGrupoAntena/obliq --ref redesign -f target=produccion

# 3. DESPUÉS el mu-plugin, con fase1-rollback.md §4.
```

**Al revés no.** Revirtiendo primero el mu-plugin queda una ventana en la que el frontend pide
`sp_seo_title` a un WordPress que ya no lo expone. No rompería —el fallback campo a campo lo
cubre— pero deja el sitio en un estado que nadie ha verificado.

> ⚠️ **Los 4 títulos NO se revierten tocando WordPress.** Viven en `src/i18n/*.json`, no en la base
> de datos: ningún rollback del mu-plugin los devuelve al estado duplicado. Solo el `git revert` del
> paso 1 más un despliegue. Es la consecuencia directa de que esta fase, por primera vez, publique
> código.

### La entrada sembrada NO se borra sola

El seed crea «Servicios · Página» con `wp_insert_post`. Volver a poner el mu-plugin anterior
**no la borra**: el CPT bloquea el borrado por diseño (`create_posts => do_not_allow` y el
filtro `obliq_contenido_block_delete`).

**Y no pasa nada.** Con el mu-plugin viejo, esos 14 campos ni se registran ni se pintan: la
entrada queda invisible en wp-admin y `services-page.ts` cae al texto de `src/i18n`. Es
inofensiva. **No hay que borrarla**, y si en algún momento se decide hacerlo, hay que retirar
antes el filtro que lo impide — un movimiento aparte, nunca dentro de una ventana de
reversión.

### El orden de la reversión importa

Si hay que revertir **la fase 2 entera** —fichero y web— el orden es:

1. **Primero el frontend**, porque es lo que ve el público: `git revert` de los commits de la
   fase en `redesign` y `workflow_dispatch` manual. Con el mu-plugin nuevo todavía puesto no
   pasa nada: los campos `sp_` existen y nadie los lee.
2. **Después el mu-plugin**, con el procedimiento de `fase1-rollback.md` §4.

Al revés se queda una ventana en la que el frontend pide `sp_seo_title` a un WordPress que ya
no lo expone. No rompería —el fallback campo a campo lo cubre—, pero deja el sitio en un
estado que nadie ha verificado.

### Qué NO revierte nada de esto

Los 4 títulos de `src/i18n` — ver el aviso del Nivel 3. Y el commit del paso 12 en sí: `git revert`
añade un commit que lo deshace, **no borra historia**. Es lo correcto: el sha que se desplegó tiene
que seguir existiendo para poder auditar qué se publicó y cuándo.
