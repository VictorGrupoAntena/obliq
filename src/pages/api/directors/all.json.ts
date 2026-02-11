import type { APIRoute } from 'astro';
import { getDirectorsFromSheet } from '@/lib/sheets';

export const GET: APIRoute = async () => {
  try {
    const directors = await getDirectorsFromSheet();

    return new Response(JSON.stringify({ directors }), {
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
