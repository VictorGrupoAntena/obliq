const VIDEOS_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1lz-zL2xB_wQLIeeKUblTlqRRo68qkHwRgx8w8G0CPWQ/gviz/tq?tqx=out:json';

export interface Video {
  slug: string;
  title: string;
  videoId: string | undefined;
  client: string;
  date: string;
  thumbnail: string;
  image: string;
}

export interface Director {
  name: string;
  thumbnail: string;
}

export function generateSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

async function fetchSheetRows(sheetUrl: string): Promise<Record<string, any>[]> {
  const res = await fetch(sheetUrl);
  const text = await res.text();

  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('No se pudo extraer el JSON del Google Sheets');
  }

  const data = JSON.parse(jsonMatch[1]);
  const headers = data.table.cols.map((col: any) => col.label);

  return data.table.rows.map((row: any) =>
    Object.fromEntries(
      row.c.map((cell: any, i: number) => [headers[i], cell?.v ?? null])
    )
  );
}

async function fetchVimeoThumbnail(videoId: string): Promise<{ thumbnail: string; image: string }> {
  try {
    const vimeoRes = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
    const vimeoData = await vimeoRes.json();
    const thumbnail = vimeoData[0]?.thumbnail_large || '';
    const image = thumbnail ? thumbnail.replace('640', '1440') : '';
    return { thumbnail, image };
  } catch {
    console.warn(`No se pudo obtener imagen de Vimeo para el video ID: ${videoId}`);
    return { thumbnail: '', image: '' };
  }
}

function parseDate(dateValue: string | null): string {
  if (!dateValue) return '';
  const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(' de ', ', ');
}

function extractVideoId(url: string): string | undefined {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|^)(\d+)/);
  return match?.[1];
}

export async function getVideosFromSheet(): Promise<Video[]> {
  const rows = await fetchSheetRows(VIDEOS_SHEET_URL);

  return Promise.all(
    rows.map(async (row) => {
      const title = row['Title'] || '';
      const slug = generateSlug(title);
      const videoUrl = row['Url'] || '';
      const videoId = extractVideoId(videoUrl);

      let thumbnail = '';
      let image = '';

      if (videoId) {
        const vimeo = await fetchVimeoThumbnail(videoId);
        thumbnail = vimeo.thumbnail;
        image = vimeo.image;
      }

      return {
        slug,
        title,
        videoId,
        client: row['Director'] || '',
        date: parseDate(row['Date']),
        thumbnail,
        image,
      };
    })
  );
}

export async function getDirectorsFromSheet(): Promise<Director[]> {
  const rows = await fetchSheetRows(VIDEOS_SHEET_URL);
  const directorMap = new Map<string, Director>();

  for (const row of rows) {
    const director = (row['Director'] || '').toLowerCase();
    const videoUrl = row['Url'] || '';

    if (!director || directorMap.has(director)) continue;

    const videoId = extractVideoId(videoUrl);
    let thumbnail = '';

    if (videoId) {
      const vimeo = await fetchVimeoThumbnail(videoId);
      thumbnail = vimeo.thumbnail;
    }

    directorMap.set(director, { name: director, thumbnail });
  }

  return Array.from(directorMap.values());
}
