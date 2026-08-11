"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { ActivityLogsMobileDockNav } from "@/systems/activity-logs/components/ActivityLogsMobileDock";
import { isActivityLogsModulePath } from "@/systems/activity-logs/activity-logs-module-nav";
import { activityLogsDockPillClass } from "@/systems/activity-logs/lib/ui-tokens";

type ActivityLogsMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const ActivityLogsMobileBottomContext = createContext<ActivityLogsMobileBottomContextValue | null>(null);

export function useActivityLogsMobileBottomSlot() {
  const ctx = useContext(ActivityLogsMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function ActivityLogsMobileBottomProvider({
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
    <ActivityLogsMobileBottomContext.Provider value={api}>
      {children}
      <ActivityLogsMobileUnifiedBar slot={slot} />
    </ActivityLogsMobileBottomContext.Provider>
  );
}

function ActivityLogsMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isActivityLogsModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างประวัติกรรม"
      slot={slot}
      pillClassName={activityLogsDockPillClass}
    >
      <ActivityLogsMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
