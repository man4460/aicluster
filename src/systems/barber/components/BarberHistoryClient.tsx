"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** เดือนเดี่ยว 1–12 หรือทุกเดือนในปีที่เลือก */
type MonthFilter = number | "all";

type LogRow = {
  id: number;
  visitType: string;
  note: string | null;
  amountBaht: string | null;
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

function bangkokCalendarParts(): { year: number; month: number } {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [y, m] = key.split("-").map((p) => Number(p));
  return { year: y, month: m };
}

function visitLabel(v: string) {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "เงินสด";
  return v;
}

function formatBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function BarberHistoryClient() {
  const pathname = usePathname();
  const [year, setYear] = useState(() => bangkokCalendarParts().year);
  const [month, setMonth] = useState<MonthFilter>(() => bangkokCalendarParts().month);
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    const { year: y } = bangkokCalendarParts();
    return [y];
  });
  const [draftQ, setDraftQ] = useState("");
  const [activeQ, setActiveQ] = useState("");

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** ทุกครั้งที่เข้าหน้าประวัติ — ใช้เดือน/ปีปัจจุบัน (เวลาไทย) และล้างตัวกรองค้นหา */
  useEffect(() => {
    if (pathname !== "/dashboard/barber/history") return;
    const { year: y, month: m } = bangkokCalendarParts();
    setYear(y);
    setMonth(m);
    setDraftQ("");
    setActiveQ("");
    setAvailableYears([y]);
  }, [pathname]);

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
      if (activeQ.length > 0) params.set("q", activeQ);
      const res = await fetch(`/api/barber/history?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        logs?: LogRow[];
        meta?: {
          availableYears?: unknown[];
          year?: number;
          month?: number | "all";
        };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setLogs([]);
        return;
      }
      setLogs(Array.isArray(data.logs) ? data.logs : []);
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
  }, [year, month, activeQ]);

  async function editLog(l: LogRow) {
    const nextNote = prompt("หมายเหตุ", l.note ?? "") ?? "";
    const nextAmountRaw =
      l.visitType === "CASH_WALK_IN" ? prompt("ยอดเงินสด (เว้นว่างได้)", l.amountBaht ?? "") : null;
    const body: { note?: string | null; amountBaht?: number | null } = { note: nextNote.trim() || null };
    if (l.visitType === "CASH_WALK_IN" && nextAmountRaw != null) {
      const t = nextAmountRaw.trim();
      if (t.length === 0) body.amountBaht = null;
      else {
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) {
          setError("ยอดเงินไม่ถูกต้อง");
          return;
        }
        body.amountBaht = n;
      }
    }
    const res = await fetch(`/api/barber/history/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "แก้ไขไม่สำเร็จ");
      return;
    }
    await fetchHistory();
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
  }

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          ปี (จากข้อมูลในฐานข้อมูล)
          <select
            className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 text-base"
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
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          เดือน
          <select
            className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 text-base"
            value={month === "all" ? "all" : String(month)}
            onChange={(e) => {
              const v = e.target.value;
              setMonth(v === "all" ? "all" : Number(v));
            }}
            aria-label="กรองตามเดือน หรือทุกเดือนในปี"
          >
            <option value="all">ทุกเดือน (รวมทั้งปีที่เลือก)</option>
            {MONTH_NUMBERS.map((m) => (
              <option key={m} value={String(m)}>
                {m} — {MONTH_LABELS_TH[m - 1]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveQ(draftQ.trim());
        }}
      >
        <input
          className="min-h-[48px] flex-1 rounded-xl border border-slate-200 px-3 text-base"
          placeholder="กรองเพิ่ม: เบอร์หรือชื่อ (ว่าง = ทุกลูกค้าในช่วงที่เลือก)"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] rounded-xl bg-[#0000BF] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "ใช้ตัวกรองค้นหา"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && logs.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          ไม่พบรายการในช่วงที่เลือก
        </p>
      ) : null}

      {logs.length > 0 ? (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{l.customer.phone}</p>
                  {l.customer.name ? (
                    <p className="text-sm text-slate-600">{l.customer.name}</p>
                  ) : null}
                </div>
                <span
                  className={
                    l.visitType === "CASH_WALK_IN"
                      ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950"
                      : "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900"
                  }
                >
                  {visitLabel(l.visitType)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(l.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                {l.subscriptionId ? ` · สมาชิก #${l.subscriptionId}` : null}
                {l.stylistName ? ` · ช่าง: ${l.stylistName}` : null}
                {l.visitType === "CASH_WALK_IN" && l.amountBaht != null ? (
                  <span className="font-semibold text-amber-900">
                    {" "}
                    · {formatBaht(Number(l.amountBaht))} บาท
                  </span>
                ) : null}
              </p>
              {l.note ? <p className="mt-1 text-sm text-slate-600">{l.note}</p> : null}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void editLog(l)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800">แก้ไข</button>
                <button type="button" onClick={() => void removeLog(l)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700">ลบ</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
