"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";

type Order = {
  id: string;
  referenceCode: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  paymentSlipUrl: string | null;
  status: keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;
};

const NEXT_STATUS: Record<string, string> = {
  PENDING_SLIP: "VERIFYING",
  VERIFYING: "PREPARING",
  PREPARING: "SHIPPED",
};

type FilterKey = "all" | keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "PENDING_SLIP", label: "รอสลิป" },
  { key: "VERIFYING", label: "ตรวจสอบ" },
  { key: "PREPARING", label: "จัดของ" },
  { key: "SHIPPED", label: "ส่งแล้ว" },
];

export function EcommerceOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const lb = useAppImageLightbox();

  async function reload() {
    const res = await fetch("/api/ecommerce-store/session/orders");
    const j = await res.json();
    setOrders(j.orders ?? []);
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  async function advance(id: string, status: string) {
    await fetch("/api/ecommerce-store/session/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await reload();
  }

  return (
    <AppDashboardSection className="appDashboardSectionVioletClass">
      <AppSectionHeader
        title="คำสั่งซื้อ"
        description="ตรวจสลิป · อนุมัติ · อัปเดตสถานะจัดส่ง"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition",
              filter === f.key
                ? "bg-[#4d47b6] text-white shadow-md"
                : "border border-white/60 bg-white/70 text-[#66638c]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <AppEmptyState>ไม่มีออเดอร์ในสถานะนี้</AppEmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const next = NEXT_STATUS[o.status];
            return (
              <li key={o.id} className="rounded-2xl border border-white/60 bg-white/75 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1e1b4b]">{o.referenceCode}</p>
                    <p className="text-sm text-[#66638c]">
                      {o.customerName} · {o.customerPhone}
                    </p>
                    <p className="text-sm font-semibold text-[#4d47b6]">
                      ฿{Number(o.totalAmount).toLocaleString("th-TH")} ·{" "}
                      {ECOMMERCE_ORDER_STATUS_LABELS[o.status]}
                    </p>
                  </div>
                  {o.paymentSlipUrl ? (
                    <AppImageThumb
                      src={o.paymentSlipUrl}
                      alt={`สลิป ${o.referenceCode}`}
                      onOpen={() => lb.open(o.paymentSlipUrl!)}
                    />
                  ) : null}
                </div>
                {next ? (
                  <button
                    type="button"
                    className="app-btn-primary mt-3 min-h-[40px] rounded-xl px-4 text-sm font-bold"
                    onClick={() => void advance(o.id, next)}
                  >
                    {o.status === "PENDING_SLIP" || o.status === "VERIFYING"
                      ? "ยืนยันยอด / ถัดไป"
                      : "อัปเดตสถานะ"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </AppDashboardSection>
  );
}
