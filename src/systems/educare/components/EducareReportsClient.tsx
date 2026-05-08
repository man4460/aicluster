"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  AppColumnBarSparkChart,
  AppCompareBarList,
  AppSparkChartPanel,
  AppSparkChartsTwoColumnGrid,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
  type AppCompareBarRow,
  type AppColumnBarBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { EDUCARE_FEATURES, EDUCARE_STATUS_LABEL } from "@/systems/educare/lib/educare-types";
import type { EducareCheckStatus } from "@/generated/prisma/enums";

type Classroom = { id: number; name: string };

type ReportPayload = {
  range: { from: string; to: string };
  totalRecords: number;
  byFeature: Record<string, Record<string, number>>;
  byDate: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }>;
};

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

const QUICK_RANGES = [
  { id: "7d", label: "7 วัน", days: 7 },
  { id: "30d", label: "30 วัน", days: 30 },
  { id: "90d", label: "90 วัน", days: 90 },
] as const;

export function EducareReportsClient() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState<number | "">("");
  const [from, setFrom] = useState<string>(() => shiftYmd(todayYmd(), -29));
  const [to, setTo] = useState<string>(() => todayYmd());
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClassrooms = useCallback(async () => {
    const res = await fetch("/api/educare/classrooms", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setClassrooms((j.classrooms ?? []).map((c: Classroom) => ({ id: c.id, name: c.name })));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to });
      if (classroomId !== "") params.set("classroomId", String(classroomId));
      const res = await fetch(`/api/educare/reports/overview?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "โหลดรายงานไม่สำเร็จ");
      }
      const j: ReportPayload = await res.json();
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [from, to, classroomId]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);
  useEffect(() => {
    void load();
  }, [load]);

  const useQuickRange = (days: number) => {
    const t = todayYmd();
    setTo(t);
    setFrom(shiftYmd(t, -(days - 1)));
  };

  const trendBuckets: AppColumnBarBucket[] = useMemo(() => {
    if (!data) return [];
    const max = data.byDate.reduce((m, d) => Math.max(m, d.present), 1);
    return data.byDate.map((d) => ({
      key: d.date,
      label: d.date.slice(5),
      amount: d.present,
      pct: max > 0 ? (d.present / max) * 100 : 0,
    }));
  }, [data]);

  const featureRows: AppCompareBarRow[] = useMemo(() => {
    if (!data) return [];
    return EDUCARE_FEATURES.map((f) => {
      const stats = data.byFeature[f.prismaKey] ?? {};
      const totalAll = Object.values(stats).reduce((sum, n) => sum + (n as number), 0);
      const positive = sumStatus(stats, ["PRESENT", "PASS", "DONE"]);
      const pct = totalAll > 0 ? Math.round((positive / totalAll) * 100) : 0;
      return {
        key: f.key,
        label: `${f.emoji} ${f.short}`,
        amount: pct,
        pct,
      };
    });
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push(`ช่วง,${data.range.from} ถึง ${data.range.to}`);
    if (classroomId !== "") {
      const c = classrooms.find((cr) => cr.id === classroomId);
      lines.push(`ห้อง,${c?.name ?? ""}`);
    }
    lines.push("");
    lines.push("# สรุปต่อฟีเจอร์");
    lines.push("ฟีเจอร์,สถานะ,จำนวน");
    for (const f of EDUCARE_FEATURES) {
      const stats = data.byFeature[f.prismaKey] ?? {};
      for (const [status, n] of Object.entries(stats)) {
        lines.push(`${f.label},${EDUCARE_STATUS_LABEL[status as EducareCheckStatus] ?? status},${n}`);
      }
    }
    lines.push("");
    lines.push("# เช็คเข้าแถวรายวัน");
    lines.push("วันที่,มาเรียน,มาสาย,ขาด,ลา");
    for (const d of data.byDate) {
      lines.push(`${d.date},${d.present},${d.late},${d.absent},${d.excused}`);
    }
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `educare-report-${data.range.from}_${data.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="รายงานสรุป"
          description="กรองช่วงเวลา/ห้องเรียน เพื่อเปรียบเทียบและส่งออก CSV"
          action={
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data || (data?.totalRecords ?? 0) === 0}
              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] px-3 py-2 text-sm disabled:opacity-50")}
            >
              ส่งออก CSV
            </button>
          }
        />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="จากวันที่">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value || shiftYmd(todayYmd(), -29))}
              className={inputCls}
            />
          </Field>
          <Field label="ถึงวันที่">
            <input
              type="date"
              value={to}
              min={from}
              max={todayYmd()}
              onChange={(e) => setTo(e.target.value || todayYmd())}
              className={inputCls}
            />
          </Field>
          <Field label="ห้องเรียน">
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            >
              <option value="">ทุกห้อง</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d47b6]/80">
              ลัด
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {QUICK_RANGES.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => useQuickRange(q.days)}
                    className="min-h-[36px] rounded-xl border border-white/60 bg-white/70 px-2.5 text-[11px] font-semibold text-[#4d47b6] hover:bg-white"
                  >
                    {q.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </AppDashboardSection>

      {loading ? (
        <AppDashboardSection tone="violet">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-32 w-full rounded-xl bg-slate-100" />
          </div>
        </AppDashboardSection>
      ) : !data || data.totalRecords === 0 ? (
        <AppDashboardSection tone="violet">
          <AppEmptyState tone="violet">
            ยังไม่มีข้อมูลในช่วงนี้ — ลองขยายช่วงวันหรือเปลี่ยนห้องเรียน
          </AppEmptyState>
        </AppDashboardSection>
      ) : (
        <>
          <AppSparkChartsTwoColumnGrid>
            <AppSparkChartPanel className="flex min-h-0 flex-col">
              <AppCompareBarList
                title="ความสำเร็จต่อฟีเจอร์ (%)"
                subtitle="คำนวณจากผลในช่วงที่เลือก — ค่าสูงคืองานที่ทำสม่ำเสมอ"
                rows={featureRows}
                emptyText="ยังไม่มีข้อมูล"
                formatAmount={(n) => `${n}%`}
                variant="brand"
              />
            </AppSparkChartPanel>
            <AppSparkChartPanel className="flex min-h-0 flex-col">
              <AppColumnBarSparkChart
                title="กราฟเช็คเข้าแถว (มาเรียน) รายวัน"
                subtitle={`${data.range.from} ถึง ${data.range.to}`}
                buckets={trendBuckets}
                emptyText="ยังไม่มีข้อมูล"
                variant="brand"
                compact={trendBuckets.length > 14}
                formatTitle={(b) => `${b.label}: ${b.amount} คน`}
                className="flex min-h-0 flex-1 flex-col"
              />
            </AppSparkChartPanel>
          </AppSparkChartsTwoColumnGrid>

          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="ตารางสรุปต่อฟีเจอร์"
              description="แสดงจำนวนสถานะต่อฟีเจอร์ในช่วงที่เลือก"
            />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#4d47b6]/80">
                    <th className="py-2 pr-3">ฟีเจอร์</th>
                    <th className="px-3">รวม</th>
                    <th className="px-3">บวก (+)</th>
                    <th className="px-3">เตือน</th>
                    <th className="px-3">ลบ (-)</th>
                    <th className="px-3">ไม่เกี่ยวข้อง</th>
                  </tr>
                </thead>
                <tbody>
                  {EDUCARE_FEATURES.map((f) => {
                    const stats = data.byFeature[f.prismaKey] ?? {};
                    const totalAll = Object.values(stats).reduce((s, n) => s + (n as number), 0);
                    const positive = sumStatus(stats, ["PRESENT", "PASS", "DONE"]);
                    const warning = sumStatus(stats, ["LATE", "PARTIAL", "EXCUSED"]);
                    const negative = sumStatus(stats, ["ABSENT", "FAIL", "NOT_DONE"]);
                    const na = sumStatus(stats, ["NA"]);
                    return (
                      <tr key={f.key} className={cn(appDashboardSectionSlateClass, "rounded-xl !py-2")}>
                        <td className="py-2.5 pr-3 font-semibold text-[#2e2a58]">
                          {f.emoji} {f.short}
                        </td>
                        <td className="px-3 text-[#66638c]">{totalAll.toLocaleString("th-TH")}</td>
                        <td className="px-3 text-emerald-700">{positive.toLocaleString("th-TH")}</td>
                        <td className="px-3 text-amber-700">{warning.toLocaleString("th-TH")}</td>
                        <td className="px-3 text-rose-700">{negative.toLocaleString("th-TH")}</td>
                        <td className="px-3 text-[#66638c]">{na.toLocaleString("th-TH")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-[#66638c]">
              รวมบันทึกในช่วง: {data.totalRecords.toLocaleString("th-TH")} รายการ
            </p>
          </AppDashboardSection>
        </>
      )}
    </div>
  );
}

function sumStatus(stats: Record<string, number>, keys: EducareCheckStatus[]) {
  return keys.reduce((sum, k) => sum + (stats[k] ?? 0), 0);
}

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] placeholder:text-[#a3a0c0] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d47b6]/80">
        {label}
      </span>
      {children}
    </label>
  );
}
