"use client";

import {
  AppDashboardSection,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  attendanceCardClass,
  attendanceEmptyStateLargeClass,
  attendanceFilterBarClass,
  attendanceFilterChipClass,
  attendanceLabelClass,
  attendanceSecondaryBtnClass,
} from "@/systems/attendance/attendance-ui";
import { attendanceSectionRadiusClass } from "@/systems/attendance/lib/ui-tokens";
import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  guestPhone: string | null;
  guestName: string | null;
  publicVisitorKind: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateCheckIn: boolean;
  earlyCheckOut: boolean;
  checkInFacePhotoUrl: string | null;
};

function visitorGroupLabel(r: Row): string {
  if (r.actorUsername) return "พนักงาน (แอป)";
  if (r.publicVisitorKind === "ROSTER_STAFF") return "พนักงาน (QR)";
  if (r.publicVisitorKind === "EXTERNAL_GUEST") return "บุคคลภายนอก";
  if (r.guestPhone) return "แขก (ไม่ระบุประเภท)";
  return "—";
}

const statusTh: Record<string, string> = {
  AWAITING_CHECKOUT: "รอเช็คออก",
  ON_TIME: "ตรงเวลา",
  LATE: "มาสาย",
  EARLY_LEAVE: "ออกก่อนเวลา",
  LATE_AND_EARLY: "มาสาย+ออกก่อน",
};

