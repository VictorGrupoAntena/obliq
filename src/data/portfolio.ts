/**
 * Portfolio data — async facade with WordPress headless CMS + mock fallback.
 */
import {
  isWPEnabled,
  getPortfolioProjects as wpGetPortfolio,
  type PortfolioProject,
} from '@/lib/wp-client';

export type { PortfolioProject };

// Mock data — matches current inline data in portfolio.astro and index.astro
const mockProjects: PortfolioProject[] = [
  { title: { es: 'MasterChef — Campaña Digital', en: 'MasterChef — Digital Campaign' }, category: 'Spots', image: '/hero.jpg', featured: true },
  { title: { es: 'Loewe — Fashion Film', en: 'Loewe — Fashion Film' }, category: 'Corporativo', image: '/hero.jpg', featured: true },
  { title: { es: 'Samsung — Evento Lanzamiento', en: 'Samsung — Launch Event' }, category: 'Eventos', image: '/hero.jpg', featured: true },
  { title: { es: 'Estrella Damm — Spot Verano', en: 'Estrella Damm — Summer Spot' }, category: 'Spots', image: '/hero.jpg', featured: false },
  { title: { es: 'Netflix — Behind the Scenes', en: 'Netflix — Behind the Scenes' }, category: 'Streaming', image: '/hero.jpg', featured: false },
  { title: { es: 'Indie Band — Videoclip', en: 'Indie Band — Music Video' }, category: 'Videoclips', image: '/hero.jpg', featured: false },
  { title: { es: 'Tech Corp — Vídeo Corporativo', en: 'Tech Corp — Corporate Video' }, category: 'Corporativo', image: '/hero.jpg', featured: false },
  { title: { es: 'Festival de Jazz — Cobertura', en: 'Jazz Festival — Coverage' }, category: 'Eventos', image: '/hero.jpg', featured: false },
  { title: { es: 'Startup — Demo Day Stream', en: 'Startup — Demo Day Stream' }, category: 'Streaming', image: '/hero.jpg', featured: false },
];

/** Sync access to mock projects */
export const projects = mockProjects;

/** Fetch all portfolio projects — WordPress or mock fallback */
export async function getPortfolioProjectsAsync(): Promise<PortfolioProject[]> {
  if (!isWPEnabled()) return mockProjects;
  try {
    const wpProjects = await wpGetPortfolio();
    return wpProjects.length > 0 ? wpProjects : mockProjects;
  } catch (e) {
    console.warn('[portfolio] WP fetch failed, using mock data:', e);
    return mockProjects;
  }
}

/** Get featured portfolio projects (for home page) */
export async function getFeaturedProjectsAsync(): Promise<PortfolioProject[]> {
  const all = await getPortfolioProjectsAsync();
  return all.filter((p) => p.featured).slice(0, 3);
}
