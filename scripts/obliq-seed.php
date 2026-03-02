<?php
/**
 * Obliq Productions — Seed WordPress con datos mock
 *
 * INSTRUCCIONES:
 * 1. Primero asegúrate de que obliq-cpts.php está activo en mu-plugins
 * 2. Sube este archivo a la raíz de WordPress (junto a wp-config.php)
 * 3. Ejecuta desde el navegador: https://admin.obliqproductions.com/obliq-seed.php
 * 4. Revisa la salida y ELIMINA el archivo después de ejecutarlo
 *
 * SEGURIDAD: Este archivo se auto-elimina tras ejecutarse exitosamente.
 * Si no, elimínalo manualmente.
 */

// Bootstrap WordPress
require_once __DIR__ . '/wp-load.php';

if ( ! current_user_can( 'manage_options' ) && php_sapi_name() !== 'cli' ) {
    // Permitir ejecución solo como admin o desde CLI
    wp_die( 'Necesitas estar logueado como administrador.' );
}

header( 'Content-Type: text/plain; charset=utf-8' );
echo "=== Obliq Seed Script ===\n\n";

// ============================================================
// Helper: crear post si no existe (por slug)
// ============================================================
function obliq_create_post( $post_type, $slug, $title, $content, $meta = array() ) {
    $existing = get_posts( array(
        'post_type'   => $post_type,
        'name'        => $slug,
        'numberposts' => 1,
        'post_status' => 'any',
    ) );

    if ( ! empty( $existing ) ) {
        echo "  [SKIP] {$post_type}/{$slug} — ya existe (ID: {$existing[0]->ID})\n";
        return $existing[0]->ID;
    }

    $post_id = wp_insert_post( array(
        'post_type'    => $post_type,
        'post_title'   => $title,
        'post_name'    => $slug,
        'post_content' => $content,
        'post_status'  => 'publish',
    ) );

    if ( is_wp_error( $post_id ) ) {
        echo "  [ERROR] {$post_type}/{$slug} — " . $post_id->get_error_message() . "\n";
        return false;
    }

    foreach ( $meta as $key => $value ) {
        update_post_meta( $post_id, $key, $value );
    }

    echo "  [OK] {$post_type}/{$slug} — creado (ID: {$post_id})\n";
    return $post_id;
}

// ============================================================
// Helper: crear término de taxonomía si no existe
// ============================================================
function obliq_create_term( $taxonomy, $name, $slug, $meta = array() ) {
    $existing = term_exists( $slug, $taxonomy );
    if ( $existing ) {
        echo "  [SKIP] {$taxonomy}/{$slug} — ya existe\n";
        return $existing['term_id'];
    }

    $result = wp_insert_term( $name, $taxonomy, array( 'slug' => $slug ) );
    if ( is_wp_error( $result ) ) {
        echo "  [ERROR] {$taxonomy}/{$slug} — " . $result->get_error_message() . "\n";
        return false;
    }

    $term_id = $result['term_id'];
    foreach ( $meta as $key => $value ) {
        update_term_meta( $term_id, $key, $value );
    }

    echo "  [OK] {$taxonomy}/{$slug} — creado (ID: {$term_id})\n";
    return $term_id;
}

// ============================================================
// 1. TAXONOMÍAS — Categorías de alquiler
// ============================================================
echo "\n--- Categorías de alquiler ---\n";

$rental_cats = array(
    array( 'name' => 'Cámaras', 'slug' => 'camaras', 'meta' => array(
        'rc_slug_en' => 'cameras', 'rc_name_en' => 'Cameras',
        'rc_description_es' => 'Cámaras de cine y vídeo profesional para cualquier tipo de producción.',
        'rc_description_en' => 'Cinema and professional video cameras for any type of production.',
        'rc_icon' => '🎬',
    )),
    array( 'name' => 'Ópticas', 'slug' => 'opticas', 'meta' => array(
        'rc_slug_en' => 'lenses', 'rc_name_en' => 'Lenses',
        'rc_description_es' => 'Objetivos de cine y fotografía profesional. Ópticas prime y zoom de alta gama.',
        'rc_description_en' => 'Cinema and professional photography lenses. High-end prime and zoom optics.',
        'rc_icon' => '🔭',
    )),
    array( 'name' => 'Estabilización', 'slug' => 'estabilizacion', 'meta' => array(
        'rc_slug_en' => 'stabilization', 'rc_name_en' => 'Stabilization',
        'rc_description_es' => 'Gimbals, trípodes y sistemas de estabilización profesional.',
        'rc_description_en' => 'Gimbals, tripods and professional stabilization systems.',
        'rc_icon' => '📐',
    )),
    array( 'name' => 'Accesorios', 'slug' => 'accesorios', 'meta' => array(
        'rc_slug_en' => 'accessories', 'rc_name_en' => 'Accessories',
        'rc_description_es' => 'Jaulas, brazos articulados, baterías y otros accesorios esenciales.',
        'rc_description_en' => 'Cages, magic arms, batteries and other essential accessories.',
        'rc_icon' => '🔧',
    )),
    array( 'name' => 'Monitores', 'slug' => 'monitores', 'meta' => array(
        'rc_slug_en' => 'monitors', 'rc_name_en' => 'Monitors',
        'rc_description_es' => 'Monitores de campo y grabadores profesionales para supervisión en rodaje.',
        'rc_description_en' => 'Field monitors and professional recorders for on-set monitoring.',
        'rc_icon' => '🖥',
    )),
    array( 'name' => 'Audio', 'slug' => 'audio', 'meta' => array(
        'rc_slug_en' => 'audio', 'rc_name_en' => 'Audio',
        'rc_description_es' => 'Micrófonos inalámbricos, cañón y sistemas de grabación de audio profesional.',
        'rc_description_en' => 'Wireless microphones, shotgun mics and professional audio recording systems.',
        'rc_icon' => '🎤',
    )),
);

$cat_term_ids = array();
foreach ( $rental_cats as $cat ) {
    $tid = obliq_create_term( 'rental_category', $cat['name'], $cat['slug'], $cat['meta'] );
    if ( $tid ) $cat_term_ids[ $cat['slug'] ] = $tid;
}

