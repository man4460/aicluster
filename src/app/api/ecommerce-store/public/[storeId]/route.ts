import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEcommerceProductImageUrls } from "@/lib/ecommerce/product-images";
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
      galleryImagesJson: true,
      description: true,
      priceBaht: true,
      stockBalance: true,
      sku: true,
      categoryId: true,
      isRecommended: true,
      isBestseller: true,
      category: { select: { id: true, name: true } },
      reviews: {
        where: { isPublished: true },
        select: { rating: true },
      },
    },
  });

  function mapProduct(p: (typeof products)[number]) {
    const reviewCount = p.reviews.length;
    const reviewAvg =
      reviewCount > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      imageUrls: parseEcommerceProductImageUrls(p.imageUrl, p.galleryImagesJson),
      description: p.description,
      priceBaht: p.priceBaht.toString(),
      stockBalance: p.stockBalance,
      sku: p.sku,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      isRecommended: p.isRecommended,
      isBestseller: p.isBestseller,
      reviewAvg,
      reviewCount,
    };
  }

  let featuredProduct = null;
  if (store.featuredProductId) {
    const found = products.find((p) => p.id === store.featuredProductId);
    featuredProduct = found ? mapProduct(found) : null;
  }

  return NextResponse.json({
    available: true,
    store,
    categories,
    products: products.map(mapProduct),
    featuredProduct,
  });
}
