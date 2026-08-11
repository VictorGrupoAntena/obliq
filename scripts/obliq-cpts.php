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

// --- Helper: campo de imagen con selector de la Biblioteca de medios (wp.media) ---
// Guarda la URL en el MISMO meta key (compat total con wp-client.ts, el frontend
// y las URLs ya guardadas: si el valor es una URL externa/pegada, se muestra
// igual en la vista previa y en el input, y se puede seguir pegando a mano).
function obliq_media_field( $post_id, $key, $label ) {
    $value = get_post_meta( $post_id, $key, true );
    if ( is_array( $value ) ) $value = '';
    $img_style = 'max-width:180px;height:auto;display:block;margin:6px 0;border:1px solid #ddd;padding:3px;background:#fff';
    echo '<p class="obliq-media-field">';
    echo '<label><strong>' . esc_html( $label ) . '</strong></label><br>';
    echo '<span class="obliq-media-preview">';
    if ( $value ) {
        echo '<img src="' . esc_url( $value ) . '" alt="" style="' . esc_attr( $img_style ) . '">';
    }
    echo '</span>';
    echo '<input type="text" class="obliq-media-url" name="' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" style="width:100%" placeholder="Selecciona una imagen o pega una URL">';
    echo '<button type="button" class="button obliq-media-select" style="margin-top:6px">Seleccionar imagen</button> ';
    echo '<button type="button" class="button obliq-media-remove" style="margin-top:6px;' . ( $value ? '' : 'display:none' ) . '">Quitar</button>';
    echo '</p>';
}

// --- Encolar el media uploader (wp.media) SOLO en las pantallas de edición
//     (post.php / post-new.php) de los CPTs con campos de imagen ---
add_action( 'admin_enqueue_scripts', 'obliq_enqueue_media_uploader' );

function obliq_enqueue_media_uploader( $hook ) {
    if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) return;
    $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
    $cpts   = array( 'servicio', 'portfolio', 'director', 'alquiler', 'alquiler_pack', 'cliente', 'contenido' );
    if ( ! $screen || ! in_array( $screen->post_type, $cpts, true ) ) return;

    wp_enqueue_media();

    $js = <<<'JS'
jQuery(function($){
    $('.obliq-media-field').each(function(){
        var $w = $(this),
            $url = $w.find('.obliq-media-url'),
            $prev = $w.find('.obliq-media-preview'),
            $rm = $w.find('.obliq-media-remove'),
            style = 'max-width:180px;height:auto;display:block;margin:6px 0;border:1px solid #ddd;padding:3px;background:#fff',
            frame;
        function setImg(url){
            $prev.html(url ? $('<img>', { src:url, alt:'', style:style }) : '');
            $rm.toggle(!!url);
        }
        $w.find('.obliq-media-select').on('click', function(e){
            e.preventDefault();
            if (frame){ frame.open(); return; }
            frame = wp.media({ title:'Seleccionar imagen', button:{ text:'Usar esta imagen' }, library:{ type:'image' }, multiple:false });
            frame.on('select', function(){
                var att = frame.state().get('selection').first().toJSON();
                $url.val(att.url);
                setImg(att.url);
            });
            frame.open();
        });
        $rm.on('click', function(e){
            e.preventDefault();
            $url.val('');
            setImg('');
        });
    });
});
JS;
    wp_add_inline_script( 'media-editor', $js );
}

function obliq_servicio_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'sv_slug_en', 'Slug EN' );
    obliq_field( $id, 'sv_long_description_es', 'Descripción larga ES', 'textarea' );
    obliq_field( $id, 'sv_long_description_en', 'Descripción larga EN', 'textarea' );
    obliq_field( $id, 'sv_marquee_text_es', 'Texto Marquee ES' );
    obliq_field( $id, 'sv_marquee_text_en', 'Texto Marquee EN' );
    obliq_media_field( $id, 'sv_image', 'Imagen' );
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
    obliq_media_field( $id, 'sv_case_study_image', 'Imagen caso' );
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
    obliq_media_field( $id, 'pf_image', 'Imagen' );
}

function obliq_director_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'dr_role_es', 'Rol ES' );
    obliq_field( $id, 'dr_role_en', 'Rol EN' );
    obliq_media_field( $id, 'dr_photo', 'Foto' );
}

function obliq_alquiler_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id = $post->ID;
    obliq_field( $id, 'al_slug', 'Slug URL' );
    obliq_field( $id, 'al_description_es', 'Descripción ES', 'textarea' );
    obliq_field( $id, 'al_description_en', 'Descripción EN', 'textarea' );
    obliq_field( $id, 'al_price', 'Precio/día (€)', 'number' );
    obliq_media_field( $id, 'al_image', 'Imagen' );
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
    obliq_media_field( $id, 'cl_logo', 'Logo' );
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

// ============================================================
// ============================================================
// CPT `contenido` — textos de páginas fijas
//
// Tres entradas SINGLETON creadas por auto-seed, discriminadas por
// el meta `_obliq_key` (NO por slug ni título → el cliente puede
// renombrarlas sin romper el frontend):
//
//   _obliq_key = 'about'    → página /nosotros/ y /en/about/
//   _obliq_key = 'contact'  → datos de contacto GLOBALES del sitio
//                             (página de contacto + footer + WhatsApp
//                              + JSON-LD LocalBusiness)
//   _obliq_key = 'home'     → fondo del hero de la portada (vídeo + imagen)
//   _obliq_key = 'alquiler' → tarifa GLOBAL de operador de alquiler
//                             (precio jornada/media, qué incluye, condiciones).
//                             El alquiler es SIEMPRE con operador. La consume
//                             el catálogo /alquiler/, la página de presupuesto
//                             y el JSON-LD Service de la vertical.
//
// El cliente NO puede crear ni borrar entradas de este CPT.
// El equipo (CPT `director`) y los clientes (CPT `cliente`) NO se
// tocan aquí: siguen gestionándose en sus propios CPTs.
// ============================================================
// ============================================================

