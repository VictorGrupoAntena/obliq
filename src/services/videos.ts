const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lz-zL2xB_wQLIeeKUblTlqRRo68qkHwRgx8w8G0CPWQ/gviz/tq?tqx=out:json';

// En SSR: llamar directamente al Google Sheets
// En cliente: usar la API interna
function getVideosURL() {
  if (typeof window === 'undefined') {
    // Servidor: ir directo al Sheet
    return SHEET_URL;
  }
  // Cliente: usar API interna
  return '/api/videos/all.json';
}

export async function getAllVideos() {
  try {
    const url = getVideosURL();
    const response = await fetch(url);
    
    // Si viene del Sheet, necesitamos parsear el formato especial
    if (url === SHEET_URL) {
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      const videos = json.table.rows.map((row: any) => {
        const cols = row.c;
        const videoId = cols[2]?.v || '';
        return {
          slug: cols[0]?.v || '',
          title: cols[1]?.v || '',
          videoId: videoId,
          client: cols[3]?.v || '',
          date: cols[4]?.v || '',
          thumbnail: `https://i.vimeocdn.com/video/${videoId}-d_640`,
          image: `https://i.vimeocdn.com/video/${videoId}-d_1440`,
        };
      });
      
      return videos;
    }
    
    // Si viene de la API interna, ya está procesado
    return await response.json();
  } catch (err) {
    console.error('Error fetching videos:', err);
    return [];
  }
}

export async function getVideoBySlug(slug: string) {
  try {
    // Siempre usar la API interna para slug específico
    const response = await fetch(`/api/videos/${slug}.json`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching video with slug ${slug}:`, err);
    return null;
  }
}

export async function getFirstVideoByDirector(director: string) {
  try {
    const videos = await getAllVideos();
    const filteredVideos = videos.filter((video: any) =>
      video.client.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim() ===
      director.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
    );
    return filteredVideos.length > 0 ? filteredVideos[0] : null;
  } catch (err) {
    console.error(`Error fetching first video for director ${director}:`, err);
    return null;
  }
}
