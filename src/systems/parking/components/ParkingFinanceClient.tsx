"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { bangkokDateKey, formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ParkingPageStack } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingStatCard } from "@/systems/parking/components/ParkingStatCard";
import {
  parkingFilterChipClass,
  parkingFinanceHeaderTabPillClass,
  parkingFinanceStatTailClass,
  parkingFinanceStatsGridClass,
  parkingListRowCardClass,
} from "@/systems/parking/parking-ui-tokens";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";
type FinanceTab = "history" | "expenses";
type EntryKind = "income" | "cost";

type IncomeCategory = {
  id: string;
  name: string;
  kind: "PARKING_SESSION" | "CUSTOM";
  isBuiltin: boolean;
  sortOrder: number;
};
type CostCategory = { id: number; name: string; sortOrder: number };
type SessionRow = {
  id: number;
  licensePlate: string;
  spotCode: string;
  checkInAt: string;
  checkOutAt: string | null;
  amountPaidBaht: number;
  amountDueBaht: number;
  customerName: string | null;
  status: string;
};
type IncomeRow = {
  id: string;
  label: string;
  amountBaht: number;
  earnedAt: string;
  note: string | null;
  paymentSlipUrl: string | null;
  categoryId: string;
  categoryName: string;
  categoryKind: "CUSTOM";
};
type CostRow = {
  id: number;
  label: string;
  amountBaht: number;
  spentAt: string;
  note: string;
  paymentSlipUrl: string;
  categoryId: number;
  categoryName: string;
};
type Summary = {
  range: FinanceRange;
  rangeLabel: string;
  grain: "day" | "month";
  totalRevenue: number;
  totalCost: number;
  net: number;
  buckets: Array<{ key: string; label: string; revenue: number; cost: number }>;
  sessions: SessionRow[];
  costs: CostRow[];
  incomes: IncomeRow[];
  incomeCategories: IncomeCategory[];
  costCategories: CostCategory[];
};

const EMPTY_SUMMARY: Summary = {
  range: "MONTH",
  rangeLabel: "เดือนนี้",
  grain: "day",
  totalRevenue: 0,
  totalCost: 0,
  net: 0,
  buckets: [],
  sessions: [],
  costs: [],
  incomes: [],
  incomeCategories: [],
  costCategories: [],
};
const fieldClass =
  "mt-1 min-h-[44px] w-full rounded-xl border border-white/70 bg-white/85 px-3 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2";

function money(value: number) {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M20 7v5h-5M4 17v-5h5M6.2 8a7 7 0 0 1 11.3-1.5L20 9M4 15l2.5 2.5A7 7 0 0 0 18 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "ดำเนินการไม่สำเร็จ");
  return data;
}

