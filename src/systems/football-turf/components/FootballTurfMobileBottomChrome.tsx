"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { FOOTBALL_TURF_BASE } from "@/systems/football-turf/football-turf-module-nav";
import { FootballTurfMobileDockNav } from "@/systems/football-turf/components/FootballTurfMobileDock";

export function FootballTurfMobileBottomProvider({
  children,
  staffFooterNav,
}: {
  children: ReactNode;
  /** แถบเมนูพอร์ทัลพนักงาน (มือถือ) */
  staffFooterNav?: ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <FootballTurfMobileUnifiedBar staffFooterNav={staffFooterNav} />
      </Suspense>
    </>
  );
}

function FootballTurfMobileUnifiedBar({ staffFooterNav }: { staffFooterNav?: ReactNode }) {
  const pathname = usePathname() ?? "";
  const onStaffPortal = pathname.startsWith("/football-turf/staff");
  const onModule = pathname === FOOTBALL_TURF_BASE || pathname.startsWith(`${FOOTBALL_TURF_BASE}/`);

  if (onStaffPortal) {
    if (!staffFooterNav) return null;
    return (
      <AppMobileDockUnifiedBar ariaLabel="เมนูพนักงานสนามฟุตบอล">
        {staffFooterNav}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!onModule) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่างสนามฟุตบอล">
      <FootballTurfMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
