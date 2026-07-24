/**
 * Tarifa de operador de alquiler (data layer).
 *
 * El alquiler de equipos de Obliq es SIEMPRE con operador. Esta tarifa es
 * GLOBAL (por solicitud, no por producto) y editable por el cliente desde WP
 * en el singleton `contenido` con `_obliq_key = 'alquiler'` (mu-plugin
 * scripts/obliq-cpts.php). Modelo aditivo: TOTAL = material + operador.
 *
 * Reglas de negocio (Dirección, 23-jul-2026):
 *  - A2  El build FALLA si op_jornada_price / op_media_price no resuelven a un
 *        número > 0. Sin fallback a vacío ni a 0. (Solo con WP habilitado; en
 *        dev sin WP se usa el mock, que sí resuelve.)
 *  - A2b El build emite un WARNING (no error) listando los campos que aún
 *        contienen el marcador [PENDIENTE DE CONFIRMAR CON CLIENTE].
 */

import { getContenido, isWPEnabled, wpText } from '@/lib/wp-client';

export const PENDING_MARKER = '[PENDIENTE DE CONFIRMAR CON CLIENTE]';

export interface OperatorTariff {
  /** €/jornada completa, sin IVA. */
  jornadaPrice: number;
  /** €/media jornada, sin IVA. */
  mediaPrice: number;
  /** "Qué incluye" — una línea por ítem (incluye entrega de brutos). */
  includes: { es: string[]; en: string[] };
  /** Condiciones (brutos, límite de media jornada, desplazamiento). */
  terms: { es: string; en: string };
}

/**
 * Fallback usado SOLO cuando WP no está habilitado (dev / CI local).
 * Espeja el seed del mu-plugin (obliq_contenido_seed_alquiler) para que el
 * build sin WP se reconstruya con los mismos valores. En modo WP habilitado
 * NUNCA se usa: si el singleton falta, el build falla (A2).
 */
const OPERATOR_MOCK: OperatorTariff = {
  jornadaPrice: 300,
  mediaPrice: 200,
  includes: {
    es: ['Operador profesional cualificado', 'Entrega de brutos'],
    en: ['Qualified professional operator', 'Raw footage delivery'],
  },
  terms: {
    // Texto definitivo confirmado por el cliente (23-Jul-2026). DEBE coincidir
    // literalmente con obliq_contenido_seed_alquiler() en scripts/obliq-cpts.php:
    // el mock solo es un sustituto válido si es representativo del valor de WP.
    es: 'Todos los alquileres se realizan con operador. Media jornada: 4 horas. Jornada completa: 8 horas. Entrega de brutos en 24 h desde la finalización del rodaje. Servicio disponible en toda la Comunitat Valenciana; para desplazamientos fuera de la comunidad, consúltanos.',
    en: 'All equipment rentals include an operator. Half day: 4 hours. Full day: 8 hours. Raw footage delivered within 24 hours of the end of the shoot. Available throughout the Valencian Community; for locations outside the region, get in touch.',
  },
};

function splitLines(value: string): string[] {
  return value.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** A2 — número > 0 obligatorio; si no, el build cae aquí a propósito. */
function parseOperatorPrice(raw: unknown, field: string): number {
  const n = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isFinite(n) || n <= 0) {
    throw new Error(
      `[operator] El campo «${field}» del singleton contenido.alquiler no resuelve a un número > 0 ` +
        `(valor: ${JSON.stringify(raw)}). El build se detiene: la tarifa de operador es obligatoria ` +
        `y no admite fallback a 0 ni a vacío. Revisa la entrada «Alquiler · Tarifa de operador» en WordPress.`
    );
  }
  return n;
}

/** A2b — avisa (una vez) de los campos aún provisionales. No bloquea el build. */
function warnIfPending(tariff: OperatorTariff, includesRawEs: string, includesRawEn: string): void {
  const pending: string[] = [];
  if (includesRawEs.includes(PENDING_MARKER)) pending.push('op_includes_es');
  if (includesRawEn.includes(PENDING_MARKER)) pending.push('op_includes_en');
  if (tariff.terms.es.includes(PENDING_MARKER)) pending.push('op_terms_es');
  if (tariff.terms.en.includes(PENDING_MARKER)) pending.push('op_terms_en');
  if (pending.length > 0) {
    console.warn(
      `[operator] ⚠️  Tarifa de operador con contenido PROVISIONAL sin confirmar por el cliente ` +
        `en los campos: ${pending.join(', ')}. No bloquea el build, pero es ítem BLOQUEANTE de cutover ` +
        `(ver checklist en MEMORY.md). Edítalos en WordPress → «Alquiler · Tarifa de operador».`
    );
  }
}

let tariffCache: Promise<OperatorTariff> | null = null;

/**
 * Devuelve la tarifa de operador. Memoizada a nivel de módulo: el fetch y el
 * warning ocurren UNA vez por build aunque la consuman muchas rutas.
 */
export function getOperatorTariffAsync(): Promise<OperatorTariff> {
  if (!tariffCache) {
    tariffCache = resolveOperatorTariff();
  }
  return tariffCache;
}

async function resolveOperatorTariff(): Promise<OperatorTariff> {
  if (!isWPEnabled()) {
    warnIfPending(OPERATOR_MOCK, OPERATOR_MOCK.includes.es.join('\n'), OPERATOR_MOCK.includes.en.join('\n'));
    return OPERATOR_MOCK;
  }

  const { alquiler } = await getContenido();
  if (!alquiler) {
    throw new Error(
      '[operator] No se encontró el singleton contenido.alquiler en WordPress. El build no puede ' +
        'continuar sin la tarifa de operador. Despliega el mu-plugin (scripts/obliq-cpts.php, seed v3) ' +
        'y comprueba que la entrada «Alquiler · Tarifa de operador» existe en la REST antes de construir.'
    );
  }

  const includesRawEs = wpText(alquiler, 'op_includes_es') ?? '';
  const includesRawEn = wpText(alquiler, 'op_includes_en') ?? includesRawEs;
  const termsEs = wpText(alquiler, 'op_terms_es') ?? '';
  const termsEn = wpText(alquiler, 'op_terms_en') ?? termsEs;

  const tariff: OperatorTariff = {
    jornadaPrice: parseOperatorPrice(alquiler.op_jornada_price, 'op_jornada_price'),
    mediaPrice: parseOperatorPrice(alquiler.op_media_price, 'op_media_price'),
    includes: {
      es: splitLines(includesRawEs),
      en: splitLines(includesRawEn),
    },
    terms: { es: termsEs, en: termsEn },
  };

  warnIfPending(tariff, includesRawEs, includesRawEn);
  return tariff;
}
