/**
 * Service data — async facade with WordPress headless CMS + mock fallback.
 * When WP_API_URL is set, fetches from WordPress REST API at build time.
 * Otherwise, uses the mock data below for local development.
 */
import { isWPEnabled, getServices as wpGetServices, getServiceBySlug as wpGetServiceBySlug } from '@/lib/wp-client';

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

export interface ServiceData {
  key: string;
  slug: { es: string; en: string };
  image: string;
  features: { es: ServiceFeature[]; en: ServiceFeature[] };
  longDescription: { es: string; en: string };
  pricing?: { es: PricingPlan[]; en: PricingPlan[] };
  marqueeText?: { es: string; en: string };
  caseStudy?: {
    title: { es: string; en: string };
    description: { es: string; en: string };
    image: string;
  };
}

export const services: ServiceData[] = [
  {
    key: 'STREAMING',
    slug: { es: 'streaming', en: 'streaming' },
    image: '/hero.jpg',
    marqueeText: { es: 'STREAMING', en: 'STREAMING' },
    longDescription: {
      es: 'Ofrecemos retransmisión en directo profesional para todo tipo de eventos. Nuestro equipo técnico se encarga de la producción completa: multicámara, grafismo en directo, integración de presentaciones y emisión simultánea en múltiples plataformas.',
      en: 'We offer professional live streaming for all types of events. Our technical team handles the complete production: multi-camera, live graphics, presentation integration and simultaneous broadcasting on multiple platforms.',
    },
    features: {
      es: [
        { title: 'Multicámara', description: 'Hasta 6 cámaras en directo con mezclador profesional.' },
        { title: 'Grafismo en directo', description: 'Overlays, rótulos y animaciones en tiempo real.' },
        { title: 'Multiplataforma', description: 'Emisión simultánea en YouTube, Twitch, LinkedIn y más.' },
        { title: 'Interactividad', description: 'Chat en directo, encuestas y Q&A integrados.' },
        { title: 'Grabación', description: 'Grabación ISO de todas las cámaras para postproducción.' },
        { title: 'Soporte técnico', description: 'Equipo técnico en remoto o presencial durante todo el evento.' },
      ],
      en: [
        { title: 'Multi-camera', description: 'Up to 6 live cameras with professional switcher.' },
        { title: 'Live graphics', description: 'Overlays, titles and real-time animations.' },
        { title: 'Multi-platform', description: 'Simultaneous broadcasting on YouTube, Twitch, LinkedIn and more.' },
        { title: 'Interactivity', description: 'Integrated live chat, polls and Q&A.' },
        { title: 'Recording', description: 'ISO recording of all cameras for post-production.' },
        { title: 'Technical support', description: 'On-site or remote technical team throughout the event.' },
      ],
    },
    pricing: {
      es: [
        {
          name: 'Starter',
          price: '800',
          features: ['1 cámara', 'Emisión en 1 plataforma', 'Grafismo básico', 'Hasta 2h de emisión', 'Soporte técnico remoto'],
        },
        {
          name: 'Professional',
          price: '2.000',
          highlighted: true,
          features: ['3 cámaras', 'Emisión en 3 plataformas', 'Grafismo personalizado', 'Hasta 4h de emisión', 'Técnico presencial', 'Grabación ISO'],
        },
        {
          name: 'Expert',
          price: '4.500',
          features: ['6 cámaras', 'Emisión ilimitada', 'Grafismo avanzado + animaciones', 'Duración flexible', 'Equipo técnico completo', 'Grabación + edición resumen'],
        },
      ],
      en: [
        {
          name: 'Starter',
          price: '800',
          features: ['1 camera', 'Broadcast on 1 platform', 'Basic graphics', 'Up to 2h broadcast', 'Remote technical support'],
        },
        {
          name: 'Professional',
          price: '2,000',
          highlighted: true,
          features: ['3 cameras', 'Broadcast on 3 platforms', 'Custom graphics', 'Up to 4h broadcast', 'On-site technician', 'ISO recording'],
        },
        {
          name: 'Expert',
          price: '4,500',
          features: ['6 cameras', 'Unlimited broadcast', 'Advanced graphics + animations', 'Flexible duration', 'Full technical team', 'Recording + highlights edit'],
        },
      ],
    },
    caseStudy: {
      title: { es: 'MasterChef — Gala Benéfica', en: 'MasterChef — Charity Gala' },
      description: {
        es: 'Retransmisión en directo multicámara para la gala benéfica de MasterChef con más de 50.000 espectadores simultáneos.',
        en: 'Multi-camera live broadcast for the MasterChef charity gala with over 50,000 simultaneous viewers.',
      },
      image: '/hero.jpg',
    },
  },
  {
    key: 'SOCIAL_CONTENT',
    slug: { es: 'contenido-redes-sociales', en: 'social-media-content' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Creamos contenido audiovisual optimizado para cada plataforma digital. Desde reels y TikToks hasta stories y contenido de formato largo, adaptamos la narrativa y el formato a las particularidades de cada red social.',
      en: 'We create audiovisual content optimized for each digital platform. From reels and TikToks to stories and long-form content, we adapt the narrative and format to the particularities of each social network.',
    },
    features: {
      es: [
        { title: 'Reels & TikToks', description: 'Contenido vertical de alto impacto para Instagram y TikTok.' },
        { title: 'Stories', description: 'Contenido efímero para mantener engagement diario.' },
        { title: 'YouTube', description: 'Vídeos optimizados para SEO y retención de audiencia.' },
        { title: 'LinkedIn', description: 'Contenido profesional para posicionamiento B2B.' },
        { title: 'Estrategia', description: 'Planificación de calendario editorial y pilares de contenido.' },
        { title: 'Analítica', description: 'Informes de rendimiento y optimización continua.' },
      ],
      en: [
        { title: 'Reels & TikToks', description: 'High-impact vertical content for Instagram and TikTok.' },
        { title: 'Stories', description: 'Ephemeral content to maintain daily engagement.' },
        { title: 'YouTube', description: 'Videos optimized for SEO and audience retention.' },
        { title: 'LinkedIn', description: 'Professional content for B2B positioning.' },
        { title: 'Strategy', description: 'Editorial calendar planning and content pillars.' },
        { title: 'Analytics', description: 'Performance reports and continuous optimization.' },
      ],
    },
    pricing: {
      es: [
        {
          name: 'Starter',
          price: '400',
          features: ['4 piezas/mes', '1 red social', 'Edición básica', 'Calendario editorial', 'Informe mensual'],
        },
        {
          name: 'Growth',
          price: '600',
          highlighted: true,
          features: ['8 piezas/mes', '2 redes sociales', 'Edición avanzada', 'Estrategia de contenido', 'Community management básico', 'Informe quincenal'],
        },
        {
          name: 'Premium',
          price: '1.200',
          features: ['16 piezas/mes', 'Todas las redes', 'Producción premium', 'Estrategia integral', 'Community management', 'Informe semanal + reunión'],
        },
      ],
      en: [
        {
          name: 'Starter',
          price: '400',
          features: ['4 pieces/month', '1 social network', 'Basic editing', 'Editorial calendar', 'Monthly report'],
        },
        {
          name: 'Growth',
          price: '600',
          highlighted: true,
          features: ['8 pieces/month', '2 social networks', 'Advanced editing', 'Content strategy', 'Basic community management', 'Bi-weekly report'],
        },
        {
          name: 'Premium',
          price: '1,200',
          features: ['16 pieces/month', 'All networks', 'Premium production', 'Comprehensive strategy', 'Community management', 'Weekly report + meeting'],
        },
      ],
    },
  },
  {
    key: 'CORPORATE_VIDEO',
    slug: { es: 'video-corporativo', en: 'corporate-video' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Producimos vídeos corporativos que comunican la esencia de tu marca. Desde vídeos institucionales hasta testimoniales, pasando por presentaciones de producto y contenido para formación interna.',
      en: 'We produce corporate videos that communicate the essence of your brand. From institutional videos to testimonials, product presentations and internal training content.',
    },
    features: {
      es: [
        { title: 'Vídeo institucional', description: 'Presenta tu empresa con una narrativa audiovisual profesional.' },
        { title: 'Testimoniales', description: 'Historias reales de clientes que generan confianza.' },
        { title: 'Producto', description: 'Presenta tus productos de forma atractiva y profesional.' },
        { title: 'Formación', description: 'Contenido formativo para equipos internos.' },
        { title: 'Employer Branding', description: 'Atrae talento mostrando la cultura de tu empresa.' },
        { title: 'Presentaciones', description: 'Vídeos para pitch, inversores y presentaciones corporativas.' },
      ],
      en: [
        { title: 'Institutional video', description: 'Present your company with a professional audiovisual narrative.' },
        { title: 'Testimonials', description: 'Real customer stories that build trust.' },
        { title: 'Product', description: 'Present your products in an attractive and professional way.' },
        { title: 'Training', description: 'Training content for internal teams.' },
        { title: 'Employer Branding', description: 'Attract talent by showcasing your company culture.' },
        { title: 'Presentations', description: 'Videos for pitches, investors and corporate presentations.' },
      ],
    },
  },
  {
    key: 'SPOTS',
    slug: { es: 'spots-publicitarios', en: 'advertising-spots' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Producimos anuncios publicitarios creativos y de alto impacto. Desde el concepto creativo hasta la postproducción final, cuidamos cada detalle para que tu mensaje llegue con fuerza a tu audiencia.',
      en: 'We produce creative and high-impact advertising. From the creative concept to the final post-production, we take care of every detail so your message reaches your audience with impact.',
    },
    features: {
      es: [
        { title: 'Concepto creativo', description: 'Desarrollo de la idea y guion del anuncio.' },
        { title: 'Dirección', description: 'Dirección artística y de fotografía profesional.' },
        { title: 'Casting', description: 'Selección de actores y modelos para el spot.' },
        { title: 'Producción', description: 'Equipo técnico completo y localizaciones.' },
        { title: 'Postproducción', description: 'Edición, VFX, color grading y sonido profesional.' },
        { title: 'Adaptaciones', description: 'Versiones adaptadas para TV, digital y redes sociales.' },
      ],
      en: [
        { title: 'Creative concept', description: 'Idea development and ad scripting.' },
        { title: 'Direction', description: 'Professional art and photography direction.' },
        { title: 'Casting', description: 'Actor and model selection for the spot.' },
        { title: 'Production', description: 'Full technical team and locations.' },
        { title: 'Post-production', description: 'Editing, VFX, color grading and professional sound.' },
        { title: 'Adaptations', description: 'Versions adapted for TV, digital and social media.' },
      ],
    },
  },
  {
    key: 'MUSIC_VIDEOS',
    slug: { es: 'videoclips', en: 'music-videos' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Dirigimos y producimos videoclips musicales con una narrativa visual única. Trabajamos con artistas emergentes y consolidados para crear piezas audiovisuales que potencien su música y su imagen.',
      en: 'We direct and produce music videos with a unique visual narrative. We work with emerging and established artists to create audiovisual pieces that enhance their music and image.',
    },
    features: {
      es: [
        { title: 'Dirección creativa', description: 'Concepto visual alineado con la identidad del artista.' },
        { title: 'Narrativa visual', description: 'Storytelling que potencia el mensaje de la canción.' },
        { title: 'Localizaciones', description: 'Scouting y gestión de localizaciones únicas.' },
        { title: 'Estilismo', description: 'Dirección de arte, vestuario y maquillaje.' },
        { title: 'Efectos visuales', description: 'VFX y motion graphics para un acabado premium.' },
        { title: 'Color grading', description: 'Look cinematográfico personalizado para cada proyecto.' },
      ],
      en: [
        { title: 'Creative direction', description: 'Visual concept aligned with the artist\'s identity.' },
        { title: 'Visual narrative', description: 'Storytelling that enhances the song\'s message.' },
        { title: 'Locations', description: 'Scouting and management of unique locations.' },
        { title: 'Styling', description: 'Art direction, wardrobe and makeup.' },
        { title: 'Visual effects', description: 'VFX and motion graphics for a premium finish.' },
        { title: 'Color grading', description: 'Customized cinematic look for each project.' },
      ],
    },
  },
  {
    key: 'EVENTS',
    slug: { es: 'eventos', en: 'events' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Ofrecemos cobertura audiovisual completa para eventos corporativos y sociales. Capturamos los momentos clave de tu evento con un equipo profesional y los convertimos en piezas audiovisuales de alto impacto.',
      en: 'We offer complete audiovisual coverage for corporate and social events. We capture the key moments of your event with a professional team and turn them into high-impact audiovisual pieces.',
    },
    features: {
      es: [
        { title: 'Grabación multicámara', description: 'Cobertura completa del evento con múltiples ángulos.' },
        { title: 'Fotografía', description: 'Fotografía profesional del evento y sus asistentes.' },
        { title: 'Resumen', description: 'Vídeo resumen editado del evento (aftermovie).' },
        { title: 'Directo', description: 'Retransmisión en directo (streaming) si se requiere.' },
        { title: 'Entrevistas', description: 'Entrevistas a ponentes y asistentes destacados.' },
        { title: 'Entrega express', description: 'Material editado disponible en 24-48h.' },
      ],
      en: [
        { title: 'Multi-camera recording', description: 'Full event coverage with multiple angles.' },
        { title: 'Photography', description: 'Professional event and attendee photography.' },
        { title: 'Highlights', description: 'Edited event highlight video (aftermovie).' },
        { title: 'Live', description: 'Live streaming if required.' },
        { title: 'Interviews', description: 'Interviews with speakers and notable attendees.' },
        { title: 'Express delivery', description: 'Edited material available within 24-48h.' },
      ],
    },
  },
  {
    key: 'PHOTOGRAPHY',
    slug: { es: 'fotografia', en: 'photography' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Fotografía profesional para campañas publicitarias, catálogos de producto, eventos y contenido editorial. Capturamos imágenes que cuentan historias y refuerzan la identidad visual de tu marca.',
      en: 'Professional photography for advertising campaigns, product catalogs, events and editorial content. We capture images that tell stories and reinforce your brand\'s visual identity.',
    },
    features: {
      es: [
        { title: 'Producto', description: 'Fotografía de producto con iluminación profesional de estudio.' },
        { title: 'Campañas', description: 'Fotografía para campañas publicitarias y editoriales.' },
        { title: 'Eventos', description: 'Cobertura fotográfica profesional de eventos.' },
        { title: 'Corporativa', description: 'Retratos profesionales y fotografía de espacios.' },
        { title: 'Gastronómica', description: 'Food styling y fotografía para restauración.' },
        { title: 'Retoque', description: 'Postproducción y retoque profesional incluido.' },
      ],
      en: [
        { title: 'Product', description: 'Product photography with professional studio lighting.' },
        { title: 'Campaigns', description: 'Photography for advertising and editorial campaigns.' },
        { title: 'Events', description: 'Professional event photography coverage.' },
        { title: 'Corporate', description: 'Professional portraits and space photography.' },
        { title: 'Food', description: 'Food styling and photography for restaurants.' },
        { title: 'Retouching', description: 'Professional post-production and retouching included.' },
      ],
    },
  },
  {
    key: 'POST_PRODUCTION',
    slug: { es: 'postproduccion', en: 'post-production' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Servicio completo de postproducción audiovisual: edición, corrección de color, efectos visuales, grafismo, sonido y acabado profesional. Transformamos material en bruto en piezas audiovisuales de alta calidad.',
      en: 'Complete audiovisual post-production service: editing, color correction, visual effects, graphics, sound and professional finishing. We transform raw material into high-quality audiovisual pieces.',
    },
    features: {
      es: [
        { title: 'Edición', description: 'Montaje narrativo profesional en Premiere Pro y DaVinci.' },
        { title: 'Color grading', description: 'Corrección de color y look cinematográfico personalizado.' },
        { title: 'VFX', description: 'Efectos visuales, composición y motion graphics.' },
        { title: 'Sonido', description: 'Mezcla, masterización y diseño de sonido.' },
        { title: 'Grafismo', description: 'Títulos, rótulos y animaciones 2D/3D.' },
        { title: 'Conformado', description: 'Entrega en cualquier formato y resolución.' },
      ],
      en: [
        { title: 'Editing', description: 'Professional narrative editing in Premiere Pro and DaVinci.' },
        { title: 'Color grading', description: 'Color correction and custom cinematic look.' },
        { title: 'VFX', description: 'Visual effects, compositing and motion graphics.' },
        { title: 'Sound', description: 'Mixing, mastering and sound design.' },
        { title: 'Graphics', description: 'Titles, captions and 2D/3D animations.' },
        { title: 'Delivery', description: 'Delivery in any format and resolution.' },
      ],
    },
  },
  {
    key: 'CONSULTING',
    slug: { es: 'consultoria', en: 'consulting' },
    image: '/hero.jpg',
    longDescription: {
      es: 'Asesoramiento técnico y estratégico para proyectos audiovisuales. Te ayudamos a definir la mejor estrategia audiovisual para tu marca, optimizar recursos y maximizar el impacto de tus producciones.',
      en: 'Technical and strategic advice for audiovisual projects. We help you define the best audiovisual strategy for your brand, optimize resources and maximize the impact of your productions.',
    },
    features: {
      es: [
        { title: 'Estrategia audiovisual', description: 'Definición de la estrategia de contenido audiovisual.' },
        { title: 'Auditoría técnica', description: 'Evaluación del equipamiento y flujos de trabajo actuales.' },
        { title: 'Formación', description: 'Formación a equipos internos en producción audiovisual.' },
        { title: 'Presupuesto', description: 'Asesoramiento en inversión y presupuesto de producción.' },
        { title: 'Tecnología', description: 'Recomendación de equipamiento y software.' },
        { title: 'Producción ejecutiva', description: 'Supervisión y coordinación de producciones externas.' },
      ],
      en: [
        { title: 'Audiovisual strategy', description: 'Audiovisual content strategy definition.' },
        { title: 'Technical audit', description: 'Evaluation of current equipment and workflows.' },
        { title: 'Training', description: 'Internal team training in audiovisual production.' },
        { title: 'Budget', description: 'Production investment and budget advisory.' },
        { title: 'Technology', description: 'Equipment and software recommendations.' },
        { title: 'Executive production', description: 'Supervision and coordination of external productions.' },
      ],
    },
  },
];

