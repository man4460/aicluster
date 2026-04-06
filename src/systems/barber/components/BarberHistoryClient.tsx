"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppColumnBarBucket, AppDualColumnBarBucket, AppRevenueCostBucket } from "@/components/app-templates";
import {
  AppIconPencil,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { daysInBangkokMonth } from "@/lib/barber/bangkok-day";
import { BarberDashboardCharts } from "@/systems/barber/components/BarberDashboardCharts";
import {
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberListRowCardClass,
  barberPageStackClass,
  barberSectionFirstClass,
  barberSectionNextClass,
} from "@/systems/barber/components/barber-ui-tokens";

/** เดือนเดี่ยว 1–12 หรือทุกเดือนในปีที่เลือก */
type MonthFilter = number | "all";

/** ทุกวันในเดือนที่เลือก หรือวันเดียว 1–31 (เวลาไทย) */
type DayFilter = number | "all";

type LogRow = {
  id: number;
  visitType: string;
  note: string | null;
  amountBaht: string | null;
  receiptImageUrl: string | null;
  createdAt: string;
  subscriptionId: number | null;
  stylistName: string | null;
  customer: { id: number; phone: string; name: string | null };
};

/** 12 เดือน — index 0 = ม.ค. */
const MONTH_LABELS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function bangkokCalendarParts(): { year: number; month: number; day: number } {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [y, m, d] = key.split("-").map((p) => Number(p));
  return { year: y, month: m, day: d };
}

function visitLabel(v: string) {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "เงินสด";
  return v;
}

function formatBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatBangkokShort(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ค่า `<input type="datetime-local" />` ตามเวลาไทย (ไม่มี DST) */
function isoToBangkokDatetimeLocal(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** แปลงค่าจาก datetime-local ที่แสดงเป็นเวลาไทย → ISO สำหรับ API */
function bangkokDatetimeLocalToIso(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return new Date(local).toISOString();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  return new Date(Date.UTC(y, mo - 1, da, hh - 7, mm, 0, 0)).toISOString();
}

export function BarberHistoryClient() {
  const pathname = usePathname();
  const receiptLightbox = useAppImageLightbox();
  const [year, setYear] = useState(() => bangkokCalendarParts().year);
  const [month, setMonth] = useState<MonthFilter>(() => bangkokCalendarParts().month);
  const [day, setDay] = useState<DayFilter>("all");
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    const { year: y } = bangkokCalendarParts();
    return [y];
  });
  const [draftQ, setDraftQ] = useState("");
  const [activeQ, setActiveQ] = useState("");

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sparkRevenueCost, setSparkRevenueCost] = useState<AppRevenueCostBucket[]>([]);
  const [sparkVisitDual, setSparkVisitDual] = useState<AppDualColumnBarBucket[]>([]);
  const [sparkPackageSales, setSparkPackageSales] = useState<AppColumnBarBucket[]>([]);
  const [sparkLoading, setSparkLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<LogRow | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCreatedLocal, setEditCreatedLocal] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editName, setEditName] = useState("");
  const [editReceiptRemoved, setEditReceiptRemoved] = useState(false);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [receiptPickUrl, setReceiptPickUrl] = useState<string | null>(null);
  const editReceiptInputRef = useRef<HTMLInputElement>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  /** เข้าหน้า — ค่าเริ่มต้น: ปีปัจจุบัน · เดือนปัจจุบัน · ทุกวันในเดือน (เวลาไทย) */
  useEffect(() => {
    if (pathname !== "/dashboard/barber/history") return;
    const { year: y, month: m } = bangkokCalendarParts();
    setYear(y);
    setMonth(m);
    setDay("all");
    setDraftQ("");
    setActiveQ("");
    setAvailableYears([y]);
  }, [pathname]);

  useEffect(() => {
    if (month === "all" || day === "all") return;
    const dim = daysInBangkokMonth(year, month);
    if (day > dim) setDay("all");
  }, [year, month, day]);

  useEffect(() => {
    if (availableYears.length === 0) return;
    const ys = availableYears.map((y) => Number(y));
    if (!ys.includes(year)) {
      setYear(ys[ys.length - 1]!);
    }
  }, [availableYears, year]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: month === "all" ? "all" : String(month),
      });
      if (month !== "all" && day !== "all") params.set("day", String(day));
      if (activeQ.length > 0) params.set("q", activeQ);
      const res = await fetch(`/api/barber/history?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        logs?: LogRow[];
        meta?: {
          availableYears?: unknown[];
          year?: number;
          month?: number | "all";
          day?: number | "all";
        };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setLogs([]);
        return;
      }
      setLogs(
        Array.isArray(data.logs)
          ? data.logs.map((l) => ({
              ...l,
              receiptImageUrl: l.receiptImageUrl ?? null,
            }))
          : [],
      );
      if (data.meta?.availableYears && data.meta.availableYears.length > 0) {
        const next = data.meta.availableYears
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x) && x >= 2000 && x <= 2100);
        setAvailableYears((prev) =>
          prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
        );
      }
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, day, activeQ]);

  const fetchSpark = useCallback(async () => {
    setSparkLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: month === "all" ? "all" : String(month),
      });
      if (month !== "all" && day !== "all") params.set("day", String(day));
      const res = await fetch(`/api/barber/history/spark?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        revenueCost?: AppRevenueCostBucket[];
        visitDual?: {
          key: string;
          label: string;
          packageUses: number;
          cashWalkIns: number;
          packageUsesPct: number;
          cashWalkInsPct: number;
        }[];
        packageSales?: AppColumnBarBucket[];
        error?: string;
      };
      if (!res.ok) {
        setSparkRevenueCost([]);
        setSparkVisitDual([]);
        setSparkPackageSales([]);
        return;
      }
      setSparkRevenueCost(Array.isArray(data.revenueCost) ? data.revenueCost : []);
      const vd = Array.isArray(data.visitDual) ? data.visitDual : [];
      setSparkVisitDual(
        vd.map((b) => ({
          key: b.key,
          label: b.label,
          seriesA: { amount: b.packageUses, pct: b.packageUsesPct },
          seriesB: { amount: b.cashWalkIns, pct: b.cashWalkInsPct },
        })),
      );
      setSparkPackageSales(Array.isArray(data.packageSales) ? data.packageSales : []);
    } catch {
      setSparkRevenueCost([]);
      setSparkVisitDual([]);
      setSparkPackageSales([]);
    } finally {
      setSparkLoading(false);
    }
  }, [year, month, day]);

  useEffect(() => {
    void fetchSpark();
  }, [fetchSpark]);

  function openEditModal(l: LogRow) {
    setEditErr(null);
    setEditTarget(l);
    setEditNote(l.note ?? "");
    setEditAmount(l.amountBaht != null ? String(l.amountBaht) : "");
    setEditCreatedLocal(isoToBangkokDatetimeLocal(l.createdAt));
    setEditPhone(l.customer.phone);
    setEditName(l.customer.name ?? "");
    setEditReceiptRemoved(false);
    setEditReceiptFile(null);
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditErr(null);
    setEditSaving(false);
    setEditReceiptRemoved(false);
    setEditReceiptFile(null);
  }

  useEffect(() => {
    if (!editReceiptFile) {
      setReceiptPickUrl(null);
      return;
    }
    const u = URL.createObjectURL(editReceiptFile);
    setReceiptPickUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [editReceiptFile]);

  useEffect(() => {
    if (!editTarget || receiptLightbox.src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [editTarget, receiptLightbox.src]);

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditErr(null);
    const digits = editPhone.replace(/\D/g, "").slice(0, 20);
    if (digits.length < 9) {
      setEditErr("เบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }

    const body: Record<string, unknown> = {
      note: editNote.trim() || null,
      createdAt: bangkokDatetimeLocalToIso(editCreatedLocal),
      customerPhone: digits,
      customerName: editName.trim() || null,
    };

    if (editTarget.visitType === "CASH_WALK_IN") {
      const t = editAmount.trim();
      if (t.length === 0) body.amountBaht = null;
      else {
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) {
          setEditErr("ยอดเงินไม่ถูกต้อง");
          return;
        }
        body.amountBaht = n;
      }
      if (editReceiptFile) {
        const fd = new FormData();
        fd.append("file", editReceiptFile);
        const up = await fetch("/api/barber/cash-receipt/upload", { method: "POST", body: fd });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setEditErr(upData.error ?? "อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setEditErr("อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        body.receiptImageUrl = upData.imageUrl;
      } else if (editReceiptRemoved) {
        body.receiptImageUrl = null;
      }
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/barber/history/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setEditErr(data.error ?? "แก้ไขไม่สำเร็จ");
        return;
      }
      closeEditModal();
      await fetchHistory();
      void fetchSpark();
    } finally {
      setEditSaving(false);
    }
  }

  async function removeLog(l: LogRow) {
    if (!confirm(`ลบประวัติรายการ #${l.id} ?`)) return;
    const res = await fetch(`/api/barber/history/${l.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await fetchHistory();
    void fetchSpark();
  }

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const { year: cy, month: cm, day: cd } = bangkokCalendarParts();
  const dayOptionsLen = month === "all" ? 0 : daysInBangkokMonth(year, month);

  const { periodTotalRevenue, periodTotalCost } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    for (const b of sparkRevenueCost) {
      rev += b.revenue;
      cost += b.cost;
    }
    return { periodTotalRevenue: rev, periodTotalCost: cost };
  }, [sparkRevenueCost]);

  function applyPresetToday() {
    setYear(cy);
    setMonth(cm);
    setDay(cd);
  }

  function applyPresetThisMonthAllDays() {
    setYear(cy);
    setMonth(cm);
    setDay("all");
  }

  function applyPresetThisYearAllMonths() {
    setYear(cy);
    setMonth("all");
    setDay("all");
  }

  return (
    <div className={barberPageStackClass}>
      <section className={barberSectionFirstClass} aria-label="กราฟตามช่วงเวลา">
        {sparkLoading ? (
          <p className="rounded-lg bg-[#f8f7ff] px-3 py-2 text-xs text-[#66638c]">กำลังโหลดกราฟ…</p>
        ) : (
          <div className="space-y-3">
            <AppRevenueCostColumnChart
              compact
              buckets={sparkRevenueCost}
              title="กราฟรายได้เทียบต้นทุน / รายจ่าย"
              emptyText="ไม่มีข้อมูลรายได้หรือต้นทุนในช่วงที่เลือก"
              formatTitle={(b) =>
                `${b.label}: รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
              }
            />
            <div className="flex flex-wrap gap-3 rounded-lg border border-[#ecebff] bg-[#faf9ff]/80 px-3 py-2 text-xs">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#66638c]">
                  รวมรายได้ (ช่วงที่กรอง)
                </p>
                <p className="text-sm font-bold tabular-nums text-[#2e2a58]">
                  ฿{periodTotalRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#66638c]">
                  รวมรายจ่าย / ต้นทุน
                </p>
                <p className="text-sm font-bold tabular-nums text-rose-700">
                  ฿{periodTotalCost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#66638c]">สุทธิ</p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-700" : "text-rose-800",
                  )}
                >
                  ฿{(periodTotalRevenue - periodTotalCost).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-[#5f5a8a]">
              <Link
                href="/dashboard/barber/costs"
                className="font-semibold text-[#4d47b6] underline decoration-[#4d47b6]/40 underline-offset-2 hover:decoration-[#4d47b6]"
              >
                บันทึกรายจ่าย / ต้นทุน
              </Link>
              <span className="text-[#66638c]"> — หมวดและสลิป</span>
            </p>
            <BarberDashboardCharts visitDualBuckets={sparkVisitDual} packageSalesBuckets={sparkPackageSales} />
          </div>
        )}
      </section>
      <section className={barberSectionNextClass} aria-label="กรองช่วงเวลา">
        <AppSectionHeader
          tone="violet"
          title="ช่วงเวลา"
          action={
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={applyPresetToday}
                className="rounded-full border border-[#d8d6ec] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#f6f5ff]"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={applyPresetThisMonthAllDays}
                className="rounded-full border border-[#d8d6ec] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#f6f5ff]"
              >
                เดือนนี้ (ทุกวัน)
              </button>
              <button
                type="button"
                onClick={applyPresetThisYearAllMonths}
                className="rounded-full border border-[#d8d6ec] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#f6f5ff]"
              >
                ปีนี้ (ทุกเดือน)
              </button>
            </div>
          }
        />
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#4d47b6]">
            ปี
            <select
              className="app-input min-h-[48px] rounded-xl px-3 text-base"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#4d47b6]">
            เดือน
            <select
              className="app-input min-h-[48px] rounded-xl px-3 text-base"
              value={month === "all" ? "all" : String(month)}
              onChange={(e) => {
                const v = e.target.value;
                setMonth(v === "all" ? "all" : Number(v));
                if (v === "all") setDay("all");
              }}
              aria-label="กรองตามเดือน หรือทุกเดือนในปี"
            >
              <option value="all">ทุกเดือนในปีนี้</option>
              {MONTH_NUMBERS.map((m) => (
                <option key={m} value={String(m)}>
                  {m} — {MONTH_LABELS_TH[m - 1]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#4d47b6]">
            วันที่
            <select
              className="app-input min-h-[48px] rounded-xl px-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
              disabled={month === "all"}
              value={month === "all" ? "all" : day === "all" ? "all" : String(day)}
              onChange={(e) => {
                const v = e.target.value;
                setDay(v === "all" ? "all" : Number(v));
              }}
              aria-label="กรองวันในปฏิทินไทย หรือทุกวันในเดือน"
            >
              <option value="all">ทุกวันในเดือน</option>
              {month !== "all"
                ? Array.from({ length: dayOptionsLen }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      {d}
                    </option>
                  ))
                : null}
            </select>
          </label>
        </div>

      <form
        className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveQ(draftQ.trim());
        }}
      >
        <input
          className="app-input min-h-[48px] min-w-0 flex-1 rounded-xl px-3 text-base placeholder:text-[#8b87ad]"
          placeholder="เบอร์หรือชื่อ (ว่าง = ทั้งหมด)"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="app-btn-primary min-h-[48px] w-full shrink-0 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
        >
          {loading ? "…" : "ค้นหา"}
        </button>
      </form>
      </section>

      {error ? <p className={barberInlineAlertErrorClass}>{error}</p> : null}

      {!loading && logs.length === 0 && !error ? (
        <section className={barberSectionNextClass} aria-label="ไม่มีรายการ">
          <p className="rounded-xl border border-dashed border-[#dcd8f0] py-10 text-center text-sm text-[#66638c]">
            ไม่มีรายการในช่วงนี้
          </p>
        </section>
      ) : null}

      {logs.length > 0 ? (
        <section className={barberSectionNextClass} aria-label="รายการยอดขาย">
          <div
            className="max-h-[min(65vh,32rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
            role="region"
            aria-label="รายการผู้มาใช้บริการ — เลื่อนดูเพิ่มเติม"
          >
            <ul className="space-y-2 pb-1">
              {logs.map((l) => {
                const isCash = l.visitType === "CASH_WALK_IN";
                const amt = isCash && l.amountBaht != null ? Number(l.amountBaht) : null;
                return (
                  <li
                    key={l.id}
                    className={cn(
                      barberListRowCardClass,
                      "flex min-w-0 gap-3 py-2.5 sm:items-start sm:gap-4",
                    )}
                  >
                    {l.receiptImageUrl ? (
                      <AppImageThumb
                        src={l.receiptImageUrl}
                        alt="สลิป"
                        onOpen={() => receiptLightbox.open(l.receiptImageUrl!)}
                        className="self-start rounded-lg border border-[#ecebff] bg-[#f8f7ff] ring-[#ecebff] hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold tabular-nums text-[#2e2a58]">
                          {l.customer.phone}
                        </span>
                        <span
                          className={
                            isCash
                              ? "shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-950"
                              : "shrink-0 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-900"
                          }
                        >
                          {visitLabel(l.visitType)}
                        </span>
                      </div>
                      {l.customer.name ? (
                        <p className="truncate text-xs text-[#5f5a8a]">{l.customer.name}</p>
                      ) : null}
                      <p className="text-[11px] leading-snug text-[#8b87ad]">
                        {formatBangkokShort(l.createdAt)}
                        {l.subscriptionId ? ` · #${l.subscriptionId}` : null}
                        {l.stylistName ? ` · ${l.stylistName}` : null}
                      </p>
                      {l.note ? (
                        <p className="line-clamp-2 text-xs leading-snug text-[#66638c]">{l.note}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 sm:min-w-[5.5rem]">
                      {isCash ? (
                        <p
                          className={cn(
                            "text-right text-lg font-bold tabular-nums leading-tight sm:text-xl",
                            amt != null ? "text-amber-900" : "text-[#b4b0ce]",
                          )}
                        >
                          {amt != null ? (
                            <>
                              ฿{formatBaht(amt)}
                              <span className="ml-0.5 text-[10px] font-semibold text-[#8b87ad]">บาท</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold">—</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-right text-xs font-semibold text-emerald-800">แพ็กเกจ</p>
                      )}
                      <div className={cn(barberIconToolbarGroupClass, "shrink-0")} role="group" aria-label="แก้ไขหรือลบ">
                        <AppIconToolbarButton title="แก้ไข" ariaLabel="แก้ไขรายการ" onClick={() => openEditModal(l)}>
                          <AppIconPencil className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                        <AppIconToolbarButton
                          title="ลบรายการ"
                          ariaLabel="ลบรายการ"
                          onClick={() => void removeLog(l)}
                          className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                        >
                          <AppIconTrash className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {editTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => closeEditModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-history-edit-title"
            className="max-h-[min(92vh,520px)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#ecebff] bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#ecebff] bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 id="barber-history-edit-title" className="text-base font-bold text-[#2e2a58] sm:text-lg">
                  แก้ไขรายการ
                </h2>
                <p className="mt-0.5 truncate text-xs text-[#66638c] tabular-nums">
                  รายการ #{editTarget.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeEditModal()}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-[#66638c] hover:bg-[#f4f3fb] hover:text-[#2e2a58]"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3 px-4 py-4 sm:px-5">
              {editErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เวลาทำรายการ (เวลาไทย)
                <input
                  type="datetime-local"
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editCreatedLocal}
                  onChange={(e) => setEditCreatedLocal(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เบอร์โทร
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-base tabular-nums"
                  inputMode="numeric"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อลูกค้า
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 100))}
                  placeholder="ไม่บังคับ"
                />
              </label>
              {editTarget.visitType === "CASH_WALK_IN" ? (
                <div className="rounded-xl border border-[#ecebff] bg-[#faf9ff] px-3 py-2.5">
                  <p className="text-xs font-semibold text-[#4d47b6]">รูปสลิป</p>
                  <input
                    ref={editReceiptInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f?.type.startsWith("image/")) return;
                      setEditReceiptRemoved(false);
                      setEditReceiptFile(f);
                    }}
                  />
                  {receiptPickUrl ? (
                    <button
                      type="button"
                      className="mt-2 block w-full cursor-zoom-in rounded-lg border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                      onClick={() => receiptLightbox.open(receiptPickUrl)}
                      aria-label="ดูรูปสลิปใหม่เต็มจอ"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptPickUrl}
                        alt="ตัวอย่างสลิปใหม่"
                        className="max-h-36 w-full rounded-lg border border-[#ecebff] object-contain"
                      />
                    </button>
                  ) : !editReceiptRemoved && editTarget.receiptImageUrl ? (
                    <button
                      type="button"
                      className="mt-2 block w-full cursor-zoom-in rounded-lg border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                      onClick={() => receiptLightbox.open(editTarget.receiptImageUrl!)}
                      aria-label="ดูรูปสลิปปัจจุบันเต็มจอ"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editTarget.receiptImageUrl}
                        alt="สลิปปัจจุบัน"
                        className="max-h-36 w-full rounded-lg border border-[#ecebff] object-contain"
                      />
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-[#8b87ad]">ยังไม่มีสลิป</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="app-btn-soft rounded-lg px-3 py-2 text-xs font-semibold text-[#2e2a58]"
                      onClick={() => editReceiptInputRef.current?.click()}
                    >
                      เลือกรูปใหม่
                    </button>
                    {(editTarget.receiptImageUrl || editReceiptFile) && !editReceiptRemoved ? (
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                        onClick={() => {
                          setEditReceiptFile(null);
                          setEditReceiptRemoved(true);
                        }}
                      >
                        ลบสลิป
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                หมายเหตุ
                <textarea
                  className="app-input mt-1 min-h-[72px] w-full resize-y rounded-xl px-3 py-2 text-sm"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value.slice(0, 255))}
                  placeholder="ไม่บังคับ"
                  rows={2}
                  maxLength={255}
                />
              </label>
              {editTarget.visitType === "CASH_WALK_IN" ? (
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ยอดเงินสด (บาท)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-base tabular-nums"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="เว้นว่างได้"
                  />
                </label>
              ) : (
                <p className="rounded-lg bg-[#f8f7ff] px-3 py-2 text-xs text-[#5f5a8a]">
                  รายการหักแพ็กเกจ — แก้เวลา เบอร์ ชื่อ หมายเหตุได้ (ไม่มีสลิป/ยอดเงิน)
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className="app-btn-soft min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-[#2e2a58]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="app-btn-primary min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {editSaving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AppImageLightbox
        src={receiptLightbox.src}
        onClose={receiptLightbox.close}
        alt="รูปสลิป"
      />
    </div>
  );
}
