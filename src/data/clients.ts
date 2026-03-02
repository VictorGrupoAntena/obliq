/**
 * Client brands data — async facade with WordPress headless CMS + mock fallback.
 */
import {
  isWPEnabled,
  getClients as wpGetClients,
  type ClientData,
} from '@/lib/wp-client';

export type { ClientData };

// Mock data — sourced from brands.json + nosotros.astro inline data
const mockClients: ClientData[] = [
  { name: 'MasterChef World', order: 1 },
  { name: 'Geekom', order: 2 },
  { name: 'Samsung', order: 3 },
  { name: 'Womenalia', order: 4 },
  { name: 'Nacavi', order: 5 },
  { name: 'Resort Las Palmeras', order: 6 },
  { name: 'Gamez studio', order: 7 },
  { name: 'Elixir Games', order: 8 },
  { name: 'Own', order: 9 },
  { name: 'Dream hack', order: 10 },
  { name: 'GG Tech', order: 11 },
  { name: 'Guasones', order: 12 },
  { name: 'Room mate', order: 13 },
];

/** Sync access to mock clients */
export const clients = mockClients;

/** Get client names as string array (for marquees) */
export function getClientNames(): string[] {
  return mockClients.map((c) => c.name);
}

/** Fetch all clients — WordPress or mock fallback */
export async function getClientsAsync(): Promise<ClientData[]> {
  if (!isWPEnabled()) return mockClients;
  try {
    const wpClients = await wpGetClients();
    return wpClients.length > 0 ? wpClients : mockClients;
  } catch (e) {
    console.warn('[clients] WP fetch failed, using mock data:', e);
    return mockClients;
  }
}

/** Get client names as string array — async version */
export async function getClientNamesAsync(): Promise<string[]> {
  const all = await getClientsAsync();
  return all.map((c) => c.name);
}
