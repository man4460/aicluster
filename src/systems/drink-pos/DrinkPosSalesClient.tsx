"use client";

import {
  AppColumnBarSparkChart,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  DrinkPosCostsPanel,
  type DrinkPosCostEntryRow,
} from "@/systems/drink-pos/components/DrinkPosCostsPanel";
import {
  drinkPosContentStackClass,
  drinkPosFieldClass,
  drinkPosFinanceSubTabShellClass,
  drinkPosNavActiveClass,
  drinkPosNavIdleClass,
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
  DRINK_POS_PAYMENT_METHODS,
  drinkPosPaymentMethodLabel,
  drinkPosPaymentRequiresSlip,
  type DrinkPosPaymentMethod,
} from "@/systems/drink-pos/lib/payment-method";
import {
  drinkPosActiveSizePrices,
  drinkPosProductHasSizes,
  drinkPosResolveUnitPrice,
  type DrinkPosSizeCode,
} from "@/systems/drink-pos/lib/size-prices";
import { DRINK_POS_ORDER_HREF } from "@/systems/drink-pos/lib/drink-pos-module-nav";
import { formatThb } from "@/systems/inventory/lib/inventory-client-data";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

type CostCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

type EditSaleLineDraft = {
  key: string;
  productId: string | null;
  productName: string;
  sizeLabel: string | null;
  unitPriceBaht: number;
  quantity: number;
};

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

