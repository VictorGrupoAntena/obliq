import type { APIRoute } from 'astro';
import { getVideosFromSheet } from '@/lib/sheets';

export const GET: APIRoute = async ({ params }) => {
  try {
    const videos = await getVideosFromSheet();
    const video = videos.find((v) => v.slug === params.slug);

    if (!video) {
      return new Response(
        JSON.stringify({ error: 'No se encontró ningún proyecto con ese slug' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(video), {
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
