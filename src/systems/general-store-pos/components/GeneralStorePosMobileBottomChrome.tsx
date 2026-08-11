"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { GeneralStorePosMobileDockNav } from "@/systems/general-store-pos/components/GeneralStorePosMobileDock";
import { isGeneralStorePosModulePath } from "@/systems/general-store-pos/general-store-pos-module-nav";
import { generalStorePosDockPillClass } from "@/systems/general-store-pos/lib/ui-tokens";

type GeneralStorePosMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const GeneralStorePosMobileBottomContext = createContext<GeneralStorePosMobileBottomContextValue | null>(null);

export function useGeneralStorePosMobileDraftSlot() {
  const ctx = useContext(GeneralStorePosMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function GeneralStorePosMobileBottomProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <GeneralStorePosMobileBottomContext.Provider value={api}>
      {children}
      <GeneralStorePosMobileUnifiedBar slot={slot} />
    </GeneralStorePosMobileBottomContext.Provider>
  );
}

function GeneralStorePosMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  if (!isGeneralStorePosModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่าง POS ร้านทั่วไป"
      slot={slot}
      pillClassName={generalStorePosDockPillClass}
    >
      <GeneralStorePosMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