function isoToDatetimeLocalBangkok(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function datetimeLocalBangkokToIso(local: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return new Date(local).toISOString();
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`).toISOString();
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
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-3.5 text-xs font-black transition-all sm:px-4",
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

/** ช่องพิมพ์กรองการเงิน — ความสูงเท่ากัน */
const salesFilterFieldClass = cn(drinkPosFieldClass, "box-border min-h-[44px]");
const salesFilterResetButtonClass = cn(
  appTemplateOutlineButtonClass,
  "inline-flex h-11 w-full min-h-[44px] shrink-0 items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6] sm:w-auto sm:min-w-[8.5rem]",
);

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

const FINANCE_DETAIL_TABS = [
  { id: "history" as const, label: "ประวัติ / รายรับ" },
  { id: "expenses" as const, label: "รายจ่าย" },
];

export function DrinkPosSalesClient() {
  const [sales, setSales] = useState<DrinkPosSaleRow[]>([]);
  const [financeBuckets, setFinanceBuckets] = useState<FinanceBucket[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [financeRangeLabel, setFinanceRangeLabel] = useState("เดือนนี้");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [costs, setCosts] = useState<DrinkPosCostEntryRow[]>([]);
  const [detailPanel, setDetailPanel] = useState<"history" | "expenses">("history");
  const slipLb = useAppImageLightbox();
  const notice = useAppNoticePopup();
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openEditSlipCamera,
    cameraInputRef: editCameraInputRef,
    cameraModal: editSlipCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });

  const [editSale, setEditSale] = useState<DrinkPosSaleRow | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editLines, setEditLines] = useState<EditSaleLineDraft[]>([]);
  const [editAddProductId, setEditAddProductId] = useState("");
  const [editAddSize, setEditAddSize] = useState<DrinkPosSizeCode | "">("");
  const [editProducts, setEditProducts] = useState<DrinkPosProductRow[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<DrinkPosPaymentMethod>("CASH");
  const [editSlipUrl, setEditSlipUrl] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editSlipBusy, setEditSlipBusy] = useState(false);

  const [filterOpen, setFilterOpen] = useState(true);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  /** ค่าเริ่มต้น: เดือนนี้ */
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const todayKey = useMemo(() => bangkokTodayKey(), []);
  const phoneSearchActiveRef = useRef(false);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/drink-pos/cost-categories", { cache: "no-store", credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(typeof j.error === "string" ? j.error : "โหลดหมวดหมู่ไม่สำเร็จ");
    }
    const j = (await res.json()) as { categories?: CostCategory[] };
    const list = Array.isArray(j.categories) ? j.categories : [];
    setCategories(list);
    return list;
  }, []);

  const reload = useCallback(async (opts?: { phone?: string | null }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ range: financeRange });
      if (financeRange === "CUSTOM") {
        if (dateFrom.trim()) qs.set("from", dateFrom.trim());
        if (dateTo.trim()) qs.set("to", dateTo.trim());
      }
      const phone = opts?.phone?.trim() || null;
      const [s, finRes, costsRes] = await Promise.all([
        fetchDrinkPosSales(phone ? 250 : 400, phone ? { phone } : undefined),
        fetch(`/api/drink-pos/finance-summary?${qs.toString()}`, { credentials: "include" }),
        fetch("/api/drink-pos/costs", { credentials: "include", cache: "no-store" }),
        loadCategories().catch(() => [] as CostCategory[]),
      ]);
      if (!s.ok) {
        setError(s.error);
        return;
      }
      setSales(s.sales);
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
      if (costsRes.ok) {
        const cj = (await costsRes.json().catch(() => ({}))) as { costs?: DrinkPosCostEntryRow[] };
        setCosts(Array.isArray(cj.costs) ? cj.costs : []);
      }
    } catch (e) {
      setError(drinkPosFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [financeRange, dateFrom, dateTo, loadCategories]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const digits = keyword.replace(/\D/g, "");
    const compact = keyword.replace(/[\s\-().]/g, "");
    const mostlyPhone = digits.length >= 4 && digits.length >= Math.max(1, compact.length - 1);
    if (mostlyPhone) {
      phoneSearchActiveRef.current = true;
      const t = window.setTimeout(() => {
        void reload({ phone: digits });
      }, 350);
      return () => window.clearTimeout(t);
    }
    if (phoneSearchActiveRef.current) {
      phoneSearchActiveRef.current = false;
      void reload();
    }
    return undefined;
  }, [keyword, reload]);

  const filtersActive = useMemo(() => {
    if (keyword.trim()) return true;
    return financeRange !== "MONTH";
  }, [keyword, financeRange]);

  function openSaleEdit(s: DrinkPosSaleRow) {
    setEditSale(s);
    setEditNote(s.note ?? "");
    setEditPhone((s.memberPhone ?? "").replace(/\D/g, "").slice(0, 20));
    setEditCreatedAt(isoToDatetimeLocalBangkok(s.createdAt));
    setEditLines(
      s.lines.map((l, i) => ({
        key: l.id || `line-${i}`,
        productId: l.productId ?? null,
        productName: l.productName,
        sizeLabel: l.sizeLabel,
        unitPriceBaht: l.unitPriceBaht,
        quantity: l.quantity,
      })),
    );
    setEditAddProductId("");
    setEditAddSize("");
    const method = (s.paymentMethod ?? "CASH") as DrinkPosPaymentMethod;
    setEditPaymentMethod(DRINK_POS_PAYMENT_METHODS.includes(method) ? method : "CASH");
    setEditSlipUrl(s.paymentSlipUrl?.trim() ?? "");
    setEditErr(null);
    void (async () => {
      const p = await fetchDrinkPosProducts();
      if (p.ok) setEditProducts(p.products.filter((x) => x.isActive !== false));
    })();
  }

  const editLinesTotal = useMemo(
    () => editLines.reduce((sum, l) => sum + l.unitPriceBaht * l.quantity, 0),
    [editLines],
  );

  const editAddProduct = useMemo(
    () => editProducts.find((p) => p.id === editAddProductId) ?? null,
    [editProducts, editAddProductId],
  );

  async function uploadEditSlip(file: File) {
    setEditSlipBusy(true);
    setEditErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch("/api/drink-pos/upload", { method: "POST", body: fd, credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !j.imageUrl?.trim()) throw new Error(j.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      setEditSlipUrl(j.imageUrl.trim());
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setEditSlipBusy(false);
    }
  }

  async function onPickEditSlip(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadEditSlip(file);
  }

  async function submitSaleEdit() {
    if (!editSale) return;
    if (editLines.length === 0) {
      setEditErr("ต้องมีสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    const slip = editSlipUrl.trim() || null;
    if (drinkPosPaymentRequiresSlip(editPaymentMethod, editLinesTotal) && !slip) {
      setEditErr("แนบสลิปชำระเงินก่อนบันทึก");
      return;
    }
    setEditBusy(true);
    setEditErr(null);
    try {
      const createdIso = editCreatedAt.trim()
        ? datetimeLocalBangkokToIso(editCreatedAt.trim())
        : editSale.createdAt;
      const res = await fetch(`/api/drink-pos/sales/${editSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          note: editNote.trim() || null,
          memberPhone: editPhone.trim() || null,
          createdAt: createdIso,
          paymentMethod: editPaymentMethod,
          paymentSlipUrl: slip,
          lines: editLines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            sizeLabel: l.sizeLabel,
            unitPriceBaht: l.unitPriceBaht,
            quantity: l.quantity,
          })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
      setEditSale(null);
      await reload();
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteSale(s: DrinkPosSaleRow) {
    const ok = await notice.confirm(`ลบบิลขาย ฿${formatThb(s.totalBaht)} ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/drink-pos/sales/${s.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "ลบไม่สำเร็จ");
      await reload();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const filteredSales = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const kwDigits = keyword.replace(/\D/g, "");
    return sales.filter((s) => {
      const day = bangkokDateKey(s.createdAt);
      if (!dateKeyInFinanceRange(day, financeRange, todayKey, dateFrom.trim(), dateTo.trim())) return false;
      if (kw) {
        const phoneDigits = (s.memberPhone ?? "").replace(/\D/g, "");
        const blob = [s.note ?? "", s.memberPhone ?? "", ...s.lines.map((l) => l.productName)]
          .join(" ")
          .toLowerCase();
        const textMatch = blob.includes(kw);
        const phoneMatch = kwDigits.length >= 3 && phoneDigits.includes(kwDigits);
        if (!textMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [sales, keyword, financeRange, todayKey, dateFrom, dateTo]);

  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      const day = bangkokDateKey(c.spentAt);
      return dateKeyInFinanceRange(day, financeRange, todayKey, dateFrom.trim(), dateTo.trim());
    });
  }, [costs, financeRange, todayKey, dateFrom, dateTo]);

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
    phoneSearchActiveRef.current = false;
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
      {notice.popup}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

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
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <DrinkPosButton
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="drink-pos-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 text-xs font-black text-[#4d47b6]",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span>{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="drink-pos-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center px-3 text-xs font-black text-[#4d47b6]",
                  chartsOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                )}
              >
                {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
              </DrinkPosButton>
              <DrinkPosButton
                type="button"
                onClick={() => void reload()}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชข้อมูลรายงาน"
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
            </div>
          }
        />

        <div
          id="drink-pos-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            <FinanceRangeChip label="วันนี้" active={financeRange === "TODAY"} onClick={() => selectFinanceRange("TODAY")} />
            <FinanceRangeChip label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => selectFinanceRange("MONTH")} />
            <FinanceRangeChip label="ปีนี้" active={financeRange === "YEAR"} onClick={() => selectFinanceRange("YEAR")} />
            <FinanceRangeChip
              label="กำหนดเอง"
              active={financeRange === "CUSTOM"}
              onClick={() => selectFinanceRange("CUSTOM")}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {financeRange === "CUSTOM" ? (
              <>
                <label className="min-w-0 sm:w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="ตั้งแต่วันที่ กรุงเทพ"
                    className={cn(salesFilterFieldClass, "mt-1")}
                  />
                </label>
                <label className="min-w-0 sm:w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="ถึงวันที่ กรุงเทพ"
                    className={cn(salesFilterFieldClass, "mt-1")}
                  />
                </label>
              </>
            ) : null}
            <label className="min-w-0 flex-1 sm:min-w-[14rem]">
              <span className="sr-only">ค้นหาโน้ต ชื่อสินค้า หรือเบอร์โทรลูกค้า</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาโน้ต ชื่อสินค้า หรือเบอร์โทรลูกค้า…"
                aria-label="ค้นหาโน้ต ชื่อสินค้า หรือเบอร์โทรลูกค้า"
                inputMode="search"
                className={cn(salesFilterFieldClass, "mt-0")}
              />
            </label>
            {filtersActive || keyword.trim() ? (
              <DrinkPosButton
                type="button"
                onClick={() => resetSalesFilters()}
                className={salesFilterResetButtonClass}
                aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
              >
                รีเซ็ต · เดือนนี้
              </DrinkPosButton>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
        </div>
          {chartsOpen ? (
            <div id="drink-pos-finance-charts" className="space-y-4 mt-4">
            <p className="text-sm font-black text-[#1e1b4b]">รายได้เทียบต้นทุน · {financeRangeLabel}</p>
            {loading ? (
              <div className={cn("h-40 animate-pulse rounded-2xl", drinkPosPulseWashClass)} aria-hidden />
            ) : (
              <AppSparkChartPanel className="w-full min-w-0">
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

            <p className="text-sm font-black text-[#1e1b4b]">ยอดขาย · {financeRangeLabel}</p>
            {loading ? (
              <div className={cn("h-36 animate-pulse rounded-2xl", drinkPosPulseWashClass)} aria-hidden />
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
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
            </div>
          ) : null}

        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          <nav className={drinkPosFinanceSubTabShellClass} aria-label="เมนูการเงิน">
            <div className="flex w-full min-w-0 gap-1" role="tablist">
              {FINANCE_DETAIL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={detailPanel === t.id}
                  id={`drink-pos-finance-tab-${t.id}`}
                  aria-controls={`drink-pos-finance-panel-${t.id}`}
                  onClick={() => setDetailPanel(t.id)}
                  className={cn(
                    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:px-3 sm:text-sm",
                    detailPanel === t.id
                      ? cn(drinkPosNavActiveClass, "ring-1 ring-white/55")
                      : cn("ring-1 ring-transparent", drinkPosNavIdleClass),
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-4">
            {detailPanel === "history" ? (
              <div
                id="drink-pos-finance-panel-history"
                role="tabpanel"
                aria-labelledby="drink-pos-finance-tab-history"
              >
                <AppSectionHeader
                  tone="slate"
                  title="ประวัติ / รายรับ"
                  className="flex flex-row items-start justify-between gap-3 sm:items-center"
                  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                  action={
                    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                      <Link
                        href={DRINK_POS_ORDER_HREF}
                        className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-0 font-black shadow-md sm:min-w-0 sm:px-4"
                        aria-label="ไปหน้าออเดอร์เพื่อบันทึกขาย"
                      >
                        <svg className="h-5 w-5 sm:mr-1.5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                        <span className="hidden sm:inline">+ บันทึกขาย</span>
                      </Link>
                    </div>
                  }
                />
                {filtersActive ? (
                  <p className="mt-2 text-xs font-semibold text-[#66638c]">
                    แสดงตามตัวกรองด้านบน
                    {keyword.trim() ? ` · ค้นหา «${keyword.trim()}»` : ""} · {financeRangeLabel}
                  </p>
                ) : null}
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
                      {filteredSales.map((s) => {
                        const slipUrl = s.paymentSlipUrl?.trim() || "";
                        return (
                          <li
                            key={s.id}
                            className="rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4"
                          >
                            <div className="flex items-start gap-3">
                              {slipUrl ? (
                                <AppImageThumb
                                  src={slipUrl}
                                  alt="สลิปชำระเงิน"
                                  className="h-14 w-14 shrink-0"
                                  onOpen={() => slipLb.open(slipUrl)}
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#66638c]">
                                  {new Date(s.createdAt).toLocaleString("th-TH", {
                                    timeZone: "Asia/Bangkok",
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {s.memberPhone ? (
                                  <p className="mt-0.5 text-sm font-black tabular-nums text-[#1e1b4b]">
                                    ลูกค้า {s.memberPhone}
                                  </p>
                                ) : null}
                                {s.note ? <p className="mt-0.5 text-sm font-semibold text-[#1e1b4b]">{s.note}</p> : null}
                                <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                                  {drinkPosPaymentMethodLabel(s.paymentMethod)}
                                  {s.isRewardRedemption ? " · แลกคะแนน" : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <p className="text-right text-lg font-black tabular-nums text-emerald-700">
                                  ฿{formatThb(s.totalBaht)}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openSaleEdit(s)}
                                    className={assetRowEditIconButtonClass}
                                    aria-label={`แก้ไขบิล ${formatThb(s.totalBaht)} บาท`}
                                    title="แก้ไข"
                                  >
                                    <IconRowEdit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteSale(s)}
                                    className={assetRowRemoveIconButtonClass}
                                    aria-label={`ลบบิล ${formatThb(s.totalBaht)} บาท`}
                                    title="ลบ"
                                  >
                                    <IconRowRemove className="h-4 w-4" />
                                  </button>
                                </div>
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
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {detailPanel === "expenses" ? (
              <div
                id="drink-pos-finance-panel-expenses"
                role="tabpanel"
                aria-labelledby="drink-pos-finance-tab-expenses"
              >
                <p className="mb-2 text-xs font-semibold text-[#66638c]">ต้นทุน · {financeRangeLabel}</p>
                {loading ? (
                  <div className="mt-4 h-32 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
                ) : (
                  <DrinkPosCostsPanel
                    categories={categories}
                    entries={filteredCosts}
                    emptyWhenFilteredMessage="ยังไม่มีรายจ่ายในช่วงนี้ — กด «+ เพิ่มรายจ่าย»"
                    onChanged={() => void reload()}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </AppDashboardSection>



      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระเงิน" />

      <FormModal
        open={editSale != null}
        onClose={() => {
          if (!editBusy) setEditSale(null);
        }}
        title="แก้ไขบิลขาย"
        description="แก้เมนู · เบอร์ · วันที่ · ชำระ และสลิป"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setEditSale(null)}
            onSubmit={() => void submitSaleEdit()}
            submitLabel={editBusy ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={editBusy || editSlipBusy}
            loading={editBusy}
          />
        }
      >
        <div className="space-y-3">
          {editErr ? <p className="text-sm font-semibold text-rose-600">{editErr}</p> : null}
          <p className="text-sm font-black tabular-nums text-emerald-700">
            ยอด ฿{formatThb(editLinesTotal)}
          </p>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทรลูกค้า</span>
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 20))}
              className={cn(drinkPosFieldClass, "mt-1")}
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">วัน–เวลาขาย</span>
            <input
              type="datetime-local"
              value={editCreatedAt}
              onChange={(e) => setEditCreatedAt(e.target.value)}
              className={cn(drinkPosFieldClass, "mt-1")}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ช่องทางชำระ</span>
            <select
              value={editPaymentMethod}
              onChange={(e) => setEditPaymentMethod(e.target.value as DrinkPosPaymentMethod)}
              className={cn(drinkPosFieldClass, "mt-1 cursor-pointer")}
            >
              {DRINK_POS_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {drinkPosPaymentMethodLabel(m)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-bold text-[#4d47b6]">รายการเครื่องดื่ม</p>
            <ul className="mt-2 space-y-2">
              {editLines.map((l) => (
                <li
                  key={l.key}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1e1b4b]">
                      {l.productName}
                      {l.sizeLabel ? ` (${l.sizeLabel})` : ""}
                    </p>
                    <p className="text-[11px] font-medium text-[#66638c]">
                      ฿{formatThb(l.unitPriceBaht)} / รายการ
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white text-lg font-black text-[#4d47b6]"
                      aria-label={`ลดจำนวน ${l.productName}`}
                      onClick={() =>
                        setEditLines((prev) =>
                          prev.flatMap((row) => {
                            if (row.key !== l.key) return [row];
                            if (row.quantity <= 1) return [];
                            return [{ ...row, quantity: row.quantity - 1 }];
                          }),
                        )
                      }
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white text-lg font-black text-[#4d47b6]"
                      aria-label={`เพิ่มจำนวน ${l.productName}`}
                      onClick={() =>
                        setEditLines((prev) =>
                          prev.map((row) =>
                            row.key === l.key
                              ? { ...row, quantity: Math.min(9999, row.quantity + 1) }
                              : row,
                          ),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${l.productName}`}
                    title="ลบรายการ"
                    onClick={() => setEditLines((prev) => prev.filter((row) => row.key !== l.key))}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-2">
              <label className="block">
                <span className="text-[11px] font-bold text-[#4d47b6]">เพิ่มสินค้า</span>
                <select
                  value={editAddProductId}
                  onChange={(e) => {
                    setEditAddProductId(e.target.value);
                    setEditAddSize("");
                  }}
                  className={cn(drinkPosFieldClass, "mt-1 cursor-pointer")}
                >
                  <option value="">— เลือกสินค้า —</option>
                  {editProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · ฿{formatThb(p.priceBaht)}
                    </option>
                  ))}
                </select>
              </label>
              {editAddProduct && drinkPosProductHasSizes(editAddProduct.sizePrices) ? (
                <label className="block">
                  <span className="text-[11px] font-bold text-[#4d47b6]">ขนาด</span>
                  <select
                    value={editAddSize}
                    onChange={(e) => setEditAddSize(e.target.value as DrinkPosSizeCode | "")}
                    className={cn(drinkPosFieldClass, "mt-1 cursor-pointer")}
                  >
                    <option value="">— เลือกขนาด —</option>
                    {drinkPosActiveSizePrices(editAddProduct.sizePrices).map((sz) => (
                      <option key={sz.size} value={sz.size}>
                        {sz.size} · ฿{formatThb(sz.priceBaht)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "rounded-xl px-3 py-2 text-xs font-bold")}
                disabled={
                  !editAddProduct ||
                  (drinkPosProductHasSizes(editAddProduct.sizePrices) && !editAddSize)
                }
                onClick={() => {
                  if (!editAddProduct) return;
                  const size = editAddSize || null;
                  const unit = drinkPosResolveUnitPrice(editAddProduct, size);
                  if (unit == null) return;
                  const sizeKey = size ?? "";
                  setEditLines((prev) => {
                    const exist = prev.find(
                      (x) => x.productId === editAddProduct.id && (x.sizeLabel ?? "") === sizeKey,
                    );
                    if (exist) {
                      return prev.map((row) =>
                        row.key === exist.key
                          ? { ...row, quantity: Math.min(9999, row.quantity + 1) }
                          : row,
                      );
                    }
                    return [
                      ...prev,
                      {
                        key: `new-${editAddProduct.id}-${sizeKey}-${Date.now()}`,
                        productId: editAddProduct.id,
                        productName: editAddProduct.name,
                        sizeLabel: size,
                        unitPriceBaht: unit,
                        quantity: 1,
                      },
                    ];
                  });
                  setEditAddProductId("");
                  setEditAddSize("");
                }}
              >
                เพิ่มรายการ
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={2}
              className={cn(drinkPosFieldClass, "mt-1 min-h-[4rem] py-2")}
            />
          </label>
          <div>
            <p className="text-xs font-bold text-[#4d47b6]">สลิป (ไม่บังคับ ยกเว้นพร้อมเพย์/โอน)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={editGalleryRef}
              cameraInputRef={editCameraInputRef}
              onChange={(e) => void onPickEditSlip(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => editGalleryRef.current?.click()}
                onPickCamera={() => openEditSlipCamera((file) => void uploadEditSlip(file))}
                disabled={editBusy || editSlipBusy}
                busy={editSlipBusy}
              />
            </div>
            {editSlipCameraModal}
            {editSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={editSlipUrl}
                  alt="สลิปบิล"
                  onOpen={() => slipLb.open(editSlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setEditSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-xl px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีสลิป — อัปโหลดหรือถ่ายใหม่ได้</p>
            )}
          </div>
        </div>
      </FormModal>
    </div>
  );
}
