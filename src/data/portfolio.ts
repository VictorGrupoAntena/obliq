/**
 * Portfolio data — async facade with WordPress headless CMS + mock fallback.
 *
 * Los thumbnails se resuelven en build vía Vimeo oEmbed (con caché) cuando el
 * proyecto tiene vimeoUrl y no tiene imagen propia — ver src/lib/vimeo.ts.
 */
import {
  isWPEnabled,
  getPortfolioProjects as wpGetPortfolio,
  getPortfolioCategories as wpGetPortfolioCategories,
  type PortfolioProject,
} from '@/lib/wp-client';
import { getVimeoThumbnail } from '@/lib/vimeo';

export type { PortfolioProject };

const FALLBACK_IMAGE = '/hero.jpg';

// Mock data — espejo del contenido real de WP (scripts/obliq-portfolio-reset.php).
// 11 vídeos reales del cliente, 6 categorías, títulos provisionales.
const mockProjects: PortfolioProject[] = [
  { title: { es: 'Proyecto Gastro 1', en: 'Project Gastro 1' }, category: 'Gastro', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209481160', featured: true },
  { title: { es: 'Proyecto Gastro 2', en: 'Project Gastro 2' }, category: 'Gastro', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209450532/6da71b05b3', featured: false },
  { title: { es: 'Proyecto Marcas 1', en: 'Project Brands 1' }, category: 'Marcas', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209641919/eed26bbdd6', featured: true },
  { title: { es: 'Proyecto Marcas 2', en: 'Project Brands 2' }, category: 'Marcas', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209456791/de3e459c53', featured: false },
  { title: { es: 'Proyecto Marcas 3', en: 'Project Brands 3' }, category: 'Marcas', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1147316237/c1a2479df5', featured: false },
  { title: { es: 'Proyecto Branded content 1', en: 'Project Branded content 1' }, category: 'Branded content', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209451032', featured: false },
  { title: { es: 'Proyecto Entrevistas 1', en: 'Project Interviews 1' }, category: 'Entrevistas', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1172559496/6c29294452', featured: false },
  { title: { es: 'Proyecto Entrevistas 2', en: 'Project Interviews 2' }, category: 'Entrevistas', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1161036538/4fcc5767cd', featured: false },
  { title: { es: 'Proyecto Eventos 1', en: 'Project Events 1' }, category: 'Eventos', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1127528944', featured: false },
  { title: { es: 'Proyecto Spots 1', en: 'Project Spots 1' }, category: 'Spots', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1163689471/f05ec68da4', featured: true },
  { title: { es: 'Proyecto Spots 2', en: 'Project Spots 2' }, category: 'Spots', image: FALLBACK_IMAGE, vimeoUrl: 'https://vimeo.com/1209452284/640faaaa6f', featured: false },
];

/** Sync access to mock projects */
export const projects = mockProjects;

/**
 * Rellena la imagen con el thumbnail de Vimeo (oEmbed) cuando el proyecto
 * tiene vídeo y no tiene imagen propia. Si oEmbed falla, conserva el fallback.
 */
async function enrichWithThumbnails(list: PortfolioProject[]): Promise<PortfolioProject[]> {
  return Promise.all(
    list.map(async (project) => {
      const needsThumbnail = project.vimeoUrl && (!project.image || project.image === FALLBACK_IMAGE);
      if (!needsThumbnail) return project;
      const thumbnail = await getVimeoThumbnail(project.vimeoUrl!);
      return thumbnail ? { ...project, image: thumbnail } : project;
    })
  );
}

/** Fetch all portfolio projects — WordPress or mock fallback */
export async function getPortfolioProjectsAsync(): Promise<PortfolioProject[]> {
  if (!isWPEnabled()) return enrichWithThumbnails(mockProjects);
  try {
    const wpProjects = await wpGetPortfolio();
    return enrichWithThumbnails(wpProjects.length > 0 ? wpProjects : mockProjects);
  } catch (e) {
    console.warn('[portfolio] WP fetch failed, using mock data:', e);
    return enrichWithThumbnails(mockProjects);
  }
}

/** Categorías únicas presentes en una lista de proyectos, en orden de aparición */
function categoriesFromProjects(list: PortfolioProject[]): string[] {
  return [...new Set(list.map((p) => p.category).filter(Boolean))];
}

/**
 * Categorías para los botones de filtro del portfolio.
 * WP: términos con proyectos, en orden de creación (el cliente amplía desde WP).
 * Mock/fallback: derivadas de los propios proyectos.
 */
export async function getPortfolioCategoriesAsync(): Promise<string[]> {
  if (!isWPEnabled()) return categoriesFromProjects(mockProjects);
  try {
    const categories = await wpGetPortfolioCategories();
    return categories.length > 0 ? categories : categoriesFromProjects(await getPortfolioProjectsAsync());
  } catch (e) {
    console.warn('[portfolio] WP categories fetch failed, deriving from projects:', e);
    return categoriesFromProjects(await getPortfolioProjectsAsync());
  }
}

/** Get featured portfolio projects (for home page) */
export async function getFeaturedProjectsAsync(): Promise<PortfolioProject[]> {
  const all = await getPortfolioProjectsAsync();
  return all.filter((p) => p.featured).slice(0, 3);
}
