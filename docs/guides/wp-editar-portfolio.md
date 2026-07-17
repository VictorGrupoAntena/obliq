# Cómo actualizar el portfolio de la web (para el equipo de Obliq)

Esta guía explica cómo **añadir, editar o quitar proyectos** del portfolio de la web
desde WordPress. **No hace falta saber programar ni avisar a nadie**: cuando guardas un
cambio, la web se reconstruye y se publica **sola en 1-2 minutos**.

---

## Entrar

1. Ve a **https://admin.obliqproductions.com/wp-admin**
2. Inicia sesión con tu usuario y contraseña.
3. En el menú de la izquierda verás **Portfolio** (icono de galería).

## Añadir un proyecto nuevo

1. **Portfolio → Añadir proyecto**.
2. **Título:** el nombre del proyecto (ej. *Campaña Verano — Estrella Damm*).
3. **Categoría** (columna derecha, "Categorías de portfolio"): marca **una** de las
   existentes (Gastro, Marcas, Branded content, Entrevistas, Eventos, Spots).
   - ¿Necesitas una categoría nueva? Escríbela y pulsa "Añadir". **Aparecerá sola como
     filtro** en la web, sin tocar nada más.
4. Baja al recuadro **"Campos del proyecto"** y rellena:
   - **Vimeo URL:** pega el enlace del vídeo en Vimeo (ej. `https://vimeo.com/123456789`).
     Si el vídeo es privado/oculto, pega el enlace **con su código** (ej.
     `https://vimeo.com/123456789/a1b2c3d4e5`). El vídeo se reproducirá al hacer clic.
   - **Título EN:** el título en inglés (para la versión /en/ de la web).
   - **Destacado:** escribe `true` si quieres que salga en la home; si no, `false`.
   - (Opcionales) Cliente, Director, Año.
5. Pulsa **Publicar** (botón azul, arriba a la derecha).

✅ **Listo.** En 1-2 minutos el proyecto aparece en https://obliqproductions.com/portfolio/

## Editar un proyecto existente

1. **Portfolio** → clic en el proyecto → cambia lo que necesites → **Actualizar**.
2. Espera 1-2 minutos y refresca la web.

## Quitar un proyecto

1. **Portfolio** → pasa el ratón por el proyecto → **Papelera**.
2. En 1-2 minutos desaparece de la web.

## Ordenar / destacar

- El **orden** del grid sigue la fecha de publicación (los más nuevos primero).
- Marca **Destacado = true** en hasta 3 proyectos para que salgan en la portada.

---

## Preguntas frecuentes

**¿Cuánto tarda en verse el cambio?**
Normalmente **1-2 minutos**. La web se reconstruye entera de forma automática.

**He guardado varios cambios seguidos, ¿pasa algo?**
No. El sistema **agrupa** los cambios y hace una sola actualización ~90 s después del
último, para no reconstruir diez veces.

**No veo el cambio pasados unos minutos.**
Refresca con Ctrl+F5 (o Cmd+Shift+R). Si sigue sin verse, avisa a Grupo Antena: puede ser
que la actualización automática necesite una revisión (ver `auto-rebuild.md`).

**¿Puedo romper la web editando aquí?**
No. Solo editas contenido; el diseño y la estructura están protegidos.

> Además del portfolio, este mismo comportamiento aplica a **Servicios, Alquiler, Packs,
> Equipo y Clientes**: cualquier cambio publicado en ellos actualiza la web sola.
