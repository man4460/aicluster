"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { LoyaltyStampMobileDockNav } from "@/systems/loyalty-stamp/components/LoyaltyStampMobileDock";
import { isLoyaltyStampModulePath } from "@/systems/loyalty-stamp/loyalty-stamp-module-nav";
import { loyaltyStampDockPillClass } from "@/systems/loyalty-stamp/lib/ui-tokens";

type LoyaltyStampMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const LoyaltyStampMobileBottomContext = createContext<LoyaltyStampMobileBottomContextValue | null>(null);

export function useLoyaltyStampMobileBottomSlot() {
  const ctx = useContext(LoyaltyStampMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function LoyaltyStampMobileBottomProvider({
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
    <LoyaltyStampMobileBottomContext.Provider value={api}>
      {children}
      <LoyaltyStampMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </LoyaltyStampMobileBottomContext.Provider>
  );
}

function LoyaltyStampMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onStaffPortal = pathname.startsWith("/loyalty-stamp/staff");

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar
        ariaLabel="เมนูพนักงานสะสมแต้ม"
        slot={slot}
        pillClassName={loyaltyStampDockPillClass}
      >
        {staffFooterNav ?? <span className="sr-only">พนักงานสะสมแต้ม</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!isLoyaltyStampModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างสะสมแต้มดิจิทัล"
      slot={slot}
      pillClassName={loyaltyStampDockPillClass}
    >
      <LoyaltyStampMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
