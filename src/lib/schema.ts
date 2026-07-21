/** Schema.org JSON-LD helpers for Obliq Productions */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Datos de contacto que alimentan el LocalBusiness. Provienen de
 * src/data/site.ts (WordPress). Todos son opcionales: si no se pasa ninguno,
 * `localBusinessSchema()` devuelve exactamente los valores de siempre.
 */
export interface BusinessContact {
  telephone?: string;
  email?: string;
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
}

export function localBusinessSchema(contact: BusinessContact = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://obliqproductions.com/#organization',
    name: 'Obliq Audiovisual SL',
    alternateName: 'Obliq Productions',
    url: 'https://obliqproductions.com',
    logo: 'https://obliqproductions.com/logo.svg',
    image: 'https://obliqproductions.com/hero.jpg',
    telephone: contact.telephone ?? '+34675489980',
    email: contact.email ?? 'info@obliqproductions.com',
    taxID: 'B19377019',
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.streetAddress ?? 'C/ Pintor Navarro Llorens bajo 3',
      addressLocality: contact.addressLocality ?? 'Valencia',
      postalCode: contact.postalCode ?? '46008',
      addressRegion: 'Comunidad Valenciana',
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.4699,
      longitude: -0.3763,
    },
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

export function productSchema(
  name: string,
  price: string,
  image: string,
  specs?: Record<string, string>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
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
