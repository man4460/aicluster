"use client";

import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";
import {
  BarberDashboardTabToolbar,
  type BarberDashboardTabKey,
} from "@/systems/barber/components/BarberDashboardHeaderTrailing";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import {
  BARBER_STAFF_KIOSK_PATH,
  parseBarberDashboardTab,
} from "@/systems/barber/barber-module-nav";

export type { BarberDashboardTabKey };
export {
  BarberDashboardHeaderTrailing,
  BarberDashboardTabToolbar,
} from "@/systems/barber/components/BarberDashboardHeaderTrailing";

function BarberDashboardHubTabs({
  initialDateKey,
  children,
  staffLane = false,
}: {
  initialDateKey: string;
  children: React.ReactNode;
  staffLane?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const onStaff = staffLane || pathname === BARBER_STAFF_KIOSK_PATH;
  const tab = useMemo(
    () => parseBarberDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  useEffect(() => {
    if (onStaff) return;
    const raw = searchParams.get("tab");
    if (raw === "stylists") {
      router.replace("/dashboard/barber/manage?tab=stylists");
    }
  }, [onStaff, router, searchParams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {!onStaff && tab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <BarberDashboardTabToolbar />
        </div>
      ) : null}

      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <BarberBookingsClient
          initialDateKey={initialDateKey}
          showDashboardBackLink={false}
          showHubToolbar={!onStaff}
          staffQrLanding={onStaff}
        />
      ) : null}
      {tab === "checkin" ? (
        <BarberCheckInClient embedded staffQrLanding={onStaff} />
      ) : null}
    </div>
  );
}

function HubTabsFallback() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy>
      <div className={`h-16 animate-pulse ${barberCardSurfaceRadiusClass} bg-white/25 sm:h-14`} />
    </div>
  );
}

export function BarberDashboardHubClient({
  initialDateKey,
  children,
  staffLane = false,
}: {
  initialDateKey: string;
  /** ภาพรวม: สถิติ + คิววันนี้ (ส่งจากหน้าเซิร์ฟเวอร์) */
  children: React.ReactNode;
  staffLane?: boolean;
}) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <BarberDashboardHubTabs initialDateKey={initialDateKey} staffLane={staffLane}>
        {children}
      </BarberDashboardHubTabs>
    </Suspense>
  );
}
