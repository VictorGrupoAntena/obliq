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
        const title = cols[0]?.v || '';
        const director = cols[1]?.v || '';
        const date = cols[2]?.f || cols[2]?.v || ''; // Usar formato o valor
        const vimeoUrl = cols[3]?.v || '';
        
        // Extraer videoId de la URL de Vimeo
        // URL ejemplo: https://vimeo.com/1090174353
        const videoIdMatch = vimeoUrl.match(/vimeo\.com\/(\d+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : '';
        
        // Generar slug desde el título
        const slug = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        
        return {
          slug: slug,
          title: title,
          videoId: videoId,
          client: director,
          date: date,
          thumbnail: `https://i.vimeocdn.com/video/${videoId}-d_640`,
          image: `https://i.vimeocdn.com/video/${videoId}-d_1440`,
          description_eng: '',
          description_esp: ''
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
