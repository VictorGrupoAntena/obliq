# Gate 3 — Plan de validación E2E (alquiler con operador, en staging)

> Se ejecuta **después** del Gate 1 (singleton sembrado + verificado en REST) y del cruce deliberado del deploy a staging (`workflow_dispatch` sobre `redesign`). `DEPLOY_TARGET` sigue en staging. `main` intacto.

## Prerrequisitos (antes de empezar)

- [ ] Gate 1 hecho: `contenido?_obliq_key=alquiler` responde en la REST con `op_jornada_price: '300'`.
- [ ] **`OBLIQ_MAIL_TO` definido en el PHP-FPM del dominio de staging** = buzón de **pruebas** (NO `info@obliqproductions.com`). Sin esto, el envío devuelve 500 (fail-closed) y el escenario 4 no valida el correo.
- [ ] Primer deploy a staging cruzado a mano (Actions → Run workflow → `redesign`) y en verde. Build con WP real → sin el error A2 (singleton existe) + WARNING de `op_terms_*` provisional (esperado).
- [ ] Acceso Basic Auth de staging (user `obliq`).

## Escenario 1 — El precio de WP manda (editabilidad + rebuild)

1. En wp-admin → **Contenido de páginas → «Alquiler · Tarifa de operador»**, cambia `op_jornada_price` de `300` a, p. ej., `330`. Guarda.
2. El deploy-hook programa el dispatch (**debounce 90 s**) → deploy.yml → rsync a staging.
3. Espera ~2-3 min. Verifica en staging:
   - `/alquiler/` → la banda de operador y la ficha muestran **330 €/jornada**.
   - `/presupuesto/` → el contador «Jornadas completas» dice **330 € c/u** y el total usa 330.
   - JSON-LD de `/alquiler/` (`Service > offers`) → `price: "330"`.
4. **Revierte** el valor a `300` en WP y espera el rebuild (deja staging consistente).

**Criterio:** el cambio en WP se refleja en staging sin tocar código. ✅/❌

## Escenario 2 — Campo único de operador (norma `n + m === días`)

> ⚠️ **Obsoletos desde la norma del 24-jul-2026** (no ejecutar): el caso `n+m = 0` (ya no es alcanzable: el total siempre es calculable) y el barrido de 1/3/5/7 días con el operador fijo en 2+1 (ese estado ya no es válido).

En staging, con al menos un producto en el carrito, entra a `/presupuesto/` (y `/en/quote/`). Hay **un solo campo**: «¿Cuántas de las N jornadas son de media jornada?» (`m`); `n = días − m` se deriva.

- [ ] **Acotado 0..N:** con 5 días, escribir `m=9` deja el campo en `5` (atributo `max=5`).
- [ ] **Desglose correcto:** con 5 días y `m=2` → «3 × jornada completa (900 €) + 2 × media jornada (400 €)», línea «Operador» = **1.300 €**, total = material + 1.300.
- [ ] **Re-acotado al BAJAR N:** con `m=4`, pulsar el selector de **1 día** → `m` pasa a `1` y la etiqueta cambia al texto singular.
- [ ] **N que SUBE (sin salir de la página):** con 2 líneas a 1 día y `m=1`, subir una línea a **5 días** → `N=5`, `m` **sigue en 1**, `max` pasa a 5 y el desglose da «4 × jornada completa (1.200 €) + 1 × media jornada (200 €)» = **1.400 €** de operador.

> **Nota de comportamiento (no es defecto):** `m` vive solo en el DOM, **no se persiste**. Añadir un producto obliga a salir de `/presupuesto/` (se añade desde la ficha), así que al volver `m` reaparece en **0**. Por eso el caso de «N que sube» se prueba subiendo los días de una línea **dentro de la propia página**, no añadiendo un producto.
- [ ] **Extremos:** `m=0` → todas completas; `m=N` → todas medias (0 completas).
- [ ] **Concordancia:** con N=1 la etiqueta usa la variante singular («¿La jornada de alquiler es de media jornada?»), no «de las 1 jornadas».

**Criterio:** el estado inválido es inalcanzable por construcción y el desglose cuadra. ✅/❌

## Escenario 3 — 422 por descuadre, por POST directo (no desde la UI)

