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
