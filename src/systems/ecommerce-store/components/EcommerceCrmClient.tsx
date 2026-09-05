"use client";

import { Crown, Phone, ShoppingBag, Users, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceProductTagClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreCardToneClasses,
  ecommerceStoreCustomerRowTone,
  ecommerceStoreTonedRowCardClass,
  type EcommerceStoreCardTone,
} from "@/systems/ecommerce-store/lib/card-tones";
import {
  ecommerceStoreContentStackClass,
  ecommerceStoreFinanceStatInlineClass,
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStoreNavDividerClass,
  ecommerceStoreSectionHeadingClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Customer = {
  id: string;
  name: string;
  phone: string;
  totalSpendBaht: string;
  orderCount: number;
  lastOrderAt: string | null;
};

type SortKey = "spend" | "orders" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "spend", label: "ยอดสูงสุด" },
  { key: "orders", label: "ออเดอร์เยอะ" },
  { key: "recent", label: "ล่าสุด" },
];

const CRM_STATS_GRID_CLASS = "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3";

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tierBadge(totalSpend: number): { label: string; tone: "rose" | "amber" | "emerald" } | null {
  if (totalSpend >= 20000) return { label: "VIP", tone: "rose" };
  if (totalSpend >= 5000) return { label: "ประจำ", tone: "amber" };
  if (totalSpend >= 1000) return { label: "ต่อเนื่อง", tone: "emerald" };
  return null;
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "ยังไม่มีคำสั่งซื้อ";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = now - then;
  const dayMs = 86_400_000;
  if (diffMs < dayMs) return "วันนี้";
  const days = Math.floor(diffMs / dayMs);
  if (days < 30) return `${days} วันก่อน`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนก่อน`;
  const years = Math.floor(months / 12);
  return `${years} ปีก่อน`;
}

function CrmStatCard({
  tone,
  label,
  value,
  valueClassName,
  icon,
}: {
  tone: EcommerceStoreCardTone;
  label: string;
  value: string;
  valueClassName?: string;
  icon: ReactNode;
}) {
  const t = ecommerceStoreCardToneClasses(tone);
  return (
    <li className={cn(ecommerceStoreFinanceStatInlineClass, "border-l-[3px]", t.leftBorder, t.bg)}>
      <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide", t.label)}>
        {icon}
        {label}
      </div>
      <p className={cn("text-lg font-black tabular-nums sm:text-xl", valueClassName ?? "text-[#1e1b4b]")}>{value}</p>
    </li>
  );
}

export type EcommerceCrmEmbeddedToolbarApi = {
  filterOpen: boolean;
  hasActiveFilters: boolean;
  toggleFilter: () => void;
  reload: () => void;
  loading: boolean;
};

export function EcommerceCrmClient({
  embedded = false,
  onEmbeddedToolbar,
}: {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: EcommerceCrmEmbeddedToolbarApi | null) => void;
} = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortKey>("spend");
  const [filterOpen, setFilterOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/customers");
      const j = await res.json();
      setCustomers(j.customers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => {
    const total = customers.reduce((acc, c) => acc + Number(c.totalSpendBaht || 0), 0);
    const orders = customers.reduce((acc, c) => acc + c.orderCount, 0);
    const vip = customers.filter((c) => Number(c.totalSpendBaht || 0) >= 5000).length;
    return { total, orders, vip };
  }, [customers]);

  const filtersActive = Boolean(keyword.trim()) || sort !== "spend";

  const toggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      filterOpen,
      hasActiveFilters: filtersActive,
      toggleFilter,
      reload: () => {
        void reload();
      },
      loading,
    });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, filterOpen, filtersActive, toggleFilter, reload, loading]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (!kw) return true;
      return `${c.name} ${c.phone}`.toLowerCase().includes(kw);
    });
    const sorted = [...list].sort((a, b) => {
      if (sort === "orders") return b.orderCount - a.orderCount;
      if (sort === "recent") {
        const ta = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
        const tb = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
        return tb - ta;
      }
      return Number(b.totalSpendBaht || 0) - Number(a.totalSpendBaht || 0);
    });
    return sorted;
  }, [customers, keyword, sort]);

  const topSpender = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort(
      (a, b) => Number(b.totalSpendBaht || 0) - Number(a.totalSpendBaht || 0),
    )[0];
  }, [customers]);

  function resetFilters() {
    setKeyword("");
    setSort("spend");
  }

  const body = (
      <>
        {!embedded ? (
        <AppSectionHeader
          tone="violet"
          title="ลูกค้า (CRM)"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div
              className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
              role="group"
              aria-label="เครื่องมือลูกค้า"
            >
              <div className={ecommerceStoreInlineSubNavShellClass}>
                <button
                  type="button"
                  onClick={toggleFilter}
                  aria-expanded={filterOpen}
                  aria-controls="ecommerce-crm-filter-panel"
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  className={cn(
                    ecommerceStoreInlineSubNavBtnClass(filterOpen),
                    "relative",
                    filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                  )}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  {filtersActive && !filterOpen ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
              <span className={ecommerceStoreNavDividerClass} aria-hidden />
              <div className={ecommerceStoreInlineSubNavShellClass}>
                <button
                  type="button"
                  onClick={() => void reload()}
                  disabled={loading}
                  aria-busy={loading}
                  aria-label="รีเฟรชรายชื่อลูกค้า"
                  title="รีเฟรช"
                  className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
                >
                  <IconRefresh className={cn("h-3.5 w-3.5 shrink-0", loading && "animate-spin")} />
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>
              </div>
            </div>
          }
        />
        ) : null}

        <div className={cn(embedded ? "min-w-0 space-y-2.5" : "mt-4 space-y-4")}>
        <ul className={CRM_STATS_GRID_CLASS} aria-label="สรุปลูกค้า">
          <CrmStatCard
            tone="violet"
            label="ลูกค้าทั้งหมด"
            value={String(customers.length)}
            valueClassName="text-violet-800"
            icon={<Users className="h-3.5 w-3.5" aria-hidden />}
          />
          <CrmStatCard
            tone="emerald"
            label="ยอดขายสะสม"
            value={`฿${stats.total.toLocaleString("th-TH")}`}
            valueClassName="text-emerald-700"
            icon={<Wallet className="h-3.5 w-3.5" aria-hidden />}
          />
          <CrmStatCard
            tone="indigo"
            label="ออเดอร์รวม"
            value={String(stats.orders)}
            valueClassName="text-indigo-800"
            icon={<ShoppingBag className="h-3.5 w-3.5" aria-hidden />}
          />
          <CrmStatCard
            tone="amber"
            label="ลูกค้าประจำ"
            value={String(stats.vip)}
            valueClassName="text-amber-900"
            icon={<Crown className="h-3.5 w-3.5" aria-hidden />}
          />
        </ul>

        {topSpender && Number(topSpender.totalSpendBaht) > 0 ? (
          <div className={cn(ecommerceStoreTonedRowCardClass("amber"), "sm:items-center")}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={ecommerceStoreCardIconTileClass("amber", "lg")} aria-hidden>
                <span className="text-sm font-black sm:text-base">{getInitials(topSpender.name)}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide",
                    ecommerceStoreCardToneClasses("amber").label,
                  )}
                >
                  <Crown className="h-3.5 w-3.5" aria-hidden />
                  ลูกค้ายอดใช้จ่ายสูงสุด
                </p>
                <p className="mt-0.5 truncate text-base font-black text-[#1e1b4b]">{topSpender.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{topSpender.phone}</p>
              </div>
            </div>
            <p className="shrink-0 text-right text-xl font-black tabular-nums text-emerald-700 sm:text-2xl">
              ฿{Number(topSpender.totalSpendBaht).toLocaleString("th-TH")}
            </p>
          </div>
        ) : null}

        <div
          id="ecommerce-crm-filter-panel"
          className={cn("space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b87b8]" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร"
              className={cn(ecommerceFieldClass, "min-h-[44px] pl-9")}
              aria-label="ค้นหาลูกค้า"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="เรียงรายชื่อลูกค้า">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSort(opt.key)}
                className={ecommerceFilterChipClass(sort === opt.key)}
                aria-pressed={sort === opt.key}
              >
                {opt.label}
              </button>
            ))}
            {filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className={ecommerceStoreInlineSubNavBtnClass(false)}
                aria-label="รีเซ็ตตัวกรอง"
              >
                ล้างกรอง
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 border-t border-[#ecebff] pt-4">
          <h3 className={ecommerceStoreSectionHeadingClass}>
            รายชื่อลูกค้า
            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5f5a8a]">
              {filtersActive ? `${filtered.length}/${customers.length}` : customers.length}
            </span>
          </h3>

          {filtered.length === 0 ? (
            <AppEmptyState tone="slate">
              {loading ? "กำลังโหลด…" : customers.length === 0 ? "ยังไม่มีลูกค้า" : "ไม่พบลูกค้าตามตัวกรอง"}
            </AppEmptyState>
          ) : (
            <ul className="space-y-2" aria-label="รายชื่อลูกค้า">
              {filtered.map((c, idx) => {
                const spend = Number(c.totalSpendBaht || 0);
                const tier = tierBadge(spend);
                const avgOrder = c.orderCount > 0 ? spend / c.orderCount : 0;
                const isTopRank = sort === "spend" && idx < 3 && spend > 0;
                const tone = ecommerceStoreCustomerRowTone({ spendBaht: spend, isTopRank });
                return (
                  <li key={c.id} className={ecommerceStoreTonedRowCardClass(tone)}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className={cn(ecommerceStoreCardIconTileClass(tone, "lg"), "relative")} aria-hidden>
                        <span className="text-sm font-black sm:text-base">{getInitials(c.name)}</span>
                        {isTopRank ? (
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white ring-2 ring-white">
                            {idx + 1}
                          </span>
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">
                            {c.name}
                          </p>
                          {tier ? (
                            <span className={ecommerceProductTagClass(tier.tone)}>{tier.label}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#66638c]">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" aria-hidden />
                            {c.phone}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{formatRelative(c.lastOrderAt)}</span>
                          <span aria-hidden>·</span>
                          <span>{c.orderCount} ออเดอร์</span>
                          {avgOrder > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span>เฉลี่ย ฿{Math.round(avgOrder).toLocaleString("th-TH")}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-lg font-black tabular-nums text-emerald-700 sm:text-xl">
                      ฿{spend.toLocaleString("th-TH")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
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

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
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
