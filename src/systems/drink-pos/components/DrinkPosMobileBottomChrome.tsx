"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { DrinkPosMobileDockNav } from "@/systems/drink-pos/components/DrinkPosMobileDock";

const base = "/dashboard/drink-pos";

type DrinkPosMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const DrinkPosMobileBottomContext = createContext<DrinkPosMobileBottomContextValue | null>(null);

/** ฝังรายการสรุปบิล (มือถือ) ในการ์ดล่างเดียวกับเมนู — ใช้ใน `DrinkPosDashboardClient` เท่านั้น */
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
    <div
      className={cn(
        "fixed inset-x-4 bottom-6 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 md:hidden print:hidden",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
        "pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label="เมนูล่าง POS ร้านเครื่องดื่ม"
    >
      {slot ? <div className="border-b border-white/45 px-1.5 pb-1 pt-1.5">{slot}</div> : null}
      <div className="p-2">
        <DrinkPosMobileDockNav />
      </div>
    </div>
  );
}
