// Construir URL base automáticamente
function getBaseURL() {
  // En servidor (SSR): usar la URL de Vercel
  if (typeof window === 'undefined') {
    const vercelUrl = import.meta.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
    // Fallback para desarrollo local
    return 'http://localhost:4321';
  }
  // En cliente: usar la URL actual del navegador
  return window.location.origin;
}

const BASE_URL = getBaseURL();

export async function getAllVideos() {
  try {
    const url = `${BASE_URL}/api/videos/all.json`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching videos:', err);
    return [];
  }
}

export async function getVideoBySlug(slug: string) {
  try {
    const url = `${BASE_URL}/api/videos/${slug}.json`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching video with slug ${slug}:`, err);
    return null;
  }
}

export async function getFirstVideoByDirector(director: string) {
  try {
    const url = `${BASE_URL}/api/videos/all.json`;
    const response = await fetch(url);
    const data = await response.json();
    const filteredVideos = data.filter((video: any) =>
      video.client.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim() ===
      director.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
    );
    return filteredVideos.length > 0 ? filteredVideos[0] : null;
  } catch (err) {
    console.error(`Error fetching first video for director ${director}:`, err);
    return null;
  }
}
