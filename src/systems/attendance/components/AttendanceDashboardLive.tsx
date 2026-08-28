"use client";

import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import type { AttendanceDashboardStats } from "@/lib/attendance/dashboard-types";
import { AttendanceDashboardTodayBoard } from "@/systems/attendance/components/AttendanceDashboardTodayBoard";
import { useAttendanceDashboardLive } from "@/systems/attendance/hooks/useAttendanceDashboardLive";
import { attendanceSectionRadiusClass } from "@/systems/attendance/lib/ui-tokens";

export function AttendanceDashboardLive({ initialStats }: { initialStats: AttendanceDashboardStats }) {
  const { stats, rows, loading, loadErr } = useAttendanceDashboardLive(initialStats);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
        <AppSectionHeader tone="violet" title="สรุปวันนี้" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="เข้างานแล้ว" value={stats.checkedIn} accent="violet" />
          <StatCard label="มาสาย" value={stats.late} accent="amber" />
          <StatCard label="ยังเหลือ" value={stats.remaining} accent="slate" />
          <StatCard label="กำลังทำงาน" value={stats.stillWorking} accent="green" />
          <StatCard
            label="ออกงานแล้ว"
            value={stats.checkedOut}
            accent="indigo"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
        <AttendanceDashboardTodayBoard rows={rows} loading={loading} loadErr={loadErr} />
      </AppDashboardSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: number;
  accent: "violet" | "amber" | "slate" | "green" | "indigo";
  className?: string;
}) {
  const toneStyles = {
    violet:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
    amber:
      "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
    slate:
      "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
    green:
      "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
    indigo:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5",
        toneStyles[accent],
        className,
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{label}</p>
        <p
          className={cn(
            "mt-3 bg-clip-text text-transparent text-2xl font-black tabular-nums tracking-tight sm:text-3xl",
            appDashboardBrandGradientBarClass,
          )}
        >
          {value.toLocaleString("th-TH")}
        </p>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}
