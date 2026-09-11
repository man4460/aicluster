import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { UsedCarVehicleDetailClient } from "@/systems/used-car-showroom/components/UsedCarVehicleDetailClient";

type Props = {
  params: Promise<{ slug: string; vehicleId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `รายละเอียดรถ · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function UsedCarVehiclePublicPage({ params, searchParams }: Props) {
  const { slug: rawSlug, vehicleId } = await params;
  const { t } = await searchParams;
  const slug = rawSlug?.trim().toLowerCase() ?? "";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-indigo-50 to-white text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      }
    >
      <UsedCarVehicleDetailClient
        slug={slug}
        vehicleId={vehicleId}
        trialParam={t ?? null}
      />
    </Suspense>
  );
}
