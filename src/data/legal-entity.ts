/**
 * Identidad jurídica del titular del sitio — FUENTE ÚNICA.
 *
 * Antes de este fichero, la razón social estaba escrita a mano en CINCO sitios
 * repartidos en tres ficheros (`aviso-legal.astro` ×3, `politica-privacidad.astro`
 * y `schema.ts`), y el domicilio en cuatro más. Por eso el aviso legal pudo estar
 * un mes identificando mal al titular sin que nadie lo viera: no había un sitio
 * donde mirar, había cinco donde no mirar. Ver el Bloque 1 de
 * `docs/audits/legal-pendiente-revision.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DOS DIRECCIONES DISTINTAS QUE HOY COINCIDEN — no las fundas
 * ─────────────────────────────────────────────────────────────────────────────
 * · El **domicilio social** vive AQUÍ. Es un dato registral: lo fija la escritura
 *   y solo cambia ante notario. Es lo que exige el art. 10 LSSI en el aviso legal.
 * · La **dirección de contacto** vive en WordPress (`ct_address_*` → `site.ts`).
 *   Es la oficina donde se trabaja y la edita el cliente cuando quiera.
 *
 * Hoy son la misma calle, y por eso resultaba tentador tener un solo dato. Pero es
 * habitual que una sociedad esté domiciliada en su gestoría y no donde trabaja: si
 * la nota simple trae una dirección distinta, un sitio que los tenga fundidos se ve
 * obligado a elegir cuál de los dos publica mal. Separados, puede decir los dos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE FALTA Y POR QUÉ NO SE RELLENA A OJO
 * ─────────────────────────────────────────────────────────────────────────────
 * El aviso legal publicado dice «Obliq Audiovisual SL». El sitio anterior decía
 * «ACMG AGENCY S.L.». **El CIF es el mismo en las dos**, así que una de las dos
 * denominaciones es falsa y no hay forma de saber cuál sin el Registro Mercantil.
 * Elegir la que ya está publicada no es un dato: es repetir la apuesta.
 *
 * **Resuelto el 9-sep-2026 con la nota simple**: la denominación vigente es
 * `AC MG AGENCY, S.L.` — luego «Obliq Audiovisual SL», que llevaba publicado desde
 * el rediseño, era la incorrecta. Con ella llegó el domicilio social.
 *
 * **Queda uno, aplazado por decisión de Víctor:** los datos de inscripción
 * registral (tomo, folio, hoja), que el art. 10.1.a exige igual que la
 * denominación. Riesgo conocido y asumido. Mientras `registryEntry` sea `null`, la
 * línea no se imprime; en cuanto se rellene aquí, aparece sola en el aviso legal.
 * Ningún otro fichero se toca.
 */

/** Datos de inscripción en el Registro Mercantil (art. 10.1.a LSSI). */
export interface RegistryEntry {
  /** Registro Mercantil competente. Ej.: «Registro Mercantil de Valencia». */
  registry: string;
  volume: string;
  folio: string;
  sheet: string;
}

/** Domicilio SOCIAL — el registral, no el de contacto. */
export interface RegisteredOffice {
  street: string;
  postalCode: string;
  city: string;
}

export interface LegalEntity {
  /** Marca comercial. Es lo que el público conoce y lo que va en `name`. */
  brandName: string;
  /**
   * Denominación social registral, exacta. `null` mientras no haya nota simple.
   * NO se rellena con ninguna de las dos grafías que circulan.
   */
  legalName: string | null;
  /** NIF/CIF. El único dato de identidad verificado: coincide en ambas fuentes. */
  taxId: string;
  /** Domicilio social. `null` mientras no haya nota simple. */
  registeredOffice: RegisteredOffice | null;
  /** Tomo, folio y hoja. `null`: nunca han estado publicados, y el art. 10 los exige. */
  registryEntry: RegistryEntry | null;
  /** Fuero al que remiten los textos legales. */
  jurisdiction: string;
}

export const LEGAL_ENTITY: LegalEntity = {
  brandName: 'Obliq Productions',
  // Nota simple del Registro Mercantil, 9-sep-2026. Copiada TAL CUAL: el espacio
  // entre «AC» y «MG» y la coma antes de «S.L.» son parte de la denominación
  // inscrita. Normalizarla —quitar la coma, juntar «ACMG»— la convertiría en otra
  // cadena, y el art. 10 LSSI pide la exacta. No la «arregles».
  legalName: 'AC MG AGENCY, S.L.',
  taxId: 'B19377019',
  registeredOffice: {
    street: 'Calle Pintor Navarro Llorens 3, bajo izquierda',
    postalCode: '46008',
    city: 'Valencia',
  },
  // APLAZADO por decisión de Víctor (9-sep-2026). Riesgo conocido y asumido: el
  // art. 10.1.a los exige. Mientras sea `null`, la línea NO se imprime — ver
  // `DATO_PENDIENTE` más abajo. En cuanto se rellene, aparece sola.
  registryEntry: null,
  jurisdiction: 'Valencia',
};

/**
 * Lo que se imprime donde falta un dato que **antes estaba publicado**.
 *
 * ⚠️ **Regla corregida el 9-sep-2026.** Antes decía que toda laguna debía verse,
 * porque «una laguna marcada es honesta». Era cierto **mientras la alternativa
 * era no desplegar nada**: con el titular y el domicilio equivocados en la web, un
 * hueco marcado era mejor que un dato falso.
 *
 * Ya no. Con el titular y el domicilio correctos, imprimir «pendiente de
 * verificación registral» en la única línea que falta **convierte una ausencia que
 * hoy no ve nadie en una declaración pública de trabajo a medias**, en una web que
 * exhibe los emblemas de red.es y de la Unión Europea. La página legal del cliente
 * no es nuestra lista de tareas.
 *
 * El criterio que queda, y que distingue los dos casos:
 *
 * · **Dato que YA estaba publicado** (Titular, Domicilio social) → si faltara, se
 *   marca. Callar sería peor: el lector vería desaparecer una línea que estaba.
 * · **Dato que NUNCA se publicó** (datos registrales) → **se omite la línea
 *   entera** hasta tenerlo. Omitirla mantiene exactamente el estado actual.
 *
 * Y en el JSON-LD **nunca se emite nada** (ver `schema.ts`): un marcador ahí lo
 * indexarían los buscadores como si fuera la denominación de la empresa.
 */
export const DATO_PENDIENTE = 'pendiente de verificación registral';

/** El valor, o el marcador de hueco si todavía no lo tenemos. */
export function orPending(value: string | null | undefined): string {
  return value ?? DATO_PENDIENTE;
}

/** «C/ … , 46008 Valencia», o el marcador si no hay domicilio social confirmado. */
export function registeredOfficeLine(entity: LegalEntity = LEGAL_ENTITY): string {
  const o = entity.registeredOffice;
  if (!o) return DATO_PENDIENTE;
  const locality = [o.postalCode, o.city].filter(Boolean).join(' ');
  return [o.street, locality].filter(Boolean).join(', ');
}

/** «Registro Mercantil de Valencia, tomo X, folio Y, hoja Z», o el marcador. */
export function registryEntryLine(entity: LegalEntity = LEGAL_ENTITY): string {
  const r = entity.registryEntry;
  if (!r) return DATO_PENDIENTE;
  return `${r.registry}, tomo ${r.volume}, folio ${r.folio}, hoja ${r.sheet}`;
}
