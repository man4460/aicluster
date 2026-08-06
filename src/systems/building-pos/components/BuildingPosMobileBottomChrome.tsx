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

export function BuildingPosMobileBottomProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <BuildingPosMobileBottomContext.Provider value={api}>
      {children}
      <BuildingPosMobileUnifiedBar slot={slot} />
    </BuildingPosMobileBottomContext.Provider>
  );
}

function BuildingPosMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  if (!isBuildingPosModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่าง POS ร้านอาหาร" slot={slot}>
      <BuildingPosMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
