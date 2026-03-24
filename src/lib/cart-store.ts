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

// ─── Mailto ───

interface MailtoStrings {
  subject: string;
  greeting: string;
  productListHeader: string;
  daysLabel: string;
  discountLabel: string;
  unitPriceLabel: string;
  subtotalLabel: string;
  totalLabel: string;
  datesPlaceholder: string;
  closing: string;
  dayLabel?: string;
}

export function generateMailtoLink(strings: MailtoStrings, email: string = 'info@obliqproductions.com'): string {
  const cart = readCart();

  let body = strings.greeting + '\n\n';
  body += strings.productListHeader + '\n';
  body += '─'.repeat(40) + '\n\n';

  // Group by pack
  const packs = new Map<string, CartItem[]>();
  const loose: CartItem[] = [];
  cart.forEach((item) => {
    if (item.packName) {
      const list = packs.get(item.packName) || [];
      list.push(item);
      packs.set(item.packName, list);
    } else {
      loose.push(item);
    }
  });

  function formatItem(item: CartItem): string {
    const dailyDiscounted = getDiscountedDailyPrice(item.price, item.days);
    const subtotal = getItemTotal(item.price, item.days);
    const discount = getDiscountPercent(item.days);
    const dLabel = item.days === 1 ? (strings.dayLabel || strings.daysLabel) : strings.daysLabel;
    let text = `- ${item.productName}\n`;
    text += `  ${strings.unitPriceLabel}: ${dailyDiscounted.toFixed(2)}€/${dLabel.toLowerCase()}\n`;
    text += `  ${strings.subtotalLabel} (${item.days} ${dLabel.toLowerCase()}): ${subtotal.toFixed(2)}€`;
    if (discount > 0) text += ` (${strings.discountLabel}: -${discount}%)`;
    text += '\n';
    return text;
  }

  // Packs first
  packs.forEach((items, packName) => {
    body += `📦 ${packName}\n`;
    items.forEach((item) => { body += formatItem(item); });
    body += '\n';
  });

  // Loose items
  loose.forEach((item) => { body += formatItem(item) + '\n'; });

  body += '─'.repeat(40) + '\n';
  body += `${strings.totalLabel}: ${getTotal().toFixed(2)}€ + IVA\n`;
  body += '\n' + strings.datesPlaceholder + '\n\n';
  body += strings.closing;

  // Truncate if too long for mailto
  if (body.length > 1800) {
    body = body.substring(0, 1800) + '\n\n[...]';
  }

  return `mailto:${email}?subject=${encodeURIComponent(strings.subject)}&body=${encodeURIComponent(body)}`;
}

// ─── Section detection ───

export function isRentalSection(pathname?: string): boolean {
  const path = pathname ?? window.location.pathname;
  return path.startsWith('/alquiler/') || path.startsWith('/en/rental/') || path === '/alquiler' || path === '/en/rental';
}
