"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { EcommerceStoreMobileDockNav } from "@/systems/ecommerce-store/components/EcommerceStoreMobileDock";
import { isEcommerceStoreModulePath } from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { ecommerceStoreDockPillClass } from "@/systems/ecommerce-store/lib/ui-tokens";

type EcommerceStoreMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const EcommerceStoreMobileBottomContext = createContext<EcommerceStoreMobileBottomContextValue | null>(null);

export function useEcommerceStoreMobileBottomSlot() {
  const ctx = useContext(EcommerceStoreMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function EcommerceStoreMobileBottomProvider({
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
    <EcommerceStoreMobileBottomContext.Provider value={api}>
      {children}
      <EcommerceStoreMobileUnifiedBar slot={slot} />
    </EcommerceStoreMobileBottomContext.Provider>
  );
}

function EcommerceStoreMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isEcommerceStoreModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างร้านออนไลน์"
      slot={slot}
      pillClassName={ecommerceStoreDockPillClass}
    >
      <EcommerceStoreMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
