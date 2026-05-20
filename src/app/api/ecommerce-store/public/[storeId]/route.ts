import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await ctx.params;
  const id = storeId?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    return NextResponse.json(
      { available: false, reason: availability.reason },
      { status: availability.reason === "not_found" ? 404 : 503 },
    );
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: {
      id: true,
      storeName: true,
      logoUrl: true,
      description: true,
      salePageEnabled: true,
      featuredProductId: true,
      promptPayPhone: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      paymentNote: true,
    },
  });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const categories = await prisma.ecommerceCategory.findMany({
    where: { storeId: id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const products = await prisma.ecommerceProduct.findMany({
    where: { storeId: id, isActive: true, stockBalance: { gt: 0 } },
    orderBy: [
      { isBestseller: "desc" },
      { isRecommended: "desc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      description: true,
      priceBaht: true,
      stockBalance: true,
      sku: true,
      categoryId: true,
      isRecommended: true,
      isBestseller: true,
      category: { select: { id: true, name: true } },
    },
  });

  let featuredProduct = null;
  if (store.featuredProductId) {
    featuredProduct = products.find((p) => p.id === store.featuredProductId) ?? null;
  }

  return NextResponse.json({
    available: true,
    store,
    categories,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      description: p.description,
      priceBaht: p.priceBaht.toString(),
      stockBalance: p.stockBalance,
      sku: p.sku,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      isRecommended: p.isRecommended,
      isBestseller: p.isBestseller,
    })),
    featuredProduct: featuredProduct
      ? {
          id: featuredProduct.id,
          name: featuredProduct.name,
          imageUrl: featuredProduct.imageUrl,
          description: featuredProduct.description,
          priceBaht: featuredProduct.priceBaht.toString(),
          stockBalance: featuredProduct.stockBalance,
          sku: featuredProduct.sku,
          categoryId: featuredProduct.categoryId,
          categoryName: featuredProduct.category?.name ?? null,
          isRecommended: featuredProduct.isRecommended,
          isBestseller: featuredProduct.isBestseller,
        }
      : null,
  });
}
