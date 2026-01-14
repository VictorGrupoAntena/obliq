import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
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

    const items = await Promise.all(
      rows.map(async (row: any) => {
        const title = row['Title'] || '';
        const slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        const videoUrl = row['Url'] || '';
        const videoIdMatch = videoUrl.match(/(?:vimeo\.com\/(?:video\/)?|^)(\d+)/);
        const videoId = videoIdMatch?.[1];

        let thumbnail = '';
        let image = '';

        if (videoId) {
          try {
            const vimeoRes = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
            const vimeoData = await vimeoRes.json();
            thumbnail = vimeoData[0]?.thumbnail_large || '';
            image = vimeoData[0]?.thumbnail_large.replace("640", "1440") || '';
          } catch (err) {
            console.warn(`No se pudo obtener imagen de Vimeo para el video ID: ${videoId}`);
          }
        }

        let formattedDate = '';

        if (row["Date"]) {
          const match = row["Date"].match(/Date\((\d+),(\d+),(\d+)\)/);
          if (match) {
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            formattedDate = date.toLocaleDateString('es-ES', {
              month: "long",
              year: "numeric",
            }).replace(" de ", ", ");
          }
        }

        return {
          slug,
          title,
          videoId: videoId,
          client: row['Director'] || '',
          date: formattedDate || '',
          thumbnail,
          image,
        };
      })
    );

    const item = items.find((el) => el.slug === params.slug);

    if (!item) {
      return new Response(
        JSON.stringify({ error: 'No se encontró ningún proyecto con ese slug' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(item), {
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
