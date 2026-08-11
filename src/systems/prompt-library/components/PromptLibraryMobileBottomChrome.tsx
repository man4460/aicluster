"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { PromptLibraryMobileDockNav } from "@/systems/prompt-library/components/PromptMobileDock";
import { isPromptLibraryModulePath } from "@/systems/prompt-library/prompt-library-module-nav";
import { promptLibraryDockPillClass } from "@/systems/prompt-library/lib/ui-tokens";

type PromptLibraryMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const PromptLibraryMobileBottomContext = createContext<PromptLibraryMobileBottomContextValue | null>(null);

export function usePromptLibraryMobileBottomSlot() {
  const ctx = useContext(PromptLibraryMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function PromptLibraryMobileBottomProvider({
  children,
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
    <PromptLibraryMobileBottomContext.Provider value={api}>
      {children}
      <PromptLibraryMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </PromptLibraryMobileBottomContext.Provider>
  );
}

function PromptLibraryMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onStaffPortal = pathname.startsWith("/prompt-library/staff");

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar
        ariaLabel="เมนูพนักงานคลังคำสั่ง AI"
        slot={slot}
        pillClassName={promptLibraryDockPillClass}
      >
        {staffFooterNav ?? <span className="sr-only">พนักงานคลังคำสั่ง AI</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!isPromptLibraryModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างคลังคำสั่ง AI"
      slot={slot}
      pillClassName={promptLibraryDockPillClass}
    >
      <PromptLibraryMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
