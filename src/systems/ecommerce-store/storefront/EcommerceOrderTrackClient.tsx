"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import {
  ecommerceStoreFieldClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePortalPageInnerClass,
  ecommerceStorePortalPageShellClass,
  ecommerceStorePortalPageTitleClass,
  ecommerceStorePortalStickyHeaderClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { useEcommerceBuyerPhone } from "@/systems/ecommerce-store/storefront/useEcommerceBuyerPhone";

type OrderSummary = {
  referenceCode: string;
  trackingCode: string;
  status: keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;
  statusLabel: string;
  totalAmount: string;
  createdAt: string;
};

type Tab = "code" | "history";

export function EcommerceOrderTrackClient({ storeId }: { storeId: string }) {
  const mounted = useMounted();
  const sp = useSearchParams();
  const savedPhone = useEcommerceBuyerPhone(storeId);
  const [tab, setTab] = useState<Tab>("code");

  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    referenceCode: string;
    trackingCode?: string;
    courierTrackingNo?: string | null;
    status: keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;
    statusLabel: string;
    totalAmount: string;
    store: { storeName: string };
  } | null>(null);

  const [history, setHistory] = useState<OrderSummary[]>([]);
  const [historyName, setHistoryName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const qCode = sp.get("code");
    if (qCode) {
      setCode(qCode);
      setTab("code");
    }
    const qTab = sp.get("tab");
    if (qTab === "history") setTab("history");
  }, [mounted, sp]);

  useEffect(() => {
    if (!mounted) return;
    const qCode = sp.get("code")?.trim();
    if (!qCode) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/ecommerce-store/public/track?code=${encodeURIComponent(qCode)}`,
        );
        const j = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setErr(j.error ?? "ไม่พบออเดอร์");
          return;
        }
        setResult(j.order);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, sp]);

  useEffect(() => {
    if (savedPhone.ready && savedPhone.phone) setPhone(savedPhone.phone);
  }, [savedPhone.ready, savedPhone.phone]);

  async function lookupByCode() {
    setErr(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/ecommerce-store/public/track?code=${encodeURIComponent(code.trim())}`);
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "ไม่พบออเดอร์");
        return;
      }
      setResult(j.order);
    } finally {
      setBusy(false);
    }
  }

  async function lookupByPhone() {
    setErr(null);
    setHistory([]);
    setHistoryName(null);
    setBusy(true);
    try {
      savedPhone.setPhone(phone);
      const res = await fetch(
        `/api/ecommerce-store/public/${encodeURIComponent(storeId)}/buyer-orders?phone=${encodeURIComponent(phone.trim())}`,
      );
      const j = (await res.json()) as {
        error?: string;
        customerName?: string | null;
        orders?: OrderSummary[];
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      setHistoryName(j.customerName ?? null);
      setHistory(j.orders ?? []);
      if ((j.orders ?? []).length === 0) {
        setErr("ไม่พบออเดอร์ของเบอร์นี้ในร้านนี้ — ตรวจสอบเบอร์หรือใช้รหัสติดตาม");
      }
    } finally {
      setBusy(false);
    }
  }

  function openOrderDetail(trackingCode: string) {
    setTab("code");
    setCode(trackingCode);
    setResult(null);
    setErr(null);
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch(
          `/api/ecommerce-store/public/track?code=${encodeURIComponent(trackingCode.trim())}`,
        );
        const j = await res.json();
        if (!res.ok) {
          setErr(j.error ?? "ไม่พบออเดอร์");
          return;
        }
        setResult(j.order);
      } finally {
        setBusy(false);
      }
    })();
  }

  if (!mounted) {
    return (
      <div className={ecommerceStorePortalPageShellClass} aria-hidden>
        <div className={cn(ecommerceStorePortalPageInnerClass, "py-8")}>
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className={ecommerceStorePortalPageShellClass}>
      <header className={ecommerceStorePortalStickyHeaderClass}>
        <div
          className={cn(
            ecommerceStorePortalPageInnerClass,
            "flex flex-wrap items-center justify-between gap-2 py-3 sm:gap-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>
              ออเดอร์ของฉัน
            </h1>
            <p className="truncate text-xs font-semibold text-[#66638c] sm:text-sm">
              ติดตามสถานะหรือดูประวัติการซื้อ
            </p>
          </div>
          <Link href={`/shop/${storeId}`} className={cn(ecommerceStoreOutlineButtonClass, "shrink-0")}>
            กลับร้าน
          </Link>
        </div>
      </header>

      <main className={cn(ecommerceStorePortalPageInnerClass, "py-6")}>
        <div className={cn(ecommerceStorePanelClass, "mx-auto max-w-3xl p-4 sm:p-5 lg:max-w-none")}>
          <div
            className="flex rounded-lg border border-slate-200/90 bg-slate-50 p-1"
            role="tablist"
            aria-label="ค้นหาออเดอร์"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "code"}
              onClick={() => {
                setTab("code");
                setErr(null);
              }}
              className={cn(
                "min-h-9 flex-1 rounded-md text-xs font-bold transition sm:min-h-10 sm:text-sm",
                tab === "code" ? "bg-white text-[#4d47b6] shadow-sm" : "text-[#66638c]",
              )}
            >
              รหัสติดตาม
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "history"}
              onClick={() => {
                setTab("history");
                setErr(null);
                setResult(null);
              }}
              className={cn(
                "min-h-9 flex-1 rounded-md text-xs font-bold transition sm:min-h-10 sm:text-sm",
                tab === "history" ? "bg-white text-[#4d47b6] shadow-sm" : "text-[#66638c]",
              )}
            >
              ประวัติซื้อ
            </button>
          </div>

          {tab === "code" ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-[#8b87b8]">
                ใส่รหัสที่ได้หลังสั่งซื้อสำเร็จ — หรือเปิดจากหน้าสรุปรายการ
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={cn(ecommerceStoreFieldClass, "min-w-0 flex-1")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="รหัสติดตาม"
                  aria-label="รหัสติดตามออเดอร์"
                />
                <button
                  type="button"
                  disabled={busy || !code.trim()}
                  onClick={() => void lookupByCode()}
                  className={cn(ecommerceStorePrimaryButtonClass, "w-full shrink-0 sm:w-auto sm:px-5")}
                >
                  ค้นหา
                </button>
              </div>
              {result ? (
                <div className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="text-[#66638c]">ร้าน:</span> {result.store.storeName}
                    </p>
                    <p>
                      <span className="text-[#66638c]">เลขอ้างอิง:</span> {result.referenceCode}
                    </p>
                    <p>
                      <span className="text-[#66638c]">สถานะ:</span>{" "}
                      <span className="font-bold text-[#4d47b6]">{result.statusLabel}</span>
                    </p>
                    <p>
                      <span className="text-[#66638c]">ยอด:</span> ฿
                      {Number(result.totalAmount).toLocaleString("th-TH")}
                    </p>
                  </div>
                  {result.courierTrackingNo ? (
                    <p>
                      <span className="text-[#66638c]">เลขพัสดุ:</span>{" "}
                      <span className="font-bold text-[#1e1b4b]">{result.courierTrackingNo}</span>
                    </p>
                  ) : null}
                  {result.trackingCode ? (
                    <Link
                      href={`/shop/${storeId}/order/${encodeURIComponent(result.trackingCode)}`}
                      className={cn(ecommerceStorePrimaryButtonClass, "inline-flex w-full sm:w-auto")}
                    >
                      ดูสรุปรายการ
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-[#8b87b8]">
                ใช้เบอร์โทรเดียวกับตอนสั่งซื้อ — แสดงเฉพาะออเดอร์ในร้านนี้
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={cn(ecommerceStoreFieldClass, "min-w-0 flex-1")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เบอร์โทร"
                  inputMode="tel"
                  aria-label="เบอร์โทรที่ใช้สั่งซื้อ"
                />
                <button
                  type="button"
                  disabled={busy || !phone.trim()}
                  onClick={() => void lookupByPhone()}
                  className={cn(ecommerceStorePrimaryButtonClass, "w-full shrink-0 sm:w-auto sm:px-5")}
                >
                  ดูประวัติ
                </button>
              </div>
              {historyName ? (
                <p className="text-sm text-[#66638c]">
                  ลูกค้า: <span className="font-semibold text-[#1e1b4b]">{historyName}</span>
                </p>
              ) : null}
              {history.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {history.map((o) => (
                    <li key={o.trackingCode}>
                      <button
                        type="button"
                        onClick={() => openOrderDetail(o.trackingCode)}
                        className={cn(
                          ecommerceStorePanelClass,
                          "w-full p-3.5 text-left text-sm transition hover:border-[#5b61ff]/35 sm:p-4",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-bold text-[#1e1b4b]">{o.referenceCode}</span>
                          <span className="shrink-0 text-[11px] font-bold text-[#4d47b6]">
                            {o.statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#66638c]">
                          {new Date(o.createdAt).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="mt-1 text-sm font-black tabular-nums text-emerald-700">
                          ฿{Number(o.totalAmount).toLocaleString("th-TH")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}
        </div>
      </main>
    </div>
  );
}
