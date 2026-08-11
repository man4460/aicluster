"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { AppointmentQueueMobileDockNav } from "@/systems/appointment-queue/components/AppointmentQueueMobileDock";
import { isAppointmentQueueModulePath } from "@/systems/appointment-queue/appointment-queue-module-nav";
import { appointmentQueueDockPillClass } from "@/systems/appointment-queue/lib/ui-tokens";

type AppointmentQueueMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const AppointmentQueueMobileBottomContext = createContext<AppointmentQueueMobileBottomContextValue | null>(null);

export function useAppointmentQueueMobileBottomSlot() {
  const ctx = useContext(AppointmentQueueMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function AppointmentQueueMobileBottomProvider({
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
    <AppointmentQueueMobileBottomContext.Provider value={api}>
      {children}
      <AppointmentQueueMobileUnifiedBar slot={slot} staffFooterNav={staffFooterNav} />
    </AppointmentQueueMobileBottomContext.Provider>
  );
}

function AppointmentQueueMobileUnifiedBar({
  slot,
  staffFooterNav,
}: {
  slot: ReactNode | null;
  staffFooterNav?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onStaffPortal = pathname.startsWith("/appointment-queue/staff");

  if (onStaffPortal) {
    if (!staffFooterNav && !slot) return null;
    return (
      <AppMobileDockUnifiedBar
        ariaLabel="เมนูพนักงานจองคิว"
        slot={slot}
        pillClassName={appointmentQueueDockPillClass}
      >
        {staffFooterNav ?? <span className="sr-only">พนักงานจองคิว</span>}
      </AppMobileDockUnifiedBar>
    );
  }

  if (!isAppointmentQueueModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างจองคิวอัจฉริยะ"
      slot={slot}
      pillClassName={appointmentQueueDockPillClass}
    >
      <AppointmentQueueMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
