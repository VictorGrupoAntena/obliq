<?php
/**
 * Obliq Productions — Deploy Hook (auto-rebuild)
 *
 * Al publicar/editar/borrar contenido de los CPTs y taxonomías del sitio,
 * dispara un `repository_dispatch` en GitHub → GitHub Actions reconstruye el
 * SSG y lo sube a Plesk (ver .github/workflows/deploy.yml).
 *
 * INSTALACIÓN:
 *   1. Subir a wp-content/mu-plugins/obliq-deploy-hook.php (auto-activo).
 *   2. Definir en wp-config.php (NUNCA hardcodear aquí):
 *        define('OBLIQ_DEPLOY_PAT',  'github_pat_XXXXXXXX');      // PAT fine-grained, Contents: R/W, solo repo obliq
 *        define('OBLIQ_DEPLOY_REPO', 'VictorGrupoAntena/obliq');
 *      (opcional) define('OBLIQ_DEPLOY_EVENT', 'wp-content-update');
 *
 * DEBOUNCE: 90 s vía wp_schedule_single_event único → una ráfaga de ediciones
 * produce UN solo build. Ver docs/guides/auto-rebuild.md (incl. cron de
 * garantía de wp-cron para sitios headless de bajo tráfico).
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// CPTs y taxonomías que, al cambiar, deben regenerar la web.
const OBLIQ_DEPLOY_CPTS  = array( 'portfolio', 'servicio', 'alquiler', 'alquiler_pack', 'director', 'cliente' );
const OBLIQ_DEPLOY_TAXOS = array( 'portfolio_category', 'rental_category' );
const OBLIQ_DEPLOY_HOOK  = 'obliq_deploy_dispatch';
const OBLIQ_DEPLOY_DEBOUNCE = 90; // segundos

// ---------------------------------------------------------------------------
// Triggers — posts (publicar / actualizar / borrar)
// ---------------------------------------------------------------------------
add_action( 'transition_post_status', function ( $new_status, $old_status, $post ) {
    if ( ! in_array( $post->post_type, OBLIQ_DEPLOY_CPTS, true ) ) return;
    if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post ) ) return;
    // Solo cambios que afectan a lo publicado (publish nuevo, edición de publicado,
    // o despublicar). Ignora borradores que nunca se publicaron.
    if ( $new_status === 'publish' || $old_status === 'publish' ) {
        obliq_schedule_deploy();
    }
}, 10, 3 );

add_action( 'before_delete_post', function ( $post_id ) {
    if ( in_array( get_post_type( $post_id ), OBLIQ_DEPLOY_CPTS, true ) ) {
        obliq_schedule_deploy();
    }
} );

// ---------------------------------------------------------------------------
// Triggers — taxonomías (crear / editar / borrar término)
// ---------------------------------------------------------------------------
foreach ( array( 'created_term', 'edited_term', 'delete_term' ) as $tax_hook ) {
    add_action( $tax_hook, function ( $term_id, $tt_id, $taxonomy ) {
        if ( in_array( $taxonomy, OBLIQ_DEPLOY_TAXOS, true ) ) {
            obliq_schedule_deploy();
        }
    }, 10, 3 );
}

// ---------------------------------------------------------------------------
// Debounce — programa UN único evento; ediciones posteriores dentro de la
// ventana no acumulan builds.
// ---------------------------------------------------------------------------
function obliq_schedule_deploy() {
    if ( ! wp_next_scheduled( OBLIQ_DEPLOY_HOOK ) ) {
        wp_schedule_single_event( time() + OBLIQ_DEPLOY_DEBOUNCE, OBLIQ_DEPLOY_HOOK );
    }
}

// ---------------------------------------------------------------------------
// Dispatch — POST a la API de GitHub (repository_dispatch)
// ---------------------------------------------------------------------------
add_action( OBLIQ_DEPLOY_HOOK, 'obliq_do_dispatch' );

function obliq_do_dispatch() {
    if ( ! defined( 'OBLIQ_DEPLOY_PAT' ) || ! defined( 'OBLIQ_DEPLOY_REPO' ) ) {
        error_log( '[obliq-deploy] Falta OBLIQ_DEPLOY_PAT / OBLIQ_DEPLOY_REPO en wp-config.php — dispatch cancelado.' );
        return;
    }

    $event = defined( 'OBLIQ_DEPLOY_EVENT' ) ? OBLIQ_DEPLOY_EVENT : 'wp-content-update';
    $url   = 'https://api.github.com/repos/' . OBLIQ_DEPLOY_REPO . '/dispatches';

    $res = wp_remote_post( $url, array(
        'timeout' => 20,
        'headers' => array(
            'Accept'               => 'application/vnd.github+json',
            'Authorization'        => 'Bearer ' . OBLIQ_DEPLOY_PAT,
            'Content-Type'         => 'application/json',
            'User-Agent'           => 'obliq-deploy-hook',
            'X-GitHub-Api-Version' => '2022-11-28',
        ),
        'body' => wp_json_encode( array(
            'event_type'     => $event,
            'client_payload' => array(
                'source' => 'wordpress',
                'time'   => current_time( 'mysql' ),
            ),
        ) ),
    ) );

    if ( is_wp_error( $res ) ) {
        error_log( '[obliq-deploy] dispatch error: ' . $res->get_error_message() );
        return;
    }

    $code = wp_remote_retrieve_response_code( $res );
    if ( $code !== 204 ) {
        // 204 = OK (sin cuerpo). 401/403 = PAT; 404 = repo/permiso/nombre.
        error_log( '[obliq-deploy] dispatch HTTP ' . $code . ': ' . wp_remote_retrieve_body( $res ) );
    }
}