La UI no puede generar un descuadre (el campo único lo impide), así que la validación de servidor se prueba por `curl` directo. **nginx no escucha en loopback**: se va por el backend Apache con `--resolve` para el SNI, **sin tocar la config de nginx**.

```bash
PHP=/opt/plesk/php/8.3/bin/php
TT=$(( $(date +%s) - 6 )); SECRET="obliq_quote_$(date +%Y-%m-%d)"
TOKEN=$($PHP -r "echo hash('sha256', \$argv[1].\$argv[2]);" "$SECRET" "$TT")
START=$(date -d "+1 day" +%Y-%m-%d)
URL="https://staging.obliqproductions.com:7081/api/send-quote.php"
RES="--resolve staging.obliqproductions.com:7081:127.0.0.1"
# $1 = días del producto, $2 = n, $3 = m, $4 = campo `days` del payload (debe ignorarse)
mk(){ printf '{"company":"QA","email":"qa@example.com","phone":"600111222","startDate":"%s","days":%s,"products":[{"name":"X","days":%s,"price":110,"subtotal":467.5}],"total":467.5,"discount":15,"n_jornadas":%s,"n_medias_jornadas":%s,"operator_jornada_price":300,"operator_media_price":200,"lang":"es","website":"","_token":"%s","_t":%s}' "$START" "$4" "$1" "$2" "$3" "$TOKEN" "$TT"; }
run(){ curl -s -k $RES -o /tmp/r.json -w "$1 → HTTP %{http_code}\n" -X POST -H "Content-Type: application/json" --data "$2" "$URL"; }
```

- [ ] `run "A cuadra"      "$(mk 5 3 2 5)"` → **200** (o 500 fail-closed si `OBLIQ_MAIL_TO` no está puesto aún).
- [ ] `run "B no cuadra"    "$(mk 5 2 1 5)"` → **422** «Las jornadas de operador deben coincidir con los días de alquiler.»
- [ ] `run "C m>N"          "$(mk 5 -1 6 5)"` → **422**.
- [ ] `run "D days falseado" "$(mk 5 3 2 1)"` → **200**: el servidor **ignora** `days` y deriva 5 de `products[]`.
- [ ] `run "E days falseado" "$(mk 1 3 2 5)"` → **422**: días reales = 1, `n+m = 5`.

**Criterio:** el servidor deriva los días de `products[]`, ignora el `days` recibido y rechaza los descuadres. ✅/❌ (El token vale para la fecha del servidor; regenéralo si cambia el día.)

## Escenario 4 — Envío real al buzón de PRUEBAS (no a info@)

```bash
# n=1 → debe enviar al buzón OBLIQ_MAIL_TO de staging (pruebas), no a info@
curl -s -w "\nn=1 → HTTP %{http_code}\n" -X POST -H "Content-Type: application/json" --data "$(post 1 0)" "$BASE/api/send-quote.php"
```

- [ ] `HTTP 200`.
- [ ] Llega el correo **al buzón de pruebas**, con: filas por modalidad, la **línea de resumen** «Operador: N dias de alquiler → n × jornada completa + m × media jornada» con su importe, «Entrega de brutos incluida», los **días** en el bloque de fechas, y el gran total = material + operador.
- [ ] **NO** llega nada a `info@obliqproductions.com`.

**Criterio:** el correo llega al buzón de pruebas con el desglose de operador; el buzón real no recibe nada. ✅/❌

## Escenario 5 — Paridad ES/EN y no-regresión

- [ ] `/en/rental/` y `/en/quote/`: badge «Always with an operator», contadores «Full/Half days», mismo comportamiento `n+m=0`.
- [ ] Fichas (ES+EN): el JSON-LD `Product` **no** tiene `offers`/`price`; `/alquiler/` sí tiene `Service` con la tarifa.
- [ ] Resto del sitio (home, servicios, portfolio) sin cambios visibles.

## Salida

- Marca cada criterio ✅/❌ y anota incidencias en `MEMORY.md`.
- Si todo ✅: staging validado. El **cutover a producción** (P5+) queda pendiente de: títulos reales del portfolio, `op_terms_*` reales del cliente, `OBLIQ_MAIL_TO=info@` en el dominio de producción, y el resto de bloqueantes ya listados en `MEMORY.md`.