// ============================================================
// 2. TAXONOMÍAS — Categorías de portfolio
// ============================================================
echo "\n--- Categorías de portfolio ---\n";

$portfolio_cats = array( 'Spots', 'Corporativo', 'Videoclips', 'Streaming', 'Eventos', 'Redes Sociales' );
$pf_term_ids = array();
foreach ( $portfolio_cats as $name ) {
    $slug = sanitize_title( $name );
    $tid = obliq_create_term( 'portfolio_category', $name, $slug );
    if ( $tid ) $pf_term_ids[ $name ] = $tid;
}

// ============================================================
// 3. SERVICIOS (9)
// ============================================================
echo "\n--- Servicios ---\n";

$servicios = array(
    array(
        'slug' => 'streaming', 'title' => 'Streaming',
        'content' => 'Retransmisión en directo profesional',
        'meta' => array(
            'sv_slug_en' => 'streaming',
            'sv_long_description_es' => 'Ofrecemos retransmisión en directo profesional para todo tipo de eventos. Nuestro equipo técnico se encarga de la producción completa: multicámara, grafismo en directo, integración de presentaciones y emisión simultánea en múltiples plataformas.',
            'sv_long_description_en' => 'We offer professional live streaming for all types of events. Our technical team handles the complete production: multi-camera, live graphics, presentation integration and simultaneous broadcasting on multiple platforms.',
            'sv_marquee_text_es' => 'STREAMING',
            'sv_marquee_text_en' => 'STREAMING',
            'sv_features_es' => array(
                array( 'title' => 'Multicámara', 'description' => 'Hasta 6 cámaras en directo con mezclador profesional.' ),
                array( 'title' => 'Grafismo en directo', 'description' => 'Overlays, rótulos y animaciones en tiempo real.' ),
                array( 'title' => 'Multiplataforma', 'description' => 'Emisión simultánea en YouTube, Twitch, LinkedIn y más.' ),
                array( 'title' => 'Interactividad', 'description' => 'Chat en directo, encuestas y Q&A integrados.' ),
                array( 'title' => 'Grabación', 'description' => 'Grabación ISO de todas las cámaras para postproducción.' ),
                array( 'title' => 'Soporte técnico', 'description' => 'Equipo técnico en remoto o presencial durante todo el evento.' ),
            ),
            'sv_features_en' => array(
                array( 'title' => 'Multi-camera', 'description' => 'Up to 6 live cameras with professional switcher.' ),
                array( 'title' => 'Live graphics', 'description' => 'Overlays, titles and real-time animations.' ),
                array( 'title' => 'Multi-platform', 'description' => 'Simultaneous broadcasting on YouTube, Twitch, LinkedIn and more.' ),
                array( 'title' => 'Interactivity', 'description' => 'Integrated live chat, polls and Q&A.' ),
                array( 'title' => 'Recording', 'description' => 'ISO recording of all cameras for post-production.' ),
                array( 'title' => 'Technical support', 'description' => 'On-site or remote technical team throughout the event.' ),
            ),
            'sv_pricing_es' => array(
                array( 'name' => 'Starter', 'price' => '800', 'features' => "1 cámara\nEmisión en 1 plataforma\nGrafismo básico\nHasta 2h de emisión\nSoporte técnico remoto" ),
                array( 'name' => 'Professional', 'price' => '2.000', 'features' => "3 cámaras\nEmisión en 3 plataformas\nGrafismo personalizado\nHasta 4h de emisión\nTécnico presencial\nGrabación ISO", 'highlighted' => 'true' ),
                array( 'name' => 'Expert', 'price' => '4.500', 'features' => "6 cámaras\nEmisión ilimitada\nGrafismo avanzado + animaciones\nDuración flexible\nEquipo técnico completo\nGrabación + edición resumen" ),
            ),
            'sv_pricing_en' => array(
                array( 'name' => 'Starter', 'price' => '800', 'features' => "1 camera\nBroadcast on 1 platform\nBasic graphics\nUp to 2h broadcast\nRemote technical support" ),
                array( 'name' => 'Professional', 'price' => '2,000', 'features' => "3 cameras\nBroadcast on 3 platforms\nCustom graphics\nUp to 4h broadcast\nOn-site technician\nISO recording", 'highlighted' => 'true' ),
                array( 'name' => 'Expert', 'price' => '4,500', 'features' => "6 cameras\nUnlimited broadcast\nAdvanced graphics + animations\nFlexible duration\nFull technical team\nRecording + highlights edit" ),
            ),
            'sv_case_study_title_es' => 'MasterChef — Gala Benéfica',
            'sv_case_study_title_en' => 'MasterChef — Charity Gala',
            'sv_case_study_desc_es'  => 'Retransmisión en directo multicámara para la gala benéfica de MasterChef con más de 50.000 espectadores simultáneos.',
            'sv_case_study_desc_en'  => 'Multi-camera live broadcast for the MasterChef charity gala with over 50,000 simultaneous viewers.',
            'sv_case_study_image'    => '/hero.jpg',
        ),
    ),
    array(
        'slug' => 'contenido-redes-sociales', 'title' => 'Contenido para Redes Sociales',
        'content' => 'Contenido audiovisual optimizado para redes sociales',
        'meta' => array(
            'sv_slug_en' => 'social-media-content',
            'sv_long_description_es' => 'Creamos contenido audiovisual optimizado para cada plataforma digital. Desde reels y TikToks hasta stories y contenido de formato largo, adaptamos la narrativa y el formato a las particularidades de cada red social.',
            'sv_long_description_en' => 'We create audiovisual content optimized for each digital platform. From reels and TikToks to stories and long-form content, we adapt the narrative and format to the particularities of each social network.',
            'sv_features_es' => array(
                array( 'title' => 'Reels & TikToks', 'description' => 'Contenido vertical de alto impacto para Instagram y TikTok.' ),
                array( 'title' => 'Stories', 'description' => 'Contenido efímero para mantener engagement diario.' ),
                array( 'title' => 'YouTube', 'description' => 'Vídeos optimizados para SEO y retención de audiencia.' ),
                array( 'title' => 'LinkedIn', 'description' => 'Contenido profesional para posicionamiento B2B.' ),
                array( 'title' => 'Estrategia', 'description' => 'Planificación de calendario editorial y pilares de contenido.' ),
                array( 'title' => 'Analítica', 'description' => 'Informes de rendimiento y optimización continua.' ),
            ),
            'sv_features_en' => array(
                array( 'title' => 'Reels & TikToks', 'description' => 'High-impact vertical content for Instagram and TikTok.' ),
                array( 'title' => 'Stories', 'description' => 'Ephemeral content to maintain daily engagement.' ),
                array( 'title' => 'YouTube', 'description' => 'Videos optimized for SEO and audience retention.' ),
                array( 'title' => 'LinkedIn', 'description' => 'Professional content for B2B positioning.' ),
                array( 'title' => 'Strategy', 'description' => 'Editorial calendar planning and content pillars.' ),
                array( 'title' => 'Analytics', 'description' => 'Performance reports and continuous optimization.' ),
            ),
            'sv_pricing_es' => array(
                array( 'name' => 'Starter', 'price' => '400', 'features' => "4 piezas/mes\n1 red social\nEdición básica\nCalendario editorial\nInforme mensual" ),
                array( 'name' => 'Growth', 'price' => '600', 'features' => "8 piezas/mes\n2 redes sociales\nEdición avanzada\nEstrategia de contenido\nCommunity management básico\nInforme quincenal", 'highlighted' => 'true' ),
                array( 'name' => 'Premium', 'price' => '1.200', 'features' => "16 piezas/mes\nTodas las redes\nProducción premium\nEstrategia integral\nCommunity management\nInforme semanal + reunión" ),
            ),
            'sv_pricing_en' => array(
                array( 'name' => 'Starter', 'price' => '400', 'features' => "4 pieces/month\n1 social network\nBasic editing\nEditorial calendar\nMonthly report" ),
                array( 'name' => 'Growth', 'price' => '600', 'features' => "8 pieces/month\n2 social networks\nAdvanced editing\nContent strategy\nBasic community management\nBi-weekly report", 'highlighted' => 'true' ),
                array( 'name' => 'Premium', 'price' => '1,200', 'features' => "16 pieces/month\nAll networks\nPremium production\nComprehensive strategy\nCommunity management\nWeekly report + meeting" ),
            ),
        ),
    ),
    array( 'slug' => 'video-corporativo', 'title' => 'Vídeo Corporativo', 'content' => 'Producción de vídeo corporativo profesional', 'meta' => array( 'sv_slug_en' => 'corporate-video', 'sv_long_description_es' => 'Producimos vídeos corporativos que comunican la esencia de tu marca. Desde vídeos institucionales hasta testimoniales, pasando por presentaciones de producto y contenido para formación interna.', 'sv_long_description_en' => 'We produce corporate videos that communicate the essence of your brand. From institutional videos to testimonials, product presentations and internal training content.', 'sv_features_es' => array( array('title'=>'Vídeo institucional','description'=>'Presenta tu empresa con una narrativa audiovisual profesional.'), array('title'=>'Testimoniales','description'=>'Historias reales de clientes que generan confianza.'), array('title'=>'Producto','description'=>'Presenta tus productos de forma atractiva y profesional.'), array('title'=>'Formación','description'=>'Contenido formativo para equipos internos.'), array('title'=>'Employer Branding','description'=>'Atrae talento mostrando la cultura de tu empresa.'), array('title'=>'Presentaciones','description'=>'Vídeos para pitch, inversores y presentaciones corporativas.') ), 'sv_features_en' => array( array('title'=>'Institutional video','description'=>'Present your company with a professional audiovisual narrative.'), array('title'=>'Testimonials','description'=>'Real customer stories that build trust.'), array('title'=>'Product','description'=>'Present your products in an attractive and professional way.'), array('title'=>'Training','description'=>'Training content for internal teams.'), array('title'=>'Employer Branding','description'=>'Attract talent by showcasing your company culture.'), array('title'=>'Presentations','description'=>'Videos for pitches, investors and corporate presentations.') ) ) ),
    array( 'slug' => 'spots-publicitarios', 'title' => 'Spots Publicitarios', 'content' => 'Producción de anuncios publicitarios', 'meta' => array( 'sv_slug_en' => 'advertising-spots', 'sv_long_description_es' => 'Producimos anuncios publicitarios creativos y de alto impacto. Desde el concepto creativo hasta la postproducción final, cuidamos cada detalle para que tu mensaje llegue con fuerza a tu audiencia.', 'sv_long_description_en' => 'We produce creative and high-impact advertising. From the creative concept to the final post-production, we take care of every detail so your message reaches your audience with impact.', 'sv_features_es' => array( array('title'=>'Concepto creativo','description'=>'Desarrollo de la idea y guion del anuncio.'), array('title'=>'Dirección','description'=>'Dirección artística y de fotografía profesional.'), array('title'=>'Casting','description'=>'Selección de actores y modelos para el spot.'), array('title'=>'Producción','description'=>'Equipo técnico completo y localizaciones.'), array('title'=>'Postproducción','description'=>'Edición, VFX, color grading y sonido profesional.'), array('title'=>'Adaptaciones','description'=>'Versiones adaptadas para TV, digital y redes sociales.') ), 'sv_features_en' => array( array('title'=>'Creative concept','description'=>'Idea development and ad scripting.'), array('title'=>'Direction','description'=>'Professional art and photography direction.'), array('title'=>'Casting','description'=>'Actor and model selection for the spot.'), array('title'=>'Production','description'=>'Full technical team and locations.'), array('title'=>'Post-production','description'=>'Editing, VFX, color grading and professional sound.'), array('title'=>'Adaptations','description'=>'Versions adapted for TV, digital and social media.') ) ) ),
    array( 'slug' => 'videoclips', 'title' => 'Videoclips', 'content' => 'Dirección y producción de videoclips musicales', 'meta' => array( 'sv_slug_en' => 'music-videos', 'sv_long_description_es' => 'Dirigimos y producimos videoclips musicales con una narrativa visual única. Trabajamos con artistas emergentes y consolidados para crear piezas audiovisuales que potencien su música y su imagen.', 'sv_long_description_en' => 'We direct and produce music videos with a unique visual narrative. We work with emerging and established artists to create audiovisual pieces that enhance their music and image.', 'sv_features_es' => array( array('title'=>'Dirección creativa','description'=>'Concepto visual alineado con la identidad del artista.'), array('title'=>'Narrativa visual','description'=>'Storytelling que potencia el mensaje de la canción.'), array('title'=>'Localizaciones','description'=>'Scouting y gestión de localizaciones únicas.'), array('title'=>'Estilismo','description'=>'Dirección de arte, vestuario y maquillaje.'), array('title'=>'Efectos visuales','description'=>'VFX y motion graphics para un acabado premium.'), array('title'=>'Color grading','description'=>'Look cinematográfico personalizado para cada proyecto.') ), 'sv_features_en' => array( array('title'=>'Creative direction','description'=>"Visual concept aligned with the artist's identity."), array('title'=>'Visual narrative','description'=>"Storytelling that enhances the song's message."), array('title'=>'Locations','description'=>'Scouting and management of unique locations.'), array('title'=>'Styling','description'=>'Art direction, wardrobe and makeup.'), array('title'=>'Visual effects','description'=>'VFX and motion graphics for a premium finish.'), array('title'=>'Color grading','description'=>'Customized cinematic look for each project.') ) ) ),
    array( 'slug' => 'eventos', 'title' => 'Eventos', 'content' => 'Cobertura audiovisual de eventos', 'meta' => array( 'sv_slug_en' => 'events', 'sv_long_description_es' => 'Ofrecemos cobertura audiovisual completa para eventos corporativos y sociales. Capturamos los momentos clave de tu evento con un equipo profesional y los convertimos en piezas audiovisuales de alto impacto.', 'sv_long_description_en' => 'We offer complete audiovisual coverage for corporate and social events. We capture the key moments of your event with a professional team and turn them into high-impact audiovisual pieces.', 'sv_features_es' => array( array('title'=>'Grabación multicámara','description'=>'Cobertura completa del evento con múltiples ángulos.'), array('title'=>'Fotografía','description'=>'Fotografía profesional del evento y sus asistentes.'), array('title'=>'Resumen','description'=>'Vídeo resumen editado del evento (aftermovie).'), array('title'=>'Directo','description'=>'Retransmisión en directo (streaming) si se requiere.'), array('title'=>'Entrevistas','description'=>'Entrevistas a ponentes y asistentes destacados.'), array('title'=>'Entrega express','description'=>'Material editado disponible en 24-48h.') ), 'sv_features_en' => array( array('title'=>'Multi-camera recording','description'=>'Full event coverage with multiple angles.'), array('title'=>'Photography','description'=>'Professional event and attendee photography.'), array('title'=>'Highlights','description'=>'Edited event highlight video (aftermovie).'), array('title'=>'Live','description'=>'Live streaming if required.'), array('title'=>'Interviews','description'=>'Interviews with speakers and notable attendees.'), array('title'=>'Express delivery','description'=>'Edited material available within 24-48h.') ) ) ),
    array( 'slug' => 'fotografia', 'title' => 'Fotografía', 'content' => 'Fotografía profesional', 'meta' => array( 'sv_slug_en' => 'photography', 'sv_long_description_es' => 'Fotografía profesional para campañas publicitarias, catálogos de producto, eventos y contenido editorial. Capturamos imágenes que cuentan historias y refuerzan la identidad visual de tu marca.', 'sv_long_description_en' => "Professional photography for advertising campaigns, product catalogs, events and editorial content. We capture images that tell stories and reinforce your brand's visual identity.", 'sv_features_es' => array( array('title'=>'Producto','description'=>'Fotografía de producto con iluminación profesional de estudio.'), array('title'=>'Campañas','description'=>'Fotografía para campañas publicitarias y editoriales.'), array('title'=>'Eventos','description'=>'Cobertura fotográfica profesional de eventos.'), array('title'=>'Corporativa','description'=>'Retratos profesionales y fotografía de espacios.'), array('title'=>'Gastronómica','description'=>'Food styling y fotografía para restauración.'), array('title'=>'Retoque','description'=>'Postproducción y retoque profesional incluido.') ), 'sv_features_en' => array( array('title'=>'Product','description'=>'Product photography with professional studio lighting.'), array('title'=>'Campaigns','description'=>'Photography for advertising and editorial campaigns.'), array('title'=>'Events','description'=>'Professional event photography coverage.'), array('title'=>'Corporate','description'=>'Professional portraits and space photography.'), array('title'=>'Food','description'=>'Food styling and photography for restaurants.'), array('title'=>'Retouching','description'=>'Professional post-production and retouching included.') ) ) ),
    array( 'slug' => 'postproduccion', 'title' => 'Postproducción', 'content' => 'Servicio de postproducción audiovisual', 'meta' => array( 'sv_slug_en' => 'post-production', 'sv_long_description_es' => 'Servicio completo de postproducción audiovisual: edición, corrección de color, efectos visuales, grafismo, sonido y acabado profesional. Transformamos material en bruto en piezas audiovisuales de alta calidad.', 'sv_long_description_en' => 'Complete audiovisual post-production service: editing, color correction, visual effects, graphics, sound and professional finishing. We transform raw material into high-quality audiovisual pieces.', 'sv_features_es' => array( array('title'=>'Edición','description'=>'Montaje narrativo profesional en Premiere Pro y DaVinci.'), array('title'=>'Color grading','description'=>'Corrección de color y look cinematográfico personalizado.'), array('title'=>'VFX','description'=>'Efectos visuales, composición y motion graphics.'), array('title'=>'Sonido','description'=>'Mezcla, masterización y diseño de sonido.'), array('title'=>'Grafismo','description'=>'Títulos, rótulos y animaciones 2D/3D.'), array('title'=>'Conformado','description'=>'Entrega en cualquier formato y resolución.') ), 'sv_features_en' => array( array('title'=>'Editing','description'=>'Professional narrative editing in Premiere Pro and DaVinci.'), array('title'=>'Color grading','description'=>'Color correction and custom cinematic look.'), array('title'=>'VFX','description'=>'Visual effects, compositing and motion graphics.'), array('title'=>'Sound','description'=>'Mixing, mastering and sound design.'), array('title'=>'Graphics','description'=>'Titles, captions and 2D/3D animations.'), array('title'=>'Delivery','description'=>'Delivery in any format and resolution.') ) ) ),
    array( 'slug' => 'consultoria', 'title' => 'Consultoría', 'content' => 'Asesoramiento técnico y estratégico audiovisual', 'meta' => array( 'sv_slug_en' => 'consulting', 'sv_long_description_es' => 'Asesoramiento técnico y estratégico para proyectos audiovisuales. Te ayudamos a definir la mejor estrategia audiovisual para tu marca, optimizar recursos y maximizar el impacto de tus producciones.', 'sv_long_description_en' => 'Technical and strategic advice for audiovisual projects. We help you define the best audiovisual strategy for your brand, optimize resources and maximize the impact of your productions.', 'sv_features_es' => array( array('title'=>'Estrategia audiovisual','description'=>'Definición de la estrategia de contenido audiovisual.'), array('title'=>'Auditoría técnica','description'=>'Evaluación del equipamiento y flujos de trabajo actuales.'), array('title'=>'Formación','description'=>'Formación a equipos internos en producción audiovisual.'), array('title'=>'Presupuesto','description'=>'Asesoramiento en inversión y presupuesto de producción.'), array('title'=>'Tecnología','description'=>'Recomendación de equipamiento y software.'), array('title'=>'Producción ejecutiva','description'=>'Supervisión y coordinación de producciones externas.') ), 'sv_features_en' => array( array('title'=>'Audiovisual strategy','description'=>'Audiovisual content strategy definition.'), array('title'=>'Technical audit','description'=>'Evaluation of current equipment and workflows.'), array('title'=>'Training','description'=>'Internal team training in audiovisual production.'), array('title'=>'Budget','description'=>'Production investment and budget advisory.'), array('title'=>'Technology','description'=>'Equipment and software recommendations.'), array('title'=>'Executive production','description'=>'Supervision and coordination of external productions.') ) ) ),
);

