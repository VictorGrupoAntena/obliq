const API_URL = import.meta.env.PUBLIC_API_URL;

export async function getAllVideos() {
  try {
    console.log('[DEBUG] API_URL:', API_URL);
    console.log('[DEBUG] Fetching from:', `${API_URL}videos/all.json`);
    
    const response = await fetch(`${API_URL}videos/all.json`);
    console.log('[DEBUG] Response status:', response.status);
    
    const data = await response.json();
    console.log('[DEBUG] Data length:', data.length);
    
    return data;
  } catch (err) {
    console.error('[ERROR] Error fetching videos:', err);
    return [];
  }
}

export async function getVideoBySlug(slug: string) {
  try {
    const response = await fetch(`${API_URL}videos/${slug}.json`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching video with slug ${slug}:`, err);
    return null;
  }
}

export async function getFirstVideoByDirector(director: string) {
  try {
    const response = await fetch(`${API_URL}videos/all.json`);
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
