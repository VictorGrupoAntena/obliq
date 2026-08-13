/// <reference types="astro/client" />

/**
 * Contrato entre el bootstrap de Consent Mode del <head> (script `is:inline`,
 * sin bundling ni tipos) y el script del componente CookieConsent, que sí pasa
 * por TypeScript en modo strict. Sin estas declaraciones habría que recurrir a
 * `as any`, que el Protocolo Anti-Atajo del proyecto prohíbe.
 */

interface ObliqConsentCategories {
  analytics: boolean;
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
  interface Window {
    __obliqConsent?: ObliqConsentApi;
    /** Guard para no duplicar el listener de astro:after-swap. */
    __obliqCmpBound?: boolean;
    /** Guard para no inyectar gtag.js dos veces. */
    __obliqGaLoaded?: boolean;
  }
}

export {};
