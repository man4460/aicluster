/** ชำระตอนจองจากเว็บลูกค้า — POS ร้านเครื่องดื่ม */

export type DrinkPosPortalBookingPaymentMode = "NONE" | "DEPOSIT" | "FULL";

export const DRINK_POS_PORTAL_GALLERY_MAX = 8;
export const DRINK_POS_REVIEW_PHOTO_MAX = 5;

export function normalizeDrinkPosPortalPaymentMode(
  value: string | null | undefined,
): DrinkPosPortalBookingPaymentMode {
  if (value === "DEPOSIT" || value === "FULL" || value === "NONE") return value;
  return "NONE";
}

/**
 * ยอดที่ต้องชำระตอนจอง
 * - NONE → 0
 * - DEPOSIT → ถ้ามีพรีออเดอร์และ depositPercent → % ของยอด ไม่เช่นนั้นใช้บาทคงที่
 * - FULL → พรีออเดอร์ใช้ยอดเต็ม ไม่มีพรีออเดอร์ใช้บาทคงที่
 */
export function drinkPosComputePortalPayDue(opts: {
  mode: DrinkPosPortalBookingPaymentMode;
  depositAmountBaht: number | null | undefined;
  depositPercent: number | null | undefined;
  itemsTotalBaht: number;
}): number {
  const items = Math.max(0, Math.round(opts.itemsTotalBaht));
  const fixed = Math.max(0, Math.round(Number(opts.depositAmountBaht ?? 0)));
  const percentRaw = opts.depositPercent != null ? Math.round(Number(opts.depositPercent)) : null;
  const percent = percentRaw != null && percentRaw >= 1 && percentRaw <= 100 ? percentRaw : null;

  if (opts.mode === "NONE") return 0;

  if (opts.mode === "FULL") {
    if (items > 0) return items;
    return fixed;
  }

  // DEPOSIT
  if (items > 0 && percent != null) {
    return Math.max(0, Math.ceil((items * percent) / 100));
  }
  return fixed;
}

export function drinkPosPortalSlipProofMessage(mode: DrinkPosPortalBookingPaymentMode): string {
  if (mode === "FULL") return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง";
  return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง";
}

/** อนุญาต path อัปโหลด (`/…`) หรือ URL ภายนอก (https) — สำหรับ seed / Unsplash */
export function drinkPosNormalizePortalGallery(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || url.length > 512) continue;
    if (!(url.startsWith("/") || /^https?:\/\//i.test(url))) continue;
    out.push(url);
    if (out.length >= DRINK_POS_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function drinkPosNormalizeReviewPhotos(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  return arr
    .filter((u): u is string => typeof u === "string" && u.trim().startsWith("/"))
    .map((u) => u.trim())
    .slice(0, DRINK_POS_REVIEW_PHOTO_MAX);
}

export type DrinkPosPortalCartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
};

export function drinkPosNormalizePortalCartItems(raw: unknown): DrinkPosPortalCartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: DrinkPosPortalCartItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const productId = String(r.productId ?? r.id ?? "").trim();
    const name = String(r.name ?? "").trim().slice(0, 160);
    const unitPrice = Math.max(0, Math.round(Number(r.unitPrice ?? r.price ?? 0)));
    const qty = Math.max(0, Math.min(99, Math.round(Number(r.qty ?? 1))));
    if (!productId || productId.length < 8 || !name || qty <= 0) continue;
    out.push({ productId, name, unitPrice, qty });
  }
  return out.slice(0, 40);
}

export function drinkPosCartItemsTotalBaht(items: DrinkPosPortalCartItem[]): number {
  return items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
}