function logPrimaryLine(r: Row): { title: string; subId: string } {
  const name = (r.guestName ?? r.actorFullName ?? "").trim();
  const id = r.guestPhone ?? r.actorUsername ?? "—";
  if (name) return { title: name, subId: id };
  return { title: id, subId: "" };
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

export function AttendanceLogsClient() {
  const imageLightbox = useAppImageLightbox();
  const [filterOpen, setFilterOpen] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const filtersActive = useMemo(() => Boolean(q.trim() || kind), [q, kind]);

  const load = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("from", from);
    sp.set("to", to);
    if (q.trim()) sp.set("q", q.trim());
    if (kind) sp.set("kind", kind);
    const res = await fetch(`/api/attendance/logs?${sp}`, { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { logs?: Row[]; error?: string };
    if (res.ok) {
      setLoadErr(null);
      setRows(j.logs ?? []);
    } else {
      setRows([]);
      setLoadErr(j.error ?? "โหลดบันทึกไม่สำเร็จ");
    }
    setLoading(false);
  }, [from, to, q, kind]);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setFrom(d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }));
    setTo(bangkokDateKey());
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    void load();
  }, [load, from, to]);

  useEffect(() => {
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  function exportUrl() {
    const sp = new URLSearchParams();
    sp.set("from", from);
    sp.set("to", to);
    if (q.trim()) sp.set("q", q.trim());
    if (kind) sp.set("kind", kind);
    return `/api/attendance/logs/export?${sp}`;
  }

  function formatLogTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  }

  function clearFilters() {
    setQ("");
    setKind("");
  }

  return (
    <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title="รายงานเช็คอิน"
        description="ค้นหาตามช่วงวันที่หรือคำค้น — ส่งออก CSV"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-controls="attendance-logs-filter-panel"
            aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
            title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
            className={cn(
              appTemplateOutlineButtonClass,
              "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 px-0 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
              filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
              filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
            )}
          >
            <IconFilter className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
            {filtersActive ? (
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                aria-hidden
              />
            ) : null}
          </button>
        }
      />

      {loadErr ? (
        <p className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">
          {loadErr}
        </p>
      ) : null}

      <div
        id="attendance-logs-filter-panel"
        className={cn("mt-3", filterOpen ? "block" : "hidden")}
      >
        <div className={attendanceFilterBarClass}>
          <label className={cn(attendanceLabelClass, "lg:col-span-2")}>
            จาก
            <input
              type="date"
              className="mt-1 min-h-[44px] w-full rounded-[1rem] border border-white/60 bg-white/80 px-3 py-2 text-sm touch-manipulation backdrop-blur-sm sm:min-h-0"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              suppressHydrationWarning
            />
          </label>
          <label className={cn(attendanceLabelClass, "lg:col-span-2")}>
            ถึง
            <input
              type="date"
              className="mt-1 min-h-[44px] w-full rounded-[1rem] border border-white/60 bg-white/80 px-3 py-2 text-sm touch-manipulation backdrop-blur-sm sm:min-h-0"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              suppressHydrationWarning
            />
          </label>
          <label className={cn(attendanceLabelClass, "sm:col-span-2 lg:col-span-3")}>
            ค้นหา
            <input
              className="mt-1 min-h-[44px] w-full rounded-[1rem] border border-white/60 bg-white/80 px-3 py-2 text-sm touch-manipulation backdrop-blur-sm sm:min-h-0"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="เบอร์ / ชื่อ / ยูสเซอร์"
              suppressHydrationWarning
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-5">
            <p className={attendanceLabelClass}>กลุ่ม</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="tablist" aria-label="กรองกลุ่มผู้เช็คชื่อ">
              {(
                [
                  { value: "", label: "ทั้งหมด" },
                  { value: "platform", label: "แอป" },
                  { value: "roster_staff", label: "QR" },
                  { value: "external", label: "ภายนอก" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={kind === opt.value}
                  className={attendanceFilterChipClass(kind === opt.value)}
                  onClick={() => setKind(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:col-span-12 lg:justify-end">
            {filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className={cn(attendanceSecondaryBtnClass, "w-full justify-center border-amber-200 bg-amber-50 text-amber-900 sm:w-auto")}
              >
                ล้างกรอง
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void load()}
              className={cn(attendanceSecondaryBtnClass, "w-full justify-center sm:w-auto")}
              suppressHydrationWarning
            >
              ค้นหา
            </button>
            <a
              href={from && to ? exportUrl() : "#"}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[1rem] border border-[#4d47b6]/30 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#4d47b6] touch-manipulation hover:bg-white sm:w-auto sm:min-h-0"
              aria-disabled={!from || !to}
              suppressHydrationWarning
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className={attendanceEmptyStateLargeClass}>กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <p className={attendanceEmptyStateLargeClass}>ไม่มีข้อมูล</p>
        ) : (
          <ul className="flex flex-col gap-2.5" aria-label="รายการบันทึกเช็คอิน">
            {rows.map((r) => {
              const { title, subId } = logPrimaryLine(r);
              return (
                <li key={r.id} className={attendanceCardClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-gradient-to-r from-[#ecebff] to-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-[#4d47b6]">
                        {visitorGroupLabel(r)}
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60">
                        {statusTh[r.status] ?? r.status}
                      </span>
                      {r.lateCheckIn ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 ring-1 ring-amber-200/60">
                          สาย
                        </span>
                      ) : null}
                      {r.earlyCheckOut ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 ring-1 ring-rose-200/60">
                          ออกก่อน
                        </span>
                      ) : null}
                    </div>
                    {r.checkInFacePhotoUrl ? (
                      <AppImageThumb
                        src={r.checkInFacePhotoUrl}
                        alt="รูปเช็คเข้า"
                        onOpen={() => imageLightbox.open(r.checkInFacePhotoUrl!)}
                        className="ring-1 ring-white/70"
                      />
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-sm font-bold leading-snug text-[#1e1b4b]">
                        <span className="break-words">{title}</span>
                        {subId ? (
                          <>
                            <span className="font-normal text-[#66638c]"> · </span>
                            <span className="break-all font-mono text-xs font-medium tabular-nums text-[#66638c]">
                              {subId}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="max-w-[48%] shrink-0 text-right text-[11px] leading-snug text-[#66638c] tabular-nums sm:max-w-[55%] sm:text-xs">
                      <div>
                        <span className="text-[#9b98c4]">เข้า</span>{" "}
                        <span className="font-semibold text-[#2e2a58]">{formatLogTime(r.checkInTime)}</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[#9b98c4]">ออก</span>{" "}
                        <span className="font-semibold text-[#2e2a58]">{formatLogTime(r.checkOutTime)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-[11px] font-medium text-[#66638c]">อัปเดตอัตโนมัติทุก 15 วินาที</p>

      <AppImageLightbox src={imageLightbox.src} alt="รูปเช็คเข้า" onClose={imageLightbox.close} />
    </AppDashboardSection>
  );
}
