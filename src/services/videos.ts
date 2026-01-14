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
      
      const videos = await Promise.all(
        json.table.rows.map(async (row: any) => {
          const cols = row.c;
          const title = cols[0]?.v || '';
          const director = cols[1]?.v || '';
          const dateRaw = cols[2]?.v || '';
          const vimeoUrl = cols[3]?.v || '';
          
          // Extraer videoId de la URL de Vimeo
          const videoIdMatch = vimeoUrl.match(/vimeo\.com\/(\d+)/);
          const videoId = videoIdMatch ? videoIdMatch[1] : '';
          
          // Generar slug desde el título
          const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          
          // Formatear fecha
          let formattedDate = '';
          if (dateRaw) {
            const match = dateRaw.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (match) {
              const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
              formattedDate = date.toLocaleDateString('es-ES', {
                month: "long",
                year: "numeric",
              }).replace(" de ", ", ");
            }
          }
          
          // Obtener thumbnail real de Vimeo
          let thumbnail = '';
          let image = '';
          if (videoId) {
            try {
              const vimeoRes = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
              const vimeoData = await vimeoRes.json();
              thumbnail = vimeoData[0]?.thumbnail_large || '';
              image = vimeoData[0]?.thumbnail_large?.replace("640", "1440") || '';
            } catch (err) {
              console.warn(`No se pudo obtener thumbnail de Vimeo para videoId: ${videoId}`);
            }
          }
          
          return {
            slug,
            title,
            videoId,
            client: director,
            date: formattedDate,
            thumbnail,
            image,
            description_eng: '',
            description_esp: ''
          };
        })
      );
      
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
