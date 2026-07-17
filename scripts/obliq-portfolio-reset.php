<?php
/**
 * Obliq — Reset de portfolio: borra placeholder y crea contenido real.
 *
 * ONE-OFF. Ejecutar UNA vez en el servidor (NO es un plugin, NO dejar en el WP root).
 *
 * Qué hace:
 *   1. Borra TODOS los posts del CPT `portfolio` (placeholder de marzo 2026)
 *   2. Borra TODOS los términos de la taxonomía `portfolio_category`
 *   3. Crea las 6 categorías del cliente en orden: Gastro, Marcas,
 *      Branded content, Entrevistas, Eventos, Spots
 *   4. Crea los 11 proyectos reales con su categoría y pf_vimeo_url
 *      (título provisional «Proyecto {categoría} {n}» hasta recibir títulos del cliente)
 *
 * Cómo ejecutar (elige una):
 *   A) WP-CLI:   wp eval-file obliq-portfolio-reset.php --path=/ruta/al/wp
 *   B) PHP CLI:  copiar junto a wp-load.php y ejecutar `php obliq-portfolio-reset.php`
 *
 * Idempotente: se puede re-ejecutar; siempre deja WP con exactamente
 * las 6 categorías y los 11 proyectos definidos abajo.
 */

// Bootstrap: si no corre bajo WP-CLI, cargar WordPress desde el mismo directorio.
if ( ! defined( 'ABSPATH' ) ) {
    $wp_load = __DIR__ . '/wp-load.php';
    if ( ! file_exists( $wp_load ) ) {
        fwrite( STDERR, "ERROR: no encuentro wp-load.php junto al script. Copia este fichero al WP root o usa `wp eval-file`.\n" );
        exit( 1 );
    }
    require $wp_load;
}

if ( php_sapi_name() !== 'cli' && ! defined( 'WP_CLI' ) ) {
    exit( 'Solo CLI.' ); // nunca ejecutable vía web
}

$say = function ( $msg ) {
    echo $msg . "\n";
};

// Sanity check: el mu-plugin obliq-cpts.php debe estar activo.
if ( ! post_type_exists( 'portfolio' ) || ! taxonomy_exists( 'portfolio_category' ) ) {
    $say( 'ERROR: CPT portfolio / taxonomía portfolio_category no registrados. ¿Está mu-plugins/obliq-cpts.php activo?' );
    exit( 1 );
}

// ============================================================
// 1) BORRAR proyectos placeholder
// ============================================================
$old_posts = get_posts( array(
    'post_type'      => 'portfolio',
    'post_status'    => 'any',
    'posts_per_page' => -1,
    'fields'         => 'ids',
) );
foreach ( $old_posts as $pid ) {
    wp_delete_post( $pid, true ); // true = skip trash
}
$say( 'Borrados ' . count( $old_posts ) . ' proyectos placeholder.' );

// ============================================================
// 2) BORRAR categorías placeholder
// ============================================================
$old_terms = get_terms( array(
    'taxonomy'   => 'portfolio_category',
    'hide_empty' => false,
) );
foreach ( $old_terms as $term ) {
    wp_delete_term( $term->term_id, 'portfolio_category' );
}
$say( 'Borradas ' . count( $old_terms ) . ' categorías placeholder.' );

// ============================================================
// 3) CREAR las 6 categorías del cliente (en este orden)
// ============================================================
$categories = array( 'Gastro', 'Marcas', 'Branded content', 'Entrevistas', 'Eventos', 'Spots' );
$term_ids   = array();
foreach ( $categories as $cat_name ) {
    $result = wp_insert_term( $cat_name, 'portfolio_category' );
    if ( is_wp_error( $result ) ) {
        $say( "ERROR creando categoría {$cat_name}: " . $result->get_error_message() );
        exit( 1 );
    }
    $term_ids[ $cat_name ] = (int) $result['term_id'];
    $say( "Categoría creada: {$cat_name} (term_id {$result['term_id']})" );
}

