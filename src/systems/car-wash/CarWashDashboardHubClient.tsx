"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarWashBookingsClient } from "@/systems/car-wash/CarWashBookingsClient";
import type { CarWashStaffAuth } from "@/systems/car-wash/car-wash-service";
import {
  parseCarWashHubTab,
  type CarWashHubTabKey,
} from "@/systems/car-wash/CarWashDashboardTabToolbar";
import { carWashContentStackClass } from "@/systems/car-wash/car-wash-ui-tokens";

export type { CarWashHubTabKey };
export { CarWashDashboardTabToolbar } from "@/systems/car-wash/CarWashDashboardTabToolbar";

function CarWashDashboardHubPanels({
  initialDateKey,
  children,
  staffPortal = false,
  staffAuth = null,
}: {
  initialDateKey: string;
  children: React.ReactNode;
  /** พอร์ทัลลิงก์พนักงาน — ห้าม redirect ไปหน้าตั้งค่าเจ้าของ */
  staffPortal?: boolean;
  staffAuth?: CarWashStaffAuth | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const hubTab = useMemo(() => parseCarWashHubTab(rawTab), [rawTab]);

  useEffect(() => {
    if (!staffPortal && rawTab === "schedule") {
      router.replace("/dashboard/car-wash/settings?tab=hours");
    }
  }, [rawTab, router, staffPortal]);

  if (!staffPortal && rawTab === "schedule") {
    return (
      <div className={carWashContentStackClass} aria-busy>
        <p className="text-sm text-[#5f5a8a]">กำลังไปหน้าตั้งค่าเวลาเปิดร้าน…</p>
      </div>
    );
  }

  return (
    <div className={carWashContentStackClass}>
      {hubTab === "overview" ? <div className={carWashContentStackClass}>{children}</div> : null}
      {hubTab === "queue" ? (
        <CarWashBookingsClient initialDateKey={initialDateKey} staffAuth={staffAuth} />
      ) : null}
    </div>
  );
}

function HubPanelsFallback() {
  return (
    <div className={carWashContentStackClass} aria-busy>
      <div className="h-16 animate-pulse rounded-[2rem] bg-white/25 sm:h-14" />
    </div>
  );
}

export function CarWashDashboardHubClient({
  initialDateKey,
  children,
  staffPortal = false,
  staffAuth = null,
}: {
  initialDateKey: string;
  /** ภาพรวม: สถิติ + ลานวันนี้ */
  children: React.ReactNode;
  staffPortal?: boolean;
  staffAuth?: CarWashStaffAuth | null;
}) {
  return (
    <Suspense fallback={<HubPanelsFallback />}>
      <CarWashDashboardHubPanels initialDateKey={initialDateKey} staffPortal={staffPortal} staffAuth={staffAuth}>
        {children}
      </CarWashDashboardHubPanels>
    </Suspense>
  );
}
