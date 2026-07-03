"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import {
  ecommerceCardAccentBarClass,
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceGradientPriceClass,
  ecommerceInitialAvatarClass,
  ecommerceListRowCardClass,
  ecommerceListStackClass,
  ecommerceMetaChipClass,
  ecommerceOrderStatusBadgeClass,
  ecommercePlainIconActionClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

type OrderStatus = "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED";

type Order = {
  id: string;
  referenceCode: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  paymentSlipUrl: string | null;
  status: OrderStatus;
};

const NEXT_STATUS: Record<string, OrderStatus | undefined> = {
  PENDING_SLIP: "VERIFYING",
  VERIFYING: "PREPARING",
  PREPARING: "SHIPPED",
};

type FilterKey = "all" | OrderStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "PENDING_SLIP", label: "รอสลิป" },
  { key: "VERIFYING", label: "ตรวจสอบ" },
  { key: "PREPARING", label: "จัดของ" },
  { key: "SHIPPED", label: "ส่งแล้ว" },
];

const STATUS_ACCENT: Record<OrderStatus, "amber" | "sky" | "violet" | "emerald"> = {
  PENDING_SLIP: "amber",
  VERIFYING: "sky",
  PREPARING: "violet",
  SHIPPED: "emerald",
};

const STATUS_NEXT_LABEL: Record<OrderStatus, string> = {
  PENDING_SLIP: "ยืนยันสลิป → ตรวจสอบ",
  VERIFYING: "ยืนยันยอด → จัดของ",
  PREPARING: "แจ้งจัดส่งแล้ว",
  SHIPPED: "",
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarToneFor(id: string): "violet" | "amber" | "emerald" | "rose" | "slate" {
  const tones: Array<"violet" | "amber" | "emerald" | "rose" | "slate"> = [
    "violet",
    "amber",
    "emerald",
    "rose",
    "slate",
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return tones[sum % tones.length];
}

function statusIcon(status: OrderStatus, className?: string) {
  const iconProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    "aria-hidden": true as const,
  };
  switch (status) {
    case "PENDING_SLIP":
      return (
        <svg {...iconProps}>
          <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
          <path d="M14 3v6h6M9 15h6M9 11h3" strokeLinecap="round" />
        </svg>
      );
    case "VERIFYING":
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3M9 11h4M11 9v4" strokeLinecap="round" />
        </svg>
      );
    case "PREPARING":
      return (
        <svg {...iconProps}>
          <path d="M21 16V8a2 2 0 00-1-1.73L13 2.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinejoin="round" />
          <path d="M12 22V12M12 12L3 7M12 12l9-5" />
        </svg>
      );
    case "SHIPPED":
      return (
        <svg {...iconProps}>
          <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" strokeLinejoin="round" />
          <circle cx="7" cy="18" r="1.8" />
          <circle cx="17" cy="18" r="1.8" />
        </svg>
      );
  }
}

