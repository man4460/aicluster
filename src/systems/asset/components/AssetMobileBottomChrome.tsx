"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { AssetMobileDockNav } from "@/systems/asset/components/AssetMobileDock";
import { isAssetModulePath } from "@/systems/asset/asset-module-nav";
import { assetDockPillClass } from "@/systems/asset/lib/ui-tokens";

type AssetMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const AssetMobileBottomContext = createContext<AssetMobileBottomContextValue | null>(null);

export function useAssetMobileBottomSlot() {
  const ctx = useContext(AssetMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function AssetMobileBottomProvider({
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
    <AssetMobileBottomContext.Provider value={api}>
      {children}
      <AssetMobileUnifiedBar slot={slot} />
    </AssetMobileBottomContext.Provider>
  );
}

function AssetMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isAssetModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างบริหารทรัพย์สิน"
      slot={slot}
      pillClassName={assetDockPillClass}
    >
      <AssetMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
