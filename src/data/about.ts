/**
 * Textos de la página "Nosotros" — facade async con WordPress headless CMS
 * y fallback a src/i18n.
 *
 * Fuente: CPT `contenido`, entrada con `_obliq_key = 'about'`.
 *
 * NO cubre los miembros del equipo (CPT `director` → src/data/team.ts) ni los
 * logos de clientes (CPT `cliente` → src/data/clients.ts): esos ya se
 * gestionaban desde WordPress y no se tocan.
 */
import { isWPEnabled, getContenido, wpText } from '@/lib/wp-client';
import { t } from '@/lib/i18n';

export interface AboutValue {
  title: string;
  text: string;
}

export interface AboutContent {
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  storyTitle: string;
  storyText: string;
  storyImage: string;
  valuesTag: string;
  valuesTitle: string;
  /** Siempre 3 — el diseño es una rejilla fija de tres columnas numeradas 01/02/03 */
  values: [AboutValue, AboutValue, AboutValue];
  teamTag: string;
  teamTitle: string;
}

/** Imagen del bloque de historia cuando WP no aporta una */
const DEFAULT_STORY_IMAGE = '/hero.jpg';

/** Contenido por defecto: exactamente lo que hoy vive en src/i18n/*.json */
function fallbackAbout(locale: string): AboutContent {
  const a = t(locale).ABOUT_PAGE;
  return {
    heroTag: a.HERO_TAG,
    heroTitle: a.HERO_TITLE,
    heroSubtitle: a.HERO_SUBTITLE,
    storyTitle: a.STORY_TITLE,
    storyText: a.STORY_TEXT,
    storyImage: DEFAULT_STORY_IMAGE,
    valuesTag: a.VALUES_TAG,
    valuesTitle: a.VALUES_TITLE,
    values: [
      { title: a.VALUE_1_TITLE, text: a.VALUE_1_TEXT },
      { title: a.VALUE_2_TITLE, text: a.VALUE_2_TEXT },
      { title: a.VALUE_3_TITLE, text: a.VALUE_3_TEXT },
    ],
    teamTag: a.TEAM_TAG,
    teamTitle: a.TEAM_TITLE,
  };
}

/**
 * Textos de "Nosotros" — WordPress con fallback campo a campo a src/i18n.
 * Si WP_API_URL no está definido, WP no responde o el JSON viene mal,
 * devuelve el contenido de i18n y el build sigue adelante.
 */
export async function getAboutContentAsync(locale: string): Promise<AboutContent> {
  const fallback = fallbackAbout(locale);
  if (!isWPEnabled()) return fallback;

  try {
    const { about } = await getContenido();
    if (!about) return fallback;

    const f = (key: string) => wpText(about, `${key}_${locale}`);

    return {
      heroTag: f('ab_hero_tag') ?? fallback.heroTag,
      heroTitle: f('ab_hero_title') ?? fallback.heroTitle,
      heroSubtitle: f('ab_hero_subtitle') ?? fallback.heroSubtitle,
      storyTitle: f('ab_story_title') ?? fallback.storyTitle,
      storyText: f('ab_story_text') ?? fallback.storyText,
      storyImage: wpText(about, 'ab_story_image') ?? fallback.storyImage,
      valuesTag: f('ab_values_tag') ?? fallback.valuesTag,
      valuesTitle: f('ab_values_title') ?? fallback.valuesTitle,
      values: [
        {
          title: f('ab_value_1_title') ?? fallback.values[0].title,
          text: f('ab_value_1_text') ?? fallback.values[0].text,
        },
        {
          title: f('ab_value_2_title') ?? fallback.values[1].title,
          text: f('ab_value_2_text') ?? fallback.values[1].text,
        },
        {
          title: f('ab_value_3_title') ?? fallback.values[2].title,
          text: f('ab_value_3_text') ?? fallback.values[2].text,
        },
      ],
      teamTag: f('ab_team_tag') ?? fallback.teamTag,
      teamTitle: f('ab_team_title') ?? fallback.teamTitle,
    };
  } catch (e) {
    console.warn('[about] WP fetch failed, using i18n content:', e);
    return fallback;
  }
}
