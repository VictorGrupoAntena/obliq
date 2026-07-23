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

## Escenario 2 — Estado `n+m = 0` (sin importe, submit bloqueado)

En staging, con al menos un producto en el carrito, entra a `/presupuesto/` (y `/en/quote/`):

- [ ] Con los contadores a `0/0`: el resumen **no muestra importe total**; en su lugar el texto «**Indica las jornadas de operador para calcular el presupuesto**» (EN: «Indicate the operator days…»).
- [ ] El botón de envío está **deshabilitado**.
- [ ] Al poner `n_jornadas=1` (o media=1): aparece el total = material + operador, y el botón se habilita.
- [ ] La línea «Operador» del resumen refleja `300·n + 200·m`.

**Criterio:** sin operador no hay importe ni envío; con operador, total aditivo correcto. ✅/❌

## Escenario 3 — 422 del endpoint por POST directo (no desde la UI)

El submit está deshabilitado en cliente con `n+m=0`, así que la validación de servidor se prueba por `curl` directo (mismo método que en local). Contra staging:

```bash
BASE="https://obliq:<PASS>@staging.obliqproductions.com"   # Basic Auth
SECRET="obliq_quote_$(date +%Y-%m-%d)"; TT=$(( $(date +%s) - 5 ))
TOKEN=$(php -r "echo hash('sha256', \$argv[1].\$argv[2]);" "$SECRET" "$TT")
START=$(date -v+1d +%Y-%m-%d)
post() { printf '{"company":"QA","email":"qa@example.com","phone":"600111222","startDate":"%s","days":1,"products":[{"name":"X","days":1,"price":110,"subtotal":110}],"total":110,"discount":0,"n_jornadas":%s,"n_medias_jornadas":%s,"operator_jornada_price":300,"operator_media_price":200,"lang":"es","website":"","_token":"%s","_t":%s}' "$START" "$1" "$2" "$TOKEN" "$TT"; }

# n+m=0 → 422 «Indica al menos media jornada de operador.»
curl -s -o /dev/null -w "n=0 → HTTP %{http_code}\n" -X POST -H "Content-Type: application/json" --data "$(post 0 0)" "$BASE/api/send-quote.php"
```

**Criterio:** `HTTP 422`. ✅/❌ (Nota: el token es válido ~24 h del día en curso; regenéralo si cambia la fecha del servidor.)

## Escenario 4 — Envío real al buzón de PRUEBAS (no a info@)

```bash
# n=1 → debe enviar al buzón OBLIQ_MAIL_TO de staging (pruebas), no a info@
curl -s -w "\nn=1 → HTTP %{http_code}\n" -X POST -H "Content-Type: application/json" --data "$(post 1 0)" "$BASE/api/send-quote.php"
```

- [ ] `HTTP 200`.
- [ ] Llega el correo **al buzón de pruebas**, con el bloque «Operador — Jornadas completas (1 × 300,00 €)» + «Entrega de brutos incluida» + gran total = material + operador.
- [ ] **NO** llega nada a `info@obliqproductions.com`.

**Criterio:** el correo llega al buzón de pruebas con el desglose de operador; el buzón real no recibe nada. ✅/❌

## Escenario 5 — Paridad ES/EN y no-regresión

- [ ] `/en/rental/` y `/en/quote/`: badge «Always with an operator», contadores «Full/Half days», mismo comportamiento `n+m=0`.
- [ ] Fichas (ES+EN): el JSON-LD `Product` **no** tiene `offers`/`price`; `/alquiler/` sí tiene `Service` con la tarifa.
- [ ] Resto del sitio (home, servicios, portfolio) sin cambios visibles.

## Salida

- Marca cada criterio ✅/❌ y anota incidencias en `MEMORY.md`.
- Si todo ✅: staging validado. El **cutover a producción** (P5+) queda pendiente de: títulos reales del portfolio, `op_terms_*` reales del cliente, `OBLIQ_MAIL_TO=info@` en el dominio de producción, y el resto de bloqueantes ya listados en `MEMORY.md`.
