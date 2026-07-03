import { Prisma } from "@/generated/prisma/client";
import {
  drinkPosPrimaryDisplayPriceBaht,
  normalizeDrinkPosSizePrices,
  serializeDrinkPosSizePricesForDb,
  type DrinkPosSizePrice,
} from "@/systems/drink-pos/lib/size-prices";

export function mapDrinkPosProductRow(r: {
  id: string;
  categoryId: string;
  category: { name: string };
  name: string;
  priceBaht: number;
  sizePrices: unknown;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}) {
  const sizePrices = normalizeDrinkPosSizePrices(r.sizePrices);
  return {
    id: r.id,
    categoryId: r.categoryId,
    categoryName: r.category.name,
    name: r.name,
    priceBaht: drinkPosPrimaryDisplayPriceBaht({ priceBaht: r.priceBaht, sizePrices }),
    basePriceBaht: r.priceBaht,
    sizePrices,
    imageUrl: r.imageUrl,
    isFeatured: r.isFeatured,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  };
}

export function drinkPosSizePricesDbValue(
  sizesEnabled: boolean,
  sizePrices: unknown,
  fallbackPrice: number,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!sizesEnabled) return Prisma.DbNull;
  const serialized = serializeDrinkPosSizePricesForDb(sizePrices, fallbackPrice);
  if (!serialized) return Prisma.DbNull;
  return serialized as Prisma.InputJsonValue;
}

export type { DrinkPosSizePrice };
