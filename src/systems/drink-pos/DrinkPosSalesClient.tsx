"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppColumnBarSparkChart,
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  drinkPosContentStackClass,
  drinkPosFieldClass,
  drinkPosOutlineIconButtonClass,
  drinkPosPulseWashClass,
  drinkPosStatCardClass,
  drinkPosStatGridClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import {
  fetchDrinkPosProducts,
  fetchDrinkPosSales,
  drinkPosFetchErrorMessage,
  type DrinkPosProductRow,
  type DrinkPosSaleRow,
} from "@/systems/drink-pos/lib/client-data";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import {
  DrinkPosPaymentPanel,
  drinkPosPaymentSubmitBlocked,
} from "@/systems/drink-pos/components/DrinkPosPaymentPanel";
import { drinkPosPaymentMethodLabel, type DrinkPosPaymentMethod } from "@/systems/drink-pos/lib/payment-method";
import { formatThb } from "@/systems/inventory/lib/inventory-client-data";
import {
  drinkPosActiveSizePrices,
  drinkPosProductHasSizes,
  drinkPosResolveUnitPrice,
  type DrinkPosSizeCode,
} from "@/systems/drink-pos/lib/size-prices";

type DraftLine = { key: string; productId: string; size: DrinkPosSizeCode | null; quantity: number };
type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function bangkokDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
}

function bangkokTodayKey(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function dateKeyInFinanceRange(
  day: string,
  range: FinanceRange,
  today: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!day) return false;
  if (range === "TODAY") return day === today;
  if (range === "MONTH") return day.slice(0, 7) === today.slice(0, 7);
  if (range === "YEAR") return day.slice(0, 4) === today.slice(0, 4);
  const rawStart = startDate || endDate;
  const rawEnd = endDate || startDate;
  const start = rawStart && rawEnd && rawStart > rawEnd ? rawEnd : rawStart;
  const end = rawStart && rawEnd && rawStart > rawEnd ? rawStart : rawEnd;
  if (!start && !end) return true;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function FinanceRangeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <DrinkPosButton
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-3.5 text-xs font-black transition-all sm:px-4",
        active
          ? cn(appDashboardBrandGradientFillClass, "text-white shadow-[0_18px_30px_-22px_rgba(91,97,255,0.55)]")
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
      )}
      aria-pressed={active}
    >
      {label}
    </DrinkPosButton>
  );
}

const salesFilterFieldClass = drinkPosFieldClass;

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FinanceBucket = {
  dateKey: string;
  label: string;
  revenueBaht: number;
  costBaht: number;
};

