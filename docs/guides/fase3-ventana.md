# Fase 3 + corrección legal — Ventana y reversión

> **Esta ventana lleva DOS entregas independientes, en dos commits.**
>
> | | Parte A — Razón social | Parte B — Fase 3 |
> |---|---|---|
> | Origen | Bloque 1 de `docs/audits/legal-pendiente-revision.md`, abierto desde el 13-ago | Plan «Editar Obliq por URL» |
> | Urgencia | **Prioritaria.** Administración la pide por la justificación de Kit Digital | Normal |
> | Bloqueada por | **La nota simple del Registro Mercantil** | Nada |
> | Toca WordPress | No | Sí: 24 campos, 2 entradas nuevas, seed **v6** |
> | Toca las 76 páginas | **Sí** (JSON-LD) | No: solo 12, y solo si hay datos |
>
> **Van en commits separados y se verifican por separado**, porque la legal no puede
> quedarse esperando si la fase 3 tropieza. Si hubiera que revertir una, la otra se queda.

## ✅ La parte A tiene sus datos (9-sep-2026)

La nota simple llegó con **dos de los tres**:

| Dato | Valor |
|---|---|
| Denominación registral | **`AC MG AGENCY, S.L.`** |
| Domicilio social | **`Calle Pintor Navarro Llorens 3, bajo izquierda` · `46008` · `Valencia`** |
| Datos de inscripción (tomo, folio, hoja) | **APLAZADOS** por decisión de Víctor |

**Luego «Obliq Audiovisual SL», que llevaba publicado desde el rediseño, era la incorrecta.** El
sitio anterior, que decía «ACMG AGENCY S.L.», estaba más cerca pero tampoco era exacto: la
inscrita lleva **espacio entre «AC» y «MG»** y **coma antes de «S.L.»**.

> ⚠️ **Copiada carácter por carácter y verificada byte a byte.** `41 43 20 4d 47` es «AC MG» con
> su espacio; `2c 20 53 2e 4c 2e` es «, S.L.» con la coma. **No se normaliza**: juntar «ACMG» o
> quitar la coma la convierte en otra cadena, y el art. 10 LSSI pide la exacta.

### Los datos registrales: aplazados y omitidos, no marcados

**Riesgo conocido y asumido por Víctor**: el art. 10.1.a los exige igual que la denominación.

Y con la decisión cambia una regla que este documento daba por buena: **la línea se omite entera,
no se imprime como hueco marcado.** El razonamiento de «una laguna marcada es honesta» valía
mientras la alternativa era no desplegar nada, con el titular equivocado en la web. Ahora que el
titular y el domicilio salen correctos, imprimir «pendiente de verificación registral» en la única
línea que falta **convierte una ausencia que hoy no ve nadie en una declaración pública de trabajo
a medias**, en un sitio que exhibe los emblemas de red.es y de la Unión Europea.

El criterio que queda, y que distingue los dos casos:

| | Si falta el dato |
|---|---|
| **Dato que YA estaba publicado** (Titular, Domicilio social) | se marca — callar haría desaparecer una línea que el lector veía |
| **Dato que NUNCA se publicó** (datos registrales) | **se omite la línea entera** — omitirla mantiene el estado actual |

`registryEntry: null` ⇒ la línea no existe. En cuanto se rellene en `legal-entity.ts`, aparece
sola. El pendiente queda anotado ahí y en la auditoría: **la página legal del cliente no es
nuestra lista de tareas.**

## El criterio de aceptación, y por qué cambió

`localBusinessSchema()` se emite desde `BaseLayout`, así que la parte A **reescribe un bloque en
las 76 páginas**. Con eso, «N idénticas / M distintas» deja de servir: después de la parte A
ninguna página es idéntica.

El criterio que lo sustituye tiene dos mitades, y **la segunda es la que hace el trabajo**:

1. Las 76 cambian **de forma idéntica** — la misma firma de diff campo a campo en el JSON-LD.
2. En cada página, **el diff está CONFINADO a ese bloque**. Una sola diferencia fuera de él
   tumba el criterio.

Sin la segunda, un cambio accidental se escondería dentro del ruido de las setenta y seis. No es
teórico: **la cláusula cazó un cambio de contenido entrado por wp-admin** en `/servicios/` la
primera vez que se ejecutó (ver «La línea base se pudre», abajo).

```bash
python3 confinamiento.py <dist-antes> <dist-después> \
    aviso-legal/index.html politica-privacidad/index.html
```

