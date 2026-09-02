"use client";

import { useEffect, useMemo, useState } from "react";
import type { LaundryPrintShopProfile } from "@/systems/laundry/lib/laundry-print-docs";

type ApiProfile = {
  displayName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  slipPaperSize?: string | null;
  taxId?: string | null;
  bankAccountName?: string | null;
};

export function useLaundryShopPrintProfile(fallback?: {
  shopLabel?: string;
  logoUrl?: string | null;
}) {
  const [raw, setRaw] = useState<ApiProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/laundry/shop-profile", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: ApiProfile } | null) => {
        if (!cancelled && data?.profile) setRaw(data.profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = useMemo((): LaundryPrintShopProfile => {
    return {
      displayName: raw?.displayName?.trim() || fallback?.shopLabel || "รับฝากซักผ้า",
      logoUrl: raw?.logoUrl || fallback?.logoUrl || null,
      address: raw?.address ?? null,
      taxId: raw?.taxId ?? null,
      contactPhone: raw?.contactPhone ?? null,
      bankAccountName: raw?.bankAccountName ?? null,
      slipPaperSize: raw?.slipPaperSize ?? null,
    };
  }, [raw, fallback?.shopLabel, fallback?.logoUrl]);

  return { profile, loaded: raw != null };
}
