/**
 * Textos y fondo de la portada — facade async con WordPress headless CMS
 * y fallback a src/i18n.
 *
 * Fuente: CPT `contenido`, entrada con `_obliq_key = 'home'`.
 *
 * NO cubre los servicios (CPT `servicio` → src/data/services.ts), los
 * proyectos destacados (CPT `portfolio`) ni los logos de marcas (CPT
 * `cliente`): esos ya se gestionaban desde WordPress y no se tocan.
 *
 * Los campos de fondo (vídeo e imagen) son únicos para ES y EN, sin sufijo
 * `_es`/`_en`: es el mismo material en las dos versiones del sitio, igual que
 * `ab_story_image` o `ct_email`. Los textos sí van por idioma.
 */
import { isWPEnabled, getContenido, wpText } from '@/lib/wp-client';
import { t } from '@/lib/i18n';

export interface HomeContent {
  /**
   * URL de Vimeo del vídeo de fondo. `undefined` = modo imagen (el hero de
   * siempre). Es el ÚNICO interruptor: no hay un campo "activar vídeo" que
   * pueda quedar incoherente con la URL.
   */
  vimeoUrl?: string;
  /** Imagen de fondo. Con vídeo activo se reserva para los casos en que el vídeo NO se monta. */
  image: string;
  /**
   * Imagen que se muestra durante la espera del vídeo. `undefined` = no se
   * enseña nada: el hueco oscuro, que es la decisión del cliente de ago-2026 y
   * el comportamiento por defecto.
   *
   * Es un campo propio y no un interruptor sobre `image` a propósito: `image`
   * ya viene con un valor sembrado, así que cualquier condición del tipo «¿hay
   * imagen?» encendería la espera sola. Aquí el vacío ES la decisión.
   */
  waitImage?: string;

  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;

  servicesTag: string;
  servicesTitle: string;
  /** Texto que asoma al pasar el ratón por una tarjeta de servicio */
  serviceCardCta: string;

  /** Texto de la cinta deslizante. Se repite en la propia página. */
  marqueeWork: string;

  portfolioTag: string;
  portfolioTitle: string;
  portfolioCta: string;

  aboutTag: string;
  aboutTitle: string;
  aboutText: string;
  aboutCta: string;

  ctaTitle: string;
  ctaButton: string;
}

/** Imagen del hero cuando WP no aporta una — la que hoy está en el repo. */
const DEFAULT_HERO_IMAGE = '/hero.jpg';

/** Contenido por defecto: exactamente lo que hoy vive en src/i18n/*.json */
function fallbackHome(locale: string): HomeContent {
  const h = t(locale).HOME;
  return {
    image: DEFAULT_HERO_IMAGE,
    heroTag: h.HERO_TAG,
    heroTitle: h.HERO_TITLE,
    heroSubtitle: h.HERO_SUBTITLE,
    heroCtaPrimary: h.HERO_CTA_PRIMARY,
    heroCtaSecondary: h.HERO_CTA_SECONDARY,
    servicesTag: h.SERVICES_TAG,
    servicesTitle: h.SERVICES_TITLE,
    serviceCardCta: h.SERVICE_CARD_CTA,
    // MARQUEE_WORK es un array de 4 repeticiones del mismo texto; en WP el
    // cliente escribe UNA vez y la página lo repite.
    marqueeWork: h.MARQUEE_WORK[0],
    portfolioTag: h.PORTFOLIO_TAG,
    portfolioTitle: h.PORTFOLIO_TITLE,
    portfolioCta: h.PORTFOLIO_CTA,
    aboutTag: h.ABOUT_TAG,
    aboutTitle: h.ABOUT_TITLE,
    aboutText: h.ABOUT_TEXT,
    aboutCta: h.ABOUT_CTA,
    ctaTitle: h.CTA_TITLE,
    ctaButton: h.CTA_BUTTON,
  };
}

/**
 * Portada — WordPress con fallback campo a campo a src/i18n.
 * Si WP_API_URL no está definido, WP no responde, la entrada `home` no existe
 * todavía (mu-plugin sin actualizar) o los campos están vacíos, devuelve el
 * contenido de i18n y el build sigue adelante.
 */
export async function getHomeContentAsync(locale: string): Promise<HomeContent> {
  const fallback = fallbackHome(locale);
  if (!isWPEnabled()) return fallback;

  try {
    const { home } = await getContenido();
    if (!home) return fallback;

    const f = (key: string) => wpText(home, `${key}_${locale}`);
    const vimeoUrl = wpText(home, 'hm_hero_vimeo_url');
    const waitImage = wpText(home, 'hm_hero_wait_image');

    return {
      ...(vimeoUrl && { vimeoUrl }),
      image: wpText(home, 'hm_hero_fallback_image') ?? fallback.image,
      // Sin `?? fallback`: aquí `undefined` no significa «falta el dato», sino
      // «no se enseña imagen durante la espera». Darle un valor por defecto
      // invertiría la decisión del cliente.
      ...(waitImage && { waitImage }),

      heroTag: f('hm_hero_tag') ?? fallback.heroTag,
      heroTitle: f('hm_hero_title') ?? fallback.heroTitle,
      heroSubtitle: f('hm_hero_subtitle') ?? fallback.heroSubtitle,
      heroCtaPrimary: f('hm_hero_cta_primary') ?? fallback.heroCtaPrimary,
      heroCtaSecondary: f('hm_hero_cta_secondary') ?? fallback.heroCtaSecondary,

      servicesTag: f('hm_services_tag') ?? fallback.servicesTag,
      servicesTitle: f('hm_services_title') ?? fallback.servicesTitle,
      serviceCardCta: f('hm_service_card_cta') ?? fallback.serviceCardCta,

      marqueeWork: f('hm_marquee_work') ?? fallback.marqueeWork,

      portfolioTag: f('hm_portfolio_tag') ?? fallback.portfolioTag,
      portfolioTitle: f('hm_portfolio_title') ?? fallback.portfolioTitle,
      portfolioCta: f('hm_portfolio_cta') ?? fallback.portfolioCta,

      aboutTag: f('hm_about_tag') ?? fallback.aboutTag,
      aboutTitle: f('hm_about_title') ?? fallback.aboutTitle,
      aboutText: f('hm_about_text') ?? fallback.aboutText,
      aboutCta: f('hm_about_cta') ?? fallback.aboutCta,

      ctaTitle: f('hm_cta_title') ?? fallback.ctaTitle,
      ctaButton: f('hm_cta_button') ?? fallback.ctaButton,
    };
  } catch (e) {
    console.warn('[home] WP fetch failed, using i18n content:', e);
    return fallback;
  }
}
