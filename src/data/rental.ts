/**
 * Rental catalog data — async facade with WordPress headless CMS + mock fallback.
 * When WP_API_URL is set, fetches from WordPress REST API at build time.
 * Otherwise, uses the mock data below for local development.
 *
 * Business logic (discountTiers, getDiscountedPrice) always stays local.
 */
import {
  isWPEnabled,
  getRentalCategories as wpGetCategories,
  getRentalPacks as wpGetPacks,
} from '@/lib/wp-client';

export interface RentalProduct {
  slug: string;
  name: string;
  description: { es: string; en: string };
  price: number;
  image: string;
  specs: { es: string[]; en: string[] };
  category: string;
}

export interface RentalCategory {
  slug: { es: string; en: string };
  name: { es: string; en: string };
  description: { es: string; en: string };
  icon: string;
  products: RentalProduct[];
}

export const categories: RentalCategory[] = [
  {
    slug: { es: 'camaras', en: 'cameras' },
    name: { es: 'Cámaras', en: 'Cameras' },
    description: {
      es: 'Cámaras de cine y vídeo profesional para cualquier tipo de producción.',
      en: 'Cinema and professional video cameras for any type of production.',
    },
    icon: '🎬',
    products: [
      {
        slug: 'sony-fx6',
        name: 'Sony FX6',
        description: {
          es: 'Cámara de cine Full Frame. Sensor 10.2 MP, S Cinetone, 4K 120fps, Dual Base ISO.',
          en: 'Full-frame cinema camera. 10.2MP sensor, S Cinetone, 4K 120fps, Dual Base ISO.',
        },
        price: 110,
        image: '/images/product-sony-fx6.png',
        specs: {
          es: ['Sensor CMOS Full Frame 4K de 10,2 MP', 'DCI 4K 60p, UHD 4K 120p', '15+ pasos de rango dinámico', 'ISO base dual: 800 / 12.800', 'Grabación interna 10 bits 4:2:2'],
          en: ['10.2MP 4K Full-Frame CMOS sensor', 'DCI 4K 60p, UHD 4K 120p', '15+ stops of dynamic range', 'Dual base ISO: 800 / 12,800', 'Internal 10-bit 4:2:2 recording'],
        },
        category: 'camaras',
      },
    ],
  },
  {
    slug: { es: 'opticas', en: 'lenses' },
    name: { es: 'Ópticas', en: 'Lenses' },
    description: {
      es: 'Objetivos de cine y fotografía profesional. Ópticas prime y zoom de alta gama.',
      en: 'Cinema and professional photography lenses. High-end prime and zoom optics.',
    },
    icon: '🔭',
    products: [
      {
        slug: 'sony-fe-16-35mm-f28-gm-ii',
        name: 'Sony FE 16-35mm F2.8 GM II',
        description: {
          es: 'Zoom gran angular f/2.8 constante con nitidez de esquina a esquina.',
          en: 'Wide-angle zoom with constant f/2.8 and corner-to-corner sharpness.',
        },
        price: 40,
        image: '/images/product-sony-16-35.png',
        specs: {
          es: ['Distancia focal: 16-35 mm', 'Apertura: f/2.8 constante', 'Full Frame montura E', 'Peso: 547 g'],
          en: ['Focal length: 16-35mm', 'Aperture: f/2.8 constant', 'Full-frame E-mount', 'Weight: 547g'],
        },
        category: 'opticas',
      },
      {
        slug: 'sony-fe-28-135mm-f4-g-oss',
        name: 'Sony FE 28-135mm F4 G OSS',
        description: {
          es: 'Zoom motorizado profesional con apertura f/4 constante y estabilización.',
          en: 'Professional power zoom with constant f/4 and stabilization.',
        },
        price: 25,
        image: '/images/product-sony-28-135.png',
        specs: {
          es: ['Distancia focal: 28-135 mm', 'Apertura: f/4 constante', 'Zoom motorizado (PZ)', 'Diseño parfocal'],
          en: ['Focal length: 28-135mm', 'Aperture: f/4 constant', 'Power Zoom (PZ)', 'Parfocal design'],
        },
        category: 'opticas',
      },
      {
        slug: 'dzofilm-pictor-20-55mm-t28',
        name: 'DZOFilm Pictor 20-55mm T2.8',
        description: {
          es: 'Zoom cinematográfico Super 35 con apertura T2.8 constante y diseño parfocal.',
          en: 'Super 35 cinema zoom with constant T2.8 and parfocal design.',
        },
        price: 45,
        image: '/images/product-dzofilm-pictor-20-55.png',
        specs: {
          es: ['Distancia focal: 20-55 mm', 'Apertura: T2.8', 'Super 35', 'Montura PL'],
          en: ['Focal length: 20-55mm', 'Aperture: T2.8', 'Super 35', 'PL mount'],
        },
        category: 'opticas',
      },
      {
        slug: 'dzofilm-vespid-50mm-t21',
        name: 'DZOFilm Vespid 50mm T2.1',
        description: {
          es: 'Prime cinematográfico Full Frame con T2.1 y bokeh suave.',
          en: 'Full-frame cinema prime with T2.1 and smooth bokeh.',
        },
        price: 45,
        image: '/images/product-dzofilm-vespid-50.png',
        specs: {
          es: ['Distancia focal: 50 mm', 'Apertura: T2.1', 'Full Frame', 'Montura PL'],
          en: ['Focal length: 50mm', 'Aperture: T2.1', 'Full-frame', 'PL mount'],
        },
        category: 'opticas',
      },
    ],
  },
  {
    slug: { es: 'estabilizacion', en: 'stabilization' },
    name: { es: 'Estabilización', en: 'Stabilization' },
    description: {
      es: 'Gimbals, trípodes y sistemas de estabilización profesional.',
      en: 'Gimbals, tripods and professional stabilization systems.',
    },
    icon: '📐',
    products: [
      {
        slug: 'zhiyun-crane-3s-pro',
        name: 'Zhiyun Crane 3S Pro',
        description: {
          es: 'Gimbal de 3 ejes para cargas pesadas hasta 6,5 kg.',
          en: '3-axis gimbal for heavy loads up to 6.5 kg.',
        },
        price: 65,
        image: '/images/product-zhiyun-crane-3s-pro.png',
        specs: {
          es: ['Carga máxima: 6,5 kg', 'Autonomía: 12 horas', 'Pantalla OLED', 'Incluye maleta rígida'],
          en: ['Max payload: 6.5 kg', 'Battery: 12 hours', 'OLED screen', 'Hard case included'],
        },
        category: 'estabilizacion',
      },
      {
        slug: 'manfrotto-mvh502a-546bk',
        name: 'Manfrotto MVH502A + 546BK',
        description: {
          es: 'Cabezal fluido y trípode profesional con base de 75 mm.',
          en: 'Fluid head and professional tripod with 75mm bowl.',
        },
        price: 25,
        image: '/images/product-manfrotto-mvh502a-546bk.png',
        specs: {
          es: ['Carga máxima: 7 kg', 'Base 75 mm', 'Arrastre ajustable', 'Aluminio'],
          en: ['Max load: 7 kg', '75mm bowl', 'Adjustable drag', 'Aluminum'],
        },
        category: 'estabilizacion',
      },
    ],
  },
  {
    slug: { es: 'accesorios', en: 'accessories' },
    name: { es: 'Accesorios', en: 'Accessories' },
    description: {
      es: 'Jaulas, brazos articulados, baterías y otros accesorios esenciales.',
      en: 'Cages, magic arms, batteries and other essential accessories.',
    },
    icon: '🔧',
    products: [
      {
        slug: 'tilta-ts-t20-b-v',
        name: 'Tilta TS-T20-B-V',
        description: {
          es: 'Jaula completa para Sony FX6 con protección 360° y placa V-Mount.',
          en: 'Complete cage for Sony FX6 with 360° protection and V-Mount plate.',
        },
        price: 10,
        image: '/images/product-tilta-ts-t20-b-v.png',
        specs: {
          es: ['Protección 360°', 'Puntos de montaje 1/4" y 3/8"', 'Riel NATO', 'Placa V-Mount'],
          en: ['360° protection', '1/4" and 3/8" mounting points', 'NATO rail', 'V-Mount plate'],
        },
        category: 'accesorios',
      },
      {
        slug: 'smallrig-magic-arm',
        name: 'SmallRig Magic Arm',
        description: {
          es: 'Brazo articulado con múltiples puntos de montaje y bloqueo seguro.',
          en: 'Articulating arm with multiple mounting points and secure locking.',
        },
        price: 3,
        image: '/images/product-smallrig-magic-arm.png',
        specs: {
          es: ['Rotación 360°', 'Tornillos 1/4"-20', 'Aluminio', 'Bloqueo central'],
          en: ['360° rotation', '1/4"-20 screws', 'Aluminum', 'Central locking'],
        },
        category: 'accesorios',
      },
      {
        slug: 'smallrig-v9s2-se',
        name: 'SmallRig V9S2 SE',
        description: {
          es: 'Batería V-Mount 99Wh con carga rápida USB-C PD y pantalla OLED.',
          en: 'V-Mount battery 99Wh with USB-C PD fast charging and OLED display.',
        },
        price: 15,
        image: '/images/product-smallrig-v9s2-se.png',
        specs: {
          es: ['Capacidad: 99Wh', 'USB-C PD 65W', 'Pantalla OLED', 'D-Tap + USB-A'],
          en: ['Capacity: 99Wh', 'USB-C PD 65W', 'OLED display', 'D-Tap + USB-A'],
        },
        category: 'accesorios',
      },
    ],
  },
  {
    slug: { es: 'monitores', en: 'monitors' },
    name: { es: 'Monitores', en: 'Monitors' },
    description: {
      es: 'Monitores de campo y grabadores profesionales para supervisión en rodaje.',
      en: 'Field monitors and professional recorders for on-set monitoring.',
    },
    icon: '🖥',
    products: [
      {
        slug: 'feelworld-lut-6s',
        name: 'FEELWORLD LUT 6S',
        description: {
          es: 'Monitor de campo 6" con 3D LUT, SDI/HDMI y 2600 nits.',
          en: '6" field monitor with 3D LUT, SDI/HDMI and 2600 nits.',
        },
        price: 17,
        image: '/images/product-feelworld-lut-6s.png',
        specs: {
          es: ['Pantalla: 6" IPS', 'Resolución: 1920x1080', 'Brillo: 2600 nits', 'SDI + HDMI'],
          en: ['Screen: 6" IPS', 'Resolution: 1920x1080', 'Brightness: 2600 nits', 'SDI + HDMI'],
        },
        category: 'monitores',
      },
      {
        slug: 'atomos-ninja-ultra',
        name: 'Atomos Ninja Ultra',
        description: {
          es: 'Monitor grabador HDR 5" con Dolby Vision y grabación ProRes RAW.',
          en: '5" HDR monitor recorder with Dolby Vision and ProRes RAW recording.',
        },
        price: 35,
        image: '/images/product-atomos-ninja-ultra.png',
        specs: {
          es: ['Pantalla: 5.2" IPS', 'Resolución: 1920x1080', 'Grabación: hasta 8K30p', 'ProRes RAW'],
          en: ['Screen: 5.2" IPS', 'Resolution: 1920x1080', 'Recording: up to 8K30p', 'ProRes RAW'],
        },
        category: 'monitores',
      },
    ],
  },
  {
    slug: { es: 'audio', en: 'audio' },
    name: { es: 'Audio', en: 'Audio' },
    description: {
      es: 'Micrófonos inalámbricos, cañón y sistemas de grabación de audio profesional.',
      en: 'Wireless microphones, shotgun mics and professional audio recording systems.',
    },
    icon: '🎤',
    products: [
      {
        slug: 'sennheiser-avx-mke2-set',
        name: 'Sennheiser AVX-MKE2 SET',
        description: {
          es: 'Sistema inalámbrico digital con lavalier MKE2 y receptor PlugON.',
          en: 'Digital wireless system with MKE2 lavalier and PlugON receiver.',
        },
        price: 35,
        image: '/images/product-sennheiser-avx-mke2-set.png',
        specs: {
          es: ['Lavalier MKE2 omnidireccional', 'Cifrado AES 256', 'Autonomía: 15h', '1880-1930 MHz'],
          en: ['Omnidirectional MKE2 lavalier', 'AES 256 encryption', 'Battery: 15h', '1880-1930 MHz'],
        },
        category: 'audio',
      },
      {
        slug: 'audio-technica-at897',
        name: 'Audio-Technica AT897',
        description: {
          es: 'Micrófono cañón condensador direccional para cine y televisión.',
          en: 'Directional condenser shotgun microphone for film and TV.',
        },
        price: 20,
        image: '/images/product-audio-technica-at897.png',
        specs: {
          es: ['Respuesta: 20Hz - 20kHz', 'Filtro paso alto 80Hz', 'Peso: 145 g', 'Incluye paravientos'],
          en: ['Response: 20Hz - 20kHz', 'High-pass filter 80Hz', 'Weight: 145g', 'Windscreen included'],
        },
        category: 'audio',
      },
      {
        slug: 'rode-wireless-pro',
        name: 'Rode Wireless Pro',
        description: {
          es: 'Sistema inalámbrico 2 canales con grabación interna y timecode.',
          en: '2-channel wireless system with internal recording and timecode.',
        },
        price: 25,
        image: '/images/product-rode-wireless-pro.png',
        specs: {
          es: ['2 canales', 'Alcance: 260 m', 'Memoria: 32 GB', 'Timecode SMPTE'],
          en: ['2 channels', 'Range: 260m', 'Memory: 32GB', 'SMPTE timecode'],
        },
        category: 'audio',
      },
    ],
  },
];