// Versión del seed. Subir este número solo si se AÑADEN campos nuevos
// que deban precargarse; el seed nunca sobrescribe lo ya escrito.
//
//   v2 — entrada «Inicio» (_obliq_key = 'home'). Sin subir la versión, el
//        guard `obliq_contenido_seeded` impediría crearla en el WP ya
//        instalado y el campo de vídeo no aparecería nunca en wp-admin.
//   v3 — entrada «Alquiler · Tarifa de operador» (_obliq_key = 'alquiler').
//        Mismo motivo: sin subir la versión, el singleton de la tarifa de
//        operador no se crearía en el WP ya instalado.
//   v4 — 36 campos de texto en la entrada «Inicio» (titular H1, subtítulos,
//        botones y cabeceras de bloque). La entrada YA existe en el WP
//        instalado, así que sin subir la versión el guard `obliq_contenido_seeded`
//        cortaría antes de sembrarlos y el cliente encontraría 36 campos en
//        blanco. El seed solo rellena lo vacío: lo ya escrito no se toca.
if ( ! defined( 'OBLIQ_CONTENIDO_SEED_VERSION' ) ) {
    define( 'OBLIQ_CONTENIDO_SEED_VERSION', '4' );
}

/**
 * Definición única de los campos del CPT.
 * meta_key => array( etiqueta en wp-admin, tipo: text|textarea|media )
 *
 * Es la ÚNICA fuente de verdad: de aquí salen el registro de meta,
 * los rest_fields, el render del metabox y el guardado.
 */
