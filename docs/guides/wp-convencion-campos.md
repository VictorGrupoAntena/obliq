# Convención de etiquetas de campo en wp-admin

> **Esto es un contrato, no un ejemplo.** Gobierna las etiquetas de todos los campos que el
> cliente ve en wp-admin. Se fija en la fase 1 (8-sep-2026) y **«cumple la convención de la
> fase 1» es criterio de aceptación de las fases 2, 3 y 4** del plan de edición por URL.
>
> El vocabulario de papeles es **cerrado**: no se amplía sin decírselo a Dirección.

## Por qué existe

Antes de la fase 1 el panel tenía dos vocabularios para lo mismo. La entrada «Nosotros»
llamaba `Hero — etiqueta (ES)` a lo que «Inicio» llamaba `Cabecera — etiqueta pequeña (ES)`.
De 92 campos, **uno solo** decía qué papel jugaba en la página (`… / H1`), y lo decía
gritando en mayúsculas.

Esta fase reetiqueta 92 campos. Las fases 2 a 4 añaden unos 46 más. Si la convención vive
solo en el ejemplo de la fase 1, los campos nuevos derivan y acabamos con dos vocabularios
en el mismo panel — que es exactamente el problema que la fase 1 existe para resolver.

## La gramática

```text
<Bloque> — <Papel><, matiz> (<Idioma>)
```

| Parte | Regla |
|---|---|
| **Bloque** | El nombre del bloque **tal y como se ve en la página**, en español. Coincide literalmente con el `<h4>` del grupo en el metabox. Se omite cuando el campo no pertenece a ningún bloque (los datos de contacto globales). |
| **Papel** | Un valor del vocabulario cerrado de abajo. Obligatorio. |
| **Matiz** | Solo si dos campos del mismo bloque comparten papel y hay que distinguirlos: `Botón, el principal` / `Botón, el secundario`. |
| **Idioma** | `(ES)` o `(EN)`. **Se omite** cuando el campo es único para las dos versiones del sitio: imágenes, vídeo, precios, email, teléfono, dirección. |

**Separador:** raya (`—`, U+2014) con espacio a cada lado. No guion corto.

### Tres casos que la forma básica no cubre

No son excepciones sueltas: son situaciones que vuelven a aparecer, así que se resuelven
siempre igual.

1. **El papel da nombre al bloque entero.** Cuando un bloque contiene un único campo y el
   papel ya lo nombra, el papel ocupa el lugar del bloque y tras la raya va el matiz.
   → `Cinta deslizante — texto que se repite (ES)`, no `Cinta deslizante — cinta deslizante`.

2. **Un bloque partido en dos grupos.** Cuando un bloque es tan largo que se separa en dos
   grupos del metabox, el nombre del bloque en la etiqueta es el común, y el `<h4>` añade
   el subgrupo **tras dos puntos**, no tras la raya —la raya ya separa bloque de papel—.
   → `<h4>1 · Cabecera: el fondo</h4>` y `<h4>2 · Cabecera: los textos</h4>`, con todas sus
   etiquetas empezando por `Cabecera — …`.

3. **Datos de contacto.** El papel es el nombre del dato (`email`, `teléfono`, `horario`,
   `dirección`, `WhatsApp`), porque decir `dato de contacto, email` sería decirlo dos veces.
   El matiz precisa cuál cuando hacen falta varios campos para un mismo dato.
   → `Información de contacto — dirección, código postal`.

**Sin punto final. Sin MAYÚSCULAS para enfatizar.** La instrucción larga —«pega la dirección
tal cual la da Vimeo», «una línea por ítem»— **no va en la etiqueta**: va en el bloque de
ayuda del grupo, que ya existe en el metabox y admite varias líneas y negritas.

## Vocabulario cerrado de papeles

Los ocho primeros son papeles de HTML: dicen qué es el campo para Google y para un lector de
pantalla. Los demás son papeles de interfaz.

