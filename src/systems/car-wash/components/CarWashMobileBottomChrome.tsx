"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { CarWashMobileDockNav } from "@/systems/car-wash/components/CarWashMobileDock";
import { isCarWashModulePath } from "@/systems/car-wash/car-wash-module-nav";
import { carWashDockPillClass } from "@/systems/car-wash/car-wash-ui-tokens";

type CarWashMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const CarWashMobileBottomContext = createContext<CarWashMobileBottomContextValue | null>(null);

export function useCarWashMobileBottomSlot() {
  const ctx = useContext(CarWashMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function CarWashMobileBottomProvider({
  children,
  /** แถบเมนูพอร์ทัลพนักงาน (มือถือ) — แสดงใน pill ล่างแทนเมนูแดชบอร์ด */
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
    <CarWashMobileBottomContext.Provider value={api}>
      {children}
      <CarWashMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </CarWashMobileBottomContext.Provider>
  );
}

function CarWashMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onDashboard = isCarWashModulePath(pathname);
  const onStaffPortal = pathname.startsWith("/car-wash/staff");

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar
        ariaLabel="เมนูพนักงานคาร์แคร์"
        slot={slot}
        pillClassName={carWashDockPillClass}
      >
        {staffFooterNav ?? <span className="sr-only">พนักงานคาร์แคร์</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!onDashboard) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างคาร์แคร์"
      slot={slot}
      pillClassName={carWashDockPillClass}
    >
      <CarWashMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
