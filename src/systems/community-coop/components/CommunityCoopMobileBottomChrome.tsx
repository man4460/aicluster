"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { CommunityCoopMobileDockNav } from "@/systems/community-coop/components/CommunityCoopMobileDock";
import { isCommunityCoopModulePath } from "@/systems/community-coop/community-coop-module-nav";
import { communityCoopDockPillClass } from "@/systems/community-coop/lib/ui-tokens";

type CommunityCoopMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const CommunityCoopMobileBottomContext = createContext<CommunityCoopMobileBottomContextValue | null>(null);

export function useCommunityCoopMobileBottomSlot() {
  const ctx = useContext(CommunityCoopMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function CommunityCoopMobileBottomProvider({
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
    <CommunityCoopMobileBottomContext.Provider value={api}>
      {children}
      <CommunityCoopMobileUnifiedBar slot={slot} />
    </CommunityCoopMobileBottomContext.Provider>
  );
}

function CommunityCoopMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isCommunityCoopModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างสหกรณ์ชุมชน"
      slot={slot}
      pillClassName={communityCoopDockPillClass}
    >
      <CommunityCoopMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