| Papel | Cuándo se usa | HTML |
|---|---|---|
| `Titular de la página (H1)` | El titular grande. **Uno solo por URL**, nunca dos. | `<h1>` |
| `Título de bloque (H2)` | Encabezado que abre una sección de la página. | `<h2>` |
| `Título de bloque (H3)` | Encabezado de un bloque interior, subordinado a un H2. | `<h3>` |
| `Etiqueta superior` | El texto corto en mayúsculas que va **encima** del titular. Es decorativo: no es un encabezado y Google no lo lee como tal. | `<span>` |
| `Párrafo bajo el titular` | El texto que va inmediatamente debajo del H1. | `<p>` |
| `Párrafo bajo el título` | El texto que va inmediatamente debajo de un H2 o H3. **Este es el papel que estrena la fase 4.** | `<p>` |
| `Párrafo` | Texto de cuerpo que no cuelga de ningún encabezado. | `<p>` |
| `Lista` | Un campo de varias líneas donde **cada línea es un elemento**. | `<ul>` |
| `Botón` | El texto de un enlace de acción. | `<a>` |
| `Texto al pasar el ratón` | Texto que solo aparece al poner el ratón encima. | — |
| `Cinta deslizante` | El texto que se desliza en bucle. | — |
| `Imagen` | Campo con selector de la Biblioteca de medios. | `<img>` |
| `Vídeo (dirección de Vimeo)` | La dirección de un vídeo de Vimeo. | `<iframe>` |
| `Dato de contacto` | Email, teléfono, WhatsApp, dirección, horario. | — |
| `Precio` | Importe numérico. Lleva siempre `(€, sin IVA)`. | — |
| `Título en Google` | Lo que Google enseña como titular azul del resultado. **Lo estrena la fase 2.** | `<title>` |
| `Descripción en Google` | El texto gris bajo el titular del resultado. **Lo estrena la fase 2.** | `<meta>` |

**Cerrado significa cerrado.** Si en la fase 2, 3 o 4 aparece un campo que no encaja en
ninguno de los diecisiete, **no se inventa un papel nuevo**: se para y se consulta. Un
vocabulario que crece por conveniencia deja de ser un vocabulario en dos sprints.

## Palabras prohibidas en una etiqueta

El cliente no es técnico. Ninguna de estas aparece en un texto que él vea:

> hero · tag · slug · meta tag · meta description · SERP · snippet · CTA · string · JSON ·
> array · key · repeater · textarea · input · placeholder · ID · front · backend · deploy ·
> build · alt · URL

Traducciones obligatorias: **hero → cabecera** · **tag → etiqueta superior** ·
**CTA → botón** · **URL → dirección** · **meta description → descripción en Google**.

`H1`, `H2` y `H3` **sí** se usan, siempre entre paréntesis y detrás del nombre llano
(`Título de bloque (H2)`). Son la única sigla admitida: el cliente ha llegado preguntando
por ellas y necesita poder reconocerlas.

## Antes y después

| `meta_key` | Antes | Después |
|---|---|---|
| `ab_hero_title_es` | `Hero — título (ES)` | `Cabecera — titular de la página (H1) (ES)` |
| `hm_hero_title_es` | `Cabecera — TITULAR PRINCIPAL / H1 (ES)` | `Cabecera — titular de la página (H1) (ES)` |
| `ab_values_title_es` | `Valores — título (ES)` | `Valores — título de bloque (H2) (ES)` |
| `hm_service_card_cta_es` | `Servicios — texto que aparece al pasar el ratón por una tarjeta (ES)` | `Servicios — texto al pasar el ratón por una tarjeta (ES)` |
| `op_includes_es` | `Qué incluye la tarifa de operador — una línea por ítem (ES)` | `Qué incluye — lista (ES)` |

Los dos primeros son el caso que justifica todo esto: **el mismo papel, en dos pantallas,
con dos nombres distintos**. Después dicen lo mismo porque son lo mismo.

Nótese que ningún `meta_key` cambia. **Renombrar una clave vacía el campo en producción sin
aviso**: es la restricción dura del encargo. La convención toca la etiqueta y solo la
etiqueta — en `obliq_contenido_field_defs()`, el primer elemento del array; en
`obliq_field()` y `obliq_media_field()`, el tercer argumento. Nunca la clave.

## Orden y numeración de los bloques

Cada pantalla numera sus bloques `1 ·`, `2 ·`, `3 ·`… **en el orden en que se ven en la
página**, de arriba abajo. El patrón lo estrenó «Inicio» y desde la fase 1 lo cumplen las
cuatro pantallas.