// ============================================================
// 4) CREAR los 11 proyectos reales
//    formato: [categoría, vimeo_id, hash|null, featured]
//    featured provisional (3, para la home) — el cliente puede cambiarlo en WP
// ============================================================
$projects = array(
    array( 'Gastro',          '1209481160', null,         true ),
    array( 'Gastro',          '1209450532', '6da71b05b3', false ),
    array( 'Marcas',          '1209641919', 'eed26bbdd6', true ),
    array( 'Marcas',          '1209456791', 'de3e459c53', false ),
    array( 'Marcas',          '1147316237', 'c1a2479df5', false ),
    array( 'Branded content', '1209451032', null,         false ),
    array( 'Entrevistas',     '1172559496', '6c29294452', false ),
    array( 'Entrevistas',     '1161036538', '4fcc5767cd', false ),
    array( 'Eventos',         '1127528944', null,         false ),
    array( 'Spots',           '1163689471', 'f05ec68da4', true ),
    array( 'Spots',           '1209452284', '640faaaa6f', false ),
);

// EN provisional por categoría (solo para pf_title_en; el nombre de categoría
// que se muestra en filtros/tarjetas es el término WP, único para ambos idiomas)
$en_names = array(
    'Gastro'          => 'Gastro',
    'Marcas'          => 'Brands',
    'Branded content' => 'Branded content',
    'Entrevistas'     => 'Interviews',
    'Eventos'         => 'Events',
    'Spots'           => 'Spots',
);

$counters = array();
$base_ts  = time();
$i        = 0;

foreach ( $projects as $p ) {
    list( $cat, $vimeo_id, $hash, $featured ) = $p;

    $counters[ $cat ] = ( $counters[ $cat ] ?? 0 ) + 1;
    $n        = $counters[ $cat ];
    $title_es = "Proyecto {$cat} {$n}";
    $title_en = 'Project ' . $en_names[ $cat ] . " {$n}";
    $vimeo    = $hash ? "https://vimeo.com/{$vimeo_id}/{$hash}" : "https://vimeo.com/{$vimeo_id}";

    // post_date descendente: el 1º de la lista queda el más reciente
    // → la REST API (orderby date desc) devuelve el grid en el orden de esta lista
    $date = gmdate( 'Y-m-d H:i:s', $base_ts - ( $i * 60 ) );
    $i++;

    $post_id = wp_insert_post( array(
        'post_type'     => 'portfolio',
        'post_status'   => 'publish',
        'post_title'    => $title_es,
        'post_date_gmt' => $date,
        'post_date'     => get_date_from_gmt( $date ),
    ), true );

    if ( is_wp_error( $post_id ) ) {
        $say( "ERROR creando {$title_es}: " . $post_id->get_error_message() );
        exit( 1 );
    }

    wp_set_object_terms( $post_id, array( $term_ids[ $cat ] ), 'portfolio_category' );

    update_post_meta( $post_id, 'pf_title_en', $title_en );
    update_post_meta( $post_id, 'pf_vimeo_url', $vimeo );
    update_post_meta( $post_id, 'pf_featured', $featured ? 'true' : 'false' );

    $say( "Proyecto creado: {$title_es} → {$vimeo}" . ( $featured ? ' [featured]' : '' ) );
}

// ============================================================
// Resumen final
// ============================================================
$final_posts = wp_count_posts( 'portfolio' )->publish;
$final_terms = count( get_terms( array( 'taxonomy' => 'portfolio_category', 'hide_empty' => false ) ) );
$say( '---' );
$say( "DONE: {$final_terms} categorías, {$final_posts} proyectos publicados." );
$say( 'Verifica: https://admin.obliqproductions.com/wp-json/wp/v2/portfolio_category' );
$say( 'RECUERDA: borrar este script del servidor tras ejecutarlo.' );
