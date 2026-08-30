import type { Metadata } from "next";
import { Suspense } from "react";
import { ParkingFinanceClient } from "@/systems/parking/components/ParkingFinanceClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "การเงิน | บริการรับฝากจอดรถ",
};

export default async function ParkingFinancePage() {
  await requireParkingPage();
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-[2.5rem] bg-white/40" aria-hidden />}>
      <ParkingFinanceClient />
    </Suspense>
  );
}