export function ParkingFinanceClient() {
  const notice = useAppNoticePopup();
  const lightbox = useAppImageLightbox();
  const camera = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const galleryRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [range, setRange] = useState<FinanceRange>("MONTH");
  const [from, setFrom] = useState(bangkokDateKey());
  const [to, setTo] = useState(bangkokDateKey());
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [tab, setTab] = useState<FinanceTab>("history");
  const [incomeFilter, setIncomeFilter] = useState<string>("ALL");
  const [costFilter, setCostFilter] = useState<number | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryKind, setEntryKind] = useState<EntryKind>("income");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [entryCategoryId, setEntryCategoryId] = useState("");
  const [entryLabel, setEntryLabel] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySlipUrl, setEntrySlipUrl] = useState("");
  const [entryBusy, setEntryBusy] = useState(false);
  const [slipBusy, setSlipBusy] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryKind, setCategoryKind] = useState<EntryKind>("income");
  const [categoryEditingId, setCategoryEditingId] = useState<string | number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryErr, setCategoryErr] = useState<string | null>(null);
  const [categoryBusy, setCategoryBusy] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ range });
      if (range === "CUSTOM") {
        query.set("from", from);
        query.set("to", to);
      }
      setSummary(await apiJson<Summary>(`/api/parking/finance-summary?${query}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [from, range, to]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  const filtersDirty = range !== "MONTH" || Boolean(keyword.trim());
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("th-TH");
  const customIncomeCategories = summary.incomeCategories.filter((item) => item.kind === "CUSTOM" && !item.isBuiltin);
  const filteredSessions = summary.sessions.filter((row) => {
    if (incomeFilter !== "ALL" && incomeFilter !== "PARKING_SESSION") return false;
    return !normalizedKeyword ||
      `${row.licensePlate} ${row.customerName ?? ""} ${row.spotCode}`.toLocaleLowerCase("th-TH").includes(normalizedKeyword);
  });
  const filteredIncomes = summary.incomes.filter((row) => {
    if (incomeFilter !== "ALL" && row.categoryId !== incomeFilter) return false;
    return !normalizedKeyword ||
      `${row.label} ${row.categoryName} ${row.note ?? ""}`.toLocaleLowerCase("th-TH").includes(normalizedKeyword);
  });
  const filteredCosts = summary.costs.filter((row) => {
    if (costFilter !== "ALL" && row.categoryId !== costFilter) return false;
    return !normalizedKeyword ||
      `${row.label} ${row.categoryName} ${row.note}`.toLocaleLowerCase("th-TH").includes(normalizedKeyword);
  });
  const chartBuckets = useMemo(() => {
    const max = Math.max(1, ...summary.buckets.map((row) => Math.max(row.revenue, row.cost)));
    return summary.buckets.map((row) => ({
      ...row,
      revenuePct: (row.revenue / max) * 100,
      costPct: (row.cost / max) * 100,
    }));
  }, [summary.buckets]);

  function resetEntry() {
    setEditingId(null);
    setEntryLabel("");
    setEntryAmount("");
    setEntryNote("");
    setEntrySlipUrl("");
  }

  function openNewEntry(kind: EntryKind) {
    resetEntry();
    setEntryKind(kind);
    setEntryCategoryId(
      kind === "income" ? customIncomeCategories[0]?.id ?? "" : String(summary.costCategories[0]?.id ?? ""),
    );
    setEntryOpen(true);
  }

  function openIncomeEdit(row: IncomeRow) {
    setEntryKind("income");
    setEditingId(row.id);
    setEntryCategoryId(row.categoryId);
    setEntryLabel(row.label);
    setEntryAmount(String(row.amountBaht));
    setEntryNote(row.note ?? "");
    setEntrySlipUrl(row.paymentSlipUrl ?? "");
    setEntryOpen(true);
  }

  function openCostEdit(row: CostRow) {
    setEntryKind("cost");
    setEditingId(row.id);
    setEntryCategoryId(String(row.categoryId));
    setEntryLabel(row.label);
    setEntryAmount(String(row.amountBaht));
    setEntryNote(row.note);
    setEntrySlipUrl(row.paymentSlipUrl);
    setEntryOpen(true);
  }

  async function saveEntry() {
    const amountBaht = Math.round(Number(entryAmount));
    if (!entryCategoryId || !entryLabel.trim() || amountBaht <= 0) {
      setError("เลือกหมวดหมู่และกรอกรายการกับจำนวนเงิน");
      return;
    }
    setEntryBusy(true);
    setError(null);
    try {
      const root = entryKind === "income" ? "incomes" : "costs";
      const url = editingId === null ? `/api/parking/${root}` : `/api/parking/${root}/${editingId}`;
      await apiJson(url, {
        method: editingId === null ? "POST" : "PATCH",
        body: JSON.stringify({
          categoryId: entryKind === "cost" ? Number(entryCategoryId) : entryCategoryId,
          label: entryLabel,
          amountBaht,
          note: entryNote,
          paymentSlipUrl: entrySlipUrl || null,
        }),
      });
      setEntryOpen(false);
      resetEntry();
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ");
    } finally {
      setEntryBusy(false);
    }
  }

  async function uploadSlip(file: File) {
    setSlipBusy(true);
    setError(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.append("file", prepared);
      const result = await apiJson<{ imageUrl: string }>("/api/parking/upload", { method: "POST", body: form });
      setEntrySlipUrl(result.imageUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setSlipBusy(false);
    }
  }

  async function onPickSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await uploadSlip(file);
  }

  async function deleteEntry(kind: EntryKind, id: string | number, label: string) {
    if (!(await notice.confirm(`ลบรายการ «${label}» ใช่หรือไม่?`))) return;
    try {
      await apiJson(`/api/parking/${kind === "income" ? "incomes" : "costs"}/${id}`, { method: "DELETE" });
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      notice.error(caught instanceof Error ? caught.message : "ลบไม่สำเร็จ");
    }
  }

  function openCategories(kind: EntryKind) {
    setCategoryKind(kind);
    setCategoryFormOpen(false);
    setCategoryEditingId(null);
    setCategoryName("");
    setCategoryErr(null);
    setCategoryOpen(true);
  }

  function openCategoryCreate() {
    setCategoryEditingId(null);
    setCategoryName("");
    setCategoryErr(null);
    setCategoryFormOpen(true);
  }

  function openCategoryEdit(id: string | number, name: string) {
    setCategoryEditingId(id);
    setCategoryName(name);
    setCategoryErr(null);
    setCategoryFormOpen(true);
  }

  async function saveCategory() {
    const name = categoryName.trim();
    if (!name) {
      setCategoryErr("กรอกชื่อหมวดหมู่");
      return;
    }
    setCategoryBusy(true);
    setCategoryErr(null);
    try {
      const root = categoryKind === "income" ? "income-categories" : "cost-categories";
      await apiJson(
        categoryEditingId === null ? `/api/parking/${root}` : `/api/parking/${root}/${categoryEditingId}`,
        {
          method: categoryEditingId === null ? "POST" : "PATCH",
          body: JSON.stringify({ name }),
        },
      );
      setCategoryEditingId(null);
      setCategoryName("");
      setCategoryFormOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "บันทึกหมวดหมู่ไม่สำเร็จ";
      setCategoryErr(message);
      notice.error(message);
    } finally {
      setCategoryBusy(false);
    }
  }

  async function deleteCategory(id: string | number, name: string) {
    if (!(await notice.confirm(`ลบหมวด «${name}» ใช่หรือไม่?`))) return;
    setCategoryBusy(true);
    setCategoryErr(null);
    try {
      const root = categoryKind === "income" ? "income-categories" : "cost-categories";
      await apiJson(`/api/parking/${root}/${id}`, { method: "DELETE" });
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "ลบหมวดหมู่ไม่สำเร็จ";
      setCategoryErr(message);
      notice.error(message);
    } finally {
      setCategoryBusy(false);
    }
  }

  const categoryRows = categoryKind === "income" ? customIncomeCategories : summary.costCategories;

  return (
    <ParkingPageStack>
      <div className={parkingFinanceStatsGridClass}>
        <ParkingStatCard title={`รายรับ · ${summary.rangeLabel}`} value={`฿${money(summary.totalRevenue)}`} tone="emerald" />
        <ParkingStatCard title={`รายจ่าย · ${summary.rangeLabel}`} value={`฿${money(summary.totalCost)}`} tone="rose" />
        <ParkingStatCard
          title="สุทธิ"
          value={`฿${money(summary.net)}`}
          tone={summary.net < 0 ? "rose" : "indigo"}
          className={parkingFinanceStatTailClass}
        />
      </div>

      <AppDashboardSection tone="violet" className="!rounded-[2.5rem]">
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1" role="tablist" aria-label="รายรับหรือรายจ่าย">
                <button
                  id="parking-finance-tab-history"
                  type="button"
                  role="tab"
                  aria-selected={tab === "history"}
                  aria-controls="parking-finance-panel-history"
                  onClick={() => setTab("history")}
                  className={parkingFinanceHeaderTabPillClass(tab === "history")}
                >
                  รายรับ
                </button>
                <button
                  id="parking-finance-tab-expenses"
                  type="button"
                  role="tab"
                  aria-selected={tab === "expenses"}
                  aria-controls="parking-finance-panel-expenses"
                  onClick={() => setTab("expenses")}
                  className={parkingFinanceHeaderTabPillClass(tab === "expenses")}
                >
                  รายจ่าย
                </button>
              </div>
              <button
                type="button"
                aria-expanded={filterOpen}
                aria-controls="parking-finance-filters"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                onClick={() => setFilterOpen((value) => !value)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 px-2 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
                  filterOpen && "border-[#5b61ff]/45 bg-[#5b61ff]/10",
                )}
              >
                <IconFilter className="h-5 w-5" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersDirty && !filterOpen ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" /> : null}
              </button>
              <button
                type="button"
                aria-expanded={chartsOpen}
                aria-controls="parking-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                onClick={() => setChartsOpen((value) => !value)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 px-2 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
                  chartsOpen && "border-[#5b61ff]/45 bg-[#5b61ff]/10",
                )}
              >
                <IconChart className="h-5 w-5" />
                <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
              </button>
              <button
                type="button"
                aria-label="รีเฟรชข้อมูลการเงิน"
                aria-busy={loading}
                disabled={loading}
                title="รีเฟรช"
                onClick={() => setRefreshKey((value) => value + 1)}
                className={cn(appTemplateOutlineButtonClass, "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-2 text-[#4d47b6] sm:min-w-0 sm:px-3")}
              >
                <IconRefresh className={cn("h-5 w-5 sm:mr-1.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        <div id="parking-finance-filters" className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            {([
              ["TODAY", "วันนี้"],
              ["MONTH", "เดือนนี้"],
              ["YEAR", "ปีนี้"],
              ["CUSTOM", "กำหนดเอง"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className={cn(parkingFilterChipClass(range === value), "h-10 rounded-full px-3.5")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {range === "CUSTOM" ? (
              <>
                <label className="min-w-[10rem] flex-1">
                  <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                  <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={fieldClass} />
                </label>
                <label className="min-w-[10rem] flex-1">
                  <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                  <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={fieldClass} />
                </label>
              </>
            ) : null}
            <label className="min-w-[12rem] flex-[2]">
              <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ทะเบียนรถหรือชื่อรายการ…"
                className={fieldClass}
              />
            </label>
            {filtersDirty ? (
              <button
                type="button"
                onClick={() => {
                  setRange("MONTH");
                  setKeyword("");
                  setFrom(bangkokDateKey());
                  setTo(bangkokDateKey());
                }}
                className={cn(appTemplateOutlineButtonClass, "h-11 min-h-[44px] rounded-xl px-4 text-sm font-black text-[#4d47b6]")}
              >
                รีเซ็ต · เดือนนี้
              </button>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {summary.rangeLabel}</p>
        </div>

        {chartsOpen ? (
          <div id="parking-finance-charts" className="mt-4">
            <AppSparkChartPanel>
              <AppRevenueCostColumnChart
                compact
                title={`รายรับเทียบรายจ่าย · ${summary.rangeLabel}`}
                subtitle=""
                emptyText="ไม่มีข้อมูลในช่วงนี้"
                buckets={chartBuckets}
                formatTitle={(bucket) => `รายรับ ${money(bucket.revenue)} · รายจ่าย ${money(bucket.cost)}`}
                className="flex min-h-0 flex-1 flex-col"
              />
            </AppSparkChartPanel>
          </div>
        ) : null}

        <div className="mt-4 space-y-4 border-t border-white/60 pt-4">
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

          {tab === "history" ? (
            <div id="parking-finance-panel-history" role="tabpanel" aria-labelledby="parking-finance-tab-history" className="space-y-4">
              <AppSectionHeader
                tone="slate"
                title="ประวัติ / รายรับ"
                className="flex flex-row items-start justify-between gap-3 sm:items-center"
                actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                action={
                  <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => openCategories("income")}
                      className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 text-xs font-black text-[#4d47b6]")}
                      aria-label="จัดการหมวดหมู่รายรับ"
                      title="หมวดหมู่"
                    >
                      หมวดหมู่
                    </button>
                    <button
                      type="button"
                      onClick={() => openNewEntry("income")}
                      className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-0 text-xs font-black sm:min-w-0 sm:px-3"
                      aria-label="เพิ่มรายรับ"
                    >
                      <span className="sm:hidden">+</span>
                      <span className="hidden sm:inline">+ รายรับ</span>
                    </button>
                  </div>
                }
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="กรองหมวดรายรับ">
                <button type="button" onClick={() => setIncomeFilter("ALL")} className={parkingFilterChipClass(incomeFilter === "ALL")}>ทั้งหมด</button>
                <button type="button" onClick={() => setIncomeFilter("PARKING_SESSION")} className={parkingFilterChipClass(incomeFilter === "PARKING_SESSION")}>ค่าจอดรถ</button>
                {customIncomeCategories.map((category) => (
                  <button key={category.id} type="button" onClick={() => setIncomeFilter(category.id)} className={parkingFilterChipClass(incomeFilter === category.id)}>
                    {category.name}
                  </button>
                ))}
              </div>
              {filteredSessions.length + filteredIncomes.length === 0 ? (
                <AppEmptyState tone="violet">ไม่มีรายรับในช่วงนี้ — ลองเปลี่ยนช่วงเวลาหรือคำค้น</AppEmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filteredSessions.map((row) => (
                    <li key={`session-${row.id}`} className={parkingListRowCardClass}>
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-[#1e1b4b]">{row.licensePlate}</p>
                          <p className="mt-1 text-xs font-semibold text-[#66638c]">ค่าจอดรถ · ช่อง {row.spotCode}</p>
                          <p className="mt-1 text-xs text-[#66638c]">{row.checkOutAt ? formatBangkokDateTimeLong(row.checkOutAt) : "-"}</p>
                        </div>
                        <p className="shrink-0 text-right text-lg font-black tabular-nums text-emerald-700">+฿{money(row.amountPaidBaht)}</p>
                      </div>
                    </li>
                  ))}
                  {filteredIncomes.map((row) => (
                    <li key={`income-${row.id}`} className={parkingListRowCardClass}>
                      <div className="flex items-start gap-2">
                        {row.paymentSlipUrl ? <AppImageThumb src={row.paymentSlipUrl} alt={`สลิป ${row.label}`} onOpen={() => lightbox.open(row.paymentSlipUrl!)} className="h-14 w-14 shrink-0" /> : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-[#1e1b4b]">{row.label}</p>
                          <p className="mt-1 text-xs font-semibold text-[#66638c]">{row.categoryName} · {formatBangkokDateTimeLong(row.earnedAt)}</p>
                          {row.note ? <p className="mt-1 line-clamp-2 text-xs text-[#66638c]">{row.note}</p> : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black tabular-nums text-emerald-700">+฿{money(row.amountBaht)}</p>
                          <div className="mt-2 flex gap-1">
                            <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.label}`} title="แก้ไข" onClick={() => openIncomeEdit(row)}><IconRowEdit className="h-4 w-4" /></button>
                            <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.label}`} title="ลบ" onClick={() => void deleteEntry("income", row.id, row.label)}><IconRowRemove className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div id="parking-finance-panel-expenses" role="tabpanel" aria-labelledby="parking-finance-tab-expenses" className="space-y-4">
              <AppSectionHeader
                tone="slate"
                title="รายจ่าย"
                className="flex flex-row items-start justify-between gap-3 sm:items-center"
                actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                action={
                  <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => openCategories("cost")}
                      className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 text-xs font-black text-[#4d47b6]")}
                      aria-label="จัดการหมวดหมู่รายจ่าย"
                      title="หมวดหมู่"
                    >
                      หมวดหมู่
                    </button>
                    <button
                      type="button"
                      onClick={() => openNewEntry("cost")}
                      className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-0 text-xs font-black sm:min-w-0 sm:px-3"
                      aria-label="เพิ่มรายจ่าย"
                    >
                      <span className="sm:hidden">+</span>
                      <span className="hidden sm:inline">+ รายจ่าย</span>
                    </button>
                  </div>
                }
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="กรองหมวดรายจ่าย">
                <button type="button" onClick={() => setCostFilter("ALL")} className={parkingFilterChipClass(costFilter === "ALL")}>ทั้งหมด</button>
                {summary.costCategories.map((category) => (
                  <button key={category.id} type="button" onClick={() => setCostFilter(category.id)} className={parkingFilterChipClass(costFilter === category.id)}>
                    {category.name}
                  </button>
                ))}
              </div>
              {summary.costCategories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#d8d6ec] bg-white/50 px-3 py-3 text-center text-sm font-semibold text-[#66638c]">
                  สร้างหมวดก่อนจึงจะบันทึกรายจ่ายได้ — กด «หมวดหมู่»
                </p>
              ) : null}
              {filteredCosts.length === 0 ? (
                <AppEmptyState tone="violet">
                  {summary.costCategories.length === 0 ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายจ่าย" : "ไม่มีรายจ่ายในช่วงนี้ — เพิ่มรายจ่ายหรือเปลี่ยนตัวกรอง"}
                </AppEmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filteredCosts.map((row) => (
                    <li key={row.id} className={parkingListRowCardClass}>
                      <div className="flex items-start gap-2">
                        {row.paymentSlipUrl ? <AppImageThumb src={row.paymentSlipUrl} alt={`สลิป ${row.label}`} onOpen={() => lightbox.open(row.paymentSlipUrl)} className="h-14 w-14 shrink-0" /> : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-[#1e1b4b]">{row.label}</p>
                          <p className="mt-1 text-xs font-semibold text-[#66638c]">{row.categoryName} · {formatBangkokDateTimeLong(row.spentAt)}</p>
                          {row.note ? <p className="mt-1 line-clamp-2 text-xs text-[#66638c]">{row.note}</p> : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black tabular-nums text-rose-600">-฿{money(row.amountBaht)}</p>
                          <div className="mt-2 flex gap-1">
                            <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.label}`} title="แก้ไข" onClick={() => openCostEdit(row)}><IconRowEdit className="h-4 w-4" /></button>
                            <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.label}`} title="ลบ" onClick={() => void deleteEntry("cost", row.id, row.label)}><IconRowRemove className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </AppDashboardSection>

      <FormModal
        open={entryOpen}
        onClose={() => !entryBusy && setEntryOpen(false)}
        title={`${editingId === null ? "เพิ่ม" : "แก้ไข"}${entryKind === "income" ? "รายรับ" : "รายจ่าย"}`}
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setEntryOpen(false)}
            onSubmit={saveEntry}
            submitLabel="บันทึก"
            submitDisabled={!entryCategoryId || !entryLabel.trim() || Number(entryAmount) <= 0}
            loading={entryBusy}
          />
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-[#1e1b4b]">หมวดหมู่</span>
            <select value={entryCategoryId} onChange={(event) => setEntryCategoryId(event.target.value)} className={fieldClass}>
              <option value="">เลือกหมวดหมู่</option>
              {(entryKind === "income" ? customIncomeCategories : summary.costCategories).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#1e1b4b]">รายละเอียดรายการ</span>
            <input value={entryLabel} onChange={(event) => setEntryLabel(event.target.value)} className={fieldClass} maxLength={200} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#1e1b4b]">จำนวนเงิน (บาท)</span>
            <input type="number" min="1" inputMode="decimal" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#1e1b4b]">หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span></span>
            <textarea value={entryNote} onChange={(event) => setEntryNote(event.target.value)} className={cn(fieldClass, "min-h-24 py-3")} maxLength={500} />
          </label>
          <div>
            <p className="text-sm font-bold text-[#1e1b4b]">รูปสลิป <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span></p>
            <AppGalleryCameraFileInputs galleryInputRef={galleryRef} cameraInputRef={camera.cameraInputRef} onChange={(event) => void onPickSlip(event)} />
            <AppImagePickCameraButtons
              className="mt-2"
              onPickGallery={() => galleryRef.current?.click()}
              onPickCamera={() => camera.openCamera((file) => void uploadSlip(file))}
              disabled={entryBusy || slipBusy}
              busy={slipBusy}
            />
            {entrySlipUrl ? (
              <div className="mt-3 flex items-end gap-3">
                <AppImageThumb src={entrySlipUrl} alt="ตัวอย่างสลิป" onOpen={() => lightbox.open(entrySlipUrl)} className="h-20 w-20" />
                <button type="button" onClick={() => setEntrySlipUrl("")} className={cn(appTemplateOutlineButtonClass, "min-h-[40px] px-3 text-xs font-bold text-rose-600")}>ลบสลิป</button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={categoryOpen}
        onClose={() => {
          if (categoryBusy) return;
          setCategoryOpen(false);
          setCategoryFormOpen(false);
          setCategoryErr(null);
        }}
        title={
          categoryFormOpen
            ? categoryEditingId === null
              ? `เพิ่มหมวดหมู่${categoryKind === "income" ? "รายรับ" : "รายจ่าย"}`
              : "แก้ไขหมวดหมู่"
            : `หมวดหมู่${categoryKind === "income" ? "รายรับ" : "รายจ่าย"}`
        }
        size="md"
        mobileCentered
        footer={
          categoryFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                setCategoryFormOpen(false);
                setCategoryEditingId(null);
                setCategoryName("");
                setCategoryErr(null);
              }}
              onSubmit={() => void saveCategory()}
              submitLabel={categoryEditingId === null ? "เพิ่มหมวด" : "บันทึก"}
              submitDisabled={!categoryName.trim()}
              loading={categoryBusy}
            />
          ) : (
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCategoryOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 sm:flex-none sm:px-8"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={openCategoryCreate}
                className="flex-1 rounded-2xl bg-[#5b61ff] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-[#4d47b6] sm:flex-none sm:px-8"
              >
                + เพิ่มหมวดหมู่
              </button>
            </div>
          )
        }
      >
        {categoryErr ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{categoryErr}</p> : null}
        {categoryFormOpen ? (
          <label className="block">
            <span className="text-sm font-bold text-[#1e1b4b]">ชื่อหมวดหมู่</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className={fieldClass}
              maxLength={120}
              placeholder={categoryKind === "income" ? "เช่น ค่าบริการเพิ่ม · ค่าปรับ" : "เช่น ค่าน้ำ · ค่าไฟ · วัสดุ"}
              autoFocus
            />
          </label>
        ) : categoryRows.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-6 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="space-y-2">
            {categoryRows.map((category) => (
              <li key={category.id} className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/65 p-3">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1e1b4b]">{category.name}</span>
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไขหมวด ${category.name}`}
                  title="แก้ไข"
                  onClick={() => openCategoryEdit(category.id, category.name)}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ลบหมวด ${category.name}`}
                  title="ลบ"
                  onClick={() => void deleteCategory(category.id, category.name)}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      {camera.cameraModal}
      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="รูปสลิป" />
      {notice.popup}
    </ParkingPageStack>
  );
}