foreach ( $servicios as $svc ) {
    obliq_create_post( 'servicio', $svc['slug'], $svc['title'], $svc['content'], $svc['meta'] );
}

// ============================================================
// 4. PRODUCTOS DE ALQUILER (15)
// ============================================================
echo "\n--- Productos de alquiler ---\n";

$productos = array(
    array( 'slug' => 'sony-fx6', 'title' => 'Sony FX6', 'cat' => 'camaras', 'meta' => array( 'al_slug' => 'sony-fx6', 'al_description_es' => 'Cámara de cine Full Frame. Sensor 10.2 MP, S Cinetone, 4K 120fps, Dual Base ISO.', 'al_description_en' => 'Full-frame cinema camera. 10.2MP sensor, S Cinetone, 4K 120fps, Dual Base ISO.', 'al_price' => 110, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Sensor CMOS Full Frame 4K de 10,2 MP'),array('spec'=>'DCI 4K 60p, UHD 4K 120p'),array('spec'=>'15+ pasos de rango dinámico'),array('spec'=>'ISO base dual: 800 / 12.800'),array('spec'=>'Grabación interna 10 bits 4:2:2')), 'al_specs_en' => array(array('spec'=>'10.2MP 4K Full-Frame CMOS sensor'),array('spec'=>'DCI 4K 60p, UHD 4K 120p'),array('spec'=>'15+ stops of dynamic range'),array('spec'=>'Dual base ISO: 800 / 12,800'),array('spec'=>'Internal 10-bit 4:2:2 recording')) ) ),
    array( 'slug' => 'sony-fe-16-35mm-f28-gm-ii', 'title' => 'Sony FE 16-35mm F2.8 GM II', 'cat' => 'opticas', 'meta' => array( 'al_slug' => 'sony-fe-16-35mm-f28-gm-ii', 'al_description_es' => 'Zoom gran angular f/2.8 constante con nitidez de esquina a esquina.', 'al_description_en' => 'Wide-angle zoom with constant f/2.8 and corner-to-corner sharpness.', 'al_price' => 40, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Distancia focal: 16-35 mm'),array('spec'=>'Apertura: f/2.8 constante'),array('spec'=>'Full Frame montura E'),array('spec'=>'Peso: 547 g')), 'al_specs_en' => array(array('spec'=>'Focal length: 16-35mm'),array('spec'=>'Aperture: f/2.8 constant'),array('spec'=>'Full-frame E-mount'),array('spec'=>'Weight: 547g')) ) ),
    array( 'slug' => 'sony-fe-28-135mm-f4-g-oss', 'title' => 'Sony FE 28-135mm F4 G OSS', 'cat' => 'opticas', 'meta' => array( 'al_slug' => 'sony-fe-28-135mm-f4-g-oss', 'al_description_es' => 'Zoom motorizado profesional con apertura f/4 constante y estabilización.', 'al_description_en' => 'Professional power zoom with constant f/4 and stabilization.', 'al_price' => 25, 'al_order' => 2, 'al_specs_es' => array(array('spec'=>'Distancia focal: 28-135 mm'),array('spec'=>'Apertura: f/4 constante'),array('spec'=>'Zoom motorizado (PZ)'),array('spec'=>'Diseño parfocal')), 'al_specs_en' => array(array('spec'=>'Focal length: 28-135mm'),array('spec'=>'Aperture: f/4 constant'),array('spec'=>'Power Zoom (PZ)'),array('spec'=>'Parfocal design')) ) ),
    array( 'slug' => 'dzofilm-pictor-20-55mm-t28', 'title' => 'DZOFilm Pictor 20-55mm T2.8', 'cat' => 'opticas', 'meta' => array( 'al_slug' => 'dzofilm-pictor-20-55mm-t28', 'al_description_es' => 'Zoom cinematográfico Super 35 con apertura T2.8 constante y diseño parfocal.', 'al_description_en' => 'Super 35 cinema zoom with constant T2.8 and parfocal design.', 'al_price' => 45, 'al_order' => 3, 'al_specs_es' => array(array('spec'=>'Distancia focal: 20-55 mm'),array('spec'=>'Apertura: T2.8'),array('spec'=>'Super 35'),array('spec'=>'Montura PL')), 'al_specs_en' => array(array('spec'=>'Focal length: 20-55mm'),array('spec'=>'Aperture: T2.8'),array('spec'=>'Super 35'),array('spec'=>'PL mount')) ) ),
    array( 'slug' => 'dzofilm-vespid-50mm-t21', 'title' => 'DZOFilm Vespid 50mm T2.1', 'cat' => 'opticas', 'meta' => array( 'al_slug' => 'dzofilm-vespid-50mm-t21', 'al_description_es' => 'Prime cinematográfico Full Frame con T2.1 y bokeh suave.', 'al_description_en' => 'Full-frame cinema prime with T2.1 and smooth bokeh.', 'al_price' => 45, 'al_order' => 4, 'al_specs_es' => array(array('spec'=>'Distancia focal: 50 mm'),array('spec'=>'Apertura: T2.1'),array('spec'=>'Full Frame'),array('spec'=>'Montura PL')), 'al_specs_en' => array(array('spec'=>'Focal length: 50mm'),array('spec'=>'Aperture: T2.1'),array('spec'=>'Full-frame'),array('spec'=>'PL mount')) ) ),
    array( 'slug' => 'zhiyun-crane-3s-pro', 'title' => 'Zhiyun Crane 3S Pro', 'cat' => 'estabilizacion', 'meta' => array( 'al_slug' => 'zhiyun-crane-3s-pro', 'al_description_es' => 'Gimbal de 3 ejes para cargas pesadas hasta 6,5 kg.', 'al_description_en' => '3-axis gimbal for heavy loads up to 6.5 kg.', 'al_price' => 65, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Carga máxima: 6,5 kg'),array('spec'=>'Autonomía: 12 horas'),array('spec'=>'Pantalla OLED'),array('spec'=>'Incluye maleta rígida')), 'al_specs_en' => array(array('spec'=>'Max payload: 6.5 kg'),array('spec'=>'Battery: 12 hours'),array('spec'=>'OLED screen'),array('spec'=>'Hard case included')) ) ),
    array( 'slug' => 'manfrotto-mvh502a-546bk', 'title' => 'Manfrotto MVH502A + 546BK', 'cat' => 'estabilizacion', 'meta' => array( 'al_slug' => 'manfrotto-mvh502a-546bk', 'al_description_es' => 'Cabezal fluido y trípode profesional con base de 75 mm.', 'al_description_en' => 'Fluid head and professional tripod with 75mm bowl.', 'al_price' => 25, 'al_order' => 2, 'al_specs_es' => array(array('spec'=>'Carga máxima: 7 kg'),array('spec'=>'Base 75 mm'),array('spec'=>'Arrastre ajustable'),array('spec'=>'Aluminio')), 'al_specs_en' => array(array('spec'=>'Max load: 7 kg'),array('spec'=>'75mm bowl'),array('spec'=>'Adjustable drag'),array('spec'=>'Aluminum')) ) ),
    array( 'slug' => 'tilta-ts-t20-b-v', 'title' => 'Tilta TS-T20-B-V', 'cat' => 'accesorios', 'meta' => array( 'al_slug' => 'tilta-ts-t20-b-v', 'al_description_es' => 'Jaula completa para Sony FX6 con protección 360° y placa V-Mount.', 'al_description_en' => 'Complete cage for Sony FX6 with 360° protection and V-Mount plate.', 'al_price' => 10, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Protección 360°'),array('spec'=>'Puntos de montaje 1/4" y 3/8"'),array('spec'=>'Riel NATO'),array('spec'=>'Placa V-Mount')), 'al_specs_en' => array(array('spec'=>'360° protection'),array('spec'=>'1/4" and 3/8" mounting points'),array('spec'=>'NATO rail'),array('spec'=>'V-Mount plate')) ) ),
    array( 'slug' => 'smallrig-magic-arm', 'title' => 'SmallRig Magic Arm', 'cat' => 'accesorios', 'meta' => array( 'al_slug' => 'smallrig-magic-arm', 'al_description_es' => 'Brazo articulado con múltiples puntos de montaje y bloqueo seguro.', 'al_description_en' => 'Articulating arm with multiple mounting points and secure locking.', 'al_price' => 3, 'al_order' => 2, 'al_specs_es' => array(array('spec'=>'Rotación 360°'),array('spec'=>'Tornillos 1/4"-20'),array('spec'=>'Aluminio'),array('spec'=>'Bloqueo central')), 'al_specs_en' => array(array('spec'=>'360° rotation'),array('spec'=>'1/4"-20 screws'),array('spec'=>'Aluminum'),array('spec'=>'Central locking')) ) ),
    array( 'slug' => 'smallrig-v9s2-se', 'title' => 'SmallRig V9S2 SE', 'cat' => 'accesorios', 'meta' => array( 'al_slug' => 'smallrig-v9s2-se', 'al_description_es' => 'Batería V-Mount 99Wh con carga rápida USB-C PD y pantalla OLED.', 'al_description_en' => 'V-Mount battery 99Wh with USB-C PD fast charging and OLED display.', 'al_price' => 15, 'al_order' => 3, 'al_specs_es' => array(array('spec'=>'Capacidad: 99Wh'),array('spec'=>'USB-C PD 65W'),array('spec'=>'Pantalla OLED'),array('spec'=>'D-Tap + USB-A')), 'al_specs_en' => array(array('spec'=>'Capacity: 99Wh'),array('spec'=>'USB-C PD 65W'),array('spec'=>'OLED display'),array('spec'=>'D-Tap + USB-A')) ) ),
    array( 'slug' => 'feelworld-lut-6s', 'title' => 'FEELWORLD LUT 6S', 'cat' => 'monitores', 'meta' => array( 'al_slug' => 'feelworld-lut-6s', 'al_description_es' => 'Monitor de campo 6" con 3D LUT, SDI/HDMI y 2600 nits.', 'al_description_en' => '6" field monitor with 3D LUT, SDI/HDMI and 2600 nits.', 'al_price' => 17, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Pantalla: 6" IPS'),array('spec'=>'Resolución: 1920x1080'),array('spec'=>'Brillo: 2600 nits'),array('spec'=>'SDI + HDMI')), 'al_specs_en' => array(array('spec'=>'Screen: 6" IPS'),array('spec'=>'Resolution: 1920x1080'),array('spec'=>'Brightness: 2600 nits'),array('spec'=>'SDI + HDMI')) ) ),
    array( 'slug' => 'atomos-ninja-ultra', 'title' => 'Atomos Ninja Ultra', 'cat' => 'monitores', 'meta' => array( 'al_slug' => 'atomos-ninja-ultra', 'al_description_es' => 'Monitor grabador HDR 5" con Dolby Vision y grabación ProRes RAW.', 'al_description_en' => '5" HDR monitor recorder with Dolby Vision and ProRes RAW recording.', 'al_price' => 35, 'al_order' => 2, 'al_specs_es' => array(array('spec'=>'Pantalla: 5.2" IPS'),array('spec'=>'Resolución: 1920x1080'),array('spec'=>'Grabación: hasta 8K30p'),array('spec'=>'ProRes RAW')), 'al_specs_en' => array(array('spec'=>'Screen: 5.2" IPS'),array('spec'=>'Resolution: 1920x1080'),array('spec'=>'Recording: up to 8K30p'),array('spec'=>'ProRes RAW')) ) ),
    array( 'slug' => 'sennheiser-avx-mke2-set', 'title' => 'Sennheiser AVX-MKE2 SET', 'cat' => 'audio', 'meta' => array( 'al_slug' => 'sennheiser-avx-mke2-set', 'al_description_es' => 'Sistema inalámbrico digital con lavalier MKE2 y receptor PlugON.', 'al_description_en' => 'Digital wireless system with MKE2 lavalier and PlugON receiver.', 'al_price' => 35, 'al_order' => 1, 'al_specs_es' => array(array('spec'=>'Lavalier MKE2 omnidireccional'),array('spec'=>'Cifrado AES 256'),array('spec'=>'Autonomía: 15h'),array('spec'=>'1880-1930 MHz')), 'al_specs_en' => array(array('spec'=>'Omnidirectional MKE2 lavalier'),array('spec'=>'AES 256 encryption'),array('spec'=>'Battery: 15h'),array('spec'=>'1880-1930 MHz')) ) ),
    array( 'slug' => 'audio-technica-at897', 'title' => 'Audio-Technica AT897', 'cat' => 'audio', 'meta' => array( 'al_slug' => 'audio-technica-at897', 'al_description_es' => 'Micrófono cañón condensador direccional para cine y televisión.', 'al_description_en' => 'Directional condenser shotgun microphone for film and TV.', 'al_price' => 20, 'al_order' => 2, 'al_specs_es' => array(array('spec'=>'Respuesta: 20Hz - 20kHz'),array('spec'=>'Filtro paso alto 80Hz'),array('spec'=>'Peso: 145 g'),array('spec'=>'Incluye paravientos')), 'al_specs_en' => array(array('spec'=>'Response: 20Hz - 20kHz'),array('spec'=>'High-pass filter 80Hz'),array('spec'=>'Weight: 145g'),array('spec'=>'Windscreen included')) ) ),
    array( 'slug' => 'rode-wireless-pro', 'title' => 'Rode Wireless Pro', 'cat' => 'audio', 'meta' => array( 'al_slug' => 'rode-wireless-pro', 'al_description_es' => 'Sistema inalámbrico 2 canales con grabación interna y timecode.', 'al_description_en' => '2-channel wireless system with internal recording and timecode.', 'al_price' => 25, 'al_order' => 3, 'al_specs_es' => array(array('spec'=>'2 canales'),array('spec'=>'Alcance: 260 m'),array('spec'=>'Memoria: 32 GB'),array('spec'=>'Timecode SMPTE')), 'al_specs_en' => array(array('spec'=>'2 channels'),array('spec'=>'Range: 260m'),array('spec'=>'Memory: 32GB'),array('spec'=>'SMPTE timecode')) ) ),
);

foreach ( $productos as $prod ) {
    $post_id = obliq_create_post( 'alquiler', $prod['slug'], $prod['title'], '', $prod['meta'] );
    if ( $post_id && isset( $cat_term_ids[ $prod['cat'] ] ) ) {
        wp_set_object_terms( $post_id, (int) $cat_term_ids[ $prod['cat'] ], 'rental_category' );
    }
}

// ============================================================
// 5. PACKS DE ALQUILER (3)
// ============================================================
echo "\n--- Packs de alquiler ---\n";

$packs = array(
    array( 'slug' => 'pack-documental', 'title' => 'Pack Documental', 'meta' => array( 'ap_slug' => 'pack-documental', 'ap_name_en' => 'Documentary Pack', 'ap_description_es' => 'Todo lo necesario para un documental profesional: cámara, óptica zoom de cine, trípode, audio inalámbrico y monitor de campo.', 'ap_description_en' => 'Everything you need for a professional documentary: camera, cinema zoom lens, tripod, wireless audio and field monitor.', 'ap_daily_price' => 195, 'ap_savings' => 15, 'ap_items' => array(array('product_slug'=>'sony-fx6'),array('product_slug'=>'dzofilm-pictor-20-55mm-t28'),array('product_slug'=>'manfrotto-mvh502a-546bk'),array('product_slug'=>'sennheiser-avx-mke2-set'),array('product_slug'=>'feelworld-lut-6s')) ) ),
    array( 'slug' => 'pack-corporativo', 'title' => 'Pack Corporativo', 'meta' => array( 'ap_slug' => 'pack-corporativo', 'ap_name_en' => 'Corporate Pack', 'ap_description_es' => 'Kit compacto para vídeo corporativo y entrevistas: cámara, zoom versátil, gimbal, micro inalámbrico dual y batería extra.', 'ap_description_en' => 'Compact kit for corporate video and interviews: camera, versatile zoom, gimbal, dual wireless mic and extra battery.', 'ap_daily_price' => 210, 'ap_savings' => 12, 'ap_items' => array(array('product_slug'=>'sony-fx6'),array('product_slug'=>'sony-fe-28-135mm-f4-g-oss'),array('product_slug'=>'zhiyun-crane-3s-pro'),array('product_slug'=>'rode-wireless-pro'),array('product_slug'=>'smallrig-v9s2-se')) ) ),
    array( 'slug' => 'pack-videoclip', 'title' => 'Pack Videoclip', 'meta' => array( 'ap_slug' => 'pack-videoclip', 'ap_name_en' => 'Music Video Pack', 'ap_description_es' => 'Equipamiento cinematográfico para videoclips: cámara, prime 50mm, zoom gran angular, gimbal, jaula completa y monitor grabador.', 'ap_description_en' => 'Cinematic equipment for music videos: camera, 50mm prime, wide zoom, gimbal, full cage and monitor recorder.', 'ap_daily_price' => 275, 'ap_savings' => 10, 'ap_items' => array(array('product_slug'=>'sony-fx6'),array('product_slug'=>'dzofilm-vespid-50mm-t21'),array('product_slug'=>'sony-fe-16-35mm-f28-gm-ii'),array('product_slug'=>'zhiyun-crane-3s-pro'),array('product_slug'=>'tilta-ts-t20-b-v'),array('product_slug'=>'atomos-ninja-ultra')) ) ),
);

foreach ( $packs as $pack ) {
    obliq_create_post( 'alquiler_pack', $pack['slug'], $pack['title'], '', $pack['meta'] );
}

// ============================================================
// 6. EQUIPO / DIRECTORES (4)
// ============================================================
echo "\n--- Equipo ---\n";

$equipo = array(
    array( 'slug' => 'carlos-martinez', 'title' => 'Carlos Martínez', 'meta' => array( 'dr_role_es' => 'Director Creativo', 'dr_role_en' => 'Creative Director' ) ),
    array( 'slug' => 'ana-garcia', 'title' => 'Ana García', 'meta' => array( 'dr_role_es' => 'Productora Ejecutiva', 'dr_role_en' => 'Executive Producer' ) ),
    array( 'slug' => 'david-lopez', 'title' => 'David López', 'meta' => array( 'dr_role_es' => 'Director de Fotografía', 'dr_role_en' => 'Director of Photography' ) ),
    array( 'slug' => 'laura-fernandez', 'title' => 'Laura Fernández', 'meta' => array( 'dr_role_es' => 'Editora Senior', 'dr_role_en' => 'Senior Editor' ) ),
);

foreach ( $equipo as $member ) {
    obliq_create_post( 'director', $member['slug'], $member['title'], '', $member['meta'] );
}

// ============================================================
// 7. CLIENTES / MARCAS (13)
// ============================================================
echo "\n--- Clientes ---\n";

$clientes = array(
    'MasterChef World', 'Geekom', 'Samsung', 'Womenalia', 'Nacavi',
    'Resort Las Palmeras', 'Gamez studio', 'Elixir Games', 'Own',
    'Dream hack', 'GG Tech', 'Guasones', 'Room mate',
);

foreach ( $clientes as $i => $name ) {
    $slug = sanitize_title( $name );
    obliq_create_post( 'cliente', $slug, $name, '', array( 'cl_order' => $i + 1 ) );
}

// ============================================================
// 8. PORTFOLIO MOCK (9 proyectos)
// ============================================================
echo "\n--- Portfolio ---\n";

$portfolio = array(
    array( 'slug' => 'masterchef-campana-digital', 'title' => 'MasterChef — Campaña Digital', 'cat' => 'Spots', 'meta' => array( 'pf_title_en' => 'MasterChef — Digital Campaign', 'pf_featured' => 'true', 'pf_year' => '2025' ) ),
    array( 'slug' => 'loewe-fashion-film', 'title' => 'Loewe — Fashion Film', 'cat' => 'Corporativo', 'meta' => array( 'pf_title_en' => 'Loewe — Fashion Film', 'pf_featured' => 'true', 'pf_year' => '2025' ) ),
    array( 'slug' => 'samsung-evento-lanzamiento', 'title' => 'Samsung — Evento Lanzamiento', 'cat' => 'Eventos', 'meta' => array( 'pf_title_en' => 'Samsung — Launch Event', 'pf_featured' => 'true', 'pf_year' => '2024' ) ),
    array( 'slug' => 'estrella-damm-spot-verano', 'title' => 'Estrella Damm — Spot Verano', 'cat' => 'Spots', 'meta' => array( 'pf_title_en' => 'Estrella Damm — Summer Spot', 'pf_featured' => 'false', 'pf_year' => '2024' ) ),
    array( 'slug' => 'netflix-behind-the-scenes', 'title' => 'Netflix — Behind the Scenes', 'cat' => 'Streaming', 'meta' => array( 'pf_title_en' => 'Netflix — Behind the Scenes', 'pf_featured' => 'false', 'pf_year' => '2024' ) ),
    array( 'slug' => 'indie-band-videoclip', 'title' => 'Indie Band — Videoclip', 'cat' => 'Videoclips', 'meta' => array( 'pf_title_en' => 'Indie Band — Music Video', 'pf_featured' => 'false', 'pf_year' => '2023' ) ),
    array( 'slug' => 'tech-corp-video-corporativo', 'title' => 'Tech Corp — Vídeo Corporativo', 'cat' => 'Corporativo', 'meta' => array( 'pf_title_en' => 'Tech Corp — Corporate Video', 'pf_featured' => 'false', 'pf_year' => '2023' ) ),
    array( 'slug' => 'festival-jazz-cobertura', 'title' => 'Festival de Jazz — Cobertura', 'cat' => 'Eventos', 'meta' => array( 'pf_title_en' => 'Jazz Festival — Coverage', 'pf_featured' => 'false', 'pf_year' => '2023' ) ),
    array( 'slug' => 'startup-demo-day-stream', 'title' => 'Startup — Demo Day Stream', 'cat' => 'Streaming', 'meta' => array( 'pf_title_en' => 'Startup — Demo Day Stream', 'pf_featured' => 'false', 'pf_year' => '2023' ) ),
);

foreach ( $portfolio as $proj ) {
    $post_id = obliq_create_post( 'portfolio', $proj['slug'], $proj['title'], '', $proj['meta'] );
    if ( $post_id && isset( $pf_term_ids[ $proj['cat'] ] ) ) {
        wp_set_object_terms( $post_id, (int) $pf_term_ids[ $proj['cat'] ], 'portfolio_category' );
    }
}

// ============================================================
// RESUMEN
// ============================================================
echo "\n=== Seed completado ===\n";
echo "IMPORTANTE: Elimina este archivo del servidor por seguridad.\n";

// Auto-delete (solo si estamos en el directorio de WordPress)
$self = __FILE__;
if ( strpos( $self, ABSPATH ) === 0 ) {
    @unlink( $self );
    echo "El archivo se ha auto-eliminado.\n";
}