function obliq_contenido_field_defs() {
    return array(

        // ---------- Entrada "Nosotros" (31 campos) ----------
        'ab_hero_tag_es'        => array( 'Hero — etiqueta (ES)', 'text' ),
        'ab_hero_tag_en'        => array( 'Hero — etiqueta (EN)', 'text' ),
        'ab_hero_title_es'      => array( 'Hero — título (ES)', 'text' ),
        'ab_hero_title_en'      => array( 'Hero — título (EN)', 'text' ),
        'ab_hero_subtitle_es'   => array( 'Hero — subtítulo (ES)', 'textarea' ),
        'ab_hero_subtitle_en'   => array( 'Hero — subtítulo (EN)', 'textarea' ),

        'ab_story_title_es'     => array( 'Historia — título (ES)', 'text' ),
        'ab_story_title_en'     => array( 'Historia — título (EN)', 'text' ),
        'ab_story_text_es'      => array( 'Historia — texto (ES)', 'textarea' ),
        'ab_story_text_en'      => array( 'Historia — texto (EN)', 'textarea' ),
        'ab_story_image'        => array( 'Historia — imagen', 'media' ),

        'ab_values_tag_es'      => array( 'Valores — etiqueta (ES)', 'text' ),
        'ab_values_tag_en'      => array( 'Valores — etiqueta (EN)', 'text' ),
        'ab_values_title_es'    => array( 'Valores — título (ES)', 'text' ),
        'ab_values_title_en'    => array( 'Valores — título (EN)', 'text' ),
        'ab_value_1_title_es'   => array( 'Valor 1 — título (ES)', 'text' ),
        'ab_value_1_title_en'   => array( 'Valor 1 — título (EN)', 'text' ),
        'ab_value_1_text_es'    => array( 'Valor 1 — texto (ES)', 'textarea' ),
        'ab_value_1_text_en'    => array( 'Valor 1 — texto (EN)', 'textarea' ),
        'ab_value_2_title_es'   => array( 'Valor 2 — título (ES)', 'text' ),
        'ab_value_2_title_en'   => array( 'Valor 2 — título (EN)', 'text' ),
        'ab_value_2_text_es'    => array( 'Valor 2 — texto (ES)', 'textarea' ),
        'ab_value_2_text_en'    => array( 'Valor 2 — texto (EN)', 'textarea' ),
        'ab_value_3_title_es'   => array( 'Valor 3 — título (ES)', 'text' ),
        'ab_value_3_title_en'   => array( 'Valor 3 — título (EN)', 'text' ),
        'ab_value_3_text_es'    => array( 'Valor 3 — texto (ES)', 'textarea' ),
        'ab_value_3_text_en'    => array( 'Valor 3 — texto (EN)', 'textarea' ),

        'ab_team_tag_es'        => array( 'Equipo — etiqueta (ES)', 'text' ),
        'ab_team_tag_en'        => array( 'Equipo — etiqueta (EN)', 'text' ),
        'ab_team_title_es'      => array( 'Equipo — título (ES)', 'text' ),
        'ab_team_title_en'      => array( 'Equipo — título (EN)', 'text' ),

        // ---------- Entrada "Datos de contacto" (16 campos) ----------
        'ct_hero_tag_es'        => array( 'Hero — etiqueta (ES)', 'text' ),
        'ct_hero_tag_en'        => array( 'Hero — etiqueta (EN)', 'text' ),
        'ct_hero_title_es'      => array( 'Hero — título (ES)', 'text' ),
        'ct_hero_title_en'      => array( 'Hero — título (EN)', 'text' ),
        'ct_hero_subtitle_es'   => array( 'Hero — subtítulo / intro (ES)', 'textarea' ),
        'ct_hero_subtitle_en'   => array( 'Hero — subtítulo / intro (EN)', 'textarea' ),
        'ct_info_title_es'      => array( 'Título del bloque de información (ES)', 'text' ),
        'ct_info_title_en'      => array( 'Título del bloque de información (EN)', 'text' ),
        'ct_hours_es'           => array( 'Horario (ES)', 'text' ),
        'ct_hours_en'           => array( 'Horario (EN)', 'text' ),

        'ct_email'              => array( 'Email', 'text' ),
        'ct_phone'              => array( 'Teléfono (tal y como debe verse)', 'text' ),
        'ct_whatsapp'           => array( 'WhatsApp (solo dígitos, con prefijo país y sin +)', 'text' ),
        'ct_address_street'     => array( 'Dirección — calle y número', 'text' ),
        'ct_address_postal'     => array( 'Dirección — código postal', 'text' ),
        'ct_address_city'       => array( 'Dirección — ciudad', 'text' ),

        // ---------- Entrada "Inicio" (2 de fondo + 36 de texto) ----------
        // Los de fondo NO llevan sufijo de idioma: son el mismo vídeo y la
        // misma imagen en las dos versiones del sitio, igual que ab_story_image.
        'hm_hero_vimeo_url'     => array( 'Hero — vídeo de Vimeo (URL). Si se deja vacío se muestra solo la imagen.', 'text' ),
        'hm_hero_fallback_image' => array( 'Hero — imagen (se ve mientras carga el vídeo, con reduced-motion o ahorro de datos, y si no hay vídeo)', 'media' ),

        'hm_hero_tag_es'        => array( 'Cabecera — etiqueta pequeña (ES)', 'text' ),
        'hm_hero_tag_en'        => array( 'Cabecera — etiqueta pequeña (EN)', 'text' ),
        'hm_hero_title_es'      => array( 'Cabecera — TITULAR PRINCIPAL / H1 (ES)', 'text' ),
        'hm_hero_title_en'      => array( 'Cabecera — TITULAR PRINCIPAL / H1 (EN)', 'text' ),
        'hm_hero_subtitle_es'   => array( 'Cabecera — subtítulo (ES)', 'textarea' ),
        'hm_hero_subtitle_en'   => array( 'Cabecera — subtítulo (EN)', 'textarea' ),
        'hm_hero_cta_primary_es'   => array( 'Cabecera — botón principal (ES)', 'text' ),
        'hm_hero_cta_primary_en'   => array( 'Cabecera — botón principal (EN)', 'text' ),
        'hm_hero_cta_secondary_es' => array( 'Cabecera — botón secundario (ES)', 'text' ),
        'hm_hero_cta_secondary_en' => array( 'Cabecera — botón secundario (EN)', 'text' ),

        'hm_services_tag_es'    => array( 'Servicios — etiqueta (ES)', 'text' ),
        'hm_services_tag_en'    => array( 'Servicios — etiqueta (EN)', 'text' ),
        'hm_services_title_es'  => array( 'Servicios — título (ES)', 'text' ),
        'hm_services_title_en'  => array( 'Servicios — título (EN)', 'text' ),
        'hm_service_card_cta_es' => array( 'Servicios — texto que aparece al pasar el ratón por una tarjeta (ES)', 'text' ),
        'hm_service_card_cta_en' => array( 'Servicios — texto que aparece al pasar el ratón por una tarjeta (EN)', 'text' ),

        'hm_marquee_work_es'    => array( 'Cinta deslizante — texto que se repite (ES)', 'text' ),
        'hm_marquee_work_en'    => array( 'Cinta deslizante — texto que se repite (EN)', 'text' ),

        'hm_portfolio_tag_es'   => array( 'Portfolio — etiqueta (ES)', 'text' ),
        'hm_portfolio_tag_en'   => array( 'Portfolio — etiqueta (EN)', 'text' ),
        'hm_portfolio_title_es' => array( 'Portfolio — título (ES)', 'text' ),
        'hm_portfolio_title_en' => array( 'Portfolio — título (EN)', 'text' ),
        'hm_portfolio_cta_es'   => array( 'Portfolio — botón (ES)', 'text' ),
        'hm_portfolio_cta_en'   => array( 'Portfolio — botón (EN)', 'text' ),

        'hm_about_tag_es'       => array( 'Nosotros — etiqueta (ES)', 'text' ),
        'hm_about_tag_en'       => array( 'Nosotros — etiqueta (EN)', 'text' ),
        'hm_about_title_es'     => array( 'Nosotros — título (ES)', 'text' ),
        'hm_about_title_en'     => array( 'Nosotros — título (EN)', 'text' ),
        'hm_about_text_es'      => array( 'Nosotros — párrafo (ES)', 'textarea' ),
        'hm_about_text_en'      => array( 'Nosotros — párrafo (EN)', 'textarea' ),
        'hm_about_cta_es'       => array( 'Nosotros — botón (ES)', 'text' ),
        'hm_about_cta_en'       => array( 'Nosotros — botón (EN)', 'text' ),

        'hm_cta_title_es'       => array( 'Llamada final — título (ES)', 'text' ),
        'hm_cta_title_en'       => array( 'Llamada final — título (EN)', 'text' ),
        'hm_cta_button_es'      => array( 'Llamada final — botón (ES)', 'text' ),
        'hm_cta_button_en'      => array( 'Llamada final — botón (EN)', 'text' ),

        // ---------- Entrada "Alquiler · Tarifa de operador" (6 campos) ----------
        // El alquiler es SIEMPRE con operador. Precios SIN IVA (mismo criterio
        // que el resto del catálogo). Modelo aditivo: TOTAL = material + operador.
        'op_jornada_price'      => array( 'Operador — tarifa por JORNADA COMPLETA (€, sin IVA). Solo el número, p. ej. 300', 'number' ),
        'op_media_price'        => array( 'Operador — tarifa por MEDIA JORNADA (€, sin IVA). Solo el número, p. ej. 200', 'number' ),
        'op_includes_es'        => array( 'Qué incluye la tarifa de operador — una línea por ítem (ES)', 'textarea' ),
        'op_includes_en'        => array( 'Qué incluye la tarifa de operador — una línea por ítem (EN)', 'textarea' ),
        'op_terms_es'           => array( 'Condiciones (brutos, límite de media jornada, desplazamiento) (ES)', 'textarea' ),
        'op_terms_en'           => array( 'Condiciones (brutos, límite de media jornada, desplazamiento) (EN)', 'textarea' ),
    );
}

