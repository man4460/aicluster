"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { FOOTBALL_TURF_BASE } from "@/systems/football-turf/football-turf-module-nav";
import { FootballTurfMobileDockNav } from "@/systems/football-turf/components/FootballTurfMobileDock";

export function FootballTurfMobileBottomProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <FootballTurfMobileUnifiedBar />
      </Suspense>
    </>
  );
}

function FootballTurfMobileUnifiedBar() {
  const pathname = usePathname() ?? "";
  const onModule = pathname === FOOTBALL_TURF_BASE || pathname.startsWith(`${FOOTBALL_TURF_BASE}/`);
  if (!onModule) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่างสนามฟุตบอล">
      <FootballTurfMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
