# Cómo cambiar los textos de "Nosotros" y los datos de contacto (para el equipo de Obliq)

Esta guía explica cómo **editar los textos de la página Nosotros** y **los datos de
contacto de la empresa** (teléfono, email, dirección, horario) desde WordPress.
**No hace falta saber programar ni avisar a nadie**: cuando guardas un cambio, la web se
reconstruye y se publica **sola en 1-2 minutos**.

---

## Entrar

1. Ve a **https://admin.obliqproductions.com/wp-admin**
2. Inicia sesión con tu usuario y contraseña.
3. En el menú de la izquierda verás **Contenido de páginas** (icono de documento).

Dentro hay **dos fichas fijas**:

| Ficha | Para qué sirve |
|---|---|
| **Nosotros** | Todos los textos de la página *Nosotros* |
| **Datos de contacto** | Teléfono, email, dirección y horario de la empresa |

Estas dos fichas **no se pueden borrar ni crear de nuevo**: siempre estarán ahí. Solo se
editan. Es a propósito, para que no se pueda dejar la web sin datos por accidente.

---

## Español e inglés

La web está en dos idiomas, así que casi todos los campos vienen **por parejas**:

- **(ES)** → lo que se ve en https://obliqproductions.com/nosotros/
- **(EN)** → lo que se ve en https://obliqproductions.com/en/about/

Cambia **los dos** si quieres que el cambio se vea en las dos versiones. Si solo tocas el
español, la web en inglés se queda como estaba (no se rompe, simplemente no cambia).

> Los datos que no se traducen —email, teléfono, dirección— tienen **un solo campo**.

---

## Ficha "Nosotros"

Entra en **Contenido de páginas → Nosotros**. Debajo del título verás el recuadro
**"Contenido de la página"**, dividido en secciones que siguen el mismo orden que la web:

### Cabecera

Lo primero que se ve al abrir la página, sobre fondo negro.

- **Hero — etiqueta:** la palabra pequeña de arriba (ahora: *NOSOTROS*). Se ve en
  mayúsculas siempre.
- **Hero — título:** el titular grande (ahora: *CREAMOS HISTORIAS QUE IMPORTAN*).
- **Hero — subtítulo:** la frase de debajo.

### Nuestra historia

El bloque de dos columnas: texto a la izquierda, foto a la derecha.

- **Historia — título** y **Historia — texto:** el texto de la izquierda.
- **Historia — imagen:** la foto de la derecha. Pulsa **"Seleccionar imagen"** para abrir
  la **Biblioteca de medios** de WordPress, elige una foto (o sube una nueva) y pulsa
  *"Usar esta imagen"*. Verás una vista previa debajo. El botón **"Quitar"** la borra.
  - La foto se recorta automáticamente a formato apaisado, así que **usa imágenes
    horizontales** y anchas (mínimo ~1200 px) para que se vea nítida.

### Valores

El bloque negro con los tres números grandes (01, 02, 03).

- **Valores — etiqueta** y **Valores — título:** la cabecera del bloque.
- **Valor 1**, **Valor 2** y **Valor 3:** cada uno con su título y su texto.

> **Son siempre tres.** El diseño es una rejilla de tres columnas, así que no se pueden
> añadir ni quitar valores desde aquí. Si algún día hicieran falta cuatro, habría que
> tocar el diseño: avisa a Grupo Antena.

### Cabecera del bloque de equipo

Solo el titulillo que va **encima** de las fotos del equipo (ahora: *EQUIPO* / *Las
personas detrás de Obliq*).

⚠️ **Las personas del equipo NO se editan aquí.** Van en su propio menú: **Equipo**.
Desde ahí se añaden, se quitan, se les cambia el cargo o la foto — y aparecen solas en
esta página.

Cuando termines, pulsa **Actualizar** (botón azul, arriba a la derecha).

---

## Ficha "Datos de contacto"

Entra en **Contenido de páginas → Datos de contacto**.

> ⚠️ **Ojo: estos datos se usan en toda la web, no solo en la página de contacto.**
> Si cambias el teléfono o el email aquí, se actualizan **a la vez** en:
> - la página de **Contacto** (ES e inglés),
> - el **pie de página** de todas las páginas,
> - el **botón verde de WhatsApp** que flota abajo a la derecha,
> - y la **ficha de empresa que lee Google** (la que puede salir en los resultados de
>   búsqueda y en Google Maps).
>
> Es justo lo que queremos: **se cambia en un sitio y queda bien en todos**. Pero por eso
> mismo, revisa bien lo que escribes antes de guardar.

### Datos de contacto

- **Email:** el correo de contacto.
- **Teléfono (tal y como debe verse):** escríbelo como quieres que se lea en la web,
  con espacios incluidos (ahora: *+34 675 489 980*). El enlace para llamar desde el móvil
  se genera solo.
- **WhatsApp (solo dígitos, con prefijo país y sin +):** el número del botón de WhatsApp,
  **sin espacios, sin signos y sin el +** (ahora: *34675489980*). Puede ser un número
  distinto al de arriba si os interesa.

### Dirección

Va en **tres campos separados** (calle y número · código postal · ciudad) porque Google
necesita las partes por separado para la ficha de empresa. En la web se juntan solas y se
muestran en una línea: *C/ Pintor Navarro Llorens bajo 3, 46008 Valencia*.

### Horario

El horario de atención, tal cual quieres que se lea. Tiene versión en español y en inglés.

### Textos de la página de contacto

La cabecera de la página (etiqueta, titular y frase de entrada) y el título del bloque
donde aparecen el email y el teléfono. Igual que en Nosotros, con versión ES y EN.

Pulsa **Actualizar** cuando acabes.

---

## Qué NO se toca desde aquí

| Esto | Dónde se gestiona |
|---|---|
| **El formulario de contacto** (campos, textos de los campos, aviso de privacidad) | Está fijo en el diseño. Si hay que cambiarlo, avisa a Grupo Antena |
| **Las personas del equipo** (nombre, cargo, foto) | Menú **Equipo** |
| **Los logos de clientes / marcas** | Menú **Clientes** |
| **El mapa** de la página de contacto | Aún no está puesto (pendiente) |
| **Aviso legal, privacidad y cookies** | Son textos legales; los cambia Grupo Antena |

---

## Preguntas frecuentes

**¿Cuánto tarda en verse el cambio?**
Normalmente **1-2 minutos**. La web se reconstruye entera de forma automática.

**He guardado varios cambios seguidos, ¿pasa algo?**
No. El sistema **agrupa** los cambios y hace una sola actualización ~90 s después del
último, para no reconstruir diez veces.

**He borrado sin querer el contenido de un campo y lo he guardado.**
Tranquilidad: si un campo se queda vacío, la web **recupera automáticamente el texto que
tenía originalmente** en vez de dejar un hueco en blanco. Vuelve a escribirlo y guarda.

**No veo el cambio pasados unos minutos.**
Refresca con Ctrl+F5 (o Cmd+Shift+R). Si sigue sin verse, avisa a Grupo Antena: puede ser
que la actualización automática necesite una revisión (ver `auto-rebuild.md`).

**¿Puedo romper la web editando aquí?**
No. Solo editas textos e imágenes; el diseño, la estructura y el formulario están
protegidos. Tampoco puedes borrar las dos fichas.

**¿Puedo dejar un campo en inglés vacío?**
Sí, pero entonces la web en inglés seguirá mostrando el texto anterior. Lo ideal es
rellenar siempre las dos versiones.

---

> Para el portfolio, los servicios, el alquiler, el equipo y los clientes, mira
> `wp-editar-portfolio.md`: funcionan igual y con el mismo tiempo de publicación.