/** Multi-day discount tiers */
export interface DiscountTier {
  days: number;
  label: { es: string; en: string };
  discount: number; // percentage
}

export const discountTiers: DiscountTier[] = [
  { days: 1, label: { es: '1 día', en: '1 day' }, discount: 0 },
  { days: 3, label: { es: '3 días', en: '3 days' }, discount: 10 },
  { days: 5, label: { es: '5 días', en: '5 days' }, discount: 15 },
  { days: 7, label: { es: '1 semana', en: '1 week' }, discount: 20 },
];

/** Calculate discounted price for a product */
export function getDiscountedPrice(basePrice: number, days: number): number {
  const tier = [...discountTiers].reverse().find((t) => days >= t.days);
  if (!tier || tier.discount === 0) return basePrice * days;
  const discounted = basePrice * (1 - tier.discount / 100);
  return Math.round(discounted * days);
}

/** Equipment packs — themed bundles combining products from different categories */

export interface RentalPack {
  slug: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  items: string[]; // product slugs
  dailyPrice: number;
  savings: number; // percentage discount vs individual rental
}

export const packs: RentalPack[] = [
  {
    slug: 'pack-documental',
    name: { es: 'Pack Documental', en: 'Documentary Pack' },
    description: {
      es: 'Todo lo necesario para un documental profesional: cámara, óptica zoom de cine, trípode, audio inalámbrico y monitor de campo.',
      en: 'Everything you need for a professional documentary: camera, cinema zoom lens, tripod, wireless audio and field monitor.',
    },
    items: ['sony-fx6', 'dzofilm-pictor-20-55mm-t28', 'manfrotto-mvh502a-546bk', 'sennheiser-avx-mke2-set', 'feelworld-lut-6s'],
    dailyPrice: 195,
    savings: 15,
  },
  {
    slug: 'pack-corporativo',
    name: { es: 'Pack Corporativo', en: 'Corporate Pack' },
    description: {
      es: 'Kit compacto para vídeo corporativo y entrevistas: cámara, zoom versátil, gimbal, micro inalámbrico dual y batería extra.',
      en: 'Compact kit for corporate video and interviews: camera, versatile zoom, gimbal, dual wireless mic and extra battery.',
    },
    items: ['sony-fx6', 'sony-fe-28-135mm-f4-g-oss', 'zhiyun-crane-3s-pro', 'rode-wireless-pro', 'smallrig-v9s2-se'],
    dailyPrice: 210,
    savings: 12,
  },
  {
    slug: 'pack-videoclip',
    name: { es: 'Pack Videoclip', en: 'Music Video Pack' },
    description: {
      es: 'Equipamiento cinematográfico para videoclips: cámara, prime 50mm, zoom gran angular, gimbal, jaula completa y monitor grabador.',
      en: 'Cinematic equipment for music videos: camera, 50mm prime, wide zoom, gimbal, full cage and monitor recorder.',
    },
    items: ['sony-fx6', 'dzofilm-vespid-50mm-t21', 'sony-fe-16-35mm-f28-gm-ii', 'zhiyun-crane-3s-pro', 'tilta-ts-t20-b-v', 'atomos-ninja-ultra'],
    dailyPrice: 275,
    savings: 10,
  },
];

