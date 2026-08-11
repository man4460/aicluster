"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { AttendanceMobileDockNav } from "@/systems/attendance/components/AttendanceMobileDock";
import { isAttendanceModulePath } from "@/systems/attendance/attendance-module-nav";
import { attendanceDockPillClass } from "@/systems/attendance/lib/ui-tokens";

type AttendanceMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const AttendanceMobileBottomContext = createContext<AttendanceMobileBottomContextValue | null>(null);

export function useAttendanceMobileBottomSlot() {
  const ctx = useContext(AttendanceMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function AttendanceMobileBottomProvider({
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
    <AttendanceMobileBottomContext.Provider value={api}>
      {children}
      <AttendanceMobileUnifiedBar slot={slot} />
    </AttendanceMobileBottomContext.Provider>
  );
}

function AttendanceMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isAttendanceModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างเช็คอินอัจฉริยะ"
      slot={slot}
      pillClassName={attendanceDockPillClass}
    >
      <AttendanceMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
