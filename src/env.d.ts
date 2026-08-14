/// <reference types="astro/client" />

/**
 * Contrato entre el bootstrap de Consent Mode del <head> (script `is:inline`,
 * sin bundling ni tipos) y el script del componente CookieConsent, que sí pasa
 * por TypeScript en modo strict. Sin estas declaraciones habría que recurrir a
 * `as any`, que el Protocolo Anti-Atajo del proyecto prohíbe.
 */

interface ObliqConsentCategories {
  analytics: boolean;
  /**
   * Contenido incrustado de Google Maps. Categoría propia y no una genérica de
   * «terceros»: el consentimiento tiene que ser específico, así que un embed
   * distinto que se añada mañana exigirá su propia categoría y su propia
   * subida de CONSENT_SCHEMA. Vimeo queda fuera del CMP (usa dnt=1).
   */
  maps: boolean;
}

interface ObliqConsentRecord {
  /** Versión del esquema. Ver CONSENT_SCHEMA en src/data/analytics.ts. */
  v: number;
  /** Momento de la decisión (epoch ms). Caducidad y prueba de consentimiento. */
  ts: number;
  action: 'accept' | 'reject' | 'custom';
  categories: ObliqConsentCategories;
}

interface ObliqConsentApi {
  /** Devuelve null si no hay decisión, si el esquema no coincide o si ha caducado. */
  read(): ObliqConsentRecord | null;
  /** Persiste, aplica el `consent update` y oculta el banner. */
  save(
    categories: ObliqConsentCategories,
    action: ObliqConsentRecord['action'],
  ): ObliqConsentRecord;
  clear(): void;
}

declare global {
  /**
   * Evento que `save()` emite sobre `document` tras aplicar una decisión, con
   * el registro recién guardado en `detail`.
   *
   * Existe porque el consumidor de una categoría puede no vivir en el <head>.
   * GA no lo necesitaba: se carga desde `apply()`, dentro del propio bootstrap.
   * El mapa sí — solo existe en /contacto/, y el bootstrap del <head> NO PUEDE
   * saber en qué página está (Astro deduplica los is:inline por textContent;
   * ver el comentario largo de BaseLayout.astro). Así que la lógica vive en el
   * componente y este evento es cómo se entera de que el usuario ha decidido
   * sin recargar la página.
   *
   * Declarado en DocumentEventMap para que el listener venga tipado y no haga
   * falta un `as` en el `detail` (Protocolo Anti-Atajo).
   */
  interface DocumentEventMap {
    'obliq:consent': CustomEvent<ObliqConsentRecord>;
  }

  interface Window {
    __obliqConsent?: ObliqConsentApi;
    /** Guard para no duplicar el listener de astro:after-swap. */
    __obliqCmpBound?: boolean;
    /** Guard para no inyectar gtag.js dos veces. */
    __obliqGaLoaded?: boolean;
    /** Guard para no duplicar los listeners del mapa de /contacto/. */
    __obliqMapBound?: boolean;
  }
}

export {};
