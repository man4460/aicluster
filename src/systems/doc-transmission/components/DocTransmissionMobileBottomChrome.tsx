"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { DocTransmissionMobileDockNav } from "@/systems/doc-transmission/components/DocMobileDock";
import { isDocTransmissionModulePath } from "@/systems/doc-transmission/doc-transmission-module-nav";
import { docTransmissionDockPillClass } from "@/systems/doc-transmission/lib/ui-tokens";

type DocTransmissionMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const DocTransmissionMobileBottomContext = createContext<DocTransmissionMobileBottomContextValue | null>(null);

export function useDocTransmissionMobileBottomSlot() {
  const ctx = useContext(DocTransmissionMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

export function DocTransmissionMobileBottomProvider({
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
    <DocTransmissionMobileBottomContext.Provider value={api}>
      {children}
      <DocTransmissionMobileUnifiedBar slot={slot} />
    </DocTransmissionMobileBottomContext.Provider>
  );
}

function DocTransmissionMobileUnifiedBar({
  slot,
}: {
  slot: ReactNode | null;
}) {
  const pathname = usePathname() ?? "";

  if (!isDocTransmissionModulePath(pathname)) return null;

  return (
    <AppMobileDockUnifiedBar
      ariaLabel="เมนูล่างสารบรรณดิจิทัล"
      slot={slot}
      pillClassName={docTransmissionDockPillClass}
    >
      <DocTransmissionMobileDockNav />
    </AppMobileDockUnifiedBar>
  );
}
