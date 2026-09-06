"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
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
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import {
  clubEventCardIconTileClass,
  clubEventCardToneClasses,
  clubEventTonedRowCardClass,
} from "@/systems/club-event/lib/card-tones";
import type { ClubEventFinanceDto, ClubFinanceCategory } from "@/systems/club-event/lib/mappers";
import {
  DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES,
  CLUB_EVENT_FINANCE_TYPE_LABELS,
} from "@/systems/club-event/lib/mappers";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import {
  clubEventFieldClass,
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
  clubEventFinanceChartPanelClass,
  clubEventFinanceRangeChipClass,
  clubEventFinanceStatsGridClass,
  clubEventFinanceStatTailClass,
  clubEventFixedBottomActionClass,
  clubEventIconButtonClass,
  clubEventInlineSubNavBtnClass,
  clubEventInlineSubNavShellClass,
  clubEventNavDividerClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventSectionHeadingClass,
  clubEventStatInlineClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";
import { ArrowDownLeft, ArrowUpRight, BarChart3, RefreshCw, Scale, Wallet } from "lucide-react";

type FinanceRange = BarberFinanceRange;

function inFinanceRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function financeRangeLabelTh(range: FinanceRange, from: string, to: string): string {
  if (range === "TODAY") return "วันนี้";
  if (range === "MONTH") return "เดือนนี้";
  if (range === "YEAR") return "ปีนี้";
  if (from && to && from !== to) return `${from} ถึง ${to}`;
  if (from || to) return `วันที่ ${from || to}`;
  return "กำหนดเอง";
}

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

export function ClubEventFinanceClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [listTab, setListTab] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const todayKey = bangkokDateKey();
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${todayKey.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(todayKey);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [rows, setRows] = useState<ClubEventFinanceDto[]>([]);
  const [categories, setCategories] = useState<ClubFinanceCategory[]>(DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [catName, setCatName] = useState("");
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
        fetch("/api/club-event/session/finance"),
        fetch("/api/club-event/session/profile"),
      ]);
      const fin = (await finRes.json()) as {
        transactions?: ClubEventFinanceDto[];
        error?: string;
      };
      const prof = (await profRes.json()) as {
        profile?: { financeCategories?: ClubFinanceCategory[] };
        error?: string;
      };
      if (!finRes.ok) throw new Error(fin.error ?? "โหลดไม่สำเร็จ");
      setRows(fin.transactions ?? []);
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

  const rangeBounds = useMemo(
    () => barberFinanceRangeBounds(financeRange, dateFrom, dateTo),
    [financeRange, dateFrom, dateTo],
  );

  const rangeLabel = useMemo(
    () =>
      financeRange === "CUSTOM"
        ? financeRangeLabelTh(financeRange, dateFrom, dateTo)
        : rangeBounds.label,
    [financeRange, dateFrom, dateTo, rangeBounds.label],
  );

  const filtersActive =
    financeRange !== "MONTH" || search.trim().length > 0 || categoryFilter !== "all";

  const resetFilters = () => {
    setFinanceRange("MONTH");
    setDateFrom(`${bangkokDateKey().slice(0, 7)}-01`);
    setDateTo(bangkokDateKey());
    setSearch("");
    setCategoryFilter("all");
  };

  const selectFinanceRange = (next: FinanceRange) => {
    setFinanceRange(next);
    if (next === "CUSTOM") {
      const today = bangkokDateKey();
      setDateFrom((prev) => prev || `${today.slice(0, 7)}-01`);
      setDateTo((prev) => prev || today);
    }
  };

  const catsForTab = useMemo(
    () => categories.filter((c) => c.type === listTab),
    [categories, listTab],
  );

  const periodRows = useMemo(
    () => rows.filter((r) => inFinanceRange(r.transactedAt, rangeBounds.start, rangeBounds.end)),
    [rows, rangeBounds.start, rangeBounds.end],
  );

  const summary = useMemo(() => {
    const income = periodRows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountBaht, 0);
    const expense = periodRows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountBaht, 0);
    return { income, expense, balance: income - expense };
  }, [periodRows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodRows.filter((r) => {
      if (r.type !== listTab) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.category.toLowerCase().includes(q) ||
        (r.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [periodRows, listTab, categoryFilter, search]);

  const revenueCostBuckets = useMemo((): AppRevenueCostBucket[] => {
    const map = new Map<string, { revenue: number; cost: number }>();
    for (const r of periodRows) {
      const day = bangkokDateKey(new Date(r.transactedAt));
      const cur = map.get(day) ?? { revenue: 0, cost: 0 };
      if (r.type === "INCOME") cur.revenue += r.amountBaht;
      else cur.cost += r.amountBaht;
      map.set(day, cur);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => {
        const parts = day.split("-").map(Number);
        return {
          key: day,
          label: `${parts[2] ?? 0}/${parts[1] ?? 0}`,
          revenue: v.revenue,
          cost: v.cost,
        };
      });
  }, [periodRows]);

  useEffect(() => {
    setCategoryFilter("all");
  }, [listTab]);

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

  const openEdit = (row: ClubEventFinanceDto) => {
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

  const saveCategories = async (next: ClubFinanceCategory[]) => {
    setCategories(next);
    const res = await fetch("/api/club-event/session/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeCategories: next }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "บันทึกหมวดไม่สำเร็จ");
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
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ");
    }
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
      const res = await fetch(
        form.id ? `/api/club-event/session/finance/${form.id}` : "/api/club-event/session/finance",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
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
      const res = await fetch(`/api/club-event/session/finance/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const uploadSlipFile = async (file: File) => {
    setPhotoBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const formData = new FormData();
      formData.set("file", prepared);
      const res = await fetch("/api/club-event/session/images/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setForm((f) => ({ ...f, slipUrl: data.imageUrl ?? null }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadSlipFile(f);
    e.target.value = "";
  };

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="การเงิน"
        titleIcon={clubEventPageTitleIcon("finance")}
        titleTone={clubEventPageTitleTone("finance")}
        subtitle={CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]}
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <nav className={clubEventInlineSubNavShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "INCOME"}
                className={clubEventInlineSubNavBtnClass(listTab === "INCOME")}
                onClick={() => setListTab("INCOME")}
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
                className={clubEventInlineSubNavBtnClass(listTab === "EXPENSE")}
                onClick={() => setListTab("EXPENSE")}
              >
                <span className="hidden sm:inline">รายจ่าย</span>
                <span className="sm:hidden" aria-hidden>
                  จ่าย
                </span>
              </button>
            </nav>
            <span className={clubEventNavDividerClass} aria-hidden />
            <div className={clubEventInlineSubNavShellClass}>
              <button
                type="button"
                className={clubEventInlineSubNavBtnClass(false)}
                title={listTab === "INCOME" ? "บันทึกรายรับเพิ่ม" : "บันทึกรายจ่าย"}
                aria-label={listTab === "INCOME" ? "บันทึกรายรับเพิ่ม" : "บันทึกรายจ่าย"}
                onClick={() => openCreate(listTab)}
              >
                <IconPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{listTab === "INCOME" ? "รายรับเพิ่ม" : "รายจ่ายเพิ่ม"}</span>
              </button>
            </div>
            <span className={clubEventNavDividerClass} aria-hidden />
            <div className={clubEventInlineSubNavShellClass}>
              <button
                type="button"
                className={clubEventInlineSubNavBtnClass(catsOpen)}
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
                aria-controls="club-event-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  clubEventInlineSubNavBtnClass(filterOpen),
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
                aria-controls="club-event-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={clubEventInlineSubNavBtnClass(chartsOpen)}
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
              </button>
              <button
                type="button"
                className={clubEventIconButtonClass}
                aria-label="รีเฟรชข้อมูลรายงาน"
                title="รีเฟรช"
                disabled={loading}
                aria-busy={loading}
                onClick={() => void load()}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
              </button>
            </div>
          </div>
        }
      >
        <ul className={cn(clubEventFinanceStatsGridClass, "mt-4")} aria-label={`สรุปการเงิน ${rangeLabel}`}>
          <li
            className={cn(
              clubEventStatInlineClass,
              "border-l-[3px] border-l-emerald-500 bg-emerald-50/60",
            )}
          >
            <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide", clubEventCardToneClasses("emerald").label)}>
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
              รายรับ
            </div>
            <p className="text-lg font-black tabular-nums text-emerald-700 sm:text-xl">
              ฿{summary.income.toLocaleString("th-TH")}
            </p>
          </li>
          <li
            className={cn(
              clubEventStatInlineClass,
              "border-l-[3px] border-l-rose-500 bg-rose-50/55",
            )}
          >
            <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide", clubEventCardToneClasses("rose").label)}>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              รายจ่าย
            </div>
            <p className="text-lg font-black tabular-nums text-rose-600 sm:text-xl">
              ฿{summary.expense.toLocaleString("th-TH")}
            </p>
          </li>
          <li
            className={cn(
              clubEventStatInlineClass,
              clubEventFinanceStatTailClass,
              "border-l-[3px]",
              summary.balance >= 0
                ? "border-l-indigo-500 bg-indigo-50/50"
                : "border-l-rose-500 bg-rose-50/55",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide",
                summary.balance >= 0 ? clubEventCardToneClasses("indigo").label : clubEventCardToneClasses("rose").label,
              )}
            >
              <Scale className="h-3.5 w-3.5" aria-hidden />
              คงเหลือ
            </div>
            <p
              className={cn(
                "text-lg font-black tabular-nums sm:text-xl",
                summary.balance >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
              )}
            >
              ฿{summary.balance.toLocaleString("th-TH")}
            </p>
          </li>
        </ul>

        <div
          id="club-event-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
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
                onClick={() => selectFinanceRange(key)}
                className={clubEventFinanceRangeChipClass(financeRange === key)}
                aria-pressed={financeRange === key}
              >
                {label}
              </button>
            ))}
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
                    className={cn(clubEventFieldClass, "mt-1")}
                  />
                </label>
                <label className="min-w-0 sm:w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="ถึงวันที่ กรุงเทพ"
                    className={cn(clubEventFieldClass, "mt-1")}
                  />
                </label>
              </>
            ) : null}
            <label className="min-w-0 flex-1 sm:min-w-[14rem]">
              <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="หมวด หรือ หมายเหตุ…"
                aria-label="ค้นหาหมวดหรือหมายเหตุ"
                inputMode="search"
                className={cn(clubEventFieldClass, "mt-1")}
              />
            </label>
            {filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className={clubEventOutlineButtonClass}
                aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
              >
                รีเซ็ต · เดือนนี้
              </button>
            ) : null}
          </div>
          <div className={clubEventFilterChipShellClass} role="tablist" aria-label="กรองหมวด">
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === "all"}
              className={clubEventFilterChipClass(categoryFilter === "all")}
              onClick={() => setCategoryFilter("all")}
            >
              ทั้งหมด · {visibleRows.length}/{periodRows.filter((r) => r.type === listTab).length}
            </button>
            {catsForTab.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={categoryFilter === c.name}
                className={clubEventFilterChipClass(categoryFilter === c.name)}
                onClick={() => setCategoryFilter(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {rangeLabel}</p>
        </div>

        {chartsOpen ? (
          <div id="club-event-finance-charts" className="mt-4 space-y-3">
            <div className={clubEventFinanceChartPanelClass}>
              <h3 className={cn(clubEventSectionHeadingClass, "mb-2")}>
                รายรับเทียบรายจ่าย · {rangeLabel}
              </h3>
              <AppRevenueCostColumnChart
                className="flex min-h-0 flex-1 flex-col"
                compact
                buckets={revenueCostBuckets}
                title=""
                emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                formatTitle={(b) =>
                  `${b.label}: รายรับ ฿${b.revenue.toLocaleString("th-TH")} · รายจ่าย ฿${b.cost.toLocaleString("th-TH")}`
                }
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-200/80 pt-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : visibleRows.length === 0 ? (
            <AppEmptyState>
              {periodRows.filter((r) => r.type === listTab).length === 0
                ? `ยังไม่มี${CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]}ในช่วงนี้ — กดปุ่มเพิ่มด้านบน`
                : "ไม่พบรายการที่ตรงการกรอง"}
            </AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map((row) => {
                const tone = row.type === "INCOME" ? "emerald" : "rose";
                return (
                  <li key={row.id} className={clubEventTonedRowCardClass(tone)}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {row.slipUrl ? (
                        <AppImageThumb src={row.slipUrl} alt="สลิป" onOpen={() => lb.open(row.slipUrl!)} />
                      ) : (
                        <span className={clubEventCardIconTileClass(tone, "lg")} aria-hidden>
                          {row.type === "INCOME" ? (
                            <ArrowDownLeft className="h-7 w-7" strokeWidth={2.1} />
                          ) : (
                            <Wallet className="h-7 w-7" strokeWidth={2.1} />
                          )}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#1e1b4b]">{row.category}</p>
                        <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(row.transactedAt)}</p>
                        {row.note ? <p className="text-xs text-[#5f5a8a]">{row.note}</p> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <p
                        className={cn(
                          "text-base font-black tabular-nums",
                          row.type === "INCOME" ? "text-emerald-700" : "text-rose-600",
                        )}
                      >
                        {row.type === "EXPENSE" ? "-" : "+"}
                        {row.amountBaht.toLocaleString("th-TH")} ฿
                      </p>
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${row.category}`}
                        onClick={() => openEdit(row)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${row.category}`}
                        onClick={() => void remove(row.id)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ClubEventPageSubNav>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? `แก้ไข${CLUB_EVENT_FINANCE_TYPE_LABELS[form.type]}` : `เพิ่ม${CLUB_EVENT_FINANCE_TYPE_LABELS[form.type]}`}
        mobileCentered
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button
              type="button"
              className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto sm:px-6")}
              disabled={saving}
              onClick={() => void save()}
            >
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">หมวดหมู่</span>
            <select
              className={clubEventFieldClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">เลือกหมวด</option>
              {categories
                .filter((c) => c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">จำนวนเงิน (บาท)</span>
            <input
              className={clubEventFieldClass}
              inputMode="numeric"
              value={form.amountBaht}
              onChange={(e) => setForm({ ...form, amountBaht: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">วันเวลา</span>
            <input
              type="datetime-local"
              className={clubEventFieldClass}
              value={form.transactedAt}
              onChange={(e) => setForm({ ...form, transactedAt: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">หมายเหตุ</span>
            <textarea
              className={clubEventTextareaClass}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>

          <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-emerald-50/40 p-4 shadow-sm ring-1 ring-violet-100/60">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/90">
                  แนบสลิป / บิล (ไม่บังคับ)
                </p>
                <p className="mt-0.5 text-xs text-slate-600">อัปโหลดหรือถ่ายรูป</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <AppPickGalleryImageButton
                  type="button"
                  disabled={photoBusy}
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
                  aria-label="อัปโหลดรูปสลิป"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </AppPickGalleryImageButton>
                <AppTakePhotoButton
                  type="button"
                  disabled={photoBusy}
                  onClick={() => setCameraOpen(true)}
                  className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
                  aria-label="ถ่ายรูปสลิป"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </AppTakePhotoButton>
              </div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileInputChange}
            />
            {photoBusy ? <p className="mt-2 text-xs font-medium text-violet-700">กำลังอัปโหลดรูป…</p> : null}
            {form.slipUrl ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3">
                <AppImageThumb src={form.slipUrl} alt="สลิปแนบ" onOpen={() => lb.open(form.slipUrl!)} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">แนบแล้ว</p>
                </div>
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => setForm((f) => ({ ...f, slipUrl: null }))}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  ลบรูป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={catsOpen}
        onClose={() => setCatsOpen(false)}
        title={`จัดการหมวด · ${CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]}`}
        mobileCentered
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className={clubEventFieldClass}
              placeholder="ชื่อหมวดใหม่"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button type="button" className={clubEventPrimaryButtonClass} onClick={() => void addCategory()}>
              เพิ่ม
            </button>
          </div>
          {catsForTab.length === 0 ? (
            <AppEmptyState>ยังไม่มีหมวด — เพิ่มก่อนบันทึกรายการ</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {catsForTab.map((c) => (
                <li key={c.id} className={cn(clubEventTonedRowCardClass(listTab === "INCOME" ? "emerald" : "rose"), "sm:items-center")}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={clubEventCardIconTileClass(listTab === "INCOME" ? "emerald" : "rose")}
                      aria-hidden
                    >
                      <Wallet className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <p className="font-bold text-[#1e1b4b]">{c.name}</p>
                  </div>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
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
            className={cn(clubEventOutlineButtonClass, "w-full")}
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
          void uploadSlipFile(file);
        }}
        onRequestLegacyPicker={() => galleryInputRef.current?.click()}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
