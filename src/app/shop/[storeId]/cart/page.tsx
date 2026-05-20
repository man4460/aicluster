import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceCartClient } from "@/systems/ecommerce-store/storefront/EcommerceCartClient";

export default async function ShopCartPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const id = storeId?.trim() ?? "";
  if (!id) notFound();

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    if (availability.reason === "not_found") notFound();
    return (
      <EcommerceStoreUnavailable
        reason={availability.reason === "paused" ? "paused" : "unavailable"}
      />
    );
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: { id: true, storeName: true },
  });
  if (!store) notFound();

  return <EcommerceCartClient storeId={store.id} storeName={store.storeName} />;
}
