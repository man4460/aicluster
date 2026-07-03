import { z } from "zod";

export const DRINK_POS_SIZE_CODES = ["S", "M", "L"] as const;
export type DrinkPosSizeCode = (typeof DRINK_POS_SIZE_CODES)[number];

export type DrinkPosSizePrice = {
  size: DrinkPosSizeCode;
  priceBaht: number;
  enabled: boolean;
};

const sizeCodeZod = z.enum(DRINK_POS_SIZE_CODES);

const sizePriceZod = z.object({
  size: sizeCodeZod,
  priceBaht: z.number().int().min(0).max(99999999),
  enabled: z.boolean().optional(),
});

export function defaultDrinkPosSizePrices(fallbackPrice = 0): DrinkPosSizePrice[] {
  return DRINK_POS_SIZE_CODES.map((size) => ({
    size,
    priceBaht: fallbackPrice,
    enabled: size === "M",
  }));
}

export function normalizeDrinkPosSizePrices(raw: unknown): DrinkPosSizePrice[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const bySize = new Map<DrinkPosSizeCode, DrinkPosSizePrice>();
  for (const item of raw) {
    const parsed = sizePriceZod.safeParse(item);
    if (!parsed.success) continue;
    bySize.set(parsed.data.size, {
      size: parsed.data.size,
      priceBaht: parsed.data.priceBaht,
      enabled: parsed.data.enabled !== false,
    });
  }
  const list = DRINK_POS_SIZE_CODES.map((size) => bySize.get(size)).filter(
    (x): x is DrinkPosSizePrice => Boolean(x),
  );
  if (list.length === 0) return null;
  return list;
}

export function drinkPosProductHasSizes(sizePrices: DrinkPosSizePrice[] | null | undefined): boolean {
  return Boolean(sizePrices?.some((x) => x.enabled));
}

export function drinkPosActiveSizePrices(sizePrices: DrinkPosSizePrice[] | null | undefined): DrinkPosSizePrice[] {
  return (sizePrices ?? []).filter((x) => x.enabled);
}

export function drinkPosResolveUnitPrice(
  product: { priceBaht: number; sizePrices?: DrinkPosSizePrice[] | null },
  size: DrinkPosSizeCode | null | undefined,
): number | null {
  const active = drinkPosActiveSizePrices(product.sizePrices ?? null);
  if (active.length === 0) return product.priceBaht;
  if (!size) return null;
  const row = active.find((x) => x.size === size);
  return row ? row.priceBaht : null;
}

/** ราคาแสดงบนการ์ด — ต่ำสุดถึงสูงสุดของขนาดที่เปิด หรือ priceBaht เดียว */
export function drinkPosDisplayPriceLabel(product: {
  priceBaht: number;
  sizePrices?: DrinkPosSizePrice[] | null;
}): string {
  const active = drinkPosActiveSizePrices(product.sizePrices ?? null);
  if (active.length === 0) return String(product.priceBaht);
  const prices = active.map((x) => x.priceBaht);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return String(min);
  return `${min}–${max}`;
}

export function drinkPosSaleLineDisplayName(name: string, size: DrinkPosSizeCode | null | undefined): string {
  const base = name.trim();
  if (!size) return base;
  return `${base} (${size})`;
}

export function drinkPosPrimaryDisplayPriceBaht(product: {
  priceBaht: number;
  sizePrices?: DrinkPosSizePrice[] | null;
}): number {
  const active = drinkPosActiveSizePrices(product.sizePrices ?? null);
  if (active.length === 0) return product.priceBaht;
  const m = active.find((x) => x.size === "M");
  if (m) return m.priceBaht;
  return Math.min(...active.map((x) => x.priceBaht));
}

export function serializeDrinkPosSizePricesForDb(
  raw: unknown,
  fallbackPrice: number,
): DrinkPosSizePrice[] | null {
  const normalized = normalizeDrinkPosSizePrices(raw);
  if (!normalized) return null;
  if (!drinkPosProductHasSizes(normalized)) return null;
  return DRINK_POS_SIZE_CODES.map((size) => {
    const row = normalized.find((x) => x.size === size);
    return {
      size,
      priceBaht: row?.priceBaht ?? fallbackPrice,
      enabled: row?.enabled ?? false,
    };
  });
}
