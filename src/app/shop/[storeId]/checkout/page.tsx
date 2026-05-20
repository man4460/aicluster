import { notFound } from "next/navigation";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { prisma } from "@/lib/prisma";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceCheckoutClient } from "@/systems/ecommerce-store/storefront/EcommerceCheckoutClient";

export default async function ShopCheckoutPage({
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
    return <EcommerceStoreUnavailable reason={availability.reason === "paused" ? "paused" : "unavailable"} />;
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: {
      id: true,
      storeName: true,
      promptPayPhone: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      paymentNote: true,
    },
  });
  if (!store) notFound();

  return <EcommerceCheckoutClient store={store} />;
}
