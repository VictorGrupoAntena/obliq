/**
 * Hero de la home — facade async con WordPress headless CMS y fallback estático.
 *
 * Fuente: CPT `contenido`, entrada con `_obliq_key = 'home'`.
 *
 * Solo cubre el FONDO del hero (vídeo de Vimeo + imagen). Los textos del hero
 * (etiqueta, título, subtítulo) y los botones siguen viniendo de src/i18n:
 * son los mismos en ambos idiomas por diseño y no se pidieron editables.
 *
 * El campo de vídeo es único para ES y EN (sin sufijo `_es`/`_en`): es el mismo
 * vídeo en las dos versiones del sitio, igual que `ab_story_image` o `ct_email`.
 */
import { isWPEnabled, getContenido, wpText } from '@/lib/wp-client';

export interface HomeHero {
  /**
   * URL de Vimeo del vídeo de fondo. `undefined` = modo imagen (el hero de
   * siempre). Es el ÚNICO interruptor: no hay un campo "activar vídeo" que
   * pueda quedar incoherente con la URL.
   */
  vimeoUrl?: string;
  /** Imagen de fondo; con vídeo activo hace de póster mientras carga. */
  image: string;
}

/** Imagen del hero cuando WP no aporta una — la que hoy está en el repo. */
const DEFAULT_HERO_IMAGE = '/hero.jpg';

const FALLBACK_HOME_HERO: HomeHero = { image: DEFAULT_HERO_IMAGE };

/**
 * Fondo del hero de la home — WordPress con fallback campo a campo.
 * Si WP_API_URL no está definido, WP no responde, la entrada `home` no existe
 * todavía (mu-plugin sin actualizar) o los campos están vacíos, devuelve el
 * hero estático de siempre y el build sigue adelante.
 */
export async function getHomeHeroAsync(): Promise<HomeHero> {
  if (!isWPEnabled()) return FALLBACK_HOME_HERO;

  try {
    const { home } = await getContenido();
    if (!home) return FALLBACK_HOME_HERO;

    const vimeoUrl = wpText(home, 'hm_hero_vimeo_url');

    return {
      ...(vimeoUrl && { vimeoUrl }),
      image: wpText(home, 'hm_hero_fallback_image') ?? FALLBACK_HOME_HERO.image,
    };
  } catch (e) {
    console.warn('[home] WP fetch failed, using static hero:', e);
    return FALLBACK_HOME_HERO;
  }
}
