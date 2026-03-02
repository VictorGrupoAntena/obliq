/** Schema.org JSON-LD helpers for Obliq Productions */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://obliqproductions.com/#organization',
    name: 'Obliq Audiovisual SL',
    alternateName: 'Obliq Productions',
    url: 'https://obliqproductions.com',
    logo: 'https://obliqproductions.com/logo.svg',
    image: 'https://obliqproductions.com/hero.jpg',
    telephone: '+34675489980',
    email: 'info@obliqproductions.com',
    taxID: 'B19377019',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'C/ Pintor Navarro Llorens bajo 3',
      addressLocality: 'Valencia',
      postalCode: '46008',
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
