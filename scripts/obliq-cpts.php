<?php
/**
 * Obliq Productions — CPTs, Taxonomías y Meta Fields
 *
 * INSTRUCCIONES:
 * 1. Subir este archivo a wp-content/mu-plugins/obliq-cpts.php
 * 2. Se activa automáticamente (mu-plugins no necesitan activación)
 * 3. Todos los CPTs, taxonomías y meta fields se registran al cargar WP
 * 4. Los campos son visibles en REST API para consumo headless (Astro SSG)
 *
 * PARA DESINSTALAR: eliminar el archivo de mu-plugins/
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ============================================================
// TAXONOMÍAS (se registran primero — los CPTs las referencian)
// ============================================================

add_action( 'init', 'obliq_register_taxonomies', 5 );

function obliq_register_taxonomies() {

    // --- rental_category (6 categorías de alquiler) ---
    register_taxonomy( 'rental_category', array( 'alquiler' ), array(
        'labels' => array(
            'name'          => 'Categorías de alquiler',
            'singular_name' => 'Categoría de alquiler',
            'add_new_item'  => 'Añadir categoría',
            'edit_item'     => 'Editar categoría',
        ),
        'public'            => true,
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'rental_category',
        'show_admin_column' => true,
    ) );

    // Meta fields para rental_category
    $rc_meta = array(
        'rc_slug_en'         => 'string',
        'rc_name_en'         => 'string',
        'rc_description_es'  => 'string',
        'rc_description_en'  => 'string',
        'rc_icon'            => 'string',
    );
    foreach ( $rc_meta as $key => $type ) {
        register_term_meta( 'rental_category', $key, array(
            'type'         => $type,
            'single'       => true,
            'show_in_rest' => true,
        ) );
    }

    // --- portfolio_category (6 categorías de portfolio) ---
    register_taxonomy( 'portfolio_category', array( 'portfolio' ), array(
        'labels' => array(
            'name'          => 'Categorías de portfolio',
            'singular_name' => 'Categoría de portfolio',
            'add_new_item'  => 'Añadir categoría',
            'edit_item'     => 'Editar categoría',
        ),
        'public'            => true,
        'hierarchical'      => false,
        'show_in_rest'      => true,
        'rest_base'         => 'portfolio_category',
        'show_admin_column' => true,
    ) );
}

// ============================================================
// CUSTOM POST TYPES (6 CPTs)
// ============================================================

add_action( 'init', 'obliq_register_cpts', 10 );

function obliq_register_cpts() {

    // --- servicio (9 servicios) ---
    register_post_type( 'servicio', array(
        'labels' => array(
            'name'          => 'Servicios',
            'singular_name' => 'Servicio',
            'add_new_item'  => 'Añadir servicio',
            'edit_item'     => 'Editar servicio',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'servicio',
        'supports'      => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
        'menu_icon'     => 'dashicons-video-alt3',
        'menu_position' => 5,
    ) );

    // --- portfolio (proyectos) ---
    register_post_type( 'portfolio', array(
        'labels' => array(
            'name'          => 'Portfolio',
            'singular_name' => 'Proyecto',
            'add_new_item'  => 'Añadir proyecto',
            'edit_item'     => 'Editar proyecto',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'portfolio',
        'supports'      => array( 'title', 'editor', 'thumbnail' ),
        'taxonomies'    => array( 'portfolio_category' ),
        'menu_icon'     => 'dashicons-format-gallery',
        'menu_position' => 6,
    ) );

    // --- director (equipo) ---
    register_post_type( 'director', array(
        'labels' => array(
            'name'          => 'Equipo',
            'singular_name' => 'Miembro',
            'add_new_item'  => 'Añadir miembro',
            'edit_item'     => 'Editar miembro',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'director',
        'supports'      => array( 'title', 'thumbnail', 'page-attributes' ),
        'menu_icon'     => 'dashicons-groups',
        'menu_position' => 7,
    ) );

    // --- alquiler (productos de alquiler) ---
    register_post_type( 'alquiler', array(
        'labels' => array(
            'name'          => 'Alquiler',
            'singular_name' => 'Producto',
            'add_new_item'  => 'Añadir producto',
            'edit_item'     => 'Editar producto',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'alquiler',
        'supports'      => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
        'taxonomies'    => array( 'rental_category' ),
        'menu_icon'     => 'dashicons-camera',
        'menu_position' => 8,
    ) );

    // --- alquiler_pack (packs temáticos) ---
    register_post_type( 'alquiler_pack', array(
        'labels' => array(
            'name'          => 'Packs de alquiler',
            'singular_name' => 'Pack',
            'add_new_item'  => 'Añadir pack',
            'edit_item'     => 'Editar pack',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'alquiler_pack',
        'supports'      => array( 'title', 'thumbnail' ),
        'menu_icon'     => 'dashicons-archive',
        'menu_position' => 9,
    ) );

    // --- cliente (logos de marcas) ---
    register_post_type( 'cliente', array(
        'labels' => array(
            'name'          => 'Clientes',
            'singular_name' => 'Cliente',
            'add_new_item'  => 'Añadir cliente',
            'edit_item'     => 'Editar cliente',
        ),
        'public'        => true,
        'has_archive'   => false,
        'show_in_rest'  => true,
        'rest_base'     => 'cliente',
        'supports'      => array( 'title', 'thumbnail', 'page-attributes' ),
        'menu_icon'     => 'dashicons-star-filled',
        'menu_position' => 10,
    ) );
}

// ============================================================
// META FIELDS (register_post_meta — visibles en REST API)
// ============================================================

add_action( 'init', 'obliq_register_meta_fields', 15 );

function obliq_register_meta_fields() {

    // Helper para registrar meta fields en bloque
    $register = function( $post_type, $fields ) {
        foreach ( $fields as $key => $type ) {
            register_post_meta( $post_type, $key, array(
                'type'          => $type,
                'single'        => true,
                'show_in_rest'  => true,
                'auth_callback' => '__return_true',
            ) );
        }
    };

    // --- servicio ---
    $register( 'servicio', array(
        'sv_slug_en'              => 'string',
        'sv_long_description_es'  => 'string',
        'sv_long_description_en'  => 'string',
        'sv_marquee_text_es'      => 'string',
        'sv_marquee_text_en'      => 'string',
        'sv_case_study_title_es'  => 'string',
        'sv_case_study_title_en'  => 'string',
        'sv_case_study_desc_es'   => 'string',
        'sv_case_study_desc_en'   => 'string',
    ) );

    // --- portfolio ---
    $register( 'portfolio', array(
        'pf_title_en'  => 'string',
        'pf_vimeo_url' => 'string',
        'pf_client'    => 'string',
        'pf_director'  => 'string',
        'pf_year'      => 'string',
        'pf_featured'  => 'string',
    ) );

    // --- director ---
    $register( 'director', array(
        'dr_role_es' => 'string',
        'dr_role_en' => 'string',
    ) );

    // --- alquiler ---
    $register( 'alquiler', array(
        'al_slug'            => 'string',
        'al_description_es'  => 'string',
        'al_description_en'  => 'string',
        'al_price'           => 'number',
        'al_order'           => 'integer',
    ) );

    // --- alquiler_pack ---
    $register( 'alquiler_pack', array(
        'ap_slug'             => 'string',
        'ap_name_en'          => 'string',
        'ap_description_es'   => 'string',
        'ap_description_en'   => 'string',
        'ap_daily_price'      => 'number',
        'ap_savings'          => 'number',
    ) );

    // --- cliente ---
    $register( 'cliente', array(
        'cl_order' => 'integer',
    ) );
}

// ============================================================
// REPEATER / MEDIA FIELDS (via register_rest_field)
//
// Estos campos se almacenan como post_meta serializado
// y se exponen como JSON en la REST API.
// ============================================================

add_action( 'rest_api_init', 'obliq_register_rest_fields' );

function obliq_register_rest_fields() {

    // Helper genérico para exponer un meta field como rest_field
    $expose_meta = function( $post_type, $field_name ) {
        register_rest_field( $post_type, $field_name, array(
            'get_callback' => function( $post ) use ( $field_name ) {
                return get_post_meta( $post['id'], $field_name, true );
            },
            'update_callback' => function( $value, $post ) use ( $field_name ) {
                update_post_meta( $post->ID, $field_name, $value );
            },
            'schema' => null,
        ) );
    };

    // --- servicio: ALL fields ---
    $sv_fields = array(
        'sv_slug_en', 'sv_long_description_es', 'sv_long_description_en',
        'sv_marquee_text_es', 'sv_marquee_text_en',
        'sv_case_study_title_es', 'sv_case_study_title_en',
        'sv_case_study_desc_es', 'sv_case_study_desc_en',
        'sv_features_es', 'sv_features_en',
        'sv_pricing_es', 'sv_pricing_en',
        'sv_image', 'sv_case_study_image',
    );
    foreach ( $sv_fields as $f ) {
        $expose_meta( 'servicio', $f );
    }

    // --- portfolio: ALL fields ---
    $pf_fields = array(
        'pf_title_en', 'pf_vimeo_url', 'pf_client', 'pf_director',
        'pf_year', 'pf_featured', 'pf_image',
    );
    foreach ( $pf_fields as $f ) {
        $expose_meta( 'portfolio', $f );
    }

    // --- director: ALL fields ---
    $dr_fields = array( 'dr_role_es', 'dr_role_en', 'dr_photo' );
    foreach ( $dr_fields as $f ) {
        $expose_meta( 'director', $f );
    }

    // --- alquiler: ALL fields ---
    $al_fields = array(
        'al_slug', 'al_description_es', 'al_description_en',
        'al_price', 'al_order',
        'al_specs_es', 'al_specs_en', 'al_image',
    );
    foreach ( $al_fields as $f ) {
        $expose_meta( 'alquiler', $f );
    }

    // --- alquiler_pack: ALL fields ---
    $ap_fields = array(
        'ap_slug', 'ap_name_en', 'ap_description_es', 'ap_description_en',
        'ap_daily_price', 'ap_savings', 'ap_items',
    );
    foreach ( $ap_fields as $f ) {
        $expose_meta( 'alquiler_pack', $f );
    }

    // --- cliente: ALL fields ---
    $cl_fields = array( 'cl_order', 'cl_logo' );
    foreach ( $cl_fields as $f ) {
        $expose_meta( 'cliente', $f );
    }
}

// ============================================================
// ADMIN META BOXES (interfaz de edición en wp-admin)
//
// Meta boxes nativos para que el cliente pueda editar contenido
// sin depender de JetEngine meta boxes.
// ============================================================

add_action( 'add_meta_boxes', 'obliq_add_meta_boxes' );

function obliq_add_meta_boxes() {
    add_meta_box( 'obliq_servicio_meta', 'Campos del servicio', 'obliq_servicio_meta_html', 'servicio', 'normal', 'high' );
    add_meta_box( 'obliq_portfolio_meta', 'Campos del proyecto', 'obliq_portfolio_meta_html', 'portfolio', 'normal', 'high' );
    add_meta_box( 'obliq_director_meta', 'Campos del miembro', 'obliq_director_meta_html', 'director', 'normal', 'high' );
    add_meta_box( 'obliq_alquiler_meta', 'Campos del producto', 'obliq_alquiler_meta_html', 'alquiler', 'normal', 'high' );
    add_meta_box( 'obliq_pack_meta', 'Campos del pack', 'obliq_pack_meta_html', 'alquiler_pack', 'normal', 'high' );
    add_meta_box( 'obliq_cliente_meta', 'Campos del cliente', 'obliq_cliente_meta_html', 'cliente', 'normal', 'high' );
}

// --- Helper: render un campo de texto ---
function obliq_field( $post_id, $key, $label, $type = 'text' ) {
    $value = get_post_meta( $post_id, $key, true );
    if ( is_array( $value ) ) $value = wp_json_encode( $value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
    $tag = ( $type === 'textarea' ) ? 'textarea' : 'input';
    echo '<p><label><strong>' . esc_html( $label ) . '</strong><br>';
    if ( $tag === 'textarea' ) {
        echo '<textarea name="' . esc_attr( $key ) . '" rows="4" style="width:100%">' . esc_textarea( $value ) . '</textarea>';
    } else {
        echo '<input type="' . esc_attr( $type ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" style="width:100%">';
    }
    echo '</label></p>';
}

function obliq_servicio_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'sv_slug_en', 'Slug EN' );
    obliq_field( $id, 'sv_long_description_es', 'Descripción larga ES', 'textarea' );
    obliq_field( $id, 'sv_long_description_en', 'Descripción larga EN', 'textarea' );
    obliq_field( $id, 'sv_marquee_text_es', 'Texto Marquee ES' );
    obliq_field( $id, 'sv_marquee_text_en', 'Texto Marquee EN' );
    obliq_field( $id, 'sv_image', 'Imagen (URL)' );
    echo '<hr><h4>Features ES (JSON array)</h4>';
    obliq_field( $id, 'sv_features_es', 'Features ES — [{title, description}, ...]', 'textarea' );
    obliq_field( $id, 'sv_features_en', 'Features EN — [{title, description}, ...]', 'textarea' );
    echo '<hr><h4>Pricing ES (JSON array, opcional)</h4>';
    obliq_field( $id, 'sv_pricing_es', 'Pricing ES — [{name, price, features[], highlighted?}, ...]', 'textarea' );
    obliq_field( $id, 'sv_pricing_en', 'Pricing EN', 'textarea' );
    echo '<hr><h4>Caso de estudio (opcional)</h4>';
    obliq_field( $id, 'sv_case_study_title_es', 'Título caso ES' );
    obliq_field( $id, 'sv_case_study_title_en', 'Título caso EN' );
    obliq_field( $id, 'sv_case_study_desc_es', 'Descripción caso ES', 'textarea' );
    obliq_field( $id, 'sv_case_study_desc_en', 'Descripción caso EN', 'textarea' );
    obliq_field( $id, 'sv_case_study_image', 'Imagen caso (URL)' );
}

function obliq_portfolio_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'pf_title_en', 'Título EN' );
    obliq_field( $id, 'pf_vimeo_url', 'Vimeo URL' );
    obliq_field( $id, 'pf_client', 'Cliente' );
    obliq_field( $id, 'pf_director', 'Director' );
    obliq_field( $id, 'pf_year', 'Año' );
    obliq_field( $id, 'pf_featured', 'Destacado (true/false)' );
    obliq_field( $id, 'pf_image', 'Imagen (URL)' );
}

function obliq_director_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'dr_role_es', 'Rol ES' );
    obliq_field( $id, 'dr_role_en', 'Rol EN' );
    obliq_field( $id, 'dr_photo', 'Foto (URL)' );
}

function obliq_alquiler_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'al_slug', 'Slug URL' );
    obliq_field( $id, 'al_description_es', 'Descripción ES', 'textarea' );
    obliq_field( $id, 'al_description_en', 'Descripción EN', 'textarea' );
    obliq_field( $id, 'al_price', 'Precio/día (€)', 'number' );
    obliq_field( $id, 'al_image', 'Imagen (URL)' );
    obliq_field( $id, 'al_specs_es', 'Specs ES — JSON [{spec: "..."}, ...]', 'textarea' );
    obliq_field( $id, 'al_specs_en', 'Specs EN — JSON [{spec: "..."}, ...]', 'textarea' );
    obliq_field( $id, 'al_order', 'Orden', 'number' );
}

function obliq_pack_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'ap_slug', 'Slug URL' );
    obliq_field( $id, 'ap_name_en', 'Nombre EN' );
    obliq_field( $id, 'ap_description_es', 'Descripción ES', 'textarea' );
    obliq_field( $id, 'ap_description_en', 'Descripción EN', 'textarea' );
    obliq_field( $id, 'ap_daily_price', 'Precio/día (€)', 'number' );
    obliq_field( $id, 'ap_savings', 'Ahorro (%)', 'number' );
    obliq_field( $id, 'ap_items', 'Productos — JSON [{product_slug: "..."}, ...]', 'textarea' );
}

function obliq_cliente_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'cl_logo', 'Logo (URL)' );
    obliq_field( $id, 'cl_order', 'Orden', 'number' );
}

// --- Guardar todos los meta fields al hacer Save ---
add_action( 'save_post', 'obliq_save_meta_fields', 10, 2 );

function obliq_save_meta_fields( $post_id, $post ) {
    if ( ! isset( $_POST['obliq_meta_nonce'] ) || ! wp_verify_nonce( $_POST['obliq_meta_nonce'], 'obliq_save_meta' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    // Lista de todos los meta keys por CPT
    $fields_map = array(
        'servicio' => array(
            'sv_slug_en', 'sv_long_description_es', 'sv_long_description_en',
            'sv_marquee_text_es', 'sv_marquee_text_en', 'sv_image',
            'sv_features_es', 'sv_features_en', 'sv_pricing_es', 'sv_pricing_en',
            'sv_case_study_title_es', 'sv_case_study_title_en',
            'sv_case_study_desc_es', 'sv_case_study_desc_en', 'sv_case_study_image',
        ),
        'portfolio' => array(
            'pf_title_en', 'pf_vimeo_url', 'pf_client', 'pf_director',
            'pf_year', 'pf_featured', 'pf_image',
        ),
        'director' => array( 'dr_role_es', 'dr_role_en', 'dr_photo' ),
        'alquiler' => array(
            'al_slug', 'al_description_es', 'al_description_en',
            'al_price', 'al_image', 'al_specs_es', 'al_specs_en', 'al_order',
        ),
        'alquiler_pack' => array(
            'ap_slug', 'ap_name_en', 'ap_description_es', 'ap_description_en',
            'ap_daily_price', 'ap_savings', 'ap_items',
        ),
        'cliente' => array( 'cl_logo', 'cl_order' ),
    );

    $pt = $post->post_type;
    if ( ! isset( $fields_map[ $pt ] ) ) return;

    foreach ( $fields_map[ $pt ] as $key ) {
        if ( ! isset( $_POST[ $key ] ) ) continue;
        $value = wp_unslash( $_POST[ $key ] );

        // Intentar decodificar JSON para repeaters/arrays
        $decoded = json_decode( $value, true );
        if ( is_array( $decoded ) ) {
            update_post_meta( $post_id, $key, $decoded );
        } else {
            update_post_meta( $post_id, $key, sanitize_text_field( $value ) );
        }
    }
}
