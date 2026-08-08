"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";

export type HotelResortStaffAuth = {
  ownerId: string;
  trialSessionId: string;
  k: string;
};

const HotelResortStaffApiContext = createContext<HotelResortStaffAuth | null>(null);

export function HotelResortStaffApiProvider({
  staffAuth,
  children,
}: {
  staffAuth: HotelResortStaffAuth;
  children: ReactNode;
}) {
  return (
    <HotelResortStaffApiContext.Provider value={staffAuth}>{children}</HotelResortStaffApiContext.Provider>
  );
}

export function useHotelResortStaffAuth(): HotelResortStaffAuth | null {
  return useContext(HotelResortStaffApiContext);
}

/** ต่อ query พนักงาน + header ปลดล็อกรายวัน — หรือ credentials include เมื่อเป็นเจ้าของ */
export function useHotelResortApiFetch() {
  const staff = useContext(HotelResortStaffApiContext);

  return useCallback(
    (input: string, init?: RequestInit): Promise<Response> => {
      if (!staff) {
        return fetch(input, {
          ...init,
          credentials: init?.credentials ?? "include",
        });
      }

      const abs =
        input.startsWith("http://") || input.startsWith("https://")
          ? new URL(input)
          : new URL(input, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      abs.searchParams.set("ownerId", staff.ownerId);
      abs.searchParams.set("t", staff.trialSessionId);
      abs.searchParams.set("k", staff.k);
      const unlock = readStoredStaffDailyUnlock("hotel-resort", staff.ownerId);
      if (unlock) abs.searchParams.set("du", unlock);

      const headerBag = new Headers(init?.headers);
      const unlockHeaders = staffDailyUnlockHeaders("hotel-resort", staff.ownerId);
      for (const [key, value] of Object.entries(unlockHeaders)) {
        headerBag.set(key, value);
      }

      return fetch(abs.toString(), {
        ...init,
        credentials: "omit",
        headers: headerBag,
        cache: init?.cache ?? "no-store",
      });
    },
    [staff],
  );
}
