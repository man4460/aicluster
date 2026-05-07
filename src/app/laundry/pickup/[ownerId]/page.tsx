import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { LaundryPickupPublicClient } from "@/systems/laundry/components/LaundryPickupPublicClient";

type Props = { params: Promise<{ ownerId: string }> };

export const metadata: Metadata = {
  title: "ขอรับผ้าที่บ้าน",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LaundryPickupPage({ params }: Props) {
  const { ownerId } = await params;
  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isLaundryPickupPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const profile = await getBusinessProfile(ownerId);
  const shopLabel = profile?.name?.trim() || "รับฝากซักผ้า";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-indigo-50 to-white text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      }
    >
      <LaundryPickupPublicClient ownerId={ownerId} shopLabel={shopLabel} />
    </Suspense>
  );
}
