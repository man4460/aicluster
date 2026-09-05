"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

export type EcommerceStaffAuth = {
  ownerId: string;
  trialSessionId: string;
  k: string;
};

const EcommerceStaffApiContext = createContext<EcommerceStaffAuth | null>(null);

export function EcommerceStaffApiProvider({
  staffAuth,
  children,
}: {
  staffAuth: EcommerceStaffAuth;
  children: ReactNode;
}) {
  return (
    <EcommerceStaffApiContext.Provider value={staffAuth}>{children}</EcommerceStaffApiContext.Provider>
  );
}

export function useEcommerceStaffAuth(): EcommerceStaffAuth | null {
  return useContext(EcommerceStaffApiContext);
}

/** fetch ที่แนบโทเค็นพนักงานเมื่ออยู่ในพอร์ทัล staff */
export function useEcommerceApiFetch() {
  const staff = useContext(EcommerceStaffApiContext);
  return useCallback(
    (input: string, init?: RequestInit) => {
      if (!staff) {
        return fetch(input, { ...init, credentials: init?.credentials ?? "include" });
      }
      const url = new URL(input, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      url.searchParams.set("ownerId", staff.ownerId);
      url.searchParams.set("t", staff.trialSessionId);
      url.searchParams.set("k", staff.k);
      return fetch(url.toString(), {
        ...init,
        credentials: "omit",
        cache: init?.cache ?? "no-store",
      });
    },
    [staff],
  );
}
