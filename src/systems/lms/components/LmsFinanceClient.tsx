"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { RefreshCw } from "lucide-react";
import {
  AppCameraCaptureModal,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  AppRevenueCostColumnChart,
  AppTakePhotoButton,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  barberFinanceRangeBounds,
  type BarberFinanceRange,
} from "@/lib/barber/finance-range";
import { bangkokDateKey, formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import type { LmsFinanceCategory, LmsFinanceDto } from "@/systems/lms/lib/mappers";
import {
  DEFAULT_LMS_FINANCE_CATEGORIES,
  LMS_FINANCE_TYPE_LABELS,
} from "@/systems/lms/lib/mappers";
import {
  lmsFieldClass,
  lmsFilterChipClass,
  lmsFilterChipShellClass,
  lmsFinanceRangeChipClass,
  lmsFinanceStatTailClass,
  lmsFinanceStatsGridClass,
  lmsInlineSubNavBtnClass,
  lmsInlineSubNavShellClass,
  lmsOutlineButtonClass,
  lmsPanelClass,
  lmsPanelDividerClass,
  lmsPanelSectionClass,
  lmsPrimaryButtonClass,
  lmsSectionHeadingClass,
  lmsStatInlineClass,
  lmsTextareaClass,
} from "@/systems/lms/lib/ui-tokens";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}

