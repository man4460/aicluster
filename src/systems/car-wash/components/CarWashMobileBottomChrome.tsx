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
}: {
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <CarWashMobileBottomContext.Provider value={api}>
      {children}
      <CarWashMobileUnifiedBar slot={slot} />
    </CarWashMobileBottomContext.Provider>
  );
}

function CarWashMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isCarWashModulePath(pathname)) return null;

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
