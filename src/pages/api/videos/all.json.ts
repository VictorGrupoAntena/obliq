import { getVideosFromSheet } from '@/lib/sheets';

export async function GET() {
  try {
    const videos = await getVideosFromSheet();

    return new Response(JSON.stringify(videos), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: 'Error al procesar los datos', details: message }),
      { status: 500 }
    );
  }
}