Dos excepciones, ambas señaladas en el texto de ayuda de su pantalla:

- **«Alquiler · Tarifa de operador» no es una página.** Es una tarifa global que se usa en
  varios sitios. Se numera igual, pero por agrupación lógica, no por orden visual.
- **Los datos de contacto se usan fuera de su página** (pie, botón de WhatsApp, ficha de
  Google). Se ordenan por cómo se ven en `/contacto/`; lo que no aparece ahí —el WhatsApp—
  va en su propio bloque al final.

## Qué revisar antes de dar por buena una etiqueta

1. ¿El papel sale del vocabulario cerrado?
2. ¿El nombre del bloque coincide **literalmente** con el `<h4>` de su grupo?
3. ¿Lleva `(ES)`/`(EN)` solo si el campo es por idioma?
4. ¿Está libre de las palabras prohibidas?
5. ¿La instrucción larga está en la ayuda del grupo y no dentro de la etiqueta?
6. ¿El `meta_key` sigue siendo exactamente el mismo?

## Verificador

Para que «cumple la convención» sea comprobable y no una opinión. Se pega en un fichero
temporal y se ejecuta desde la raíz del repo. **Debe dar 0 incumplimientos antes de cerrar
cualquier fase.** Al añadir campos en las fases 2-4, amplíese `VOCAB` solo con papeles ya
aprobados por Dirección.

```python
import re
s = open('scripts/obliq-cpts.php', encoding='utf-8').read()
b = s.split("function obliq_contenido_field_defs()")[1].split("function obliq_contenido_keys")[0]
campos = re.findall(r"^\s*'([a-z0-9_]+)'\s*=>\s*array\(\s*'((?:[^']|\\')*)'", b, re.M)

VOCAB = ['titular de la página (H1)', 'título de bloque (H2)', 'título de bloque (H3)',
         'etiqueta superior', 'párrafo bajo el titular', 'párrafo bajo el título', 'párrafo',
         'lista', 'botón', 'texto al pasar el ratón', 'cinta deslizante', 'imagen',
         'vídeo (dirección de Vimeo)', 'email', 'teléfono', 'whatsapp', 'horario',
         'dirección', 'precio de la jornada completa', 'precio de la media jornada',
         'título en Google', 'descripción en Google']
PAPEL_ES_BLOQUE = {'cinta deslizante', 'whatsapp'}   # caso 1 de la convención
PROHIBIDAS = ['hero', 'tag ', 'slug', 'meta tag', 'meta description', 'serp', 'snippet',
              'cta', 'string', 'json', 'array', 'key', 'repeater', 'textarea', 'input',
              'placeholder', ' id ', 'front', 'backend', 'deploy', 'build', ' alt ', 'url']

errores = []
for k, label in campos:
    low = label.lower()
    errores += [f"prohibida '{p.strip()}' en {k}" for p in PROHIBIDAS if p.strip() and p in low]
    if label.rstrip().endswith('.'):                 errores.append(f"punto final en {k}")
    if re.search(r"\b[A-ZÁÉÍÓÚÑ]{4,}\b", label):     errores.append(f"mayúsculas en {k}: {label}")
    if '—' not in label:                             errores.append(f"sin raya en {k}: {label}")
    izq = label.split('—', 1)[0].strip().lower()
    resto = re.sub(r"\s*\((ES|EN)\)\s*$", "", label.split('—', 1)[-1]).strip()
    papel = resto.split(',')[0].strip()
    if izq not in PAPEL_ES_BLOQUE and not any(
            papel.lower().startswith(v.lower()) or v.lower().startswith(papel.lower())
            for v in VOCAB):
        errores.append(f"papel fuera de vocabulario en {k}: «{papel}»")
    if (k.endswith(('_es', '_en'))) != (label.endswith(('(ES)', '(EN)'))):
        errores.append(f"idioma descuadrado en {k}: {label}")

print(f"{len(campos)} campos · {len(errores)} incumplimientos")
for e in errores:
    print("  -", e)
```

## Historial

| Fecha | Cambio |
|---|---|
| 8-sep-2026 | Convención fijada. 92 campos reetiquetados, 4 pantallas numeradas (fase 1). |
