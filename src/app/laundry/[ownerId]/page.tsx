import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { resolvePublicLaundryTrialSessionId } from "@/lib/laundry/public-trial-scope";
import { LaundryPortalPublicClient } from "@/systems/laundry/components/LaundryPortalPublicClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
};

export const metadata: Metadata = {
  title: "ร้านซักผ้า",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LaundryPublicPortalPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isLaundryPickupPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const { trialSessionId } = await resolvePublicLaundryTrialSessionId(
    ownerId,
    sp.t?.trim() || sp.trialSessionId?.trim() || null,
  );

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-indigo-50 to-white text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      }
    >
      <LaundryPortalPublicClient ownerId={ownerId} trialSessionId={trialSessionId} />
    </Suspense>
  );
}
