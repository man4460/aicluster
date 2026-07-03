"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { HotelResortMobileDockNav } from "@/systems/hotel-resort/components/HotelResortMobileDock";

const base = "/dashboard/hotel-resort";

type HotelResortMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const HotelResortMobileBottomContext = createContext<HotelResortMobileBottomContextValue | null>(null);

export function useHotelResortMobileBottomSlot() {
  const ctx = useContext(HotelResortMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function HotelResortMobileBottomProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <HotelResortMobileBottomContext.Provider value={api}>
      {children}
      <HotelResortMobileUnifiedBar slot={slot} />
    </HotelResortMobileBottomContext.Provider>
  );
}

function HotelResortMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  if (!pathname.startsWith(base)) return null;

  return (
    <AppMobileDockUnifiedBar ariaLabel="เมนูล่างโรงแรมรีสอร์ท" slot={slot}>
      <HotelResortMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
