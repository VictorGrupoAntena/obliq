/**
 * WordPress REST API response types for Obliq headless CMS.
 * All custom fields exposed via register_rest_field() at top level.
 *
 * NOTE: WP REST API returns numbers as strings. Use jetNum() to convert.
 * NOTE: Switcher fields return "true"/"false" strings. Use jetBool().
 * NOTE: Media fields return string URL or "". Use jetMediaUrl().
 */

// ---------- Base ----------

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  menu_order?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<WPTerm>>;
  };
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  meta?: Record<string, unknown>;
}

// ---------- Taxonomías ----------

export interface WPRentalCategoryTerm extends WPTerm {
  meta: {
    rc_slug_en?: string;
    rc_name_en?: string;
    rc_description_es?: string;
    rc_description_en?: string;
    rc_icon?: string;
  };
}

export interface WPPortfolioCategoryTerm extends WPTerm {
  // Standard taxonomy — name is the label (Spots, Corporativo, etc.)
}

// ---------- CPT: servicio ----------

export interface WPServicio extends WPPost {
  sv_slug_en?: string;
  sv_long_description_es?: string;
  sv_long_description_en?: string;
  sv_marquee_text_es?: string;
  sv_marquee_text_en?: string;
  sv_case_study_title_es?: string;
  sv_case_study_title_en?: string;
  sv_case_study_desc_es?: string;
  sv_case_study_desc_en?: string;
  sv_image?: unknown;
  sv_features_es?: unknown;
  sv_features_en?: unknown;
  sv_pricing_es?: unknown;
  sv_pricing_en?: unknown;
  sv_case_study_image?: unknown;
}

// ---------- CPT: portfolio ----------

export interface WPPortfolio extends WPPost {
  pf_title_en?: string;
  pf_vimeo_url?: string;
  pf_client?: string;
  pf_director?: string;
  pf_year?: string;
  pf_featured?: string;
  pf_image?: unknown;
  portfolio_category?: number[];
}

// ---------- CPT: director ----------

export interface WPDirector extends WPPost {
  dr_role_es?: string;
  dr_role_en?: string;
  dr_photo?: unknown;
}

// ---------- CPT: alquiler ----------

export interface WPAlquiler extends WPPost {
  al_slug?: string;
  al_description_es?: string;
  al_description_en?: string;
  al_price?: string | number;
  al_order?: string | number;
  al_image?: unknown;
  al_specs_es?: unknown;
  al_specs_en?: unknown;
  rental_category?: number[];
}

// ---------- CPT: alquiler_pack ----------

export interface WPAlquilerPack extends WPPost {
  ap_slug?: string;
  ap_name_en?: string;
  ap_description_es?: string;
  ap_description_en?: string;
  ap_daily_price?: string | number;
  ap_savings?: string | number;
  ap_items?: unknown;
}

// ---------- CPT: cliente ----------

export interface WPCliente extends WPPost {
  cl_order?: string | number;
  cl_logo?: unknown;
}
