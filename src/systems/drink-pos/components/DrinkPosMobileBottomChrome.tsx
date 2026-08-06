"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { DrinkPosMobileDockNav } from "@/systems/drink-pos/components/DrinkPosMobileDock";

const base = "/dashboard/drink-pos";

type DrinkPosMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const DrinkPosMobileBottomContext = createContext<DrinkPosMobileBottomContextValue | null>(null);

/** ฝังรายการสรุปบิล (มือถือ) ในการ์ดล่างเดียวกับเมนู — ใช้ในแดชบอร์ด / หน้าออเดอร์ */
export function useDrinkPosMobileDraftSlot() {
  const ctx = useContext(DrinkPosMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function DrinkPosMobileBottomProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <DrinkPosMobileBottomContext.Provider value={api}>
      {children}
      <DrinkPosMobileUnifiedBar slot={slot} />
    </DrinkPosMobileBottomContext.Provider>
  );
}

/** การ์ดล่างเดียว: โซนสล็อต (รายการรอ) + เมนู — อิงระยะ `bottom-6` + `inset-x-4` แบบคาร์แคร์ */
function DrinkPosMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  const onModule = pathname.startsWith(base);
  if (!onModule) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่าง POS ร้านเครื่องดื่ม" slot={slot}>
      <DrinkPosMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