/** Lista de meta_keys de una entrada: 'about' | 'contact' | 'home' | 'alquiler' | 'all' */
function obliq_contenido_keys( $which = 'all' ) {
    $prefixes = array( 'about' => 'ab_', 'contact' => 'ct_', 'home' => 'hm_', 'alquiler' => 'op_' );
    $prefix   = isset( $prefixes[ $which ] ) ? $prefixes[ $which ] : '';
    $keys   = array();
    foreach ( obliq_contenido_field_defs() as $key => $def ) {
        if ( $prefix === '' || strpos( $key, $prefix ) === 0 ) $keys[] = $key;
    }
    return $keys;
}

/** Localiza el ID de una entrada singleton por su `_obliq_key`. 0 si no existe. */
function obliq_contenido_id( $obliq_key ) {
    $found = get_posts( array(
        'post_type'        => 'contenido',
        'post_status'      => 'any',
        'numberposts'      => 1,
        'fields'           => 'ids',
        'meta_key'         => '_obliq_key',
        'meta_value'       => $obliq_key,
        'suppress_filters' => false,
    ) );
    return $found ? (int) $found[0] : 0;
}

// ------------------------------------------------------------
// Registro del CPT
// ------------------------------------------------------------

add_action( 'init', 'obliq_register_contenido_cpt', 10 );

function obliq_register_contenido_cpt() {
    register_post_type( 'contenido', array(
        'labels' => array(
            'name'          => 'Contenido de páginas',
            'singular_name' => 'Contenido',
            'menu_name'     => 'Contenido de páginas',
            'edit_item'     => 'Editar contenido',
            'all_items'     => 'Contenido de páginas',
        ),
        // `public => false` + `publicly_queryable => true`:
        // no aparece en búsquedas ni menús de WP y no tiene URL propia,
        // pero SÍ es legible de forma anónima por la REST API — necesario
        // para que el build SSG (GitHub Actions) lo lea sin credenciales.
        'public'              => false,
        'publicly_queryable'  => true,
        'exclude_from_search' => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'show_in_nav_menus'   => false,
        'has_archive'         => false,
        'rewrite'             => false,
        'show_in_rest'        => true,
        'rest_base'           => 'contenido',
        'supports'            => array( 'title' ), // sin editor Gutenberg: solo el metabox de campos
        'capability_type'     => 'post',
        'map_meta_cap'        => true,
        'capabilities'        => array( 'create_posts' => 'do_not_allow' ),
        'menu_icon'           => 'dashicons-admin-page',
        'menu_position'       => 11,
    ) );
}

// El cliente tampoco puede BORRAR las dos entradas singleton.
add_filter( 'map_meta_cap', 'obliq_contenido_block_delete', 10, 4 );

function obliq_contenido_block_delete( $caps, $cap, $user_id, $args ) {
    if ( 'delete_post' !== $cap || empty( $args[0] ) ) return $caps;
    if ( 'contenido' === get_post_type( $args[0] ) ) return array( 'do_not_allow' );
    return $caps;
}

// ------------------------------------------------------------
// Meta fields + REST
// ------------------------------------------------------------

add_action( 'init', 'obliq_register_contenido_meta', 15 );

function obliq_register_contenido_meta() {
    foreach ( obliq_contenido_keys( 'all' ) as $key ) {
        register_post_meta( 'contenido', $key, array(
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            'auth_callback' => '__return_true',
        ) );
    }
}

add_action( 'rest_api_init', 'obliq_register_contenido_rest_fields' );

function obliq_register_contenido_rest_fields() {
    // Discriminador de entrada — expuesto en el top level del JSON.
    register_rest_field( 'contenido', '_obliq_key', array(
        'get_callback' => function ( $post ) {
            return get_post_meta( $post['id'], '_obliq_key', true );
        },
        'schema' => null,
    ) );

    foreach ( obliq_contenido_keys( 'all' ) as $key ) {
        register_rest_field( 'contenido', $key, array(
            'get_callback' => function ( $post ) use ( $key ) {
                return get_post_meta( $post['id'], $key, true );
            },
            'update_callback' => function ( $value, $post ) use ( $key ) {
                update_post_meta( $post->ID, $key, $value );
            },
            'schema' => null,
        ) );
    }
}

// ------------------------------------------------------------
// Metabox de edición
// ------------------------------------------------------------

add_action( 'add_meta_boxes', 'obliq_contenido_add_meta_box' );

function obliq_contenido_add_meta_box() {
    add_meta_box( 'obliq_contenido_meta', 'Contenido de la página', 'obliq_contenido_meta_html', 'contenido', 'normal', 'high' );
}

