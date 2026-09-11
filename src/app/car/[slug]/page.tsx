import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { UsedCarPortalPublicClient } from "@/systems/used-car-showroom/components/UsedCarPortalPublicClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `โชว์รูมรถ · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function UsedCarPublicPortalPage({ params, searchParams }: Props) {
  const { slug: raw } = await params;
  const { t } = await searchParams;
  const slug = raw?.trim().toLowerCase() ?? "";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-indigo-50 to-white text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      }
    >
      <UsedCarPortalPublicClient slug={slug} trialParam={t ?? null} />
    </Suspense>
  );
}
