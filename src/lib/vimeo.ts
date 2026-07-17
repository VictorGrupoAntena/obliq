/**
 * Vimeo helpers — parsing de URLs, embed y thumbnails vía oEmbed.
 *
 * Thumbnails: se obtienen en BUILD via oEmbed público
 * (https://vimeo.com/api/oembed.json) — NO usa la API v2 deprecada ni API key.
 * Para vídeos no listados, la URL pasada a oEmbed debe incluir el hash de
 * privacidad (https://vimeo.com/{id}/{hash}), si no Vimeo responde 403.
 *
 * Caché: Map a nivel de módulo — cada vídeo se consulta UNA vez por build
 * aunque aparezca en varias páginas (portfolio ES, portfolio EN, home…).
 * Los fallos también se cachean (null) para no reintentar por página.
 */

export interface VimeoRef {
  id: string;
  hash?: string;
}

/** Parsea una URL de Vimeo → {id, hash?}. Devuelve null si no es Vimeo. */
export function parseVimeoUrl(url: string): VimeoRef | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (!match) return null;
  return { id: match[1], ...(match[2] && { hash: match[2] }) };
}

/**
 * URL de embed para el player (iframe).
 * El hash de privacidad viaja como `h=` — requerido para vídeos no listados.
 */
export function getVimeoEmbedUrl(url: string): string | null {
  const ref = parseVimeoUrl(url);
  if (!ref) return null;
  const params = new URLSearchParams({
    ...(ref.hash && { h: ref.hash }),
    autoplay: '1',
    title: '0',
    byline: '0',
    portrait: '0',
    dnt: '1', // sin cookies de tracking de Vimeo (RGPD)
  });
  return `https://player.vimeo.com/video/${ref.id}?${params.toString()}`;
}

// ---------- Thumbnails (oEmbed, build-time) ----------

const thumbnailCache = new Map<string, string | null>();

/**
 * Thumbnail del vídeo vía oEmbed. Devuelve null si falla (offline, 403, URL
 * inválida) — el caller decide el fallback. Cacheado por build.
 */
export async function getVimeoThumbnail(url: string): Promise<string | null> {
  const ref = parseVimeoUrl(url);
  if (!ref) return null;

  // Clave canónica: id/hash (la misma URL puede llegar en formatos distintos)
  const key = ref.hash ? `${ref.id}/${ref.hash}` : ref.id;
  if (thumbnailCache.has(key)) return thumbnailCache.get(key)!;

  // oEmbed exige la URL canónica del vídeo, con hash para no listados
  const videoUrl = `https://vimeo.com/${key}`;
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}&width=960`;

  let thumbnail: string | null = null;
  try {
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = (await res.json()) as { thumbnail_url?: string };
      thumbnail = data.thumbnail_url ?? null;
    } else {
      console.warn(`[vimeo] oEmbed ${res.status} para ${videoUrl}`);
    }
  } catch (e) {
    console.warn(`[vimeo] oEmbed fetch falló para ${videoUrl}:`, e);
  }

  thumbnailCache.set(key, thumbnail);
  return thumbnail;
}