export function EcommerceOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const lb = useAppImageLightbox();

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/orders");
      const j = await res.json();
      setOrders(j.orders ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = {
      all: orders.length,
      PENDING_SLIP: 0,
      VERIFYING: 0,
      PREPARING: 0,
      SHIPPED: 0,
    };
    for (const o of orders) map[o.status] += 1;
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!kw) return true;
      const blob = `${o.referenceCode} ${o.customerName} ${o.customerPhone}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [orders, filter, keyword]);

  const hasActiveFilter = filter !== "all" || keyword.trim() !== "";

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
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            onClick={() => void reload()}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-[40px] min-w-[40px] rounded-xl px-0 sm:min-w-0 sm:px-4",
            )}
            aria-label="รีเฟรชรายการออเดอร์"
            aria-busy={loading}
          >
            <IconRefresh className={cn("h-5 w-5 sm:mr-1.5", loading && "animate-spin")} aria-hidden />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        }
      />

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b87b8]" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหารหัสออเดอร์ · ชื่อ · เบอร์โทร"
              className={cn(ecommerceFieldClass, "pl-9")}
              aria-label="ค้นหาออเดอร์"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFilterOpen((v) => !v)}
            className={cn(
              appTemplateOutlineButtonClass,
              "relative min-h-[44px] min-w-[44px] shrink-0 px-0 sm:hidden",
              (hasActiveFilter || mobileFilterOpen) && "border-[#5b61ff]/40 bg-[#ecebff]/80",
            )}
            aria-label="เปิดตัวกรองสถานะ"
            aria-expanded={mobileFilterOpen}
          >
            <IconFilter className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "space-y-2 rounded-2xl border border-white/50 bg-white/25 p-3 backdrop-blur-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
            mobileFilterOpen ? "block" : "hidden sm:block",
          )}
        >
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch]">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key];
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(ecommerceFilterChipClass(active), "gap-1.5")}
                  aria-pressed={active}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-black tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-[#5b61ff]/10 text-[#4d47b6]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">
            {hasActiveFilter
              ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${orders.length.toLocaleString("th-TH")} ออเดอร์`
              : `ทั้งหมด ${orders.length.toLocaleString("th-TH")} ออเดอร์`}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <AppEmptyState>{loading ? "กำลังโหลด…" : "ไม่มีออเดอร์ในสถานะนี้"}</AppEmptyState>
      ) : (
        <ul className={ecommerceListStackClass}>
          {filtered.map((o) => {
            const next = NEXT_STATUS[o.status];
            const accent = STATUS_ACCENT[o.status];
            const amountText = `฿${Number(o.totalAmount).toLocaleString("th-TH")}`;

            const slipIcon = o.paymentSlipUrl ? (
              <button
                type="button"
                className={cn(ecommercePlainIconActionClass, "text-emerald-600 hover:bg-emerald-500/[0.08]")}
                onClick={() => lb.open(o.paymentSlipUrl!)}
                aria-label={`ดูสลิป ${o.referenceCode}`}
                title="ดูสลิป"
              >
                <IconReceipt className="h-5 w-5" aria-hidden />
              </button>
            ) : (
              <span
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-amber-500"
                title="ยังไม่มีสลิป"
                aria-label="ยังไม่มีสลิป"
              >
                <IconReceipt className="h-5 w-5 opacity-40" aria-hidden />
              </span>
            );

            const priceBlock = (compact?: boolean) => (
              <div className={cn("text-right", compact ? "" : "shrink-0")}>
                {!compact ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">ยอดชำระ</p>
                ) : null}
                <p
                  className={cn(
                    "font-black tabular-nums leading-tight",
                    compact ? "text-lg" : "text-xl sm:text-2xl",
                    ecommerceGradientPriceClass,
                  )}
                >
                  {amountText}
                </p>
              </div>
            );

            return (
              <li key={o.id} className={cn(ecommerceListRowCardClass, "relative overflow-hidden pl-5 sm:pl-6")}>
                <span className={ecommerceCardAccentBarClass(accent)} aria-hidden />

                <div className="hidden md:absolute md:right-4 md:top-4 md:flex md:flex-col md:items-end md:gap-1.5">
                  {priceBlock()}
                  {slipIcon}
                </div>

                <div className="flex gap-3 md:pr-36">
                  <div className={cn(ecommerceInitialAvatarClass(avatarToneFor(o.id)), "shrink-0")}>
                    {getInitials(o.customerName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-base font-black tracking-tight text-[#1e1b4b]">{o.referenceCode}</p>
                      <span className={cn(ecommerceOrderStatusBadgeClass(o.status), "inline-flex items-center gap-1")}>
                        {statusIcon(o.status, "h-3 w-3")}
                        {ECOMMERCE_ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2e2a58]">{o.customerName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className={ecommerceMetaChipClass}>
                            <IconPhone className="h-3 w-3" />
                            {o.customerPhone}
                          </span>
                          <span className="md:hidden">{slipIcon}</span>
                        </div>
                      </div>
                      <div className="shrink-0 md:hidden">{priceBlock(true)}</div>
                    </div>
                  </div>
                </div>

                {next ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-white/40 pt-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      className="app-btn-primary flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black sm:w-auto"
                      onClick={() => void advance(o.id, next)}
                    >
                      {STATUS_NEXT_LABEL[o.status]}
                      <IconArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/40 pt-3 text-xs font-black text-emerald-700">
                    <IconCheck className="h-4 w-4" />
                    เสร็จสมบูรณ์
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </AppDashboardSection>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c0 1.1-.9 2-2 2A17 17 0 013 5c0-1.1.9-2 2-2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
