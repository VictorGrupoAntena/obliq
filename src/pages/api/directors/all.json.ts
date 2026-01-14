import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const sheetUrl =
    'https://docs.google.com/spreadsheets/d/1lz-zL2xB_wQLIeeKUblTlqRRo68qkHwRgx8w8G0CPWQ/gviz/tq?tqx=out:json';

  const res = await fetch(sheetUrl);
  const text = await res.text();

  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
  if (!jsonMatch || !jsonMatch[1]) {
    return new Response(
      JSON.stringify({ error: 'No se pudo extraer el JSON del Google Sheets' }),
      { status: 500 }
    );
  }

  try {
    const data = JSON.parse(jsonMatch[1]);

    const headers = data.table.cols.map((col: any) => col.label);
    const rows = data.table.rows.map((row: any) =>
      Object.fromEntries(
        row.c.map((cell: any, i: number) => [headers[i], cell?.v ?? null])
      )
    );

    const directorMap = new Map();

    for (const row of rows) {
      const director = row['Director'].toLowerCase();
      const videoUrl = row['Url'] || '';

      if (!director || directorMap.has(director)) continue;

      const videoIdMatch = videoUrl.match(/(?:vimeo\.com\/(?:video\/)?|^)(\d+)/);
      const videoId = videoIdMatch?.[1];

      let thumbnail = '';

      if (videoId) {
        try {
          const vimeoRes = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
          const vimeoData = await vimeoRes.json();
          thumbnail = vimeoData[0]?.thumbnail_large || '';
        } catch (err) {
          console.warn(`No se pudo obtener thumbnail de Vimeo para el video ID: ${videoId}`);
        }
      }

      directorMap.set(director, {
        name: director,
        thumbnail,
      });
    }

    const result = {
      directors: Array.from(directorMap.values()),
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: 'Error al procesar los datos', details: message }),
      { status: 500 }
    );
  }
};
