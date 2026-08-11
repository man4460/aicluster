"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { EducareMobileDockNav } from "@/systems/educare/components/EducareMobileDock";
import { isEducareModulePath } from "@/systems/educare/educare-module-nav";
import { educareDockPillClass } from "@/systems/educare/lib/ui-tokens";

type EducareMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const EducareMobileBottomContext = createContext<EducareMobileBottomContextValue | null>(null);

export function useEducareMobileBottomSlot() {
  const ctx = useContext(EducareMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function EducareMobileBottomProvider({
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
    <EducareMobileBottomContext.Provider value={api}>
      {children}
      <EducareMobileUnifiedBar slot={slot} />
    </EducareMobileBottomContext.Provider>
  );
}

function EducareMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isEducareModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่าง EduCare เช็คนักเรียน"
      slot={slot}
      pillClassName={educareDockPillClass}
    >
      <EducareMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
