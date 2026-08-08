"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { HotelResortMobileDockNav } from "@/systems/hotel-resort/components/HotelResortMobileDock";
import { isHotelResortModulePath } from "@/systems/hotel-resort/hotel-resort-module-nav";
import { hotelResortDockPillClass } from "@/systems/hotel-resort/lib/ui-tokens";

type HotelResortMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const HotelResortMobileBottomContext = createContext<HotelResortMobileBottomContextValue | null>(null);

export function useHotelResortMobileBottomSlot() {
  const ctx = useContext(HotelResortMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function HotelResortMobileBottomProvider({
  children,
  staffFooterNav,
}: {
  children: ReactNode;
  /** แถบเมนูพอร์ทัลพนักงาน (มือถือ) */
  staffFooterNav?: ReactNode;
}) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <HotelResortMobileBottomContext.Provider value={api}>
      {children}
      <HotelResortMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </HotelResortMobileBottomContext.Provider>
  );
}

function HotelResortMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onStaffPortal = pathname.startsWith("/hotel-resort/staff");

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar
        ariaLabel="เมนูพนักงานโรงแรม"
        slot={slot}
        pillClassName={hotelResortDockPillClass}
      >
        {staffFooterNav ?? <span className="sr-only">พนักงานโรงแรม</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!isHotelResortModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างโรงแรมรีสอร์ท"
      slot={slot}
      pillClassName={hotelResortDockPillClass}
    >
      <HotelResortMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
