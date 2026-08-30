"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ParkingBookingsClient } from "@/systems/parking/components/ParkingBookingsClient";
import { ParkingCheckoutClient } from "@/systems/parking/components/ParkingCheckoutClient";
import {
  ParkingStaffCheckInClient,
  type ParkingCheckInLotRow,
  type ParkingCheckInSpotRow,
} from "@/systems/parking/components/ParkingStaffCheckInClient";
import { ParkingDashboardTabToolbarSuspense } from "@/systems/parking/components/ParkingDashboardTabToolbar";
import { parseParkingDashboardTab } from "@/systems/parking/parking-module-nav";

function ParkingDashboardHubTabs({
  checkInLots,
  checkInSpots,
  children,
}: {
  checkInLots: ParkingCheckInLotRow[];
  checkInSpots: ParkingCheckInSpotRow[];
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseParkingDashboardTab(searchParams.get("tab")), [searchParams]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {tab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <ParkingDashboardTabToolbarSuspense />
        </div>
      ) : null}

      {tab === "overview" ? children : null}
      {tab === "checkin" ? (
        <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
          <ParkingStaffCheckInClient lots={checkInLots} spots={checkInSpots} />
        </Suspense>
      ) : null}
      {tab === "booking" ? <ParkingBookingsClient /> : null}
      {tab === "checkout" ? <ParkingCheckoutClient /> : null}
    </div>
  );
}

export function ParkingDashboardHubClient({
  checkInLots,
  checkInSpots,
  children,
}: {
  checkInLots: ParkingCheckInLotRow[];
  checkInSpots: ParkingCheckInSpotRow[];
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ParkingDashboardHubTabs checkInLots={checkInLots} checkInSpots={checkInSpots}>
        {children}
      </ParkingDashboardHubTabs>
    </Suspense>
  );
}
