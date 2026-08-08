"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { BuildingPosMobileDockNav } from "@/systems/building-pos/components/BuildingPosMobileDock";
import { isBuildingPosModulePath } from "@/systems/building-pos/building-pos-nav";

type BuildingPosMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const BuildingPosMobileBottomContext = createContext<BuildingPosMobileBottomContextValue | null>(null);

/** ฝังสรุปรายการออเดอร์ (มือถือ) ในการ์ดล่างเดียวกับเมนู — เทียบ drink-pos */
export function useBuildingPosMobileDraftSlot() {
  const ctx = useContext(BuildingPosMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function BuildingPosMobileBottomProvider({
  children,
  /** แถบเมนูพอร์ทัลพนักงาน (มือถือ) — แสดงใน pill ล่าง */
  staffFooterNav,
}: {
  children: ReactNode;
  staffFooterNav?: ReactNode;
}) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <BuildingPosMobileBottomContext.Provider value={api}>
      {children}
      <BuildingPosMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </BuildingPosMobileBottomContext.Provider>
  );
}

/** การ์ดล่างเดียว: โซนสล็อต (รายการรอ) + เมนู — อิงระยะแบบคาร์แคร์ / drink-pos */
function BuildingPosMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onDashboard = isBuildingPosModulePath(pathname);
  const onStaffPortal = pathname.startsWith("/building-pos/staff");
  if (!onDashboard && !onStaffPortal) return null;

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar ariaLabel="เมนูพนักงานร้านอาหาร" slot={slot}>
        {staffFooterNav ?? <span className="sr-only">พนักงานร้านอาหาร</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่าง POS ร้านอาหาร" slot={slot}>
      <BuildingPosMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
