"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { GeneralStorePosMobileDockNav } from "@/systems/general-store-pos/components/GeneralStorePosMobileDock";

const base = "/dashboard/general-store-pos";

type GeneralStorePosMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const GeneralStorePosMobileBottomContext = createContext<GeneralStorePosMobileBottomContextValue | null>(null);

/** ฝังรายการสรุปบิล (มือถือ) ในการ์ดล่างเดียวกับเมนู — ใช้ใน `GeneralStorePosDashboardClient` เท่านั้น */
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

/** การ์ดล่างเดียว: โซนสล็อต (รายการรอ) + เมนู — อิงระยะ `bottom-6` + `inset-x-4` แบบคาร์แคร์ */
function GeneralStorePosMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  const onModule = pathname.startsWith(base);
  if (!onModule) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่าง POS ร้านทั่วไป" slot={slot}>
      <GeneralStorePosMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
