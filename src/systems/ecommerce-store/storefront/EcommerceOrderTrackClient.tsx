"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import {
  ecommerceStoreFieldClass,
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
      <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white px-4 py-8" aria-hidden>
        <div className="mx-auto max-w-md app-surface h-64 animate-pulse rounded-[2rem] bg-[#ecebff]/30" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white px-4 py-8 pb-10">
      <div className="mx-auto max-w-md app-surface rounded-[2rem] p-6">
        <h1 className="font-black text-xl text-[#1e1b4b]">ออเดอร์ของฉัน</h1>
        <p className="mt-1 text-sm text-[#66638c]">ติดตามสถานะหรือดูประวัติการซื้อจากร้านนี้</p>

        <div className="mt-4 flex rounded-2xl bg-[#f0eeff] p-1">
          <button
            type="button"
            onClick={() => {
              setTab("code");
              setErr(null);
            }}
            className={`min-h-[40px] flex-1 rounded-xl text-sm font-bold transition ${
              tab === "code" ? "bg-white text-[#4d47b6] shadow-sm" : "text-[#66638c]"
            }`}
          >
            รหัสติดตาม
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("history");
              setErr(null);
              setResult(null);
            }}
            className={`min-h-[40px] flex-1 rounded-xl text-sm font-bold transition ${
              tab === "history" ? "bg-white text-[#4d47b6] shadow-sm" : "text-[#66638c]"
            }`}
          >
            ประวัติซื้อ
          </button>
        </div>

        {tab === "code" ? (
          <>
            <p className="mt-4 text-xs text-[#8b87b8]">ใส่รหัสที่ได้หลังสั่งซื้อสำเร็จ (หน้าชำระเงินจะพาไปหน้านี้อัตโนมัติ)</p>
            <div className="mt-3 flex gap-2">
              <input
                className={cn(ecommerceStoreFieldClass, "flex-1")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="รหัสติดตาม"
                aria-label="รหัสติดตามออเดอร์"
              />
              <button
                type="button"
                disabled={busy || !code.trim()}
                onClick={() => void lookupByCode()}
                className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
              >
                ค้นหา
              </button>
            </div>
            {result ? (
              <div className="mt-6 space-y-3 rounded-2xl bg-[#f8f7ff] p-4 text-sm">
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
                {result.courierTrackingNo ? (
                  <p>
                    <span className="text-[#66638c]">เลขพัสดุ:</span>{" "}
                    <span className="font-bold text-[#1e1b4b]">{result.courierTrackingNo}</span>
                  </p>
                ) : null}
                {result.trackingCode ? (
                  <Link
                    href={`/shop/${storeId}/order/${encodeURIComponent(result.trackingCode)}`}
                    className="inline-flex text-sm font-bold text-[#4d47b6]"
                  >
                    ดูสรุปรายการเต็ม →
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-4 text-xs text-[#8b87b8]">
              ใช้เบอร์โทรเดียวกับตอนสั่งซื้อ — แสดงเฉพาะออเดอร์ในร้านนี้
            </p>
            <div className="mt-3 flex gap-2">
              <input
                className={cn(ecommerceStoreFieldClass, "flex-1")}
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
                className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
              >
                ดูประวัติ
              </button>
            </div>
            {historyName ? (
              <p className="mt-3 text-sm text-[#66638c]">
                ลูกค้า: <span className="font-semibold text-[#1e1b4b]">{historyName}</span>
              </p>
            ) : null}
            {history.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {history.map((o) => (
                  <li key={o.trackingCode}>
                    <button
                      type="button"
                      onClick={() => openOrderDetail(o.trackingCode)}
                      className="w-full rounded-2xl border border-white/80 bg-[#f8f7ff] p-4 text-left text-sm transition hover:border-[#4d47b6]/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#1e1b4b]">{o.referenceCode}</span>
                        <span className="shrink-0 font-bold text-[#4d47b6]">{o.statusLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#66638c]">
                        {new Date(o.createdAt).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1e1b4b]">
                        ฿{Number(o.totalAmount).toLocaleString("th-TH")}
                      </p>
                      <p className="mt-1 text-xs text-[#8b87b8]">แตะเพื่อดูรายละเอียด · รหัส {o.trackingCode}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}

        {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}

        <Link href={`/shop/${storeId}`} className="mt-6 inline-block text-sm font-semibold text-[#4d47b6]">
          ← กลับหน้าร้าน
        </Link>
      </div>
    </div>
  );
}