/** Get pack with resolved product details */
export function getPackWithProducts(pack: RentalPack) {
  const allProducts = getAllProducts();
  const products = pack.items
    .map((slug) => allProducts.find((p) => p.slug === slug))
    .filter(Boolean) as RentalProduct[];
  const individualTotal = products.reduce((sum, p) => sum + p.price, 0);
  return { ...pack, products, individualTotal };
}

/** Get all categories */
export function getCategories() {
  return categories;
}

/** Get a category by slug */
export function getCategoryBySlug(slug: string, locale: 'es' | 'en') {
  return categories.find((c) => c.slug[locale] === slug);
}

/** Get a product by slug within a category */
export function getProductBySlug(categorySlug: string, productSlug: string, locale: 'es' | 'en') {
  const cat = getCategoryBySlug(categorySlug, locale);
  return cat?.products.find((p) => p.slug === productSlug);
}

/** Get all products flat */
export function getAllProducts() {
  return categories.flatMap((c) => c.products);
}

/** Get featured products (most expensive first, top 6) */
export function getFeaturedProducts() {
  return getAllProducts()
    .sort((a, b) => b.price - a.price)
    .slice(0, 6);
}

// ---------- Async facade (WP + mock fallback) ----------

/** Fetch all rental categories with products — WordPress or mock fallback */
export async function getCategoriesAsync(): Promise<RentalCategory[]> {
  if (!isWPEnabled()) return categories;
  try {
    const wpCats = await wpGetCategories();
    return wpCats.length > 0 ? wpCats : categories;
  } catch (e) {
    console.warn('[rental] WP categories fetch failed, using mock data:', e);
    return categories;
  }
}

/** Fetch all rental packs — WordPress or mock fallback */
export async function getPacksAsync(): Promise<RentalPack[]> {
  if (!isWPEnabled()) return packs;
  try {
    const wpPacks = await wpGetPacks();
    return wpPacks.length > 0 ? wpPacks : packs;
  } catch (e) {
    console.warn('[rental] WP packs fetch failed, using mock data:', e);
    return packs;
  }
}

/** Get all products flat — async version */
export async function getAllProductsAsync(): Promise<RentalProduct[]> {
  const cats = await getCategoriesAsync();
  return cats.flatMap((c) => c.products);
}

/** Get featured products — async version */
export async function getFeaturedProductsAsync(): Promise<RentalProduct[]> {
  const all = await getAllProductsAsync();
  return all.sort((a, b) => b.price - a.price).slice(0, 6);
}
