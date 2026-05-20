import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import { EcommerceStoreUnavailable } from "@/systems/ecommerce-store/storefront/EcommerceStoreUnavailable";
import { EcommerceOrderTrackClient } from "@/systems/ecommerce-store/storefront/EcommerceOrderTrackClient";

export default async function ShopTrackPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const id = storeId?.trim() ?? "";
  if (!id) notFound();

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    if (availability.reason === "not_found") notFound();
    return <EcommerceStoreUnavailable reason={availability.reason === "paused" ? "paused" : "unavailable"} />;
  }

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/30" aria-hidden />}>
      <EcommerceOrderTrackClient storeId={id} />
    </Suspense>
  );
}
