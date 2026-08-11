"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { VaultMobileDockNav } from "@/systems/vault/components/VaultMobileDock";
import { isVaultModulePath } from "@/systems/vault/vault-module-nav";
import { vaultDockPillClass } from "@/systems/vault/lib/ui-tokens";

type VaultMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const VaultMobileBottomContext = createContext<VaultMobileBottomContextValue | null>(null);

export function useVaultMobileBottomSlot() {
  const ctx = useContext(VaultMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function VaultMobileBottomProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <VaultMobileBottomContext.Provider value={api}>
      {children}
      <VaultMobileUnifiedBar slot={slot} />
    </VaultMobileBottomContext.Provider>
  );
}

function VaultMobileUnifiedBar({ slot }: { slot: ReactNode | null }) {
  const pathname = usePathname() ?? "";
  if (!isVaultModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างคลังรหัสผ่าน"
      slot={slot}
      pillClassName={vaultDockPillClass}
    >
      <VaultMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
