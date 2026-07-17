# Auto-rebuild (WordPress → GitHub Actions → Plesk)

Pipeline que reconstruye y despliega el SSG automáticamente cuando el cliente edita
contenido en WordPress. **Build fuera del servidor** (el Plesk no tiene Node en PATH),
en un runner limpio de GitHub Actions, y `rsync` al docroot de Plesk.

```
WordPress (edita CPT/taxonomía)
   └─ mu-plugin obliq-deploy-hook.php ──debounce 90s──► POST repository_dispatch (GitHub API)
        └─ .github/workflows/deploy.yml (runner Ubuntu):
             pnpm install → pnpm build (WP real) → rsync -avz --delete → Plesk
                └─ web actualizada (~1-2 min)
```

- **Workflow:** [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
- **Hook WP:** [`scripts/obliq-deploy-hook.php`](../../scripts/obliq-deploy-hook.php)
- **Manual del cliente:** [`wp-editar-portfolio.md`](wp-editar-portfolio.md)
- **Ventaja:** el runner no tiene iCloud → el bug de directorios `" 2"` desaparece; y los
  ficheros salen con permisos correctos (644), evitando el 403 de favicons visto en el
  deploy manual.

> **TARGET actual = STAGING.** No conectar a producción hasta el cutover (§ Cutover).

---

## 1. Secretos y variables de GitHub

Repo → **Settings → Secrets and variables → Actions**.

### Secrets (cifrados — pestaña "Secrets")

| Nombre | Valor |
|---|---|
| `SSH_DEPLOY_KEY` | Clave **privada** ed25519 dedicada del runner (bloque completo `-----BEGIN…END-----`). Generada aparte; su pública ya está en el `authorized_keys` del servidor. |
| `SSH_KNOWN_HOSTS` | Salida de `ssh-keyscan -t ed25519,rsa obliqproductions.com` (verifica la identidad del server). |

### Variables (texto plano — pestaña "Variables", NO son secretos)

| Nombre | Valor |
|---|---|
| `WP_API_URL` | `https://admin.obliqproductions.com/wp-json/wp/v2` |
| `DEPLOY_HOST` | `obliqproductions.com` |
| `DEPLOY_USER` | `obliqproductions.com_zbt88qx0mpj` |
| `DEPLOY_TARGET` | `staging.obliqproductions.com/` ← en el cutover se cambia a producción |

## 2. PAT de GitHub (lo genera Víctor)

El mu-plugin necesita un token para disparar el `repository_dispatch`. **Fine-grained,
mínimo privilegio:**

1. GitHub → **Settings (de tu cuenta) → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Resource owner:** VictorGrupoAntena · **Repository access:** *Only select
   repositories* → **obliq**.
3. **Permissions → Repository permissions → Contents: Read and write**
   (es el permiso que exige el endpoint `POST /repos/…/dispatches`).
4. **Expiration:** a tu criterio (recomendado 1 año, con recordatorio de renovación).
5. Generate → **copia el token** (`github_pat_…`); solo se muestra una vez.

## 3. Constantes en `wp-config.php` (servidor WordPress)

Editar `~/admin.obliqproductions.com/wp-config.php` y añadir **antes** de
`/* That's all, stop editing! */`:

```php
define( 'OBLIQ_DEPLOY_PAT',  'github_pat_XXXXXXXXXXXXXXXX' ); // el PAT del paso 2
define( 'OBLIQ_DEPLOY_REPO', 'VictorGrupoAntena/obliq' );
```

> El PAT vive **solo** en `wp-config.php` (fuera del repo). El mu-plugin nunca lo
> hardcodea: lo lee de estas constantes.

## 4. Instalar el mu-plugin

Copiar `scripts/obliq-deploy-hook.php` a
`~/admin.obliqproductions.com/wp-content/mu-plugins/obliq-deploy-hook.php`
(los mu-plugins se activan solos).

## 5. Garantía de wp-cron (headless de bajo tráfico)

El debounce usa WP-Cron, que en WordPress se dispara con las visitas. Un admin headless
puede tener poco tráfico y retrasar el build. Para garantizar que el evento programado se
ejecute a tiempo:

1. Desactivar el cron por visita en `wp-config.php`:
   ```php
   define( 'DISABLE_WP_CRON', true );
   ```
2. Añadir un cron de sistema que lo dispare cada minuto (Plesk → **Scheduled Tasks**, o
   crontab del usuario):
   ```
   * * * * * curl -s https://admin.obliqproductions.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1
   ```

Así, tras editar en WP, el build arranca como muy tarde ~90 s + 1 min después.

---

## Cutover a producción (más adelante — NO ahora)

1. Cambiar la variable **`DEPLOY_TARGET`** al docroot de producción.
2. En `deploy.yml`, **quitar `--exclude='robots.txt'`** (para publicar el `robots.txt`
   real con `Allow` + sitemap; el exclude solo protegía el `Disallow` de staging).
3. Confirmar SPF/DKIM del dominio para que los emails de los formularios no caigan en spam.

## Probar / disparar a mano

- **Manual:** repo → **Actions → "Deploy (build + rsync a Plesk)" → Run workflow**.
- **Desde WP:** publicar/editar cualquier CPT o taxonomía → esperar ~90 s → ver el run en
  Actions.

## Troubleshooting

| Síntoma | Causa probable / solución |
|---|---|
| El build no arranca al editar en WP | wp-cron no se ejecutó → aplicar § 5. Ver `error_log` de WP por líneas `[obliq-deploy]`. |
| `dispatch HTTP 401/403` en el log de WP | PAT inválido/caducado o sin permiso *Contents: R/W*. Regenerar. |
| `dispatch HTTP 404` | `OBLIQ_DEPLOY_REPO` mal escrito o el PAT no tiene acceso a ese repo. |
| Workflow falla en `rsync` (permission denied) | La clave pública del runner no está en `authorized_keys`, o `DEPLOY_TARGET` incorrecto. |
| Workflow falla en `pnpm install` | Lockfile desincronizado → `pnpm install` local y commit del `pnpm-lock.yaml`. |
| Se lanzan varios builds seguidos | El `concurrency: cancel-in-progress` cancela los solapados; con el debounce no debería pasar. |
