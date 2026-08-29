"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";
import {
  BarberDashboardTabToolbar,
  type BarberDashboardTabKey,
} from "@/systems/barber/components/BarberDashboardHeaderTrailing";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import { parseBarberDashboardTab } from "@/systems/barber/barber-module-nav";

export type { BarberDashboardTabKey };
export {
  BarberDashboardHeaderTrailing,
  BarberDashboardTabToolbar,
} from "@/systems/barber/components/BarberDashboardHeaderTrailing";

function BarberDashboardHubTabs({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseBarberDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "stylists") {
      router.replace("/dashboard/barber/manage?tab=stylists");
    }
  }, [router, searchParams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <BarberBookingsClient
          initialDateKey={initialDateKey}
          showDashboardBackLink={false}
          showHubToolbar
        />
      ) : null}
      {tab === "checkin" ? (
        <BarberCheckInClient embedded headerToolbar={<BarberDashboardTabToolbar />} />
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
}: {
  initialDateKey: string;
  /** ภาพรวม: สถิติ + คิววันนี้ (ส่งจากหน้าเซิร์ฟเวอร์) */
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <BarberDashboardHubTabs initialDateKey={initialDateKey}>{children}</BarberDashboardHubTabs>
    </Suspense>
  );
}
