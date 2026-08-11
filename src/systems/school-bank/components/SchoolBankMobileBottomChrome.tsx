"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { SchoolBankMobileDockNav } from "@/systems/school-bank/components/SchoolBankMobileDock";
import { isSchoolBankModulePath } from "@/systems/school-bank/school-bank-module-nav";
import { schoolBankDockPillClass } from "@/systems/school-bank/lib/ui-tokens";

type SchoolBankMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const SchoolBankMobileBottomContext = createContext<SchoolBankMobileBottomContextValue | null>(null);

export function useSchoolBankMobileBottomSlot() {
  const ctx = useContext(SchoolBankMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function SchoolBankMobileBottomProvider({
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
    <SchoolBankMobileBottomContext.Provider value={api}>
      {children}
      <SchoolBankMobileUnifiedBar slot={slot} />
    </SchoolBankMobileBottomContext.Provider>
  );
}

function SchoolBankMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isSchoolBankModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างธนาคารโรงเรียน"
      slot={slot}
      pillClassName={schoolBankDockPillClass}
    >
      <SchoolBankMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
