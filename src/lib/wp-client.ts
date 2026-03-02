/**
 * WordPress REST API client for Obliq headless CMS.
 * Pattern based on vertex-web wp-client.ts (proven in production).
 *
 * All functions are async and meant for build-time SSG fetching.
 * When WP_API_URL is not set, callers should fall back to mock data.
 */

import type {
  WPPost,
  WPTerm,
  WPServicio,
  WPPortfolio,
  WPDirector,
  WPAlquiler,
  WPAlquilerPack,
  WPCliente,
  WPRentalCategoryTerm,
} from './wp-types';

import type { ServiceData, ServiceFeature, PricingPlan } from '@/data/services';
import type { RentalCategory, RentalProduct, RentalPack } from '@/data/rental';

// ---------- Config ----------

const WP_API_URL = import.meta.env.WP_API_URL || '';

export function isWPEnabled(): boolean {
  return WP_API_URL.length > 0;
}

// ---------- Generic fetchers (private) ----------

async function wpFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
  if (!WP_API_URL) throw new Error('WP_API_URL not configured');

  const url = new URL(`${WP_API_URL}/${endpoint}`);
  const allParams = { per_page: '100', _embed: '1', ...params };
  for (const [k, v] of Object.entries(allParams)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`WP API error: ${res.status} ${res.statusText} — ${endpoint}`);
  }
  return res.json() as Promise<T[]>;
}

async function wpFetchOne<T>(endpoint: string, slug: string): Promise<T | null> {
  const results = await wpFetch<T>(endpoint, { slug, _embed: '1' });
  return results[0] ?? null;
}

// ---------- JetEngine field helpers ----------

export function jetBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  return false;
}

export function jetMediaUrl(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'object' && value !== null && 'url' in value) {
    return (value as { url: string }).url || undefined;
  }
  return undefined;
}

export function jetNum(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function jetRepeater<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    // JetEngine sometimes returns {item-0: {...}, item-1: {...}}
    return Object.values(value) as T[];
  }
  return [];
}

function getFeaturedImage(wp: WPPost): string {
  return wp._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '/hero.jpg';
}

function getTerms(wp: WPPost, index = 0): WPTerm[] {
  return wp._embedded?.['wp:term']?.[index] ?? [];
}

// ---------- Slug → i18n key mapping ----------
// Maps WP slugs (ES) to i18n keys used in src/i18n/*.json
const SERVICE_KEY_MAP: Record<string, string> = {
  'streaming': 'STREAMING',
  'contenido-redes-sociales': 'SOCIAL_CONTENT',
  'video-corporativo': 'CORPORATE_VIDEO',
  'spots-publicitarios': 'SPOTS',
  'videoclips': 'MUSIC_VIDEOS',
  'eventos': 'EVENTS',
  'fotografia': 'PHOTOGRAPHY',
  'postproduccion': 'POST_PRODUCTION',
  'consultoria': 'CONSULTING',
};

// ---------- Transformer: Servicio ----------

function transformServiceFeatures(raw: unknown): ServiceFeature[] {
  return jetRepeater<{ title: string; description: string }>(raw).map((f) => ({
    title: f.title ?? '',
    description: f.description ?? '',
  }));
}

function transformPricingPlans(raw: unknown): PricingPlan[] {
  return jetRepeater<{ name: string; price: string; features: string; highlighted?: string }>(raw).map((p) => ({
    name: p.name ?? '',
    price: p.price ?? '',
    features: typeof p.features === 'string' ? p.features.split('\n').filter(Boolean) : [],
    highlighted: jetBool(p.highlighted),
  }));
}

function transformService(wp: WPServicio): ServiceData {
  const esSlug = wp.slug;
  const enSlug = wp.sv_slug_en || esSlug;
  const image = jetMediaUrl(wp.sv_image) ?? getFeaturedImage(wp);

  const pricingEs = transformPricingPlans(wp.sv_pricing_es);
  const pricingEn = transformPricingPlans(wp.sv_pricing_en);
  const hasPricing = pricingEs.length > 0;

  const hasCaseStudy = !!(wp.sv_case_study_title_es || wp.sv_case_study_title_en);

  return {
    key: SERVICE_KEY_MAP[esSlug] || esSlug.toUpperCase().replace(/-/g, '_'),
    slug: { es: esSlug, en: enSlug },
    image,
    longDescription: {
      es: wp.sv_long_description_es || wp.content.rendered.replace(/<[^>]*>/g, ''),
      en: wp.sv_long_description_en || '',
    },
    features: {
      es: transformServiceFeatures(wp.sv_features_es),
      en: transformServiceFeatures(wp.sv_features_en),
    },
    ...(hasPricing && {
      pricing: { es: pricingEs, en: pricingEn },
    }),
    ...(wp.sv_marquee_text_es && {
      marqueeText: {
        es: wp.sv_marquee_text_es,
        en: wp.sv_marquee_text_en || wp.sv_marquee_text_es,
      },
    }),
    ...(hasCaseStudy && {
      caseStudy: {
        title: {
          es: wp.sv_case_study_title_es ?? '',
          en: wp.sv_case_study_title_en || wp.sv_case_study_title_es || '',
        },
        description: {
          es: wp.sv_case_study_desc_es ?? '',
          en: wp.sv_case_study_desc_en || wp.sv_case_study_desc_es || '',
        },
        image: jetMediaUrl(wp.sv_case_study_image) ?? '/hero.jpg',
      },
    }),
  };
}

