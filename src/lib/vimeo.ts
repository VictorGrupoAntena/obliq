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

/**
 * URL de embed para vídeo de FONDO (hero de la home).
 *
 * NO confundir con getVimeoEmbedUrl (lightbox del portfolio): allí el vídeo se
 * reproduce con sonido y con controles porque el usuario lo ha pedido; aquí es
 * decorativo y debe ser mudo, en bucle y sin UI.
 *
 * `background=1` ya implica muted + loop + sin controles, pero se pasan también
 * explícitos: si Vimeo cambiara el comportamiento del flag, el fondo seguiría
 * sin sonido ni botones. `autopause=0` evita que el player se detenga solo
 * cuando otro vídeo de Vimeo arranca en la misma pestaña.
 *
 * OJO: `background=1` es una función de los planes Vimeo Plus/Pro en adelante.
 * En una cuenta Basic el vídeo se sirve igualmente, pero con la UI del player
 * encima.
 */
export function getVimeoBackgroundUrl(url: string): string | null {
  const ref = parseVimeoUrl(url);
  if (!ref) return null;
  const params = new URLSearchParams({
    ...(ref.hash && { h: ref.hash }), // hash de privacidad (vídeos no listados)
    background: '1',
    autoplay: '1',
    loop: '1',
    muted: '1',
    autopause: '0',
    controls: '0',
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

// ---------- Thumbnail grande para el hero ----------

/**
 * Ancho del thumbnail del hero, en píxeles.
 *
 * oEmbed nunca devuelve más de 1280 de ancho pida lo que pida, pero la URL que
 * entrega apunta al CDN con un token de tamaño (`-d_1280`) que SÍ acepta
 * valores mayores: 1920, 2560 y 3840 responden 200 con la imagen a ese tamaño.
 *
 * 2560 y no 3840 a propósito: esta imagen es el elemento LCP —lo primero que se
 * pinta— y pesa 202 KB frente a los 337 KB de la 4K. Va bajo un degradado
 * oscuro y la sustituye el vídeo a los ~1,8 s, así que el salto a 4K no se
 * percibe y sí se paga. (759×506 y 61 KB era el hero.jpg que sustituye.)
 */
const HERO_THUMB_WIDTH = 2560;

const heroThumbnailCache = new Map<string, string | null>();

/**
 * Thumbnail del vídeo del hero a resolución alta.
 *
 * Es la capa previa del hero: el propio vídeo detenido en su primer fotograma,
 * en vez de una imagen ajena. Así la previsualización estática y el vídeo ya en
 * marcha son la misma imagen y el arranque no da un salto perceptible.
 *
 * El truco del token `-d_NNNN` NO está documentado por Vimeo, así que no se da
 * por bueno: se pide la variante grande y se COMPRUEBA que responde antes de
 * usarla. Si Vimeo cambiara el formato de sus URLs, esto degrada solo al
 * thumbnail que da oEmbed, y de ahí al fallback del caller.
 *
 * Se resuelve en BUILD (como el resto de thumbnails): una petición en runtime
 * volvería a meter espera, que es justo lo que se quiere quitar.
 */
export async function getVimeoHeroThumbnail(url: string): Promise<string | null> {
  const ref = parseVimeoUrl(url);
  if (!ref) return null;

  const key = ref.hash ? `${ref.id}/${ref.hash}` : ref.id;
  if (heroThumbnailCache.has(key)) return heroThumbnailCache.get(key)!;

  const base = await getVimeoThumbnail(url);
  if (!base) {
    heroThumbnailCache.set(key, null);
    return null;
  }

  // `https://i.vimeocdn.com/video/<id>-<hash>-d_1280?region=us`
  //                                            ^^^^^ token de tamaño
  const grande = base.replace(/-d_\d+(?=$|\?)/, `-d_${HERO_THUMB_WIDTH}`);

  let elegida = base; // si no se puede ampliar, el de oEmbed sigue sirviendo
  if (grande !== base) {
    try {
      const res = await fetch(grande, { method: 'HEAD' });
      if (res.ok) {
        elegida = grande;
      } else {
        console.warn(`[vimeo] thumbnail a ${HERO_THUMB_WIDTH}px devolvió ${res.status}; se usa el de oEmbed`);
      }
    } catch (e) {
      console.warn(`[vimeo] no se pudo comprobar el thumbnail a ${HERO_THUMB_WIDTH}px; se usa el de oEmbed:`, e);
    }
  }

  heroThumbnailCache.set(key, elegida);
  return elegida;
}
