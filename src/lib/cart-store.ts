/**
 * Cart Store — client-side quote cart with localStorage persistence.
 * Emits 'cart:updated' custom event on every change so UI components can react.
 */

const STORAGE_KEY = 'obliq-quote-cart';

export interface CartItem {
  productSlug: string;
  productName: string;
  categorySlug: string;
  price: number; // daily price (no discount)
  image: string;
  days: number; // rental days for this item
  packName?: string; // if added via a pack
}

export interface DiscountTier {
  days: number;
  discount: number; // percentage
}

const discountTiers: DiscountTier[] = [
  { days: 1, discount: 0 },
  { days: 3, discount: 10 },
  { days: 5, discount: 15 },
  { days: 7, discount: 20 },
];

export const DAY_OPTIONS = [1, 3, 5, 7];

/** Get discounted daily price for a tier */
export function getDiscountedDailyPrice(basePrice: number, days: number): number {
  const tier = [...discountTiers].reverse().find((t) => days >= t.days);
  if (!tier || tier.discount === 0) return basePrice;
  return Math.round(basePrice * (1 - tier.discount / 100) * 100) / 100;
}

/** Get total price for a product at given days */
export function getItemTotal(basePrice: number, days: number): number {
  return Math.round(getDiscountedDailyPrice(basePrice, days) * days * 100) / 100;
}

/** Get discount percentage for a tier */
export function getDiscountPercent(days: number): number {
  const tier = [...discountTiers].reverse().find((t) => days >= t.days);
  return tier?.discount ?? 0;
}

// ─── Cart CRUD ───

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: CartItem[] = JSON.parse(raw);
    // Migration: ensure all items have days field
    return items.map((item) => ({ ...item, days: item.days || 1 }));
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

export function getCart(): CartItem[] {
  return readCart();
}

export function getCount(): number {
  return readCart().length;
}

export function isInCart(slug: string): boolean {
  return readCart().some((item) => item.productSlug === slug);
}

export function addToCart(item: CartItem): void {
  const cart = readCart();
  if (cart.some((i) => i.productSlug === item.productSlug)) return;
  cart.push({ ...item, days: item.days || 1 });
  writeCart(cart);
}

export function removeFromCart(slug: string): void {
  const cart = readCart().filter((i) => i.productSlug !== slug);
  writeCart(cart);
}

export function toggleCart(item: CartItem): boolean {
  if (isInCart(item.productSlug)) {
    removeFromCart(item.productSlug);
    return false; // removed
  }
  addToCart(item);
  return true; // added
}

export function clearCart(): void {
  writeCart([]);
}

// ─── Per-item days ───

export function setItemDays(slug: string, days: number): void {
  const cart = readCart();
  const item = cart.find((i) => i.productSlug === slug);
  if (item) {
    item.days = days;
    writeCart(cart);
  }
}

// ─── Pack support ───

export function addPack(packName: string, products: Omit<CartItem, 'days' | 'packName'>[]): void {
  const cart = readCart();
  let changed = false;
  for (const product of products) {
    if (!cart.some((i) => i.productSlug === product.productSlug)) {
      cart.push({ ...product, days: 1, packName });
      changed = true;
    }
  }
  if (changed) writeCart(cart);
}

export function isPackInCart(packName: string, productSlugs: string[]): boolean {
  const cart = readCart();
  return productSlugs.every((slug) => cart.some((i) => i.productSlug === slug));
}

/** Set days for all items in a pack at once */
export function setPackDays(packName: string, days: number): void {
  const cart = readCart();
  let changed = false;
  cart.forEach((item) => {
    if (item.packName === packName) {
      item.days = days;
      changed = true;
    }
  });
  if (changed) writeCart(cart);
}

/** Remove all items belonging to a pack */
export function removePackFromCart(packName: string): void {
  const cart = readCart().filter((i) => i.packName !== packName);
  writeCart(cart);
}

/** Get pack daily total (sum of all items' daily prices) */
export function getPackDailyTotal(packName: string): number {
  const cart = readCart();
  return cart.filter((i) => i.packName === packName).reduce((sum, i) => sum + i.price, 0);
}

// ─── Totals ───

export function getTotal(): number {
  const cart = readCart();
  return cart.reduce((sum, item) => sum + getItemTotal(item.price, item.days), 0);
}

// ── Quote page helpers ──

/** Get the quote page URL for the current locale */
export function getQuotePageUrl(locale: string = 'es'): string {
  return locale === 'en' ? '/en/quote' : '/presupuesto';
}

/** Serialize cart data for the quote form */
export function getCartDataForQuote(): {
  products: Array<{
    name: string;
    slug: string;
    price: number;
    days: number;
    subtotal: number;
    packName: string | null;
  }>;
  total: number;
  discount: number;
} {
  const cart = readCart();
  const products = cart.map((item) => ({
    name: item.productName,
    slug: item.productSlug,
    price: item.price,
    days: item.days,
    subtotal: getItemTotal(item.price, item.days),
    packName: item.packName ?? null,
  }));

  // Use the max days from any item for the global discount
  const maxDays = cart.length > 0 ? Math.max(...cart.map((i) => i.days)) : 1;

  return {
    products,
    total: getTotal(),
    discount: getDiscountPercent(maxDays),
  };
}

// ─── Section detection ───

export function isRentalSection(pathname?: string): boolean {
  const path = pathname ?? window.location.pathname;
  return path.startsWith('/alquiler/') || path.startsWith('/en/rental/') || path === '/alquiler' || path === '/en/rental';
}
