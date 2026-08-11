"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { WaitQueueMobileDockNav } from "@/systems/wait-queue/components/WaitQueueMobileDock";
import { isWaitQueueModulePath } from "@/systems/wait-queue/wait-queue-module-nav";
import { waitQueueDockPillClass } from "@/systems/wait-queue/lib/ui-tokens";

type WaitQueueMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const WaitQueueMobileBottomContext = createContext<WaitQueueMobileBottomContextValue | null>(null);

export function useWaitQueueMobileBottomSlot() {
  const ctx = useContext(WaitQueueMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function WaitQueueMobileBottomProvider({
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
    <WaitQueueMobileBottomContext.Provider value={api}>
      {children}
      <WaitQueueMobileUnifiedBar slot={slot} />
    </WaitQueueMobileBottomContext.Provider>
  );
}

function WaitQueueMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isWaitQueueModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างคิวหน้าร้าน"
      slot={slot}
      pillClassName={waitQueueDockPillClass}
    >
      <WaitQueueMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
