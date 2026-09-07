"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type HomeFinanceMobileBottomContextValue = {
  setMobileBottomSlot: (slot: ReactNode | null) => void;
};

const HomeFinanceMobileBottomContext = createContext<HomeFinanceMobileBottomContextValue | null>(null);

export function useHomeFinanceMobileBottomSlot() {
  const ctx = useContext(HomeFinanceMobileBottomContext);
  return ctx?.setMobileBottomSlot ?? ((_n: ReactNode | null) => {});
}

/** Provider เดิม — dock ย้ายไป HomeFinanceShell (AppMobileDockShell) แล้ว */
export function HomeFinanceMobileBottomProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [, setSlot] = useState<ReactNode | null>(null);
  const setMobileBottomSlot = useCallback((n: ReactNode | null) => {
    setSlot(n);
  }, []);
  const api = useMemo(() => ({ setMobileBottomSlot }), [setMobileBottomSlot]);

  return (
    <HomeFinanceMobileBottomContext.Provider value={api}>{children}</HomeFinanceMobileBottomContext.Provider>
  );
}
