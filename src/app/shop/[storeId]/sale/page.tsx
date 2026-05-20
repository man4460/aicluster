import { notFound } from "next/navigation";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { prisma } from "@/lib/prisma";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceSalePageClient } from "@/systems/ecommerce-store/storefront/EcommerceSalePageClient";

export default async function ShopSalePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const id = storeId?.trim() ?? "";
  if (!id) notFound();

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    if (availability.reason === "not_found") notFound();
    return <EcommerceStoreUnavailable reason={availability.reason === "paused" ? "paused" : "unavailable"} />;
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    include: { featuredProduct: true },
  });
  if (!store?.featuredProduct || !store.salePageEnabled) notFound();

  return (
    <EcommerceSalePageClient
      store={{
        id: store.id,
        storeName: store.storeName,
        promptPayPhone: store.promptPayPhone,
        bankName: store.bankName,
        bankAccountName: store.bankAccountName,
        bankAccountNumber: store.bankAccountNumber,
      }}
      product={{
        ...store.featuredProduct,
        priceBaht: store.featuredProduct.priceBaht.toString(),
      }}
    />
  );
}