function newCatId() {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function LmsFinanceClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const todayKey = bangkokDateKey();

  const [listTab, setListTab] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [financeRange, setFinanceRange] = useState<BarberFinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${todayKey.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(todayKey);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [rows, setRows] = useState<LmsFinanceDto[]>([]);
  const [categories, setCategories] = useState<LmsFinanceCategory[]>(DEFAULT_LMS_FINANCE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    amountBaht: "",
    transactedAt: new Date().toISOString().slice(0, 16),
    note: "",
    slipUrl: "" as string | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, profRes] = await Promise.all([
        fetch("/api/lms/session/finance"),
        fetch("/api/lms/session/profile"),
      ]);
      const data = (await finRes.json()) as {
        transactions?: LmsFinanceDto[];
        error?: string;
      };
      const prof = (await profRes.json()) as {
        profile?: { financeCategories?: LmsFinanceCategory[] };
        error?: string;
      };
      if (!finRes.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setRows(data.transactions ?? []);
      if (prof.profile?.financeCategories?.length) {
        setCategories(prof.profile.financeCategories);
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const catsForTab = useMemo(
    () => categories.filter((c) => c.type === listTab),
    [categories, listTab],
  );

  const rangeBounds = useMemo(
    () => barberFinanceRangeBounds(financeRange, dateFrom, dateTo),
    [financeRange, dateFrom, dateTo],
  );

  const filtersActive =
    financeRange !== "MONTH" ||
    search.trim().length > 0 ||
    categoryFilter.length > 0 ||
    dateFrom !== `${todayKey.slice(0, 7)}-01` ||
    dateTo !== todayKey;

  const resetFilters = useCallback(() => {
    setFinanceRange("MONTH");
    setDateFrom(`${todayKey.slice(0, 7)}-01`);
    setDateTo(todayKey);
    setSearch("");
    setCategoryFilter("");
  }, [todayKey]);

  const rangedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const t = new Date(r.transactedAt).getTime();
      if (t < rangeBounds.start.getTime() || t >= rangeBounds.end.getTime()) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [r.category, r.note, LMS_FINANCE_TYPE_LABELS[r.type]].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, rangeBounds, search, categoryFilter]);

  const periodIncome = useMemo(
    () => rangedRows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountBaht, 0),
    [rangedRows],
  );
  const periodExpense = useMemo(
    () => rangedRows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountBaht, 0),
    [rangedRows],
  );
  const net = periodIncome - periodExpense;

  const visibleRows = useMemo(
    () => rangedRows.filter((r) => r.type === listTab),
    [rangedRows, listTab],
  );

  const chartBuckets = useMemo(() => {
    const byDay = new Map<string, { income: number; expense: number }>();
    for (const r of rangedRows) {
      const k = bangkokDateKey(new Date(r.transactedAt));
      const cur = byDay.get(k) ?? { income: 0, expense: 0 };
      if (r.type === "INCOME") cur.income += r.amountBaht;
      else cur.expense += r.amountBaht;
      byDay.set(k, cur);
    }
    const keys = Array.from(byDay.keys()).sort();
    const slice = keys.length > 36 ? keys.slice(-36) : keys;
    const maxVal = Math.max(
      1,
      ...slice.flatMap((k) => {
        const v = byDay.get(k)!;
        return [v.income, v.expense];
      }),
    );
    return slice.map((k) => {
      const v = byDay.get(k)!;
      return {
        key: k,
        label: k.slice(5),
        revenue: v.income,
        cost: v.expense,
        revenuePct: Math.round((v.income / maxVal) * 100),
        costPct: Math.round((v.expense / maxVal) * 100),
      };
    });
  }, [rangedRows]);

  const openCreate = (type: "INCOME" | "EXPENSE") => {
    const cats = categories.filter((c) => c.type === type);
    if (cats.length === 0) {
      setListTab(type);
      setCatsOpen(true);
      return;
    }
    setForm({
      id: "",
      type,
      category: cats[0]?.name ?? "",
      amountBaht: "",
      transactedAt: new Date().toISOString().slice(0, 16),
      note: "",
      slipUrl: null,
    });
    setListTab(type);
    setModalOpen(true);
  };

  const openEdit = (row: LmsFinanceDto) => {
    setForm({
      id: row.id,
      type: row.type,
      category: row.category,
      amountBaht: String(row.amountBaht),
      transactedAt: row.transactedAt.slice(0, 16),
      note: row.note,
      slipUrl: row.slipUrl,
    });
    setListTab(row.type);
    setModalOpen(true);
  };

  const saveCategories = async (next: LmsFinanceCategory[]) => {
    setCategories(next);
    const res = await fetch("/api/lms/session/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeCategories: next }),
    });
    const data = (await res.json()) as { error?: string; profile?: { financeCategories?: LmsFinanceCategory[] } };
    if (!res.ok) throw new Error(data.error ?? "บันทึกหมวดไม่สำเร็จ");
    if (data.profile?.financeCategories?.length) {
      setCategories(data.profile.financeCategories);
    }
  };

  const addCategory = async () => {
    const name = catName.trim();
    if (!name) return;
    try {
      const next = [...categories, { id: newCatId(), name: name.slice(0, 120), type: listTab }];
      await saveCategories(next);
      setCatName("");
      notice.success("เพิ่มหมวดแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    }
  };

  const removeCategory = async (id: string) => {
    const ok = await notice.confirm("ลบหมวดนี้ใช่หรือไม่?");
    if (!ok) return;
    try {
      await saveCategories(categories.filter((c) => c.id !== id));
      notice.success("ลบหมวดแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ");
    }
  };

  const uploadSlip = async (file: File) => {
    setPhotoBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/lms/session/images/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setForm((f) => ({ ...f, slipUrl: data.imageUrl! }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onGallery = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadSlip(file);
  };

  const save = async () => {
    const amountBaht = Number(form.amountBaht);
    if (!form.category.trim() || !Number.isFinite(amountBaht) || amountBaht <= 0) {
      notice.error("เลือกหมวดและกรอกจำนวนเงิน");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        amountBaht,
        transactedAt: new Date(form.transactedAt).toISOString(),
        note: form.note,
        slipUrl: form.slipUrl,
      };
      const res = await fetch(form.id ? `/api/lms/session/finance/${form.id}` : "/api/lms/session/finance", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setModalOpen(false);
      await load();
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await notice.confirm("ลบรายการนี้ใช่หรือไม่?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/lms/session/finance/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="min-w-0">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />

      <div className={lmsPanelClass}>
        <div className={lmsPanelSectionClass}>
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">การเงิน</h2>
            <div
              className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
              role="group"
              aria-label="เครื่องมือการเงิน"
            >
              <nav className={lmsInlineSubNavShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
                <button
                  type="button"
                  role="tab"
                  aria-selected={listTab === "INCOME"}
                  title="รายรับ"
                  aria-label="รายรับ"
                  className={lmsInlineSubNavBtnClass(listTab === "INCOME")}
                  onClick={() => {
                    setListTab("INCOME");
                    setCategoryFilter("");
                  }}
                >
                  <span className="hidden sm:inline">รายรับ</span>
                  <span className="sm:hidden" aria-hidden>
                    รับ
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={listTab === "EXPENSE"}
                  title="รายจ่าย"
                  aria-label="รายจ่าย"
                  className={lmsInlineSubNavBtnClass(listTab === "EXPENSE")}
                  onClick={() => {
                    setListTab("EXPENSE");
                    setCategoryFilter("");
                  }}
                >
                  <span className="hidden sm:inline">รายจ่าย</span>
                  <span className="sm:hidden" aria-hidden>
                    จ่าย
                  </span>
                </button>
              </nav>

              <div className={lmsInlineSubNavShellClass}>
                <button
                  type="button"
                  className={lmsInlineSubNavBtnClass(false)}
                  title={listTab === "INCOME" ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
                  aria-label={listTab === "INCOME" ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
                  onClick={() => openCreate(listTab)}
                >
                  <IconPlus className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{listTab === "INCOME" ? "รายรับเพิ่ม" : "รายจ่ายเพิ่ม"}</span>
                </button>
              </div>

              <span className="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />

              <div className={lmsInlineSubNavShellClass}>
                <button
                  type="button"
                  className={lmsInlineSubNavBtnClass(catsOpen)}
                  title="จัดการหมวดหมู่"
                  aria-label="จัดการหมวดหมู่"
                  onClick={() => setCatsOpen(true)}
                >
                  <IconFolder className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">จัดการหมวด</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  aria-expanded={filterOpen}
                  aria-controls="lms-finance-filter-panel"
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  className={cn(
                    lmsInlineSubNavBtnClass(filterOpen),
                    "relative",
                    filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                  )}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  {filtersActive ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setChartsOpen((o) => !o)}
                  aria-expanded={chartsOpen}
                  aria-controls="lms-finance-charts"
                  aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                  title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                  className={lmsInlineSubNavBtnClass(chartsOpen)}
                >
                  <IconChart className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
                </button>
                <button
                  type="button"
                  className={lmsInlineSubNavBtnClass(false)}
                  onClick={() => void load()}
                  disabled={loading}
                  aria-label="รีเฟรชข้อมูลรายงาน"
                  title="รีเฟรช"
                  aria-busy={loading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", loading && "animate-spin")} aria-hidden />
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>
              </div>
            </div>
          </div>

          <ul className={cn(lmsFinanceStatsGridClass, "mt-4")} aria-label={`สรุปการเงิน ${rangeBounds.label}`}>
            <li className={cn(lmsStatInlineClass, "border-l-[3px] border-l-emerald-500")}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">รายรับ</p>
              <p className="text-lg font-black tabular-nums text-emerald-700 sm:text-xl">
                ฿{periodIncome.toLocaleString("th-TH")}
              </p>
            </li>
            <li className={cn(lmsStatInlineClass, "border-l-[3px] border-l-rose-500")}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600/80">รายจ่าย</p>
              <p className="text-lg font-black tabular-nums text-rose-600 sm:text-xl">
                ฿{periodExpense.toLocaleString("th-TH")}
              </p>
            </li>
            <li
              className={cn(
                lmsStatInlineClass,
                lmsFinanceStatTailClass,
                "border-l-[3px]",
                net >= 0 ? "border-l-slate-400" : "border-l-rose-500",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สุทธิ</p>
              <p
                className={cn(
                  "text-lg font-black tabular-nums sm:text-xl",
                  net >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
                )}
              >
                ฿{net.toLocaleString("th-TH")}
              </p>
            </li>
          </ul>

          <div
            id="lms-finance-filter-panel"
            className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
          >
            <div className="flex flex-wrap gap-2" role="group" aria-label="ช่วงเวลา">
              {(
                [
                  ["TODAY", "วันนี้"],
                  ["MONTH", "เดือนนี้"],
                  ["YEAR", "ปีนี้"],
                  ["CUSTOM", "กำหนดเอง"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={financeRange === key}
                  className={lmsFinanceRangeChipClass(financeRange === key)}
                  onClick={() => setFinanceRange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              {financeRange === "CUSTOM" ? (
                <>
                  <label className="min-w-0 flex-1 sm:max-w-[11rem]">
                    <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                    <input
                      type="date"
                      className={cn(lmsFieldClass, "mt-1")}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </label>
                  <label className="min-w-0 flex-1 sm:max-w-[11rem]">
                    <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                    <input
                      type="date"
                      className={cn(lmsFieldClass, "mt-1")}
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </label>
                </>
              ) : null}
              <label className="min-w-0 flex-1 sm:max-w-[16rem]">
                <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                <input
                  className={cn(lmsFieldClass, "mt-1")}
                  placeholder="หมวด · หมายเหตุ…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {filtersActive ? (
                <button type="button" onClick={resetFilters} className={lmsOutlineButtonClass}>
                  รีเซ็ต · เดือนนี้
                </button>
              ) : null}
            </div>
            <div className={lmsFilterChipShellClass} role="tablist" aria-label="กรองตามหมวด">
              <button
                type="button"
                role="tab"
                aria-selected={!categoryFilter}
                className={lmsFilterChipClass(!categoryFilter)}
                onClick={() => setCategoryFilter("")}
              >
                ทั้งหมด
              </button>
              {catsForTab.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === c.name}
                  className={lmsFilterChipClass(categoryFilter === c.name)}
                  onClick={() => setCategoryFilter(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {rangeBounds.label}</p>
          </div>

          {chartsOpen ? (
            <div id="lms-finance-charts" className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 sm:p-4">
                <h3 className={cn(lmsSectionHeadingClass, "mb-2")}>แนวโน้มรายรับ–รายจ่าย</h3>
                <AppRevenueCostColumnChart
                  className="flex min-h-0 flex-1 flex-col"
                  compact
                  buckets={chartBuckets}
                  title=""
                  emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                  formatTitle={(b) =>
                    `${b.label}: รายรับ ฿${b.revenue.toLocaleString("th-TH")} · รายจ่าย ฿${b.cost.toLocaleString("th-TH")}`
                  }
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className={cn(lmsPanelSectionClass, lmsPanelDividerClass)}>
          {loading ? (
            <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : visibleRows.length === 0 ? (
            <AppEmptyState>
              {listTab === "INCOME"
                ? "ยังไม่มีรายรับในช่วงนี้ — กดรายรับเพิ่ม"
                : "ยังไม่มีรายจ่ายในช่วงนี้ — กดรายจ่ายเพิ่ม"}
            </AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-200/90 bg-white p-3 sm:p-4"
                >
                  {row.slipUrl ? (
                    <AppImageThumb
                      src={row.slipUrl}
                      alt="สลิป"
                      onOpen={() => lb.open(row.slipUrl!)}
                      className="h-14 w-14 shrink-0"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{row.category}</p>
                    <p className="text-xs text-[#66638c]">
                      {LMS_FINANCE_TYPE_LABELS[row.type]} · {formatBangkokDateTimeLong(row.transactedAt)}
                    </p>
                    {row.note ? <p className="mt-0.5 text-xs text-[#5f5a8a]">{row.note}</p> : null}
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-lg font-black tabular-nums",
                      row.type === "INCOME" ? "text-emerald-700" : "text-rose-600",
                    )}
                  >
                    ฿{row.amountBaht.toLocaleString()}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${row.category}`}
                      title="แก้ไข"
                      onClick={() => openEdit(row)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${row.category}`}
                      title="ลบ"
                      onClick={() => void remove(row.id)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "แก้ไขรายการ" : form.type === "INCOME" ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void save()}
            submitLabel="บันทึก"
            loading={saving}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">หมวดหมู่</span>
            <select
              className={lmsFieldClass}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">เลือกหมวด</option>
              {categories
                .filter((c) => c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              {form.category &&
              !categories.some((c) => c.type === form.type && c.name === form.category) ? (
                <option value={form.category}>{form.category} (เดิม)</option>
              ) : null}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">จำนวนเงิน (บาท)</span>
            <input
              className={lmsFieldClass}
              type="number"
              min={1}
              value={form.amountBaht}
              onChange={(e) => setForm((f) => ({ ...f, amountBaht: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">วันเวลา</span>
            <input
              className={lmsFieldClass}
              type="datetime-local"
              value={form.transactedAt}
              onChange={(e) => setForm((f) => ({ ...f, transactedAt: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>
            <textarea
              className={lmsTextareaClass}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#4d47b6]">สลิป (ไม่บังคับ)</p>
            {form.slipUrl ? (
              <div className="flex items-center gap-2">
                <AppImageThumb src={form.slipUrl} alt="สลิป" onOpen={() => lb.open(form.slipUrl!)} />
                <button
                  type="button"
                  className={lmsOutlineButtonClass}
                  onClick={() => setForm((f) => ({ ...f, slipUrl: null }))}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onGallery(e)}
            />
            <div className="flex flex-wrap gap-2">
              <AppPickGalleryImageButton disabled={photoBusy} onClick={() => galleryInputRef.current?.click()} />
              <AppTakePhotoButton disabled={photoBusy} onClick={() => setCameraOpen(true)} />
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={catsOpen}
        onClose={() => {
          setCatsOpen(false);
          setCatName("");
        }}
        title={`จัดการหมวด · ${LMS_FINANCE_TYPE_LABELS[listTab]}`}
        size="md"
        mobileCentered
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className={lmsFieldClass}
              placeholder="ชื่อหมวดใหม่"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button type="button" className={lmsPrimaryButtonClass} onClick={() => void addCategory()}>
              เพิ่ม
            </button>
          </div>
          {catsForTab.length === 0 ? (
            <AppEmptyState>ยังไม่มีหมวด — เพิ่มก่อนบันทึกรายการ</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {catsForTab.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white p-3"
                >
                  <p className="min-w-0 font-bold text-[#1e1b4b]">{c.name}</p>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    title="ลบ"
                    onClick={() => void removeCategory(c.id)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={cn(lmsOutlineButtonClass, "w-full")}
            onClick={() => {
              setCatsOpen(false);
              openCreate(listTab);
            }}
          >
            ปิดแล้วเพิ่มรายการ
          </button>
        </div>
      </FormModal>

      <AppCameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false);
          void uploadSlip(file);
        }}
      />
    </div>
  );
}
