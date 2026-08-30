import type { Metadata } from "next";
import { Suspense } from "react";
import { ParkingOffersClient } from "@/systems/parking/components/ParkingOffersClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "การจัดการ | บริการรับฝากจอดรถ",
};

export default async function ParkingOffersPage() {
  await requireParkingPage();
  return (
    <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ParkingOffersClient />
    </Suspense>
  );
}