### Las excepciones declaradas, por separado

**Parte A — dos páginas legales.** Cambian en el cuerpo, además del JSON-LD:

| | `/aviso-legal/` | `/politica-privacidad/` |
|---|---|---|
| Titular / Identidad | `Obliq Audiovisual SL` → **`AC MG AGENCY, S.L.`** | `Obliq Audiovisual SL` → **`AC MG AGENCY, S.L.`** |
| Etiqueta del domicilio | `Domicilio:` → **`Domicilio social:`** | `Dirección:` → **`Domicilio social:`** |
| Valor del domicilio | `C/ Pintor Navarro Llorens bajo 3, 46008 Valencia` → **`Calle Pintor Navarro Llorens 3, bajo izquierda, 46008 Valencia`** | ídem |
| Datos registrales | **no se añade**: aplazados, y la línea se omite (ver arriba) | — |
| Prosa | `Obliq Audiovisual SL` ×2 → **`Obliq Productions`** | — |

La prosa pasa a la **marca** a propósito: el art. 10 se cumple en la lista de identificación, y
en los párrafos de propiedad intelectual y responsabilidad lo natural es el nombre comercial,
que además es cierto hoy y lo seguirá siendo con la nota simple delante.

**Parte B — doce páginas.** `/`, `/nosotros/`, `/contacto/`, `/portfolio/`, `/presupuesto/`,
`/alquiler/` y sus seis gemelas en inglés. **Con el seed de esta fase NO cambian**: los valores
sembrados se leyeron de producción el 9-sep, así que el HTML sale byte a byte igual. Cambian el
día que el cliente escriba algo distinto, que es el objetivo.

## ❌ Un criterio del plan que esta fase NO cumple

El plan del 4-sep pedía, entre los criterios de aceptación, **cero descripciones duplicadas
entre páginas**. **Esta fase no lo cumple, y no se da por cumplido.**

Medido por `check-seo.mjs` sobre el build del 9-sep:

| Descripción repetida | Páginas que la comparten |
|---|---|
| «Productora audiovisual en Valencia. Producción de vídeo, streaming…» | `/` y `/servicios/` |
| «Audiovisual production company in Valencia. Video production…» | `/en/` y `/en/services/` |

**Por qué se queda así, a propósito.** El seed toma el valor **efectivo de hoy** en cada URL, que
es lo correcto: sembrar cualquier otra cosa cambiaría el HTML el día del despliegue y convertiría
una fase de infraestructura en una edición de contenido no revisada. Pero el valor efectivo de
`/` y de `/servicios/` es el mismo —los dos caían a `GLOBAL.DESCRIPTION`—, así que sembrarlos
perpetúa el duplicado.

**La fase entrega la capacidad, no la mejora.** Hasta hoy esas dos descripciones no se podían
tocar sin desplegar código; a partir de la ventana se diferencian **en wp-admin, en dos minutos**,
sin tocar el repositorio.

> **Pasa a ser tarea de contenido**, no de desarrollo: wp-admin → Contenido de páginas → Inicio
> (y Servicios · Página) → «Cómo se ve en Google» → descripción. Y lo mismo en inglés.
> `check-seo.mjs` deja de avisar cuando se hace, sin que nadie tenga que acordarse de comprobarlo.

## El estado que se espera por REST tras la ventana

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d[0]
PRE = ('ab','ct','hm','sp','op','pt','pr')
edit = [k for k in r if k.split('_')[0] in PRE]
solo = [k for k in r if k in ('_obliq_key','_obliq_cpts_version')]
claves = sorted(str(x.get('_obliq_key')) for x in d)
seo  = [k for k in r if '_seo_' in k]
print('entradas            :', len(d), claves, '(esperado 7)')
print('campos editables    :', len(edit), '(antes 106 · después 130)')
print('campos de Google    :', len(seo),  '(antes 4 · después 28)')
print('campos solo lectura :', len(solo), '(2, sin cambio)')
print('total del CPT       :', len(edit)+len(solo), '(antes 108 · después 132)')
print('version del plugin  :', r.get('_obliq_cpts_version','(ausente)'))
nuevas = {c: next((x for x in d if x.get('_obliq_key')==c), None) for c in ('portfolio','presupuesto')}
for c, x in nuevas.items():
    if not x: print(f'entrada {c:<12}: NO EXISTE'); continue
    pre = 'pt_' if c=='portfolio' else 'pr_'
    llenos = [k for k in x if k.startswith(pre) and str(x[k] or '').strip()]
    print(f'entrada {c:<12}: id={x[\"id\"]} · {len(llenos)}/4 campos con valor')
