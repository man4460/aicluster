"use client";

import { useEffect, useState } from "react";
import { normalizeBarberSlipUrlForDashboard } from "@/lib/barber/receipt-display-url";

function saleReceiptApiPath(subscriptionId: number): string {
  return `/api/barber/subscriptions/${subscriptionId}/sale-receipt`;
}

/** true ถ้า URL ที่ API/สเตทให้มาคือ endpoint สลิปตามรหัสสมาชิก (รองรับ absolute URL) */
export function isBarberSubscriptionSaleReceiptApiUrl(
  subscriptionId: number,
  url: string | null | undefined,
): boolean {
  if (!url?.trim()) return false;
  const path = saleReceiptApiPath(subscriptionId);
  const u = url.trim().split("#")[0] ?? "";
  if (u === path || u.startsWith(`${path}?`)) return true;
  try {
    if (u.startsWith("http://") || u.startsWith("https://")) {
      const parsed = new URL(u);
      const p = parsed.pathname.replace(/\/$/, "");
      return p === path || p === `${path}/`;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * โหลดสลิปผ่าน fetch+credentials แล้วได้ blob: URL — แก้เคส <img src=/api/...> ไม่แสดงทั้งที่ล็อกอินแล้ว
 */
export function useBarberSubscriptionSaleReceiptBlobUrl(
  subscriptionId: number,
  saleReceiptImageUrl: string | null | undefined,
): { displaySrc: string | null; loading: boolean } {
  const useFetch = isBarberSubscriptionSaleReceiptApiUrl(subscriptionId, saleReceiptImageUrl);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  /** โหลดครบแล้ว (สำเร็จหรือล้มเหลว) — เริ่ม false เมื่อต้อง fetch เพื่อไม่ให้เฟรมแรกโชว์ว่าไม่มีสลิป */
  const [fetchSettled, setFetchSettled] = useState(false);

  useEffect(() => {
    if (!saleReceiptImageUrl?.trim() || !useFetch) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFetchSettled(true);
      return;
    }

    let cancelled = false;
    let created: string | null = null;
    setFetchSettled(false);

    void (async () => {
      try {
        const res = await fetch(saleReceiptApiPath(subscriptionId), {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled || !res.ok) {
          if (!cancelled) {
            setBlobUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
          }
          return;
        }
        const blob = await res.blob();
        if (cancelled || !blob.type.startsWith("image/")) {
          if (!cancelled) {
            setBlobUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
          }
          return;
        }
        created = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(created);
          return;
        }
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return created;
        });
      } catch {
        if (!cancelled) {
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        if (!cancelled) setFetchSettled(true);
      }
    })();

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [subscriptionId, saleReceiptImageUrl, useFetch]);

  if (!saleReceiptImageUrl?.trim()) {
    return { displaySrc: null, loading: false };
  }

  if (useFetch) {
    return { displaySrc: blobUrl, loading: !fetchSettled };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    displaySrc: normalizeBarberSlipUrlForDashboard(saleReceiptImageUrl, origin),
    loading: false,
  };
}
