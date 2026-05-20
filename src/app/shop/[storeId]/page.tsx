import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceStorefrontClient } from "@/systems/ecommerce-store/storefront/EcommerceStorefrontClient";

export default async function PublicShopPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const id = storeId?.trim() ?? "";
  if (!id) notFound();

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    if (availability.reason === "not_found") notFound();
    const store = await prisma.ecommerceStore.findUnique({
      where: { id },
      select: { storeName: true },
    });
    return (
      <EcommerceStoreUnavailable
        storeName={store?.storeName}
        reason={availability.reason === "paused" ? "paused" : "unavailable"}
      />
    );
  }

  const [data, categories] = await Promise.all([
    prisma.ecommerceStore.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true, stockBalance: { gt: 0 } },
          orderBy: [
            { isBestseller: "desc" },
            { isRecommended: "desc" },
            { sortOrder: "asc" },
            { name: "asc" },
          ],
          include: { category: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.ecommerceCategory.findMany({
      where: { storeId: id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!data) notFound();

  return (
    <EcommerceStorefrontClient
      data={{
        store: {
          id: data.id,
          storeName: data.storeName,
          logoUrl: data.logoUrl,
          description: data.description,
        },
        salePageEnabled: data.salePageEnabled,
        featuredProductId: data.featuredProductId,
        categories,
        products: data.products.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          description: p.description,
          priceBaht: p.priceBaht.toString(),
          stockBalance: p.stockBalance,
          categoryId: p.categoryId,
          categoryName: p.category?.name ?? null,
          isRecommended: p.isRecommended,
          isBestseller: p.isBestseller,
        })),
      }}
    />
  );
}