print()
llenos_seo = sum(1 for x in d for k in x if '_seo_' in k and str(x[k] or '').strip())
print('campos de Google con valor en todo el CPT:', llenos_seo, '(esperado 28)')
ok = (len(d)==7 and len(edit)==130 and len(solo)==2 and llenos_seo==28
      and all(nuevas.values()))
prev = len(d)==5 and len(edit)==106 and len(solo)==2
print('FASE 3 APLICADA' if ok else ('ESTADO PREVIO INTACTO' if prev else 'ESTADO INESPERADO — revisar'))
"
```

| | Antes (fase 2) | Después de la fase 3 |
|---|---|---|
| Entradas de `contenido` | 5 | **7** (`+ portfolio`, `+ presupuesto`) |
| Campos **editables** | 106 | **130** |
| De ellos, **campos de Google** | 4 | **28** |
| Campos **de solo lectura** | 2 | 2 |
| **Total propio del CPT** | 108 | **132** |

> ✅ **`OBLIQ_CPTS_VERSION`: la fecha es la del DESPLIEGUE.** Hoy dice `2026.09.09`, que es la
> fecha en que se construyó. **Si la ventana se abre otro día, ajústala antes de subir el
> fichero y vuelve a lintar en PHP 8.3.** Es una línea.

## Checklist de la ventana

Hereda el orden de `fase2-ventana.md`, con la diferencia de que aquí hay **dos** commits.

| # | Paso | Valor esperado / ☐ |
|---|---|---|
| 0 | Apertura · quién ejecuta | |
| 0b | `OBLIQ_CPTS_VERSION` a la fecha del despliegue + `php -l` en **8.3** | ☐ |
| 0c | Nota simple ✅ (9-sep) · datos registrales aplazados, línea omitida | ✅ |
| 1-3 | `sha256` del fichero vivo · copia `cp -n` en servidor · copia a `~/Backups/obliq/fase3/` | |
| 4 | **Deploy-hook a `.OFF`** ← la barrera | ☐ |
| 5 | `obliq_contenido_seeded` | esperado **`5`** · **`6` o más CIERRA la ventana** |
| 6 | `obliq_servicio_seeded` | esperado `1` |
| 7 | Estado ANTES por REST | 5 entradas · 106 editables · 2 solo lectura |
| 8 | Subir `obliq-cpts.php` · `sha256` contrastado | |
| 9 | wp-admin carga · pie con la versión del día | ☐ |
| 10 | Estado DESPUÉS por REST | **7 · 130 · 28 · 2 · 132** → `FASE 3 APLICADA` |
| 11 | Las **dos pantallas nuevas** y el bloque de Google en las otras cinco | ☐ |
| 12a | **Commit 1 — parte A** (legal). Solo si el paso 0c está en verde | ☐ · sha |
| 12b | **Commit 2 — parte B** (fase 3) | ☐ · sha |
| 13 | **Deploy-hook restaurado** | ☐ |
| 13b | **GATE** · la punta de `redesign` trae **esos commits y ninguno más** | ☐ |
| 14 | Edición real → run por `repository_dispatch` · gates 6 y 8 en verde | ☐ · run n.º |
| 15 | **Las URLs pedidas a PRODUCCIÓN**: las 2 legales y las 12 de la fase 3 | ☐ |
| 16 | `MEMORY.md` actualizado | ☐ |
| 17 | Cierre | |

## Reversión

El **Nivel 3** de `fase2-ventana.md` sigue valiendo palabra por palabra, con un matiz: **hay dos
commits, así que se revierte el que falle.**

### ⚠️ Revertir la parte B son DOS operaciones, no una

`git revert` del commit 2 deja el repositorio sin la fase 3 **y el servidor con el plugin v6 y
sus 130 campos**. Eso no es una reversión: es deriva, y de la peor clase, porque es silenciosa.
El cliente vería en wp-admin siete pantallas con el bloque «Cómo se ve en Google», escribiría en
ellas, se publicaría el sitio… y no cambiaría nada, sin un solo error en ningún sitio.

**Revertir la parte B = `git revert` del commit 2 + restaurar la copia del mu-plugin**
(`fase1-rollback.md` §4, Nivel 1, desde `obliq-cpts.php.bak.pre-fase3`). En ese orden: primero el
frontend, que es lo que ve el público; después el plugin.

> **Y ojo con el guard del seed al bajar de versión.** El guard es
> `get_option('obliq_contenido_seeded') === OBLIQ_CONTENIDO_SEED_VERSION`. Tras la fase 3 la
> opción vale `'6'`; al restaurar el plugin anterior la constante vuelve a `'5'`, deja de
> coincidir y **el seed de la v5 se ejecuta otra vez** y devuelve la opción a `'5'`. Es
> **inofensivo** —solo rellena lo que esté vacío, y no hay nada vacío— pero conviene saberlo
> antes de verlo en los registros y asustarse. Los metas `pt_*` y `pr_*` se quedan en la base de
> datos sin registrar: invisibles y sin efecto.

### El resto de casos

- **Solo falla la parte A** → `git revert` del commit 1 **y nada más**: la parte A no toca
  WordPress. Los campos de Google se quedan; no dependen de ella.
- **Falla el mu-plugin (S1/S2)** → `fase1-rollback.md` §4. Las dos entradas nuevas quedan
  invisibles e inofensivas, como pasó con `servicios` en la fase 2.

> ⚠️ **`scripts/obliq-cpts.php` viaja entero en el commit 2**, aunque una parte de sus cambios
> —la consolidación del domicilio en `obliq_seed_contact_address()`— sea de la parte A. Un fichero
> no puede estar en dos commits, y separar los hunks dejaría un estado intermedio frágil. La
> consecuencia: revertir el commit 2 revierte también esa consolidación. **Es inerte** —los
> valores sembrados son los mismos, solo cambia dónde están escritos—, pero está dicho.

### Lo que NO revierte volver atrás el mu-plugin

Los campos de Google de las 12 páginas caen al texto de `src/i18n` y a los subtítulos de la
cabecera — es decir, **a lo que hay hoy**. Nada se rompe. Pero los cuatro títulos de la fase 2 y
los textos legales de la parte A **viven en el repositorio**, y solo `git revert` los deshace.

## La línea base se pudre — y no hace falta que nadie se despiste

El 9-sep, entre cerrar la ventana de la fase 2 (07:39 UTC) y verificar la fase 3, `/servicios/`
cambió en producción: `SOLUCIONES AUDIOVISUALES` → `SOLUCIONES Y SERVICIOS AUDIOVISUALES`. Fue
**una edición de Víctor en wp-admin, como prueba de aceptación del camino de edición**. El hook
la recogió, disparó el run `34326566129` y producción la publicó sin intervención. Diecisiete
minutos desde que la pantalla existía.

Como prueba de aceptación es el mejor resultado posible: la cadena completa —wp-admin →
`transition_post_status` → debounce → `repository_dispatch` → build → `rsync`— funciona con una
edición de verdad.

Como problema de medición, la lección **no es que nadie sea impredecible**. Es estructural:

> **El CMS tiene una vía de publicación que no pasa por git.** Cualquiera con acceso a wp-admin
> —el cliente, nosotros, o una prueba coordinada— puede cambiar lo que se publica sin tocar el
> repositorio y sin que nada avise al que está midiendo. Un `dist/` guardado hace media hora ya
> puede no representar el estado del sistema.

No depende de suponer nada sobre nadie, y por eso la regla es mecánica:

**La línea base se construye inmediatamente antes de comparar**, desde el commit desplegado y
contra el WordPress de ese momento; y **se comprueba que las marcas de tiempo de `contenido` no
se han movido** entre los dos builds. Si se movieron, el diff mezcla código con contenido y no
vale:

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "import sys,json; [print(x.get('_obliq_key'), x.get('modified')) for x in json.load(sys.stdin)]"
```

## Un «idéntico» no demuestra que algo esté conectado

El escenario post-seed dio **76 páginas idénticas**, que es lo que se buscaba… y que también es
exactamente lo que se vería **si el cableado no funcionara**, porque entonces cada página caería
a su fallback y saldría igual. El mismo error de razonamiento que el simulador infiel de la fase 2,
por el otro lado.

Por eso se hizo un **control negativo**: el proxy sirvió los mismos valores con un prefijo
`ZZTEST · ` y se reconstruyó. Resultado: **las 12 páginas cambiaron y las otras 64 no.** Eso es
lo que demuestra que las seis URLs leen de WordPress, que el radio de acción son exactamente
esas doce, y que `seoTitle` se publica **tal cual** sin que el sitio le añada nada.
