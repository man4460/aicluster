"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { readStoredStaffDailyUnlock, staffDailyUnlockHeaders } from "@/lib/modules/staff-daily-pin";

export type ParkingStaffAuth = {
  ownerId: string;
  trialSessionId: string;
  k: string;
};

const ParkingStaffApiContext = createContext<ParkingStaffAuth | null>(null);

export function ParkingStaffApiProvider({
  staffAuth,
  children,
}: {
  staffAuth: ParkingStaffAuth;
  children: ReactNode;
}) {
  return <ParkingStaffApiContext.Provider value={staffAuth}>{children}</ParkingStaffApiContext.Provider>;
}

export function useParkingApiFetch() {
  const staff = useContext(ParkingStaffApiContext);
  return useCallback(
    (input: string, init?: RequestInit) => {
      if (!staff) return fetch(input, { ...init, credentials: init?.credentials ?? "include" });
      const url = new URL(input, window.location.origin);
      url.searchParams.set("ownerId", staff.ownerId);
      url.searchParams.set("t", staff.trialSessionId);
      url.searchParams.set("k", staff.k);
      const unlock = readStoredStaffDailyUnlock("parking", staff.ownerId);
      if (unlock) url.searchParams.set("du", unlock);
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(staffDailyUnlockHeaders("parking", staff.ownerId))) {
        headers.set(key, value);
      }
      return fetch(url.toString(), {
        ...init,
        headers,
        credentials: "omit",
        cache: init?.cache ?? "no-store",
      });
    },
    [staff],
  );
}
