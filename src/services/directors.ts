import { getDirectorsFromSheet } from '@/lib/sheets';

export async function getAllDirectors() {
  try {
    return await getDirectorsFromSheet();
  } catch (error) {
    console.error('Error fetching directors:', error);
    return [];
  }
}
