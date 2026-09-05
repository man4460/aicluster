"use client";

import { Package, Phone, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceOrderStatusBadgeClass,
  ecommerceProductTagClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  EcommerceOrderFulfillModal,
  type EcommerceFulfillOrder,
} from "@/systems/ecommerce-store/components/EcommerceOrderFulfillModal";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreOrderRowTone,
  ecommerceStoreTonedRowCardClass,
} from "@/systems/ecommerce-store/lib/card-tones";
import type { EcommerceOrderPrintShop } from "@/systems/ecommerce-store/lib/ecommerce-order-print";
import {
  ecommerceStoreContentStackClass,
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { useEcommerceDashboardSse } from "@/systems/ecommerce-store/lib/use-ecommerce-dashboard-sse";
import {
  useEcommerceApiFetch,
  useEcommerceStaffAuth,
} from "@/systems/ecommerce-store/lib/staff-api-fetch";

type OrderStatus = "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceBaht: string;
  imageUrl?: string | null;
};

type Order = {
  id: string;
  referenceCode: string;
  trackingCode: string;
  courierTrackingNo?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  totalAmount: string;
  paymentSlipUrl: string | null;
  paymentMethod?: string | null;
  status: OrderStatus;
  salesChannel?: "ONLINE" | "IN_STORE";
  createdAt?: string;
  items?: OrderItem[];
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

const STATUS_NEXT_LABEL: Record<OrderStatus, string> = {
  PENDING_SLIP: "ยืนยันสลิป",
  VERIFYING: "เริ่มจัดของ",
  PREPARING: "จัดของ / จัดส่ง",
  SHIPPED: "",
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function orderThumbUrl(o: Order): string | null {
  if (o.paymentSlipUrl?.trim()) return o.paymentSlipUrl.trim();
  const first = o.items?.find((it) => it.imageUrl?.trim())?.imageUrl?.trim();
  return first || null;
}

export type EcommerceOrdersEmbeddedToolbarApi = {
  filterOpen: boolean;
  hasActiveFilters: boolean;
  toggleFilter: () => void;
  reload: () => void;
  loading: boolean;
};

export function EcommerceOrdersClient({
  embedded = false,
  onEmbeddedToolbar,
}: {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: EcommerceOrdersEmbeddedToolbarApi | null) => void;
} = {}) {
  const apiFetch = useEcommerceApiFetch();
  const staffAuth = useEcommerceStaffAuth();
  const notice = useAppNoticePopup();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shop, setShop] = useState<EcommerceOrderPrintShop | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fulfillOrder, setFulfillOrder] = useState<EcommerceFulfillOrder | null>(null);
  const [shipBusy, setShipBusy] = useState(false);
  const lb = useAppImageLightbox();

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const [ordRes, storeRes] = await Promise.all([
          apiFetch("/api/ecommerce-store/session/orders?channel=ONLINE"),
          apiFetch("/api/ecommerce-store/session/store", { cache: "no-store" }),
        ]);
        const j = await ordRes.json();
        setOrders(j.orders ?? []);
        const storeJ = await storeRes.json().catch(() => ({}));
        const s = storeJ.store as
          | {
              storeName?: string;
              logoUrl?: string | null;
              address?: string | null;
              taxId?: string | null;
              contactPhone?: string | null;
              slipPaperSize?: string | null;
            }
          | undefined;
        if (s) {
          setShop({
            storeName: s.storeName,
            logoUrl: s.logoUrl,
            address: s.address,
            taxId: s.taxId,
            contactPhone: s.contactPhone,
            slipPaperSize: s.slipPaperSize,
          });
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEcommerceDashboardSse(() => {
    void reload({ silent: true });
  }, !staffAuth);

  const toggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  const hasActiveFilter = filter !== "all" || keyword.trim() !== "";

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      filterOpen,
      hasActiveFilters: hasActiveFilter,
      toggleFilter,
      reload: () => {
        void reload();
      },
      loading,
    });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, filterOpen, hasActiveFilter, toggleFilter, reload, loading]);

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
      const blob = `${o.referenceCode} ${o.customerName} ${o.customerPhone} ${o.courierTrackingNo ?? ""} ${o.trackingCode}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [orders, filter, keyword]);

  async function advance(id: string, status: string) {
    const res = await apiFetch("/api/ecommerce-store/session/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      notice.error(typeof j.error === "string" ? j.error : "อัปเดตสถานะไม่สำเร็จ");
      return;
    }
    await reload({ silent: true });
  }

  async function openFulfill(order: Order) {
    if (order.status === "VERIFYING") {
      await advance(order.id, "PREPARING");
      const refreshed = await apiFetch(`/api/ecommerce-store/session/orders?channel=ONLINE`);
      const j = await refreshed.json();
      const list = (j.orders ?? []) as Order[];
      const next = list.find((o) => o.id === order.id) ?? { ...order, status: "PREPARING" as const };
      setFulfillOrder(next);
      return;
    }
    setFulfillOrder(order);
  }

  async function shipOrder(courierTrackingNo: string) {
    if (!fulfillOrder) return;
    setShipBusy(true);
    try {
      const res = await apiFetch("/api/ecommerce-store/session/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fulfillOrder.id,
          status: "SHIPPED",
          courierTrackingNo,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        notice.error(typeof j.error === "string" ? j.error : "จัดส่งไม่สำเร็จ");
        return;
      }
      notice.success(`จัดส่งแล้ว · พัสดุ ${courierTrackingNo}`);
      setFulfillOrder(null);
      await reload({ silent: true });
    } finally {
      setShipBusy(false);
    }
  }

  const toolbar = (
    <div className={ecommerceStoreInlineSubNavShellClass}>
      <button
        type="button"
        onClick={toggleFilter}
        aria-expanded={filterOpen}
        aria-controls="ecommerce-orders-filter-panel"
        aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        className={cn(
          ecommerceStoreInlineSubNavBtnClass(filterOpen),
          "relative",
          hasActiveFilter && !filterOpen && "ring-1 ring-amber-300/80",
        )}
      >
        <IconFilter className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {hasActiveFilter && !filterOpen ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => void reload()}
        disabled={loading}
        aria-busy={loading}
        aria-label="รีเฟรชออเดอร์ออนไลน์"
        title="รีเฟรช"
        className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
      >
        <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", loading && "animate-spin")} aria-hidden />
        <span className="hidden sm:inline">รีเฟรช</span>
      </button>
    </div>
  );

  const body = (
    <>
      {!embedded ? (
        <AppSectionHeader
          title="ออเดอร์ออนไลน์"
          description="ตรวจสลิป · จัดของ · พิมพ์ฉลาก · ใส่เลขพัสดุ"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={toolbar}
        />
      ) : null}

      <div className="min-w-0 space-y-2.5">
        <p className="text-sm font-black tabular-nums text-[#2e2a58]">
          {hasActiveFilter
            ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${orders.length.toLocaleString("th-TH")} ออเดอร์`
            : `ทั้งหมด ${orders.length.toLocaleString("th-TH")} ออเดอร์`}
        </p>

        <div
          id="ecommerce-orders-filter-panel"
          className={cn("space-y-3", filterOpen ? "block" : "hidden")}
        >
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหารหัส · ชื่อ · เบอร์ · เลขพัสดุ"
            className={cn(ecommerceFieldClass, "min-h-[44px]")}
            aria-label="ค้นหาออเดอร์ออนไลน์"
          />
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="กรองสถานะออเดอร์">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.key)}
                  className={cn(ecommerceFilterChipClass(active), "gap-1.5")}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-black tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-[#5b61ff]/10 text-[#4d47b6]",
                    )}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setKeyword("");
                }}
                className={ecommerceStoreInlineSubNavBtnClass(false)}
                aria-label="ล้างตัวกรอง"
              >
                ล้างกรอง
              </button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <AppEmptyState tone="slate">
            {loading ? "กำลังโหลด…" : "ยังไม่มีออเดอร์ออนไลน์ในตัวกรองนี้"}
          </AppEmptyState>
        ) : (
          <ul className="space-y-2" aria-label="รายการออเดอร์ออนไลน์">
            {filtered.map((o) => {
              const next = NEXT_STATUS[o.status];
              const tone = ecommerceStoreOrderRowTone(o.status);
              const amount = Number(o.totalAmount);
              const thumb = orderThumbUrl(o);

              return (
                <li key={o.id} className={ecommerceStoreTonedRowCardClass(tone)}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {thumb ? (
                      <AppImageThumb
                        src={thumb}
                        alt={o.paymentSlipUrl ? `สลิป ${o.referenceCode}` : o.items?.[0]?.productName || o.referenceCode}
                        onOpen={() => lb.open(thumb)}
                        className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                      />
                    ) : (
                      <span className={ecommerceStoreCardIconTileClass(tone, "lg")} aria-hidden>
                        <span className="text-sm font-black sm:text-base">{getInitials(o.customerName)}</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">
                          {o.referenceCode}
                        </p>
                        <span className={ecommerceOrderStatusBadgeClass(o.status)}>
                          {ECOMMERCE_ORDER_STATUS_LABELS[o.status]}
                        </span>
                        <span className={ecommerceProductTagClass("sky")}>ออนไลน์</span>
                      </div>
                      <p className="truncate text-sm font-semibold text-[#2e2a58]">{o.customerName}</p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#66638c]">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" aria-hidden />
                          {o.customerPhone}
                        </span>
                        {o.courierTrackingNo ? (
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3 w-3 shrink-0" aria-hidden />
                            พัสดุ {o.courierTrackingNo}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-lg font-black tabular-nums text-emerald-700 sm:hidden">
                        ฿{amount.toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    <p className="hidden text-xl font-black tabular-nums text-emerald-700 sm:block">
                      ฿{amount.toLocaleString("th-TH")}
                    </p>
                    {o.status === "SHIPPED" ? (
                      <button
                        type="button"
                        className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
                        onClick={() => setFulfillOrder(o)}
                      >
                        ดู / พิมพ์ซ้ำ
                      </button>
                    ) : next === "PREPARING" || next === "SHIPPED" || o.status === "PREPARING" ? (
                      <button
                        type="button"
                        className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
                        onClick={() => void openFulfill(o)}
                      >
                        {STATUS_NEXT_LABEL[o.status] || "จัดของ"}
                      </button>
                    ) : next ? (
                      <button
                        type="button"
                        className={cn(ecommerceStorePrimaryButtonClass, "px-4")}
                        onClick={() => void advance(o.id, next)}
                      >
                        {STATUS_NEXT_LABEL[o.status]}
                      </button>
                    ) : (
                      <p className="text-xs font-black text-emerald-700">เสร็จสมบูรณ์</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปโอน" />
      <EcommerceOrderFulfillModal
        open={Boolean(fulfillOrder)}
        order={fulfillOrder}
        shop={shop}
        busy={shipBusy}
        onClose={() => setFulfillOrder(null)}
        onShip={shipOrder}
      />
      {notice.popup}
    </>
  );

  if (embedded) return body;
  return (
    <div className={ecommerceStoreContentStackClass}>
      <AppDashboardSection tone="violet">{body}</AppDashboardSection>
    </div>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}
