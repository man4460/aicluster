"use client";

import { useMemo } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  attendanceCheckInMethodLabel,
  attendanceCheckOutMethodLabel,
  attendanceMethodChipClass,
} from "@/lib/attendance/log-channel";
import type { AttendanceDashboardLogRow } from "@/lib/attendance/dashboard-types";
import {
  attendanceDashboardTodayRowClass,
  attendanceDashboardTodayStatusChipClass,
  attendanceEmptyStateLargeClass,
} from "@/systems/attendance/attendance-ui";

function formatHm(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function primaryLine(r: AttendanceDashboardLogRow): { title: string; sub: string } {
  const name = (r.guestName ?? r.actorFullName ?? "").trim();
  const id = r.guestPhone ?? r.actorUsername ?? "";
  if (name) return { title: name, sub: id };
  return { title: id || "—", sub: "" };
}

function TodayColumn({
  title,
  emptyLabel,
  rows,
  timeKey,
  loading,
  onOpenPhoto,
}: {
  title: string;
  emptyLabel: string;
  rows: AttendanceDashboardLogRow[];
  timeKey: "checkInTime" | "checkOutTime";
  loading: boolean;
  onOpenPhoto: (url: string) => void;
}) {
  return (
    <div className="flex min-h-[12rem] min-w-0 flex-col rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/55 via-white/40 to-violet-50/25 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-4">
      <div className="min-w-0 border-b border-[#e8e6fc]/80 pb-3">
        <h3 className="text-sm font-black tracking-tight text-[#1e1b4b]">{title}</h3>
        <p className="mt-1 text-xs font-bold tabular-nums text-[#4d47b6]">
          {loading ? "…" : `${rows.length.toLocaleString("th-TH")} คน`}
        </p>
      </div>
      <div className="mt-3 min-h-0 flex-1">
        {loading ? (
          <p className={cn(attendanceEmptyStateLargeClass, "py-8 text-sm")}>กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <p className={cn(attendanceEmptyStateLargeClass, "py-8 text-sm")}>{emptyLabel}</p>
        ) : (
          <ul className="flex max-h-[min(52vh,28rem)] flex-col gap-1.5 overflow-y-auto pr-0.5" aria-label={title}>
            {rows.map((r) => {
              const { title: name, sub } = primaryLine(r);
              const time = formatHm(r[timeKey]);
              const method =
                timeKey === "checkInTime"
                  ? attendanceCheckInMethodLabel(r)
                  : attendanceCheckOutMethodLabel(r);
              const photoUrl = r.checkInFacePhotoUrl?.trim() || null;

              return (
                <li key={r.id} className={attendanceDashboardTodayRowClass}>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <AppImageThumb
                      src={photoUrl}
                      alt={`รูปเช็คอิน ${name}`}
                      className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16"
                      onOpen={() => photoUrl && onOpenPhoto(photoUrl)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-balance text-sm font-bold leading-snug text-[#2e2a58] line-clamp-2">
                          {name}
                        </p>
                        <p className="shrink-0 text-sm font-black tabular-nums text-[#4d47b6]">{time}</p>
                      </div>
                      {sub ? (
                        <p className="mt-0.5 truncate text-[11px] font-medium leading-normal text-[#66638c]" title={sub}>
                          {sub}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            attendanceDashboardTodayStatusChipClass,
                            attendanceMethodChipClass(method),
                          )}
                        >
                          {method}
                        </span>
                        {timeKey === "checkInTime" && r.lateCheckIn ? (
                          <span
                            className={cn(
                              attendanceDashboardTodayStatusChipClass,
                              "bg-amber-100 text-amber-900 ring-amber-200/60",
                            )}
                          >
                            สาย
                          </span>
                        ) : null}
                        {timeKey === "checkOutTime" && r.earlyCheckOut ? (
                          <span
                            className={cn(
                              attendanceDashboardTodayStatusChipClass,
                              "bg-rose-100 text-rose-800 ring-rose-200/60",
                            )}
                          >
                            ออกก่อน
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
      </div>
    </div>
  );
}

export function AttendanceDashboardTodayBoard({
  rows,
  loading,
  loadErr,
}: {
  rows: AttendanceDashboardLogRow[];
  loading: boolean;
  loadErr: string | null;
}) {
  const lb = useAppImageLightbox();

  const checkedInRows = useMemo(
    () =>
      [...rows]
        .filter((r) => r.checkInTime)
        .sort((a, b) => (b.checkInTime ?? "").localeCompare(a.checkInTime ?? "")),
    [rows],
  );

  const checkedOutRows = useMemo(
    () =>
      [...rows]
        .filter((r) => r.checkOutTime)
        .sort((a, b) => (b.checkOutTime ?? "").localeCompare(a.checkOutTime ?? "")),
    [rows],
  );

  return (
    <div className="space-y-3">
      {loadErr ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
          {loadErr}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayColumn
          title="เช็คเข้าวันนี้"
          emptyLabel="ยังไม่มีใครเช็คเข้าวันนี้"
          rows={checkedInRows}
          timeKey="checkInTime"
          loading={loading}
          onOpenPhoto={lb.open}
        />
        <TodayColumn
          title="เช็คออกวันนี้"
          emptyLabel="ยังไม่มีใครเช็คออกวันนี้"
          rows={checkedOutRows}
          timeKey="checkOutTime"
          loading={loading}
          onOpenPhoto={lb.open}
        />
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปเช็คอิน" />
    </div>
  );
}
