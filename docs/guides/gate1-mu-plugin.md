# Gate 1 — Desplegar el mu-plugin al WordPress compartido

> Objetivo: publicar `scripts/obliq-cpts.php` (seed v3) en el WP compartido para que se **auto-siembre** el singleton «Alquiler · Tarifa de operador». Hasta que esto no esté, `npm run build` en modo WP **falla a propósito** (guard A2). No toca `main` ni el frontend de staging.

## 0. Contexto

- El WP compartido (staging + producción) vive en el servidor Plesk: `~/admin.obliqproductions.com/`.
- El mu-plugin destino: `~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php`.
- El seed es **create-if-missing + fill-only-empty**: crea el singleton si no existe y **nunca sobrescribe** valores ya escritos (ver `obliq_contenido_seed()`). Subir esto **no altera** las entradas about/contact/home existentes.
- `OBLIQ_CONTENIDO_SEED_VERSION` sube de `'2'` a `'3'`: sin ese salto, el singleton nuevo no se crearía en el WP ya instalado.

## 1. Backup del mu-plugin actual (en el servidor)

```bash
ssh <USUARIO>@<HOST_PLESK>
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/
cp obliq-cpts.php "obliq-cpts.php.bak.$(date +%Y%m%d-%H%M%S)"
ls -la obliq-cpts.php*
```

(Convención `.bak*` ya usada en este proyecto; se limpian en el cutover.)

## 2. Subir la versión nueva

Desde tu máquina, en la raíz del repo (`obliq/obliq`, rama `redesign`):

```bash
scp scripts/obliq-cpts.php <USUARIO>@<HOST_PLESK>:~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-cpts.php
```

Alternativa sin SSH: **Plesk → Administrador de archivos** → `admin.obliqproductions.com/wp-content/mu-plugins/` → subir `obliq-cpts.php` (sobrescribir).

El seed se ejecuta solo en la **primera carga de wp-admin o del front** tras subirlo (hook `init`). Para forzarlo, abre una vez el wp-admin del WP.

## 3. Comprobar en la REST que el singleton existe

```bash
curl -s "https://admin.obliqproductions.com/wp-json/wp/v2/contenido?per_page=100" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); a=[x for x in d if x.get('_obliq_key')=='alquiler']; print('OK' if a else 'FALTA'); print({k:a[0][k] for k in ('id','_obliq_key','op_jornada_price','op_media_price','op_includes_es','op_terms_es')} if a else 'no encontrado')"
```

**Respuesta esperada:**

```
OK
{'id': <n>, '_obliq_key': 'alquiler', 'op_jornada_price': '300', 'op_media_price': '200',
 'op_includes_es': 'Operador profesional cualificado\nEntrega de brutos',
 'op_terms_es': '[PENDIENTE DE CONFIRMAR CON CLIENTE] Entrega de brutos: formato y plazo por definir...'}
```

Si sale `FALTA`: el seed no corrió → abre el wp-admin una vez (dispara `init`) y repite. Verifica también que la entrada «Alquiler · Tarifa de operador» aparece en **wp-admin → Contenido de páginas**.

## 4. Verificar que el build en modo WP pasa (camino feliz — hoy sin verificar)

Con el singleton ya en la REST, desde el repo:

```bash
npm run build          # usa WP_API_URL de .env (WP real)
```

**Esperado:** `Complete!`, `78 page(s) built`, **exit 0**, y un WARNING (no error):

```
[operator] ⚠️  Tarifa de operador con contenido PROVISIONAL sin confirmar por el cliente
en los campos: op_terms_es, op_terms_en. ...
```

Ese warning es correcto y esperado: seguirá saliendo hasta que el cliente sustituya `op_terms_*` (ítem bloqueante de cutover). Si en su lugar el build **falla** con `[operator] El campo «op_jornada_price»…` o `No se encontró el singleton…`, el paso 3 no está bien: revisa la REST.

> Antes de este despliegue, `npm run build` en modo WP **falla a propósito** (verificado: exit 1 con el mensaje de operador). Es la garantía A2, no un bug.

## 5. Revertir

Si algo va mal, restaura el backup en el servidor:

```bash
cd ~/admin.obliqproductions.com/wp-content/mu-plugins/
cp "obliq-cpts.php.bak.<TIMESTAMP>" obliq-cpts.php
```

Notas:
- La entrada singleton ya creada **permanece** en la base de datos (el CPT bloquea el borrado por diseño). Es inofensiva: si reviertes el mu-plugin, los campos `op_*` dejan de registrarse en la REST.
- **No despliegues el frontend de staging (Gate 3) si has revertido el mu-plugin:** el build en modo WP volvería a fallar (A2) al no resolver la tarifa. Revertir es limpio mientras staging siga sirviendo el build anterior.

## 6. Después del Gate 1

Continúa con **Gate 3** (deploy a staging + validación E2E): `DEPLOY_TARGET` sigue en staging. Prueba: cambiar `op_jornada_price` en WP → verlo en staging tras el rebuild (~90s de debounce); el estado `n+m=0` (sin importe, submit deshabilitado); y el 422 del endpoint.
