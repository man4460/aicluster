import type { Metadata } from "next";
import { Suspense } from "react";
import { ParkingLotsClient } from "@/systems/parking/components/ParkingLotsClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ลานจอด | บริการรับฝากจอดรถ",
};

export default async function ParkingLotsPage() {
  await requireParkingPage();
  return (
    <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ParkingLotsClient />
    </Suspense>
  );
}