export function DrinkPosSalesClient() {
  const [sales, setSales] = useState<DrinkPosSaleRow[]>([]);
  const [products, setProducts] = useState<DrinkPosProductRow[]>([]);
  const [financeBuckets, setFinanceBuckets] = useState<FinanceBucket[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [financeRangeLabel, setFinanceRangeLabel] = useState("เดือนนี้");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costBusy, setCostBusy] = useState(false);
  const [costErr, setCostErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ key: newKey(), productId: "", size: null, quantity: 1 }]);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DrinkPosPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const slipLb = useAppImageLightbox();

  const [filterOpen, setFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  /** ค่าเริ่มต้น: เดือนนี้ */
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const todayKey = useMemo(() => bangkokTodayKey(), []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ range: financeRange });
      if (financeRange === "CUSTOM") {
        if (dateFrom.trim()) qs.set("from", dateFrom.trim());
        if (dateTo.trim()) qs.set("to", dateTo.trim());
      }
      const [s, p, finRes] = await Promise.all([
        fetchDrinkPosSales(400),
        fetchDrinkPosProducts(),
        fetch(`/api/drink-pos/finance-summary?${qs.toString()}`, { credentials: "include" }),
      ]);
      if (!s.ok) {
        setError(s.error);
        return;
      }
      if (!p.ok) {
        setError(p.error);
        return;
      }
      setSales(s.sales);
      setProducts(p.products.filter((x) => x.isActive));
      const fin = (await finRes.json().catch(() => ({}))) as {
        buckets?: FinanceBucket[];
        totalRevenue?: number;
        totalCost?: number;
        totalRevenue7d?: number;
        totalCost7d?: number;
        rangeLabel?: string;
      };
      if (finRes.ok && fin.buckets) {
        setFinanceBuckets(fin.buckets);
        setTotalRevenue(fin.totalRevenue ?? fin.totalRevenue7d ?? 0);
        setTotalCost(fin.totalCost ?? fin.totalCost7d ?? 0);
        setFinanceRangeLabel(fin.rangeLabel ?? "ช่วงที่เลือก");
      }
    } catch (e) {
      setError(drinkPosFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [financeRange, dateFrom, dateTo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtersActive = useMemo(() => {
    if (keyword.trim()) return true;
    return financeRange !== "MONTH";
  }, [keyword, financeRange]);

  const filteredSales = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return sales.filter((s) => {
      const day = bangkokDateKey(s.createdAt);
      if (!dateKeyInFinanceRange(day, financeRange, todayKey, dateFrom.trim(), dateTo.trim())) return false;
      if (kw) {
        const blob = [s.note ?? "", ...s.lines.map((l) => l.productName)].join(" ").toLowerCase();
        if (!blob.includes(kw)) return false;
      }
      return true;
    });
  }, [sales, keyword, financeRange, todayKey, dateFrom, dateTo]);

  const { chartBuckets, chartPeriodTotalBaht } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of financeBuckets) totals.set(b.dateKey, 0);
    for (const s of filteredSales) {
      const day = bangkokDateKey(s.createdAt);
      if (!day) continue;
      const key = financeRange === "YEAR" ? day.slice(0, 7) : day;
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + s.totalBaht);
    }
    const max = Math.max(1, ...[...totals.values()]);
    const buckets = financeBuckets.map((b) => {
      const amount = totals.get(b.dateKey) ?? b.revenueBaht;
      return {
        key: b.dateKey,
        label: b.label,
        amount,
        pct: (amount / max) * 100,
      };
    });
    const total = buckets.reduce((acc, b) => acc + b.amount, 0);
    return { chartBuckets: buckets, chartPeriodTotalBaht: total };
  }, [filteredSales, financeBuckets, financeRange]);

  function resetSalesFilters() {
    setKeyword("");
    setFinanceRange("MONTH");
    setDateFrom("");
    setDateTo("");
  }

  function selectFinanceRange(next: FinanceRange) {
    setFinanceRange(next);
    if (next !== "CUSTOM") {
      setDateFrom("");
      setDateTo("");
    }
  }

  function openModal() {
    const first = products[0]?.id ?? "";
    setNote("");
    setLines([{ key: newKey(), productId: first, size: null, quantity: 1 }]);
    setPaymentMethod("CASH");
    setPaymentSlipUrl(null);
    setFormErr(null);
    setModalOpen(true);
  }

  const saleDraftTotalBaht = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (!l.productId || l.quantity < 1) return sum;
      const p = products.find((x) => x.id === l.productId);
      if (!p) return sum;
      const unit = drinkPosResolveUnitPrice(
        { priceBaht: p.basePriceBaht ?? p.priceBaht, sizePrices: p.sizePrices },
        drinkPosProductHasSizes(p.sizePrices) ? l.size : null,
      );
      if (unit == null) return sum;
      return sum + unit * l.quantity;
    }, 0);
  }, [lines, products]);

  async function submitSale() {
    setBusy(true);
    setFormErr(null);
    try {
      const clean = lines
        .filter((l) => l.productId)
        .map((l) => {
          const p = products.find((x) => x.id === l.productId);
          const needsSize = p ? drinkPosProductHasSizes(p.sizePrices) : false;
          return {
            productId: l.productId,
            quantity: l.quantity,
            size: needsSize ? l.size : null,
          };
        });
      if (clean.length === 0) {
        setFormErr("เลือกสินค้าอย่างน้อย 1 รายการ");
        return;
      }
      for (const l of clean) {
        if (l.quantity < 1) {
          setFormErr("จำนวนต้องเป็นบวก");
          return;
        }
        const p = products.find((x) => x.id === l.productId);
        if (p && drinkPosProductHasSizes(p.sizePrices) && !l.size) {
          setFormErr(`เลือกขนาดสำหรับ ${p.name}`);
          return;
        }
      }
      if (drinkPosPaymentSubmitBlocked(paymentMethod, saleDraftTotalBaht, paymentSlipUrl)) {
        setFormErr(
          paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน",
        );
        return;
      }
      const res = await fetch("/api/drink-pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          note: note.trim() || null,
          lines: clean,
          paymentMethod: saleDraftTotalBaht <= 0 ? "CASH" : paymentMethod,
          paymentSlipUrl:
            saleDraftTotalBaht <= 0 || paymentMethod === "CASH" ? null : paymentSlipUrl,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function submitCost() {
    setCostBusy(true);
    setCostErr(null);
    try {
      const amount = Number(costAmount);
      if (!costLabel.trim() || !Number.isFinite(amount) || amount < 0) {
        setCostErr("กรอกชื่อรายการและจำนวนเงิน");
        return;
      }
      const res = await fetch("/api/drink-pos/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label: costLabel.trim(), amountBaht: Math.round(amount) }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCostErr(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
        return;
      }
      setCostModalOpen(false);
      setCostLabel("");
      setCostAmount("");
      await reload();
    } finally {
      setCostBusy(false);
    }
  }

  const profitTotal = totalRevenue - totalCost;

  const revenueCostChartBuckets = useMemo(() => {
    const max = Math.max(
      1,
      ...financeBuckets.map((b) => Math.max(b.revenueBaht, b.costBaht)),
    );
    return financeBuckets.map((b) => ({
      key: b.dateKey,
      label: b.label,
      revenue: b.revenueBaht,
      cost: b.costBaht,
      revenuePct: (b.revenueBaht / max) * 100,
      costPct: (b.costBaht / max) * 100,
    }));
  }, [financeBuckets]);
  const financeStatClass = drinkPosStatCardClass;

  return (
    <div className={drinkPosContentStackClass}>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader tone="violet" title="ช่วงเวลา" />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
          <FinanceRangeChip label="วันนี้" active={financeRange === "TODAY"} onClick={() => selectFinanceRange("TODAY")} />
          <FinanceRangeChip label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => selectFinanceRange("MONTH")} />
          <FinanceRangeChip label="ปีนี้" active={financeRange === "YEAR"} onClick={() => selectFinanceRange("YEAR")} />
          <FinanceRangeChip
            label="กำหนดเอง"
            active={financeRange === "CUSTOM"}
            onClick={() => selectFinanceRange("CUSTOM")}
          />
        </div>
        {financeRange === "CUSTOM" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="ตั้งแต่วันที่ กรุงเทพ"
                className={cn(salesFilterFieldClass, "mt-1")}
              />
            </label>
            <label className="min-w-0">
              <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="ถึงวันที่ กรุงเทพ"
                className={cn(salesFilterFieldClass, "mt-1")}
              />
            </label>
          </div>
        ) : null}
        <p className="mt-3 text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
      </AppDashboardSection>

      <section aria-label={`สรุปการเงิน ${financeRangeLabel}`}>
        <ul className={cn(drinkPosStatGridClass, "lg:grid-cols-3")}>
          <li className={financeStatClass}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              รายได้ · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              ฿{formatThb(totalRevenue)}
            </p>
          </li>
          <li className={financeStatClass}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              ต้นทุน · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              ฿{formatThb(totalCost)}
            </p>
          </li>
          <li className={cn(financeStatClass, "col-span-2 lg:col-span-1")}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">กำไรโดยประมาณ</p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-[#1e1b4b] sm:text-3xl">
              ฿{formatThb(profitTotal)}
            </p>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title={`รายได้เทียบต้นทุน (${financeRangeLabel})`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <DrinkPosButton
              type="button"
              onClick={() => {
                setCostErr(null);
                setCostModalOpen(true);
              }}
              className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm font-bold sm:min-w-0 sm:px-4"
              aria-label="บันทึกต้นทุน"
            >
              <span className="sm:hidden" aria-hidden>
                +
              </span>
              <span className="hidden sm:inline">+ บันทึกต้นทุน</span>
            </DrinkPosButton>
          }
        />
        {loading ? (
          <div className={cn("mt-4 h-40 animate-pulse rounded-2xl", drinkPosPulseWashClass)} aria-hidden />
        ) : (
          <AppSparkChartPanel className="mt-4 w-full min-w-0">
            <AppRevenueCostColumnChart
              className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
              compact
              title=""
              subtitle=""
              emptyText="ยังไม่มีข้อมูลในช่วงนี้"
              buckets={revenueCostChartBuckets}
              formatTitle={(b) =>
                `${b.label}: รายได้ ฿${formatThb(b.revenue)} · ต้นทุน ฿${formatThb(b.cost)}`
              }
            />
          </AppSparkChartPanel>
        )}
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title={`ยอดขาย (${financeRangeLabel})`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
        />
        {loading ? (
          <div className={cn("mt-4 h-36 animate-pulse rounded-2xl", drinkPosPulseWashClass)} aria-hidden />
        ) : (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
            <div className="min-h-[10rem] min-w-0 flex-1">
              <AppColumnBarSparkChart
                className="w-full"
                buckets={chartBuckets}
                emptyText="ยังไม่มียอดในช่วงนี้"
                variant="brand"
                compact
                formatTitle={(b) => `${b.label}: ฿${formatThb(b.amount)}`}
              />
            </div>
            <aside
              className={cn(
                "flex shrink-0 flex-col justify-center rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/70 via-white/50 to-violet-50/40 px-4 py-3 shadow-sm ring-1 ring-inset ring-white/45 sm:w-[11rem] sm:rounded-2xl sm:px-4 sm:py-4",
                "sm:text-center",
              )}
              aria-label={`ยอดรวม ${financeRangeLabel} ฿${formatThb(chartPeriodTotalBaht)}`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-[#66638c] sm:text-center">
                รวม · {financeRangeLabel}
              </p>
              <p className="mt-1 text-2xl font-black leading-tight tabular-nums text-[#4d47b6] sm:text-center sm:text-3xl">
                ฿{formatThb(chartPeriodTotalBaht)}
              </p>
              {filtersActive ? (
                <p className="mt-1.5 text-[10px] font-semibold text-[#0000BF] sm:text-center">กรองแล้ว</p>
              ) : null}
            </aside>
          </div>
        )}
      </AppDashboardSection>

      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="บิลล่าสุด"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <DrinkPosButton
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ปิดตัวกรอง" : "เปิดตัวกรอง"}
                title="ตัวกรอง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:hidden",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6]",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                {filtersActive ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white" aria-hidden />
                ) : null}
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={() => void reload()}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชข้อมูลยอดขาย"
                title="รีเฟรช"
                className={cn(
                  appTemplateOutlineButtonClass,
                  drinkPosOutlineIconButtonClass,
                  "disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-1.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={openModal}
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-0 font-black shadow-md sm:min-w-0 sm:px-4"
                aria-label="บันทึกการขาย"
              >
                <svg className="h-5 w-5 sm:mr-1.5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">+ บันทึกขาย</span>
              </DrinkPosButton>
            </div>
          }
        />
        <div
          className={cn(
            "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-12",
            filterOpen ? "grid" : "hidden sm:grid",
          )}
        >
          <label className="min-w-0 sm:col-span-2 lg:col-span-10">
            <span className="sr-only">ค้นหาโน้ตหรือชื่อสินค้า</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาโน้ตหรือชื่อสินค้า…"
              aria-label="ค้นหาโน้ตหรือชื่อสินค้า"
              className={cn(salesFilterFieldClass, "mt-0 sm:mt-0")}
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-2">
            <DrinkPosButton
              type="button"
              onClick={() => {
                resetSalesFilters();
                setFilterOpen(false);
              }}
              disabled={!filtersActive && !keyword.trim()}
              className={cn(
                appTemplateOutlineButtonClass,
                "h-[42px] w-full rounded-2xl text-xs font-black text-[#4d47b6] disabled:opacity-40",
              )}
            >
              รีเซ็ตช่วง · เดือนนี้
            </DrinkPosButton>
          </div>
        </div>
        {loading ? (
          <div className="mt-4 h-32 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
        ) : sales.length === 0 ? (
          <AppEmptyState tone="slate" className="mt-4">
            ยังไม่มีการขาย
          </AppEmptyState>
        ) : filteredSales.length === 0 ? (
          <AppEmptyState tone="slate" className="mt-4">
            ไม่พบบิลตามตัวกรอง
          </AppEmptyState>
        ) : (
          <div
            className={cn("mt-4 max-h-[min(70vh,44rem)] min-h-0", appDashboardInnerScrollClass)}
            role="region"
            aria-label="รายการบิล"
          >
            <ul className="space-y-2 pr-0.5">
              {filteredSales.map((s) => (
                <li
                  key={s.id}
                  className="rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#66638c]">
                        {new Date(s.createdAt).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {s.note ? <p className="mt-0.5 text-sm font-semibold text-[#1e1b4b]">{s.note}</p> : null}
                      <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                        {drinkPosPaymentMethodLabel(s.paymentMethod)}
                        {s.isRewardRedemption ? " · แลกแต้ม" : ""}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      {s.paymentSlipUrl ? (
                        <AppImageThumb
                          src={s.paymentSlipUrl}
                          alt="สลิปชำระเงิน"
                          onOpen={() => s.paymentSlipUrl && slipLb.open(s.paymentSlipUrl)}
                          className="h-12 w-12"
                        />
                      ) : null}
                      <p className="text-lg font-black tabular-nums text-emerald-700">฿{formatThb(s.totalBaht)}</p>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 border-t border-white/40 pt-2 text-xs font-medium text-[#66638c]">
                    {s.lines.map((l) => (
                      <li key={l.id} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">
                          {l.productName} × {l.quantity}
                        </span>
                        <span className="shrink-0 tabular-nums">฿{formatThb(l.lineTotalBaht)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AppDashboardSection>

      <FormModal
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        title="บันทึกการขาย"
        footer={
          <FormModalFooterActions
            onCancel={() => !busy && setModalOpen(false)}
            onSubmit={() => void submitSale()}
            submitLabel="บันทึก"
            loading={busy}
            submitDisabled={drinkPosPaymentSubmitBlocked(paymentMethod, saleDraftTotalBaht, paymentSlipUrl)}
          />
        }
      >
        <div className="space-y-3">
          {formErr ? <p className="text-sm font-semibold text-rose-600">{formErr}</p> : null}
          {products.length === 0 ? (
            <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีสินค้า</p>
          ) : null}
          <label className="block">
            <span className="sr-only">โน้ต</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="โน้ต (ถ้ามี)"
              aria-label="โน้ต"
              className={cn("mt-0", drinkPosFieldClass)}
            />
          </label>
          <div className="space-y-2">
            <span className="sr-only">รายการสินค้า</span>
            {lines.map((l) => {
              const selected = products.find((p) => p.id === l.productId);
              const sizeOptions = selected ? drinkPosActiveSizePrices(selected.sizePrices) : [];
              return (
              <div key={l.key} className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/50 bg-white/50 p-2">
                <label className="min-w-[140px] flex-1">
                  <span className="sr-only">สินค้า</span>
                  <select
                    value={l.productId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLines((prev) =>
                        prev.map((x) => (x.key === l.key ? { ...x, productId: v, size: null } : x)),
                      );
                    }}
                    aria-label="สินค้า"
                    className="mt-0 w-full rounded-xl border border-white/60 bg-white px-2 py-2 text-sm font-semibold"
                  >
                    <option value="">— เลือก —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (฿{formatThb(p.priceBaht)})
                      </option>
                    ))}
                  </select>
                </label>
                {sizeOptions.length > 0 ? (
                  <label className="w-20">
                    <span className="sr-only">ขนาด</span>
                    <select
                      value={l.size ?? ""}
                      onChange={(e) => {
                        const v = e.target.value as DrinkPosSizeCode | "";
                        setLines((prev) =>
                          prev.map((x) => (x.key === l.key ? { ...x, size: v || null } : x)),
                        );
                      }}
                      aria-label="ขนาด"
                      className="mt-0 w-full rounded-xl border border-white/60 bg-white px-2 py-2 text-sm font-semibold"
                    >
                      <option value="">ขนาด</option>
                      {sizeOptions.map((row) => (
                        <option key={row.size} value={row.size}>
                          {row.size} (฿{formatThb(row.priceBaht)})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="w-24">
                  <span className="sr-only">จำนวน</span>
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => {
                      const q = Number.parseInt(e.target.value, 10) || 1;
                      setLines((prev) => prev.map((x) => (x.key === l.key ? { ...x, quantity: q } : x)));
                    }}
                    aria-label="จำนวน"
                    className="mt-0 w-full rounded-xl border border-white/60 bg-white px-2 py-2 text-sm font-semibold tabular-nums"
                  />
                </label>
                {lines.length > 1 ? (
                  <DrinkPosButton
                    type="button"
                    className="mb-0.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-black text-rose-600"
                    onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  >
                    ลบแถว
                  </DrinkPosButton>
                ) : null}
              </div>
            );
            })}
            <DrinkPosButton
              type="button"
              className={cn(appTemplateOutlineButtonClass, "w-full rounded-2xl py-2 text-xs font-black")}
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { key: newKey(), productId: products[0]?.id ?? "", size: null, quantity: 1 },
                ])
              }
            >
              + แถวสินค้า
            </DrinkPosButton>
          </div>
          <DrinkPosPaymentPanel
            amountBaht={saleDraftTotalBaht}
            method={paymentMethod}
            slipUrl={paymentSlipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setPaymentSlipUrl}
            disabled={busy}
          />
        </div>
      </FormModal>

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระเงิน" />

      <FormModal
        open={costModalOpen}
        onClose={() => !costBusy && setCostModalOpen(false)}
        title="บันทึกต้นทุน"
        footer={
          <FormModalFooterActions
            onCancel={() => !costBusy && setCostModalOpen(false)}
            onSubmit={() => void submitCost()}
            submitLabel="บันทึก"
            loading={costBusy}
          />
        }
      >
        <div className="space-y-3">
          {costErr ? <p className="text-sm font-semibold text-rose-600">{costErr}</p> : null}
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            รายการ
            <input
              type="text"
              value={costLabel}
              onChange={(e) => setCostLabel(e.target.value)}
              className={cn(salesFilterFieldClass, "mt-1")}
              placeholder="เช่น วัตถุดิบกาแฟ"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            จำนวนเงิน (บาท)
            <input
              type="number"
              min={0}
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              className={cn(salesFilterFieldClass, "mt-1")}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}
