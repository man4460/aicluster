"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { DormMobileDockNav } from "@/systems/dormitory/components/DormMobileDock";
import { isDormitoryModulePath } from "@/systems/dormitory/dormitory-module-nav";
import { dormDockPillClass } from "@/systems/dormitory/lib/ui-tokens";

type DormMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const DormMobileBottomContext = createContext<DormMobileBottomContextValue | null>(null);

export function useDormMobileBottomSlot() {
  const ctx = useContext(DormMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function DormMobileBottomProvider({
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
    <DormMobileBottomContext.Provider value={api}>
      {children}
      <DormMobileUnifiedBar slot={slot} />
    </DormMobileBottomContext.Provider>
  );
}

function DormMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isDormitoryModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างหอพัก"
      slot={slot}
      pillClassName={dormDockPillClass}
    >
      <DormMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
