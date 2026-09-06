"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import {
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePortalPageInnerClass,
  ecommerceStorePortalPageShellClass,
  ecommerceStorePortalPageTitleClass,
  ecommerceStorePortalStickyHeaderClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type OrderItem = {
  productName: string;
  quantity: number;
  unitPriceBaht: string;
  lineTotalBaht: string;
};

type OrderDetail = {
  referenceCode: string;
  trackingCode: string;
  courierTrackingNo?: string | null;
  status: keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;
  statusLabel: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  paymentSlipUrl?: string | null;
  createdAt: string;
  store: { id: string; storeName: string };
  items: OrderItem[];
};

export function EcommerceOrderSummaryClient({
  storeId,
  trackingCode,
}: {
  storeId: string;
  trackingCode: string;
}) {
  const mounted = useMounted();
  const lb = useAppImageLightbox();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted || !trackingCode.trim()) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void fetch(
      `/api/ecommerce-store/public/track?code=${encodeURIComponent(trackingCode.trim())}`,
    )
      .then(async (res) => {
        const j = (await res.json()) as { error?: string; order?: OrderDetail };
        if (cancelled) return;
        if (!res.ok || !j.order) {
          setErr(j.error ?? "ไม่พบออเดอร์");
          setOrder(null);
          return;
        }
        if (j.order.store.id && j.order.store.id !== storeId) {
          setErr("ออเดอร์นี้ไม่ใช่ของร้านนี้");
          setOrder(null);
          return;
        }
        setOrder(j.order);
      })
      .catch(() => {
        if (!cancelled) setErr("โหลดสรุปรายการไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, storeId, trackingCode]);

  if (!mounted || loading) {
    return (
      <div className={ecommerceStorePortalPageShellClass} aria-hidden>
        <div className={cn(ecommerceStorePortalPageInnerClass, "space-y-4 py-8")}>
          <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className={ecommerceStorePortalPageShellClass}>
      <header className={ecommerceStorePortalStickyHeaderClass}>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center justify-between gap-3 py-3")}>
          <div className="min-w-0">
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>
              สรุปรายการ
            </h1>
            <p className="truncate text-xs font-semibold text-[#66638c] sm:text-sm">
              {order?.store.storeName ?? "คำสั่งซื้อ"}
            </p>
          </div>
          <Link href={`/shop/${storeId}`} className={cn(ecommerceStoreOutlineButtonClass, "shrink-0")}>
            กลับร้าน
          </Link>
        </div>
      </header>

      <main className={cn(ecommerceStorePortalPageInnerClass, "space-y-4 py-6 sm:space-y-5")}>
        {err ? (
          <div className={cn(ecommerceStorePanelClass, "space-y-4 p-5 text-center")}>
            <p className="text-sm font-semibold text-rose-600">{err}</p>
            <Link href={`/shop/${storeId}/track`} className={cn(ecommerceStorePrimaryButtonClass, "inline-flex")}>
              ค้นหาออเดอร์
            </Link>
          </div>
        ) : null}

        {order ? (
          <>
            <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5")}>
              <p className="text-sm font-black text-emerald-700">รับคำสั่งซื้อแล้ว</p>
              <p className="text-xs font-medium text-[#66638c]">
                ร้านกำลังตรวจสอบสลิป — เก็บรหัสติดตามไว้เพื่อดูสถานะ
              </p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-[#66638c]">รหัสติดตาม:</span>{" "}
                  <span className="font-black text-[#1e1b4b]">{order.trackingCode}</span>
                </p>
                <p>
                  <span className="text-[#66638c]">เลขอ้างอิง:</span>{" "}
                  <span className="font-bold text-[#1e1b4b]">{order.referenceCode}</span>
                </p>
                <p>
                  <span className="text-[#66638c]">สถานะ:</span>{" "}
                  <span className="font-bold text-[#4d47b6]">{order.statusLabel}</span>
                </p>
                <p>
                  <span className="text-[#66638c]">วันเวลา:</span>{" "}
                  <span className="font-semibold text-[#1e1b4b]">
                    {new Date(order.createdAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </p>
              </div>
              {order.courierTrackingNo ? (
                <p className="text-sm">
                  <span className="text-[#66638c]">เลขพัสดุ:</span>{" "}
                  <span className="font-black text-[#1e1b4b]">{order.courierTrackingNo}</span>
                </p>
              ) : null}
            </div>

            <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5")}>
              <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">รายการสินค้า</p>
              <ul className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <li
                    key={`${it.productName}-${idx}`}
                    className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#1e1b4b]">{it.productName}</p>
                      <p className="text-xs font-medium text-[#66638c]">
                        ฿{Number(it.unitPriceBaht).toLocaleString("th-TH")} × {it.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 font-black tabular-nums text-[#1e1b4b]">
                      ฿{Number(it.lineTotalBaht).toLocaleString("th-TH")}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-200/80 pt-3 text-right">
                <p className="text-[10px] font-semibold text-[#66638c]">ยอดรวม</p>
                <p className="text-xl font-black tabular-nums text-emerald-700">
                  ฿{Number(order.totalAmount).toLocaleString("th-TH")}
                </p>
              </div>
            </div>

            <div className={cn(ecommerceStorePanelClass, "space-y-2 p-4 sm:p-5")}>
              <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">ข้อมูลจัดส่ง</p>
              <p className="text-sm font-bold text-[#1e1b4b]">{order.customerName}</p>
              <p className="text-sm font-medium text-[#66638c]">{order.customerPhone}</p>
              {order.customerAddress?.trim() ? (
                <p className="whitespace-pre-wrap text-sm font-medium text-[#5f5a8a]">
                  {order.customerAddress}
                </p>
              ) : null}
              {order.paymentSlipUrl ? (
                <div className="pt-2">
                  <p className="mb-1.5 text-xs font-bold text-[#4d47b6]">สลิปที่แนบ</p>
                  <AppImageThumb
                    src={order.paymentSlipUrl}
                    alt="สลิปชำระเงิน"
                    onOpen={() => lb.open(order.paymentSlipUrl!)}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 pb-8">
              <Link
                href={`/shop/${storeId}/track?code=${encodeURIComponent(order.trackingCode)}`}
                className={cn(ecommerceStoreOutlineButtonClass)}
              >
                ติดตามสถานะ
              </Link>
              <Link href={`/shop/${storeId}`} className={cn(ecommerceStorePrimaryButtonClass)}>
                ซื้อต่อ
              </Link>
            </div>
          </>
        ) : null}
      </main>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}
