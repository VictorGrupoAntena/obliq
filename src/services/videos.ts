import { getVideosFromSheet, generateSlug } from '@/lib/sheets';

export async function getAllVideos() {
  try {
    return await getVideosFromSheet();
  } catch (err) {
    console.error('Error fetching videos:', err);
    return [];
  }
}

export async function getVideoBySlug(slug: string) {
  try {
    const videos = await getVideosFromSheet();
    return videos.find((v) => v.slug === slug) ?? null;
  } catch (err) {
    console.error(`Error fetching video with slug ${slug}:`, err);
    return null;
  }
}

export async function getFirstVideoByDirector(director: string) {
  try {
    const videos = await getVideosFromSheet();
    const normalizedDirector = generateSlug(director);
    return videos.find((v) => generateSlug(v.client) === normalizedDirector) ?? null;
  } catch (err) {
    console.error(`Error fetching first video for director ${director}:`, err);
    return null;
  }
}
