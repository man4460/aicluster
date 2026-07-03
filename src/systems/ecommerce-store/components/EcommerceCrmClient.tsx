"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { EcommerceStatCard } from "@/systems/ecommerce-store/components/EcommerceStatCard";
import {
  ecommerceCardAccentBarClass,
  ecommerceFieldClass,
  ecommerceFilterChipClass,
  ecommerceGradientGoldClass,
  ecommerceGradientPriceClass,
  ecommerceInitialAvatarClass,
  ecommerceListRowCardClass,
  ecommerceListStackClass,
  ecommerceMetaChipClass,
  ecommerceOverviewStatsGridClass,
  ecommerceProductTagClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

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

function tierBadge(totalSpend: number): { label: string; tone: "rose" | "amber" | "emerald" | "slate" } | null {
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

export function EcommerceCrmClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortKey>("spend");
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce-store/session/customers");
      const j = await res.json();
      setCustomers(j.customers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const stats = useMemo(() => {
    const total = customers.reduce((acc, c) => acc + Number(c.totalSpendBaht || 0), 0);
    const orders = customers.reduce((acc, c) => acc + c.orderCount, 0);
    const vip = customers.filter((c) => Number(c.totalSpendBaht || 0) >= 5000).length;
    return { total, orders, vip };
  }, [customers]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className="appDashboardSectionVioletClass">
        <AppSectionHeader
          title="ลูกค้า (CRM)"
          description="ยอดซื้อสะสมต่อเบอร์โทร · ระดับ VIP · ประวัติล่าสุด"
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
              aria-label="รีเฟรชรายชื่อลูกค้า"
            >
              <IconRefresh className="h-5 w-5 sm:mr-1.5" aria-hidden />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          }
        />

        <div className={ecommerceOverviewStatsGridClass}>
          <EcommerceStatCard
            title="ลูกค้าทั้งหมด"
            value={customers.length}
            tone="violet"
            icon={<IconUser className="h-4 w-4" />}
          />
          <EcommerceStatCard
            title="ยอดขายสะสม"
            value={`฿${stats.total.toLocaleString("th-TH")}`}
            tone="blue"
            icon={<IconCoin className="h-4 w-4" />}
          />
          <EcommerceStatCard
            title="ออเดอร์รวม"
            value={stats.orders}
            tone="green"
            icon={<IconBag className="h-4 w-4" />}
          />
          <EcommerceStatCard
            title="ลูกค้าประจำ"
            value={stats.vip}
            tone="rose"
            icon={<IconCrown className="h-4 w-4" />}
          />
        </div>

        {topSpender && Number(topSpender.totalSpendBaht) > 0 ? (
          <div className="relative mt-4 overflow-hidden rounded-[2rem] border border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-white/70 to-rose-50/50 p-4 shadow-[0_18px_44px_-26px_rgba(217,119,6,0.35)] backdrop-blur-xl sm:p-5">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/40 blur-3xl" aria-hidden />
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div
                className={cn(
                  ecommerceInitialAvatarClass(avatarToneFor(topSpender.id)),
                  "h-14 w-14 text-lg",
                )}
              >
                {getInitials(topSpender.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
                  <IconCrown className="h-3.5 w-3.5" />
                  ลูกค้ายอดใช้จ่ายสูงสุด
                </p>
                <p className="mt-0.5 truncate text-base font-black text-[#1e1b4b]">{topSpender.name}</p>
                <p className={cn("text-2xl font-black tabular-nums tracking-tight sm:text-3xl", ecommerceGradientGoldClass)}>
                  ฿{Number(topSpender.totalSpendBaht).toLocaleString("th-TH")}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </AppDashboardSection>

      <AppDashboardSection className="appDashboardSectionVioletClass">
        <AppSectionHeader
          title="รายชื่อลูกค้า"
          description="ค้นหา · เรียงตามยอดใช้จ่าย / ออเดอร์ / ล่าสุด"
        />

        <div className="space-y-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b87b8]" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร"
              className={cn(ecommerceFieldClass, "pl-9")}
              aria-label="ค้นหาลูกค้า"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch]">
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
          </div>
        </div>

        {filtered.length === 0 ? (
          <AppEmptyState>{loading ? "กำลังโหลด…" : "ยังไม่มีลูกค้า"}</AppEmptyState>
        ) : (
          <ul className={ecommerceListStackClass}>
            {filtered.map((c, idx) => {
              const spend = Number(c.totalSpendBaht || 0);
              const tier = tierBadge(spend);
              const avgOrder = c.orderCount > 0 ? spend / c.orderCount : 0;
              const isTopTen = sort === "spend" && idx < 3;
              const accentTone = isTopTen ? "amber" : tier ? "violet" : "slate";
              return (
                <li key={c.id} className={cn(ecommerceListRowCardClass, "relative overflow-hidden pl-5 sm:pl-6")}>
                  <span className={ecommerceCardAccentBarClass(accentTone)} aria-hidden />
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative">
                        <div className={ecommerceInitialAvatarClass(avatarToneFor(c.id))}>
                          {getInitials(c.name)}
                        </div>
                        {isTopTen ? (
                          <span
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-[10px] font-black text-white shadow ring-2 ring-white"
                            aria-hidden
                          >
                            {idx + 1}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate text-base font-black tracking-tight text-[#1e1b4b]">{c.name}</p>
                          {tier ? (
                            <span className={ecommerceProductTagClass(tier.tone)}>
                              <IconStar className="mr-1 h-3 w-3" />
                              {tier.label}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={ecommerceMetaChipClass}>
                            <IconPhone className="h-3 w-3" />
                            {c.phone}
                          </span>
                          <span className={cn(ecommerceMetaChipClass, "border-emerald-200/70 bg-emerald-50/80 text-emerald-700")}>
                            <IconClock className="h-3 w-3" />
                            {formatRelative(c.lastOrderAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-end justify-between gap-4 border-t border-white/40 pt-3 md:flex-col md:items-end md:justify-center md:border-0 md:pt-0 md:text-right">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">ยอดสะสม</p>
                        <p className={cn("text-xl font-black tabular-nums leading-tight sm:text-2xl", ecommerceGradientPriceClass)}>
                          ฿{spend.toLocaleString("th-TH")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={cn(ecommerceMetaChipClass, "border-[#5b61ff]/25 bg-[#ecebff]/80 text-[#4d47b6]")}>
                          <IconBag className="h-3 w-3" />
                          {c.orderCount} ออเดอร์
                        </span>
                        {avgOrder > 0 ? (
                          <span className="text-[10px] font-semibold text-[#8b87b8]">
                            เฉลี่ย ฿{Math.round(avgOrder).toLocaleString("th-TH")}/ครั้ง
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>
    </div>
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

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
    </svg>
  );
}

function IconCoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7z" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}

function IconCrown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 8l4 4 5-7 5 7 4-4-2 12H5L3 8z" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3 6.5L22 10l-5 4.7L18.5 22 12 18.3 5.5 22 7 14.7 2 10l7-1.5L12 2z" />
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

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
