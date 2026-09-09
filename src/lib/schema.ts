/** Schema.org JSON-LD helpers for Obliq Productions */

import { LEGAL_ENTITY } from '@/data/legal-entity';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Datos de contacto que alimentan el LocalBusiness. Provienen de
 * `src/data/site.ts`, que los lee de WordPress (`ct_*`) y ya aplica su propio
 * fallback campo a campo.
 *
 * **Obligatorios a propósito.** Antes eran opcionales y cada uno traía aquí su
 * propio literal por defecto: el teléfono, el correo y las tres partes del
 * domicilio, duplicando lo que `site.ts` ya tenía. Eran código muerto —el único
 * llamante, `BaseLayout`, siempre los pasa— pero código muerto que envejece: si
 * el cliente cambiaba la dirección en wp-admin, esta copia se quedaba con la
 * vieja y reaparecía el día que WordPress no contestara. Exigirlos aquí deja el
 * fallback en un solo sitio: `src/data/site.ts`.
 *
 * ⚠️ Que sean obligatorios avisa en el editor, **no en el build**: aquí no se
 * comprueban los tipos en ningún momento. TypeScript solo existe como dependencia
 * transitiva de Astro —no está en `node_modules/.bin/`, no es dependencia directa
 * y no hay `@astrojs/check` ni script que lo invoque—, así que un `pnpm build` en
 * verde no dice nada sobre los tipos. La red real es que el único llamante es
 * `BaseLayout` y le pasa los cinco.
 */
export interface BusinessContact {
  telephone: string;
  email: string;
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  /**
   * URL canónica de la ubicación en Google Maps. Se construye con
   * `mapsLinkUrl()` (src/lib/maps.ts) a partir de la MISMA dirección que
   * alimenta el PostalAddress de aquí abajo y el mapa de /contacto/, para que
   * las tres no puedan divergir. Es la URL de la ficha, no la del incrustado:
   * `hasMap` es un dato, no una carga de terceros, y no instala nada.
   */
  hasMap?: string;
}

export function localBusinessSchema(contact: BusinessContact) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://obliqproductions.com/#organization',
    // `name` es la MARCA, que es como se conoce al negocio. La denominación
    // registral va en `legalName`, que es el campo que schema.org define para
    // eso — y solo se emite cuando el dato es real: un marcador de hueco aquí
    // lo indexarían los buscadores como si fuera el nombre de la empresa.
    // El hueco visible vive en las páginas legales, donde se puede leer.
    name: LEGAL_ENTITY.brandName,
    ...(LEGAL_ENTITY.legalName ? { legalName: LEGAL_ENTITY.legalName } : {}),
    url: 'https://obliqproductions.com',
    logo: 'https://obliqproductions.com/logo.svg',
    image: 'https://obliqproductions.com/hero.jpg',
    telephone: contact.telephone,
    email: contact.email,
    taxID: LEGAL_ENTITY.taxId,
    // Dirección de CONTACTO (la editable en wp-admin), no el domicilio social.
    // Ver la cabecera de src/data/legal-entity.ts: son dos datos distintos.
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.streetAddress,
      addressLocality: contact.addressLocality,
      postalCode: contact.postalCode,
      addressRegion: 'Comunidad Valenciana',
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.4699,
      longitude: -0.3763,
    },
    ...(contact.hasMap ? { hasMap: contact.hasMap } : {}),
    sameAs: [
      'https://www.instagram.com/obliqproductions/',
      'https://www.tiktok.com/@obliqproductions',
      'https://vimeo.com/obliproductions',
      'https://www.linkedin.com/company/obliq-productions',
    ],
    priceRange: '€€',
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[], siteUrl = 'https://obliqproductions.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: siteUrl + item.href } : {}),
    })),
  };
}

export function serviceSchema(name: string, description: string, price?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': 'https://obliqproductions.com/#organization',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Comunidad Valenciana, España',
    },
    ...(price ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR' } } : {}),
  };
}

/**
 * Product para una ficha de alquiler.
 *
 * NO emite `offers`/`price`: el alquiler es SIEMPRE con operador (modelo
 * aditivo), de modo que el precio/día del material no es contratable por sí
 * solo. Publicar `Offer/price` con el precio pelado sería un rich snippet
 * engañoso. El único precio fijo y contratable (la tarifa de operador) se
 * publica como Service en la landing /alquiler/ (ver `rentalServiceSchema`).
 */
export function productSchema(
  name: string,
  image: string,
  specs?: Record<string, string>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    ...(specs
      ? {
          additionalProperty: Object.entries(specs).map(([name, value]) => ({
            '@type': 'PropertyValue',
            name,
            value,
          })),
        }
      : {}),
  };
}

/**
 * Service de la vertical de alquiler (landing /alquiler/).
 *
 * Publica el ÚNICO precio fijo y contratable: la tarifa de operador
 * (jornada / media jornada), leída del singleton WP — nunca hardcodeada.
 * Sustituye al `Product/offers` retirado de las fichas (D4).
 */
export function rentalServiceSchema(opts: {
  name: string;
  description: string;
  jornadaPrice: number;
  jornadaLabel: string;
  mediaPrice: number;
  mediaLabel: string;
  areaServed?: string[];
}) {
  const areas = opts.areaServed ?? ['Valencia', 'Alicante', 'Castellón'];
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': 'https://obliqproductions.com/#organization',
    },
    areaServed: areas.map((a) => ({ '@type': 'Place', name: a })),
    offers: [
      {
        '@type': 'Offer',
        name: opts.jornadaLabel,
        price: String(opts.jornadaPrice),
        priceCurrency: 'EUR',
      },
      {
        '@type': 'Offer',
        name: opts.mediaLabel,
        price: String(opts.mediaPrice),
        priceCurrency: 'EUR',
      },
    ],
  };
}
