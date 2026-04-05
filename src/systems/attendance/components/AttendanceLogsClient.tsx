"use client";

import { AppImageLightbox, AppImageThumb, useAppImageLightbox } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  attendanceCardClass,
  attendanceEmptyStateLargeClass,
  attendanceFilterBarClass,
  attendanceLabelClass,
  attendanceSecondaryBtnClass,
} from "@/systems/attendance/attendance-ui";
import { useCallback, useEffect, useState } from "react";

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

export function AttendanceLogsClient() {
  const imageLightbox = useAppImageLightbox();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  });
  const [to, setTo] = useState(() => bangkokDateKey());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
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
    void load();
  }, [load]);

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

  return (
    <div className="space-y-4">
      {loadErr ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{loadErr}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <label className="text-xs font-semibold text-slate-700 lg:col-span-2">
          จาก
          <input
            type="date"
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm touch-manipulation sm:min-h-0"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className={cn(attendanceLabelClass, "lg:col-span-2")}>
          ถึง
          <input
            type="date"
            className="mt-1 min-h-[44px] w-full rounded-xl border border-[#e1e3ff] bg-white px-3 py-2 text-sm touch-manipulation sm:min-h-0"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">
          ค้นหา
          <input
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm touch-manipulation sm:min-h-0"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="เบอร์ / ชื่อ / ยูสเซอร์"
          />
        </label>
        <label className={cn(attendanceLabelClass, "sm:col-span-2 lg:col-span-2")}>
          กลุ่ม
          <select
            className="mt-1 min-h-[44px] w-full rounded-xl border border-[#e1e3ff] bg-white px-3 py-2 text-sm touch-manipulation sm:min-h-0"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="platform">พนักงาน (แอป)</option>
            <option value="roster_staff">พนักงาน (QR)</option>
            <option value="external">บุคคลภายนอก</option>
            <option value="public_legacy">แขกเดิม (ไม่ระบุประเภท)</option>
          </select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:col-span-3 lg:justify-end">
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 touch-manipulation sm:w-auto sm:min-h-0"
          >
            ค้นหา
          </button>
          <a
            href={exportUrl()}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#0000BF] px-4 py-2.5 text-sm font-semibold text-[#0000BF] touch-manipulation sm:w-auto sm:min-h-0"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div>
        {loading ? (
          <p className={attendanceEmptyStateLargeClass}>กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <p className={attendanceEmptyStateLargeClass}>ไม่มีข้อมูล</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="รายการบันทึกเช็คอิน">
            {rows.map((r) => {
              const { title, subId } = logPrimaryLine(r);
              return (
                <li key={r.id} className={cn(attendanceCardClass, "p-3 sm:p-3.5")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-[#ecebff] px-2 py-0.5 text-[11px] font-semibold text-[#4d47b6]">
                        {visitorGroupLabel(r)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {statusTh[r.status] ?? r.status}
                      </span>
                      {r.lateCheckIn ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/60">
                          สาย
                        </span>
                      ) : null}
                      {r.earlyCheckOut ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/60">
                          ออกก่อน
                        </span>
                      ) : null}
                    </div>
                    {r.checkInFacePhotoUrl ? (
                      <AppImageThumb
                        src={r.checkInFacePhotoUrl}
                        alt="รูปเช็คเข้า"
                        onOpen={() => imageLightbox.open(r.checkInFacePhotoUrl!)}
                        className="ring-1 ring-[#e8e6fc]"
                      />
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-sm font-semibold leading-snug text-[#2e2a58]">
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
                        <span className="text-[#2e2a58]">{formatLogTime(r.checkInTime)}</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[#9b98c4]">ออก</span>{" "}
                        <span className="text-[#2e2a58]">{formatLogTime(r.checkOutTime)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-[#66638c]">อัปเดตอัตโนมัติทุก 15 วินาที</p>

      <AppImageLightbox src={imageLightbox.src} alt="รูปเช็คเข้า" onClose={imageLightbox.close} />
    </div>
  );
}