/** Render de un grupo de campos según su definición */
function obliq_contenido_render_fields( $post_id, $keys ) {
    $defs = obliq_contenido_field_defs();
    foreach ( $keys as $key ) {
        if ( ! isset( $defs[ $key ] ) ) continue;
        $label = $defs[ $key ][0];
        $type  = $defs[ $key ][1];
        if ( 'media' === $type ) {
            obliq_media_field( $post_id, $key, $label );
        } else {
            obliq_field( $post_id, $key, $label, $type );
        }
    }
}

function obliq_contenido_meta_html( $post ) {
    wp_nonce_field( 'obliq_save_meta', 'obliq_meta_nonce' );
    $id  = $post->ID;
    $key = get_post_meta( $id, '_obliq_key', true );

    if ( 'about' === $key ) {
        echo '<p><em>Textos de la página «Nosotros» (/nosotros/ y /en/about/).<br>';
        echo 'Los miembros del equipo se editan en <strong>Equipo</strong> y los logos de marcas en <strong>Clientes</strong>.</em></p>';
        echo '<hr><h4>Cabecera</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_hero_tag_es', 'ab_hero_tag_en', 'ab_hero_title_es', 'ab_hero_title_en', 'ab_hero_subtitle_es', 'ab_hero_subtitle_en' ) );
        echo '<hr><h4>Nuestra historia</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_story_title_es', 'ab_story_title_en', 'ab_story_text_es', 'ab_story_text_en', 'ab_story_image' ) );
        echo '<hr><h4>Valores (siempre 3 — el diseño es una rejilla de tres columnas)</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_values_tag_es', 'ab_values_tag_en', 'ab_values_title_es', 'ab_values_title_en' ) );
        echo '<h4>Valor 1</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_value_1_title_es', 'ab_value_1_title_en', 'ab_value_1_text_es', 'ab_value_1_text_en' ) );
        echo '<h4>Valor 2</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_value_2_title_es', 'ab_value_2_title_en', 'ab_value_2_text_es', 'ab_value_2_text_en' ) );
        echo '<h4>Valor 3</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_value_3_title_es', 'ab_value_3_title_en', 'ab_value_3_text_es', 'ab_value_3_text_en' ) );
        echo '<hr><h4>Cabecera del bloque de equipo</h4>';
        obliq_contenido_render_fields( $id, array( 'ab_team_tag_es', 'ab_team_tag_en', 'ab_team_title_es', 'ab_team_title_en' ) );
        return;
    }

    if ( 'contact' === $key ) {
        echo '<p><em>Datos de contacto <strong>globales</strong>: se usan en la página de contacto, en el pie de página, en el botón de WhatsApp y en los datos que lee Google (JSON-LD).<br>';
        echo 'El formulario de contacto no se edita desde aquí.</em></p>';
        echo '<hr><h4>Datos de contacto</h4>';
        obliq_contenido_render_fields( $id, array( 'ct_email', 'ct_phone', 'ct_whatsapp' ) );
        echo '<hr><h4>Dirección</h4>';
        obliq_contenido_render_fields( $id, array( 'ct_address_street', 'ct_address_postal', 'ct_address_city' ) );
        echo '<hr><h4>Horario</h4>';
        obliq_contenido_render_fields( $id, array( 'ct_hours_es', 'ct_hours_en' ) );
        echo '<hr><h4>Textos de la página de contacto</h4>';
        obliq_contenido_render_fields( $id, array( 'ct_hero_tag_es', 'ct_hero_tag_en', 'ct_hero_title_es', 'ct_hero_title_en', 'ct_hero_subtitle_es', 'ct_hero_subtitle_en', 'ct_info_title_es', 'ct_info_title_en' ) );
        return;
    }

    if ( 'home' === $key ) {
        echo '<p><em>Textos y fondo de la <strong>portada</strong> (/ y /en/), en el mismo orden en que se ven en la página.<br>';
        echo '<strong>Cada idioma se escribe por separado</strong>: no hay traducción automática. Si dejas un campo vacío, ';
        echo 'se usa el texto que trae la web por defecto.<br>';
        echo 'Los servicios, los proyectos del portfolio y los logos de marcas se editan en sus propias secciones.</em></p>';

        echo '<hr><h4>1 · Cabecera — fondo</h4>';
        obliq_contenido_render_fields( $id, array( 'hm_hero_vimeo_url', 'hm_hero_fallback_image' ) );
        echo '<p style="background:#fff8e5;border-left:4px solid #dba617;padding:10px 12px;max-width:760px">';
        echo '<strong>Sobre el vídeo:</strong><br>';
        echo '• Pega la dirección del vídeo tal cual la da Vimeo (por ejemplo <code>https://vimeo.com/123456789</code>). ';
        echo 'Si el vídeo es <em>no listado</em>, copia la dirección completa con el código que lleva detrás.<br>';
        echo '• En Vimeo, dentro de los ajustes del vídeo, en <em>Privacidad → Dónde se puede incrustar</em>, ';
        echo 'el dominio de la web tiene que estar autorizado.<br>';
        echo '• El vídeo se reproduce <strong>sin sonido y en bucle, también en móvil</strong>. Se muestra solo la imagen ';
        echo 'si el visitante tiene activado el ahorro de datos o ha pedido reducir las animaciones.<br>';
        echo '• La imagen se ve además mientras el vídeo carga, así que conviene que sea <strong>oscura</strong>: ';
        echo 'el texto del titular va encima en blanco.<br>';
        echo '• <strong>Para volver a la cabecera con imagen, vacía el campo del vídeo.</strong>';
        echo '</p>';

        echo '<hr><h4>2 · Cabecera — textos</h4>';
        obliq_contenido_render_fields( $id, array(
            'hm_hero_tag_es', 'hm_hero_tag_en',
            'hm_hero_title_es', 'hm_hero_title_en',
            'hm_hero_subtitle_es', 'hm_hero_subtitle_en',
            'hm_hero_cta_primary_es', 'hm_hero_cta_primary_en',
            'hm_hero_cta_secondary_es', 'hm_hero_cta_secondary_en',
        ) );

        echo '<hr><h4>3 · Bloque de servicios</h4>';
        echo '<p><em>El nombre y la descripción de cada servicio se editan en <strong>Servicios</strong>, no aquí. ';
        echo 'Aquí solo va la cabecera del bloque.</em></p>';
        obliq_contenido_render_fields( $id, array(
            'hm_services_tag_es', 'hm_services_tag_en',
            'hm_services_title_es', 'hm_services_title_en',
            'hm_service_card_cta_es', 'hm_service_card_cta_en',
        ) );

        echo '<hr><h4>4 · Cinta deslizante</h4>';
        echo '<p><em>Se repite cuatro veces en bucle. Escribe el texto una sola vez.</em></p>';
        obliq_contenido_render_fields( $id, array( 'hm_marquee_work_es', 'hm_marquee_work_en' ) );

        echo '<hr><h4>5 · Bloque de portfolio</h4>';
        echo '<p><em>Qué proyectos salen aquí se decide marcándolos como destacados en <strong>Portfolio</strong>.</em></p>';
        obliq_contenido_render_fields( $id, array(
            'hm_portfolio_tag_es', 'hm_portfolio_tag_en',
            'hm_portfolio_title_es', 'hm_portfolio_title_en',
            'hm_portfolio_cta_es', 'hm_portfolio_cta_en',
        ) );

        echo '<hr><h4>6 · Bloque «Nosotros»</h4>';
        obliq_contenido_render_fields( $id, array(
            'hm_about_tag_es', 'hm_about_tag_en',
            'hm_about_title_es', 'hm_about_title_en',
            'hm_about_text_es', 'hm_about_text_en',
            'hm_about_cta_es', 'hm_about_cta_en',
        ) );

        echo '<hr><h4>7 · Llamada final</h4>';
        obliq_contenido_render_fields( $id, array(
            'hm_cta_title_es', 'hm_cta_title_en',
            'hm_cta_button_es', 'hm_cta_button_en',
        ) );
        return;
    }

    if ( 'alquiler' === $key ) {
        echo '<p><em>Tarifa <strong>global</strong> del operador de alquiler. El alquiler de equipos es <strong>siempre con operador</strong>: este precio se <strong>suma</strong> al precio del material.<br>';
        echo 'Se usa en el catálogo de alquiler, en la página de presupuesto y en los datos que lee Google.</em></p>';
        echo '<hr><h4>Precios del operador (sin IVA)</h4>';
        obliq_contenido_render_fields( $id, array( 'op_jornada_price', 'op_media_price' ) );
        echo '<hr><h4>Qué incluye</h4>';
        echo '<p><em>Una línea por ítem. La entrega de brutos debe figurar aquí.</em></p>';
        obliq_contenido_render_fields( $id, array( 'op_includes_es', 'op_includes_en' ) );
        echo '<hr><h4>Condiciones</h4>';
        echo '<p style="background:#fff8e5;border-left:4px solid #dba617;padding:10px 12px;max-width:760px">';
        echo '<strong>Pendiente de confirmar:</strong> el formato y plazo de entrega de los brutos, el límite horario de la media jornada y el desplazamiento incluido nacen marcados como <code>[PENDIENTE DE CONFIRMAR CON CLIENTE]</code>. Sustituye ese texto por los datos reales cuando estén definidos.';
        echo '</p>';
        obliq_contenido_render_fields( $id, array( 'op_terms_es', 'op_terms_en' ) );
        return;
    }

    echo '<p><strong>Entrada no reconocida.</strong> Falta el identificador interno <code>_obliq_key</code>.</p>';
}

