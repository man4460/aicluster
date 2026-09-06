"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
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
  ecommerceStorePortalBottomDockClass,
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

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-[#8b87b8] sm:text-xs">{label}</p>
      <div className="mt-0.5 text-sm font-bold text-[#1e1b4b] sm:text-[15px]">{children}</div>
    </div>
  );
}

function OrderAside({
  order,
  storeId,
  onOpenSlip,
  className,
}: {
  order: OrderDetail;
  storeId: string;
  onOpenSlip: (url: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5")}>
        <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">ยอดชำระ</p>
        <p className="text-[10px] font-semibold text-[#66638c]">
          {order.items.length} รายการ · {order.statusLabel}
        </p>
        <p className="text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
          ฿{Number(order.totalAmount).toLocaleString("th-TH")}
        </p>
        {order.paymentSlipUrl ? (
          <div className="border-t border-slate-200/80 pt-3">
            <p className="mb-1.5 text-xs font-bold text-[#4d47b6]">สลิปที่แนบ</p>
            <AppImageThumb
              src={order.paymentSlipUrl}
              alt="สลิปชำระเงิน"
              onOpen={() => onOpenSlip(order.paymentSlipUrl!)}
            />
          </div>
        ) : null}
      </div>

      <div className="hidden gap-2 lg:flex lg:flex-col">
        <Link
          href={`/shop/${storeId}`}
          className={cn(ecommerceStorePrimaryButtonClass, "w-full")}
        >
          ซื้อต่อ
        </Link>
        <Link
          href={`/shop/${storeId}/track?code=${encodeURIComponent(order.trackingCode)}`}
          className={cn(ecommerceStoreOutlineButtonClass, "w-full")}
        >
          ติดตามสถานะ
        </Link>
      </div>
    </div>
  );
}

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
        <div
          className={cn(
            ecommerceStorePortalPageInnerClass,
            "grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]",
          )}
        >
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="hidden h-40 animate-pulse rounded-xl bg-slate-100 lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(ecommerceStorePortalPageShellClass, order ? "pb-28 lg:pb-0" : undefined)}>
      <header className={ecommerceStorePortalStickyHeaderClass}>
        <div
          className={cn(
            ecommerceStorePortalPageInnerClass,
            "flex flex-wrap items-center justify-between gap-2 py-3 sm:gap-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>
              สรุปรายการ
            </h1>
            <p className="truncate text-xs font-semibold text-[#66638c] sm:text-sm">
              {order?.store.storeName ?? "คำสั่งซื้อ"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {order ? (
              <Link
                href={`/shop/${storeId}/track?code=${encodeURIComponent(order.trackingCode)}`}
                className={cn(ecommerceStoreOutlineButtonClass, "hidden sm:inline-flex")}
              >
                ติดตามสถานะ
              </Link>
            ) : null}
            <Link href={`/shop/${storeId}`} className={cn(ecommerceStoreOutlineButtonClass, "shrink-0")}>
              กลับร้าน
            </Link>
          </div>
        </div>
      </header>

      <main
        className={cn(
          ecommerceStorePortalPageInnerClass,
          "grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8",
        )}
      >
        {err ? (
          <div className={cn(ecommerceStorePanelClass, "space-y-4 p-5 text-center lg:col-span-2")}>
            <p className="text-sm font-semibold text-rose-600">{err}</p>
            <Link
              href={`/shop/${storeId}/track`}
              className={cn(ecommerceStorePrimaryButtonClass, "inline-flex")}
            >
              ค้นหาออเดอร์
            </Link>
          </div>
        ) : null}

        {order ? (
          <>
            <div className="space-y-4 sm:space-y-5">
              <div className="lg:hidden">
                <OrderAside
                  order={order}
                  storeId={storeId}
                  onOpenSlip={(url) => lb.open(url)}
                />
              </div>

              <div className={cn(ecommerceStorePanelClass, "space-y-3 p-3.5 sm:p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-emerald-700 sm:text-base">
                      รับคำสั่งซื้อแล้ว
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                      ร้านกำลังตรวจสอบสลิป — เก็บรหัสติดตามไว้เพื่อดูสถานะ
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-lg border border-[#5b61ff]/25 bg-[#5b61ff]/10 px-2.5 py-1 text-[11px] font-bold text-[#4d47b6]">
                    {order.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-3 sm:gap-4">
                  <MetaRow label="รหัสติดตาม">
                    <span className="break-all font-black">{order.trackingCode}</span>
                  </MetaRow>
                  <MetaRow label="เลขอ้างอิง">
                    <span className="break-all">{order.referenceCode}</span>
                  </MetaRow>
                  <MetaRow label="วันเวลา">
                    {new Date(order.createdAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </MetaRow>
                  {order.courierTrackingNo ? (
                    <MetaRow label="เลขพัสดุ">
                      <span className="font-black">{order.courierTrackingNo}</span>
                    </MetaRow>
                  ) : (
                    <MetaRow label="เลขพัสดุ">
                      <span className="font-semibold text-[#8b87b8]">รอจัดส่ง</span>
                    </MetaRow>
                  )}
                </div>
              </div>

              <div className={cn(ecommerceStorePanelClass, "space-y-3 p-3.5 sm:p-5")}>
                <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">รายการสินค้า</p>
                <ul className="divide-y divide-slate-100">
                  {order.items.map((it, idx) => (
                    <li
                      key={`${it.productName}-${idx}`}
                      className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-bold text-[#1e1b4b]">{it.productName}</p>
                        <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                          ฿{Number(it.unitPriceBaht).toLocaleString("th-TH")} × {it.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 font-black tabular-nums text-[#1e1b4b]">
                        ฿{Number(it.lineTotalBaht).toLocaleString("th-TH")}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-200/80 pt-3 text-right lg:hidden">
                  <p className="text-[10px] font-semibold text-[#66638c]">ยอดรวม</p>
                  <p className="text-xl font-black tabular-nums text-emerald-700">
                    ฿{Number(order.totalAmount).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              <div className={cn(ecommerceStorePanelClass, "space-y-2 p-3.5 sm:p-5")}>
                <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">ผู้รับ / ที่อยู่</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1e1b4b]">{order.customerName}</p>
                    <p className="text-sm font-medium text-[#66638c]">{order.customerPhone}</p>
                  </div>
                  {order.customerAddress?.trim() ? (
                    <p className="whitespace-pre-wrap text-sm font-medium text-[#5f5a8a] sm:text-right">
                      {order.customerAddress}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[#8b87b8] sm:text-right">ไม่ระบุที่อยู่</p>
                  )}
                </div>
              </div>
            </div>

            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <OrderAside
                order={order}
                storeId={storeId}
                onOpenSlip={(url) => lb.open(url)}
              />
            </aside>
          </>
        ) : null}
      </main>

      {order ? (
        <div className={ecommerceStorePortalBottomDockClass}>
          <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center gap-2 sm:gap-3")}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[#66638c]">{order.items.length} รายการ</p>
              <p className="text-lg font-black tabular-nums text-emerald-700">
                ฿{Number(order.totalAmount).toLocaleString("th-TH")}
              </p>
            </div>
            <Link
              href={`/shop/${storeId}/track?code=${encodeURIComponent(order.trackingCode)}`}
              className={cn(ecommerceStoreOutlineButtonClass, "shrink-0 px-3")}
              aria-label="ติดตามสถานะออเดอร์"
            >
              <span className="sm:hidden">ติดตาม</span>
              <span className="hidden sm:inline">ติดตามสถานะ</span>
            </Link>
            <Link
              href={`/shop/${storeId}`}
              className={cn(ecommerceStorePrimaryButtonClass, "shrink-0 px-4 sm:px-5")}
            >
              ซื้อต่อ
            </Link>
          </div>
        </div>
      ) : null}

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}