// ---------- Transformer: Rental ----------

function transformRentalProduct(wp: WPAlquiler, categorySlug: string): RentalProduct {
  return {
    slug: wp.al_slug || wp.slug,
    name: wp.title.rendered,
    description: {
      es: wp.al_description_es || wp.content.rendered.replace(/<[^>]*>/g, ''),
      en: wp.al_description_en || '',
    },
    price: jetNum(wp.al_price),
    image: jetMediaUrl(wp.al_image) ?? getFeaturedImage(wp),
    specs: {
      es: jetRepeater<{ spec: string }>(wp.al_specs_es).map((s) => s.spec),
      en: jetRepeater<{ spec: string }>(wp.al_specs_en).map((s) => s.spec),
    },
    category: categorySlug,
  };
}

function transformRentalCategory(
  term: WPRentalCategoryTerm,
  products: RentalProduct[]
): RentalCategory {
  const meta = term.meta ?? {};
  return {
    slug: {
      es: term.slug,
      en: meta.rc_slug_en || term.slug,
    },
    name: {
      es: term.name,
      en: meta.rc_name_en || term.name,
    },
    description: {
      es: meta.rc_description_es || term.description || '',
      en: meta.rc_description_en || '',
    },
    icon: meta.rc_icon || '',
    products,
  };
}

function transformPack(wp: WPAlquilerPack): RentalPack {
  return {
    slug: wp.ap_slug || wp.slug,
    name: {
      es: wp.title.rendered,
      en: wp.ap_name_en || wp.title.rendered,
    },
    description: {
      es: wp.ap_description_es || '',
      en: wp.ap_description_en || '',
    },
    items: jetRepeater<{ product_slug: string }>(wp.ap_items).map((i) => i.product_slug),
    dailyPrice: jetNum(wp.ap_daily_price),
    savings: jetNum(wp.ap_savings),
  };
}

// ---------- Transformer: Portfolio ----------

export interface PortfolioProject {
  title: { es: string; en: string };
  category: string;
  image: string;
  vimeoUrl?: string;
  client?: string;
  director?: string;
  year?: string;
  featured: boolean;
}

function transformPortfolio(wp: WPPortfolio): PortfolioProject {
  const terms = getTerms(wp, 0);
  const categoryName = terms[0]?.name ?? '';

  return {
    title: {
      es: wp.title.rendered,
      en: wp.pf_title_en || wp.title.rendered,
    },
    category: categoryName,
    image: jetMediaUrl(wp.pf_image) ?? getFeaturedImage(wp),
    vimeoUrl: wp.pf_vimeo_url || undefined,
    client: wp.pf_client || undefined,
    director: wp.pf_director || undefined,
    year: wp.pf_year || undefined,
    featured: jetBool(wp.pf_featured),
  };
}

// ---------- Transformer: Director ----------

export interface DirectorData {
  name: string;
  role: { es: string; en: string };
  photo?: string;
}

function transformDirector(wp: WPDirector): DirectorData {
  return {
    name: wp.title.rendered,
    role: {
      es: wp.dr_role_es || '',
      en: wp.dr_role_en || '',
    },
    photo: jetMediaUrl(wp.dr_photo) ?? getFeaturedImage(wp),
  };
}

// ---------- Transformer: Cliente ----------

export interface ClientData {
  name: string;
  logo?: string;
  order: number;
}

function transformClient(wp: WPCliente): ClientData {
  return {
    name: wp.title.rendered,
    logo: jetMediaUrl(wp.cl_logo) ?? undefined,
    order: jetNum(wp.cl_order),
  };
}

// ---------- Public API ----------

// Services
export async function getServices(): Promise<ServiceData[]> {
  const raw = await wpFetch<WPServicio>('servicio', { orderby: 'menu_order', order: 'asc' });
  return raw.map(transformService);
}

export async function getServiceBySlug(slug: string): Promise<ServiceData | null> {
  const raw = await wpFetchOne<WPServicio>('servicio', slug);
  return raw ? transformService(raw) : null;
}

// Rental Categories (with nested products)
export async function getRentalCategories(): Promise<RentalCategory[]> {
  const terms = await wpFetch<WPRentalCategoryTerm>('rental_category', { per_page: '100' });
  const allProducts = await wpFetch<WPAlquiler>('alquiler', { orderby: 'menu_order', order: 'asc' });

  return terms.map((term) => {
    const termProducts = allProducts
      .filter((p) => p.rental_category?.includes(term.id))
      .sort((a, b) => jetNum(a.al_order) - jetNum(b.al_order))
      .map((p) => transformRentalProduct(p, term.slug));
    return transformRentalCategory(term, termProducts);
  });
}

// Rental Packs
export async function getRentalPacks(): Promise<RentalPack[]> {
  const raw = await wpFetch<WPAlquilerPack>('alquiler_pack');
  return raw.map(transformPack);
}

// Portfolio
export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  const raw = await wpFetch<WPPortfolio>('portfolio');
  return raw.map(transformPortfolio);
}

// Directors / Team
export async function getDirectors(): Promise<DirectorData[]> {
  const raw = await wpFetch<WPDirector>('director');
  return raw.map(transformDirector);
}

// Clients / Brands
export async function getClients(): Promise<ClientData[]> {
  const raw = await wpFetch<WPCliente>('cliente', { orderby: 'menu_order', order: 'asc' });
  return raw.map(transformClient).sort((a, b) => a.order - b.order);
}
