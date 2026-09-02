"use client";

import { useMemo } from "react";
import type { LaundryPrintShopProfile } from "@/systems/laundry/lib/laundry-print-docs";

export function useLaundryShopPrintProfile(opts: {
  shopLabel?: string;
  logoUrl?: string | null;
}): { profile: LaundryPrintShopProfile } {
  const profile = useMemo(
    () => ({
      displayName: opts.shopLabel?.trim() || "รับฝากซักผ้า",
      logoUrl: opts.logoUrl ?? null,
    }),
    [opts.shopLabel, opts.logoUrl],
  );
  return { profile };
}
