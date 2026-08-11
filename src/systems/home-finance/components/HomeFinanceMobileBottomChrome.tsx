"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { HomeFinanceMobileDockNav } from "@/systems/home-finance/components/HomeFinanceMobileDock";
import { isHomeFinanceModulePath } from "@/systems/home-finance/home-finance-module-nav";
import { homeFinanceDockPillClass } from "@/systems/home-finance/lib/ui-tokens";

type HomeFinanceMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const HomeFinanceMobileBottomContext = createContext<HomeFinanceMobileBottomContextValue | null>(null);

export function useHomeFinanceMobileBottomSlot() {
  const ctx = useContext(HomeFinanceMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function HomeFinanceMobileBottomProvider({
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
    <HomeFinanceMobileBottomContext.Provider value={api}>
      {children}
      <HomeFinanceMobileUnifiedBar slot={slot} />
    </HomeFinanceMobileBottomContext.Provider>
  );
}

function HomeFinanceMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isHomeFinanceModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างระบบรายรับรายจ่าย"
      slot={slot}
      pillClassName={homeFinanceDockPillClass}
    >
      <HomeFinanceMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
