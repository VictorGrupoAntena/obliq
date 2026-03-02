/**
 * Team/Directors data — async facade with WordPress headless CMS + mock fallback.
 */
import {
  isWPEnabled,
  getDirectors as wpGetDirectors,
  type DirectorData,
} from '@/lib/wp-client';

export type { DirectorData };

// Mock data — matches current inline data in nosotros.astro
const mockTeam: DirectorData[] = [
  { name: 'Carlos Martínez', role: { es: 'Director Creativo', en: 'Creative Director' } },
  { name: 'Ana García', role: { es: 'Productora Ejecutiva', en: 'Executive Producer' } },
  { name: 'David López', role: { es: 'Director de Fotografía', en: 'Director of Photography' } },
  { name: 'Laura Fernández', role: { es: 'Editora Senior', en: 'Senior Editor' } },
];

/** Sync access to mock team */
export const team = mockTeam;

/** Fetch all team members — WordPress or mock fallback */
export async function getTeamAsync(): Promise<DirectorData[]> {
  if (!isWPEnabled()) return mockTeam;
  try {
    const wpTeam = await wpGetDirectors();
    return wpTeam.length > 0 ? wpTeam : mockTeam;
  } catch (e) {
    console.warn('[team] WP fetch failed, using mock data:', e);
    return mockTeam;
  }
}
