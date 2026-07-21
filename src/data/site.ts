/**
 * Datos de contacto GLOBALES del sitio — facade async con WordPress headless
 * CMS y fallback a src/i18n / valores estáticos.
 *
 * Fuente: CPT `contenido`, entrada con `_obliq_key = 'contact'`.
 *
 * Es la única fuente de verdad para email / teléfono / WhatsApp / dirección.
 * La consumen: la página de contacto (ES/EN), el pie de página, el botón
 * flotante de WhatsApp y el JSON-LD LocalBusiness. Antes cada uno los tenía
 * hardcodeados por su cuenta, así que cambiar un teléfono eran 6 ficheros.
 *
 * NO cubre el formulario de contacto ni su antispam, ni las páginas legales.
 */
import { isWPEnabled, getContenido, wpText } from '@/lib/wp-client';
import { t } from '@/lib/i18n';

export interface SiteContact {
  /** Textos de la página de contacto */
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  infoTitle: string;
  hours: string;
  /** Datos de contacto */
  email: string;
  /** Teléfono tal y como se muestra, p. ej. "+34 675 489 980" */
  phone: string;
  /** El mismo teléfono sin espacios, para href="tel:" y para schema.org */
  phoneTel: string;
  /** Solo dígitos con prefijo de país, para wa.me */
  whatsapp: string;
  /** Dirección compuesta para mostrar: "calle, CP ciudad" */
  address: string;
  /** Partes atómicas — las necesita el JSON-LD PostalAddress */
  addressStreet: string;
  addressPostal: string;
  addressCity: string;
}

/**
 * Valores estáticos por defecto. Espejo de lo que hoy está hardcodeado en
 * src/lib/schema.ts, Footer.astro y WhatsAppFAB.astro.
 */
const DEFAULT_EMAIL = 'info@obliqproductions.com';
const DEFAULT_PHONE = '+34 675 489 980';
const DEFAULT_WHATSAPP = '34675489980';
const DEFAULT_STREET = 'C/ Pintor Navarro Llorens bajo 3';
const DEFAULT_POSTAL = '46008';
const DEFAULT_CITY = 'Valencia';

/** "C/ Pintor Navarro Llorens bajo 3, 46008 Valencia" */
function composeAddress(street: string, postal: string, city: string): string {
  const locality = [postal, city].filter(Boolean).join(' ');
  return [street, locality].filter(Boolean).join(', ');
}

function fallbackContact(locale: string): SiteContact {
  const c = t(locale).CONTACT_PAGE;
  return {
    heroTag: c.HERO_TAG,
    heroTitle: c.HERO_TITLE,
    heroSubtitle: c.HERO_SUBTITLE,
    infoTitle: c.INFO_TITLE,
    hours: c.INFO_HOURS,
    email: DEFAULT_EMAIL,
    phone: DEFAULT_PHONE,
    phoneTel: DEFAULT_PHONE.replace(/\s/g, ''),
    whatsapp: DEFAULT_WHATSAPP,
    address: composeAddress(DEFAULT_STREET, DEFAULT_POSTAL, DEFAULT_CITY),
    addressStreet: DEFAULT_STREET,
    addressPostal: DEFAULT_POSTAL,
    addressCity: DEFAULT_CITY,
  };
}

/**
 * Datos de contacto del sitio — WordPress con fallback campo a campo.
 * Si WP_API_URL no está definido, WP no responde o el JSON viene mal,
 * devuelve los valores estáticos actuales y el build sigue adelante.
 */
export async function getSiteContactAsync(locale: string): Promise<SiteContact> {
  const fallback = fallbackContact(locale);
  if (!isWPEnabled()) return fallback;

  try {
    const { contact } = await getContenido();
    if (!contact) return fallback;

    const f = (key: string) => wpText(contact, `${key}_${locale}`);

    const phone = wpText(contact, 'ct_phone') ?? fallback.phone;
    const street = wpText(contact, 'ct_address_street') ?? fallback.addressStreet;
    const postal = wpText(contact, 'ct_address_postal') ?? fallback.addressPostal;
    const city = wpText(contact, 'ct_address_city') ?? fallback.addressCity;

    return {
      heroTag: f('ct_hero_tag') ?? fallback.heroTag,
      heroTitle: f('ct_hero_title') ?? fallback.heroTitle,
      heroSubtitle: f('ct_hero_subtitle') ?? fallback.heroSubtitle,
      infoTitle: f('ct_info_title') ?? fallback.infoTitle,
      hours: f('ct_hours') ?? fallback.hours,
      email: wpText(contact, 'ct_email') ?? fallback.email,
      phone,
      phoneTel: phone.replace(/\s/g, ''),
      whatsapp: wpText(contact, 'ct_whatsapp') ?? fallback.whatsapp,
      address: composeAddress(street, postal, city),
      addressStreet: street,
      addressPostal: postal,
      addressCity: city,
    };
  } catch (e) {
    console.warn('[site] WP fetch failed, using static contact data:', e);
    return fallback;
  }
}