// ------------------------------------------------------------
// Guardado (handler propio — no interfiere con obliq_save_meta_fields,
// que ignora este CPT porque no está en su $fields_map)
// ------------------------------------------------------------

add_action( 'save_post_contenido', 'obliq_contenido_save', 10, 2 );

function obliq_contenido_save( $post_id, $post ) {
    if ( ! isset( $_POST['obliq_meta_nonce'] ) || ! wp_verify_nonce( $_POST['obliq_meta_nonce'], 'obliq_save_meta' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    foreach ( obliq_contenido_field_defs() as $key => $def ) {
        if ( ! isset( $_POST[ $key ] ) ) continue;
        $value = wp_unslash( $_POST[ $key ] );
        // Los textarea conservan los saltos de línea; sanitize_text_field los colapsaría.
        $value = ( 'textarea' === $def[1] )
            ? sanitize_textarea_field( $value )
            : sanitize_text_field( $value );
        update_post_meta( $post_id, $key, $value );
    }
}

// ------------------------------------------------------------
// Auto-seed idempotente
//
// Crea las dos entradas con los textos que hoy están en el repo
// (src/i18n/*.json), de modo que tras instalar el plugin la web
// se reconstruye EXACTAMENTE igual que antes.
//
// - Guard por get_option() → se ejecuta una sola vez.
// - Solo INSERTA lo que falta; nunca sobrescribe lo ya escrito.
// ------------------------------------------------------------

add_action( 'init', 'obliq_contenido_seed', 20 );

function obliq_contenido_seed() {
    if ( get_option( 'obliq_contenido_seeded' ) === OBLIQ_CONTENIDO_SEED_VERSION ) return;

    $entries = array(
        'about'    => array( 'Nosotros', obliq_contenido_seed_about() ),
        'contact'  => array( 'Datos de contacto', obliq_contenido_seed_contact() ),
        'home'     => array( 'Inicio', obliq_contenido_seed_home() ),
        // Título inequívoco para que el cliente la localice en el listado sin ayuda.
        'alquiler' => array( 'Alquiler · Tarifa de operador', obliq_contenido_seed_alquiler() ),
    );

    foreach ( $entries as $obliq_key => $entry ) {
        $post_id = obliq_contenido_id( $obliq_key );

        if ( ! $post_id ) {
            $post_id = wp_insert_post( array(
                'post_type'   => 'contenido',
                'post_title'  => $entry[0],
                'post_status' => 'publish',
            ) );
            if ( is_wp_error( $post_id ) || ! $post_id ) continue;
            update_post_meta( $post_id, '_obliq_key', $obliq_key );
        }

        // Rellena SOLO los campos que aún no tienen valor.
        foreach ( $entry[1] as $key => $default ) {
            $current = get_post_meta( $post_id, $key, true );
            if ( '' === $current || null === $current || false === $current ) {
                update_post_meta( $post_id, $key, $default );
            }
        }
    }

    update_option( 'obliq_contenido_seeded', OBLIQ_CONTENIDO_SEED_VERSION );
}

/** Valores iniciales de "Nosotros" — espejo de ABOUT_PAGE en src/i18n/*.json */
function obliq_contenido_seed_about() {
    return array(
        'ab_hero_tag_es'      => 'NOSOTROS',
        'ab_hero_tag_en'      => 'ABOUT US',
        'ab_hero_title_es'    => 'CREAMOS HISTORIAS QUE IMPORTAN',
        'ab_hero_title_en'    => 'WE CREATE STORIES THAT MATTER',
        'ab_hero_subtitle_es' => 'Somos una productora audiovisual en Valencia con pasión por contar historias.',
        'ab_hero_subtitle_en' => 'We are an audiovisual production company in Valencia with a passion for storytelling.',

        'ab_story_title_es'   => 'Nuestra historia',
        'ab_story_title_en'   => 'Our story',
        'ab_story_text_es'    => 'Obliq Productions nace de la pasión por el audiovisual y la voluntad de crear contenido que conecte con las personas. Formados por un equipo polivalente y experimentado, entendemos la naturaleza de cada proyecto y nos adaptamos con eficacia a sus necesidades. Desde nuestra base en Valencia, trabajamos con marcas nacionales e internacionales para producir contenido que marca la diferencia.',
        'ab_story_text_en'    => 'Obliq Productions was born from a passion for audiovisual media and the desire to create content that connects with people. Formed by a versatile and experienced team, we understand the nature of each project and effectively adapt to its needs. From our base in Valencia, we work with national and international brands to produce content that makes a difference.',
        'ab_story_image'      => '/hero.jpg',

        'ab_values_tag_es'    => 'VALORES',
        'ab_values_tag_en'    => 'VALUES',
        'ab_values_title_es'  => 'Lo que nos define',
        'ab_values_title_en'  => 'What defines us',

        'ab_value_1_title_es' => 'Creatividad',
        'ab_value_1_title_en' => 'Creativity',
        'ab_value_1_text_es'  => 'Cada proyecto es una oportunidad para innovar. Buscamos soluciones creativas que sorprendan y emocionen.',
        'ab_value_1_text_en'  => 'Every project is an opportunity to innovate. We seek creative solutions that surprise and excite.',
        'ab_value_2_title_es' => 'Excelencia técnica',
        'ab_value_2_title_en' => 'Technical excellence',
        'ab_value_2_text_es'  => 'Utilizamos equipamiento de última generación y flujos de trabajo optimizados para garantizar la máxima calidad.',
        'ab_value_2_text_en'  => 'We use state-of-the-art equipment and optimized workflows to guarantee the highest quality.',
        'ab_value_3_title_es' => 'Compromiso',
        'ab_value_3_title_en' => 'Commitment',
        'ab_value_3_text_es'  => 'Nos comprometemos con cada proyecto como si fuera propio. Tu éxito es nuestro éxito.',
        'ab_value_3_text_en'  => 'We commit to every project as if it were our own. Your success is our success.',

        'ab_team_tag_es'      => 'EQUIPO',
        'ab_team_tag_en'      => 'TEAM',
        'ab_team_title_es'    => 'Las personas detrás de Obliq',
        'ab_team_title_en'    => 'The people behind Obliq',
    );
}

/** Valores iniciales de "Datos de contacto" — espejo de CONTACT_PAGE + schema.ts */
function obliq_contenido_seed_contact() {
    return array(
        'ct_hero_tag_es'      => 'CONTACTO',
        'ct_hero_tag_en'      => 'CONTACT',
        'ct_hero_title_es'    => 'HABLEMOS DE TU PROYECTO',
        'ct_hero_title_en'    => 'LET\'S TALK ABOUT YOUR PROJECT',
        'ct_hero_subtitle_es' => 'Cuéntanos tu idea y te ayudamos a hacerla realidad.',
        'ct_hero_subtitle_en' => 'Tell us your idea and we\'ll help you make it happen.',

        'ct_info_title_es'    => 'Información de contacto',
        'ct_info_title_en'    => 'Contact information',

        'ct_hours_es'         => 'Lunes a Viernes: 9:00 — 18:00',
        'ct_hours_en'         => 'Monday to Friday: 9:00 — 18:00',

        'ct_email'            => 'info@obliqproductions.com',
        'ct_phone'            => '+34 675 489 980',
        'ct_whatsapp'         => '34675489980',

        'ct_address_street'   => 'C/ Pintor Navarro Llorens bajo 3',
        'ct_address_postal'   => '46008',
        'ct_address_city'     => 'Valencia',
    );
}

/**
 * Valores iniciales de "Inicio" — espejo de HOME en src/i18n/*.json.
 *
 * El campo de vídeo nace VACÍO a propósito: así, al instalar esta versión del
 * plugin, la portada se reconstruye exactamente igual que antes (cabecera con
 * imagen). El vídeo solo aparece cuando alguien pega una URL en wp-admin.
 *
 * Los textos, en cambio, nacen CON el contenido que hoy está en producción:
 * el cliente no tiene que escribir nada el primer día, solo cambiar lo que
 * quiera. Y el build sale byte a byte igual hasta que alguien edite algo.
 */
function obliq_contenido_seed_home() {
    return array(
        'hm_hero_vimeo_url'      => '',
        'hm_hero_fallback_image' => '/hero.jpg', // la imagen que hoy vive en el repo

        'hm_hero_tag_es'         => 'PRODUCTORA AUDIOVISUAL',
        'hm_hero_tag_en'         => 'AUDIOVISUAL PRODUCTION',
        'hm_hero_title_es'       => 'WHERE DREAMS LIVE',
        'hm_hero_title_en'       => 'WHERE DREAMS LIVE',
        'hm_hero_subtitle_es'    => 'Creamos historias que importan. Producción audiovisual profesional en Valencia.',
        'hm_hero_subtitle_en'    => 'We create stories that matter. Professional audiovisual production in Valencia.',
        'hm_hero_cta_primary_es'   => 'VER SERVICIOS',
        'hm_hero_cta_primary_en'   => 'VIEW SERVICES',
        'hm_hero_cta_secondary_es' => 'CONTACTAR',
        'hm_hero_cta_secondary_en' => 'CONTACT US',

        'hm_services_tag_es'     => 'SERVICIOS',
        'hm_services_tag_en'     => 'SERVICES',
        'hm_services_title_es'   => 'Soluciones audiovisuales integrales',
        'hm_services_title_en'   => 'Comprehensive audiovisual solutions',
        'hm_service_card_cta_es' => 'VER SERVICIO',
        'hm_service_card_cta_en' => 'VIEW SERVICE',

        'hm_marquee_work_es'     => 'NUESTRO TRABAJO',
        'hm_marquee_work_en'     => 'OUR WORK',

        'hm_portfolio_tag_es'    => 'PORTFOLIO',
        'hm_portfolio_tag_en'    => 'PORTFOLIO',
        'hm_portfolio_title_es'  => 'Proyectos que hablan por sí mismos',
        'hm_portfolio_title_en'  => 'Projects that speak for themselves',
        'hm_portfolio_cta_es'    => 'VER TODOS LOS PROYECTOS',
        'hm_portfolio_cta_en'    => 'VIEW ALL PROJECTS',

        'hm_about_tag_es'        => 'NOSOTROS',
        'hm_about_tag_en'        => 'ABOUT US',
        'hm_about_title_es'      => 'Creamos historias que importan',
        'hm_about_title_en'      => 'We create stories that matter',
        'hm_about_text_es'       => 'Somos una productora audiovisual formada por un equipo polivalente y experimentado. Entendemos la naturaleza de cada proyecto y nos adaptamos con eficacia a sus necesidades.',
        'hm_about_text_en'       => 'We are an audiovisual production company formed by a versatile and experienced team. We understand the nature of each project and effectively adapt to its needs.',
        'hm_about_cta_es'        => 'CONÓCENOS',
        'hm_about_cta_en'        => 'ABOUT US',

        'hm_cta_title_es'        => '¿TIENES UN PROYECTO?',
        'hm_cta_title_en'        => 'GOT A PROJECT?',
        'hm_cta_button_es'       => 'HABLEMOS',
        'hm_cta_button_en'       => "LET'S TALK",
    );
}

/**
 * Valores iniciales de "Alquiler · Tarifa de operador".
 *
 * Valores confirmados por el cliente (23-Jul-2026): 300 €/jornada, 200 €/media
 * jornada (sin IVA); media jornada = 4 h, jornada completa = 8 h; entrega de
 * brutos en 24 h; servicio en toda la Comunitat Valenciana. Ya NO llevan el
 * marcador [PENDIENTE DE CONFIRMAR CON CLIENTE] → el build deja de avisar.
 * Como el seed v3 NUNCA se subió, este texto entra en la PRIMERA creación del
 * singleton; no requiere bump de versión.
 */
function obliq_contenido_seed_alquiler() {
    return array(
        'op_jornada_price' => '300',
        'op_media_price'   => '200',
        'op_includes_es'   => "Operador profesional cualificado\nEntrega de brutos",
        'op_includes_en'   => "Qualified professional operator\nRaw footage delivery",
        'op_terms_es'      => 'Todos los alquileres se realizan con operador. Media jornada: 4 horas. Jornada completa: 8 horas. Entrega de brutos en 24 h desde la finalización del rodaje. Servicio disponible en toda la Comunitat Valenciana; para desplazamientos fuera de la comunidad, consúltanos.',
        'op_terms_en'      => 'All equipment rentals include an operator. Half day: 4 hours. Full day: 8 hours. Raw footage delivered within 24 hours of the end of the shoot. Available throughout the Valencian Community; for locations outside the region, get in touch.',
    );
}