/** Get a service by its i18n key */
export function getServiceByKey(key: string) {
  return services.find((s) => s.key === key);
}

/** Get a service by its slug and locale */
export function getServiceBySlug(slug: string, locale: string) {
  return services.find((s) => s.slug[locale as 'es' | 'en'] === slug);
}

/** Get all service slugs for a locale */
export function getServiceSlugs(locale: 'es' | 'en') {
  return services.map((s) => s.slug[locale]);
}

// ---------- Async facade (WP + mock fallback) ----------

/** Fetch all services — WordPress or mock fallback */
export async function getServicesAsync(): Promise<ServiceData[]> {
  if (!isWPEnabled()) return services;
  try {
    const wpServices = await wpGetServices();
    return wpServices.length > 0 ? wpServices : services;
  } catch (e) {
    console.warn('[services] WP fetch failed, using mock data:', e);
    return services;
  }
}

/** Fetch a single service by slug — WordPress or mock fallback */
export async function getServiceBySlugAsync(slug: string, locale: 'es' | 'en' = 'es'): Promise<ServiceData | undefined> {
  if (!isWPEnabled()) return getServiceBySlug(slug, locale);
  try {
    const all = await getServicesAsync();
    return all.find((s) => s.slug[locale] === slug);
  } catch {
    return getServiceBySlug(slug, locale);
  }
}
