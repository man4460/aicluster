import { notFound } from "next/navigation";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceOrderSummaryClient } from "@/systems/ecommerce-store/storefront/EcommerceOrderSummaryClient";

export default async function ShopOrderSummaryPage({
  params,
}: {
  params: Promise<{ storeId: string; trackingCode: string }>;
}) {
  const { storeId, trackingCode } = await params;
  const id = storeId?.trim() ?? "";
  const code = trackingCode?.trim() ?? "";
  if (!id || !code) notFound();

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    if (availability.reason === "not_found") notFound();
    return (
      <EcommerceStoreUnavailable reason={availability.reason === "paused" ? "paused" : "unavailable"} />
    );
  }

  return <EcommerceOrderSummaryClient storeId={id} trackingCode={code} />;
}
