"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AppRevenueCostColumnChart,
  AppSparkChartPanel,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageField } from "@/systems/village/village-ui";

type MonthRow = {
  year_month: string;
  house_rows: number;
  total_due: number;
  total_paid: number;
  total_cost: number;
};

const TH_MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

function sparkMonthLabel(ym: string) {
  const m = Number(ym.slice(5, 7));
  if (m >= 1 && m <= 12) return TH_MONTH_SHORT[m - 1];
  return ym.slice(5);
}

function bucketLabel(ym: string) {
  const y = ym.slice(0, 4);
  const mi = Number(ym.slice(5, 7));
  const short = mi >= 1 && mi <= 12 ? TH_MONTH_SHORT[mi - 1] : ym.slice(5);
  return `${short} ${y}`;
}

function monthPct(m: MonthRow) {
  if (m.total_due <= 0) return null;
  return Math.round(Math.min(100, (m.total_paid / m.total_due) * 100));
}

function normalizeRow(r: {
  year_month: string;
  house_rows: number;
  total_due: number;
  total_paid: number;
  total_cost?: number;
}): MonthRow {
  return {
    year_month: r.year_month,
    house_rows: r.house_rows,
    total_due: r.total_due,
    total_paid: r.total_paid,
    total_cost: r.total_cost ?? 0,
  };
}

export function VillageAnnualClient({ initialYear }: { initialYear: number }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        const r = (await api.getSummary(year)) as {
          months: {
            year_month: string;
            house_rows: number;
            total_due: number;
            total_paid: number;
            total_cost?: number;
          }[];
        };
        if (ok) setRows((r.months ?? []).map(normalizeRow));
      } catch (e) {
        if (ok) setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      }
    })();
    return () => {
      ok = false;
    };
  }, [api, year]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, m) => ({
        rows: acc.rows + m.house_rows,
        due: acc.due + m.total_due,
        paid: acc.paid + m.total_paid,
        cost: acc.cost + m.total_cost,
      }),
      { rows: 0, due: 0, paid: 0, cost: 0 },
    );
  }, [rows]);

  const financeBuckets = useMemo((): AppRevenueCostBucket[] => {
    const maxVal = Math.max(1, ...rows.flatMap((m) => [m.total_paid, m.total_cost]));
    return rows.map((m) => ({
      key: m.year_month,
      label: bucketLabel(m.year_month),
      revenue: Math.round(m.total_paid),
      cost: m.total_cost,
      revenuePct: Math.round((m.total_paid / maxVal) * 100),
      costPct: Math.round((m.total_cost / maxVal) * 100),
    }));
  }, [rows]);

  const totalPct = totals.due > 0 ? Math.round(Math.min(100, (totals.paid / totals.due) * 100)) : null;
  const totalNet = totals.paid - totals.cost;

  return (
    <VillagePageStack>
      <VillagePanelCard title="ปีและส่งออก">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
            ปีปฏิทิน ค.ศ.
          </span>
          <span className="inline-flex items-center rounded-lg bg-indigo-50/90 px-2.5 py-1 text-[10px] font-semibold text-indigo-900/90 ring-1 ring-indigo-200/60">
            เวลาไทย (กรุงเทพ)
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-end sm:gap-3">
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6366f1]" aria-hidden />
              ปี (ค.ศ.)
            </span>
            <input
              type="number"
              min={2000}
              max={2100}
              className={`block w-full text-center text-sm font-bold tabular-nums ${villageField}`}
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value, 10) || year)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:gap-2">
            <a
              href={api.exportUrl("annual_summary", year)}
              className={cn(villageBtnPrimary, "w-full justify-center sm:w-auto sm:min-w-[9rem]")}
            >
              ดาวน์โหลด CSV
            </a>
            <Link
              href="/dashboard/village/reports"
              className={cn(villageBtnSecondary, "w-full justify-center text-center sm:w-auto sm:min-w-[9rem]")}
            >
              ส่งออกอื่น ๆ
            </Link>
          </div>
        </div>
      </VillagePanelCard>

      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      <VillagePanelCard
        title="รายได้ค่าส่วนกลาง เทียบรายจ่าย/ต้นทุน (รายเดือน)"
        description={
          <>
            รายได้ = ยอดรับแล้วของบิลในเดือนนั้น (งวดเดียวกับตารางด้านล่าง) · รายจ่ายจากเมนู{" "}
            <Link href="/dashboard/village/costs" className="font-semibold text-[#4338ca] underline-offset-2 hover:underline">
              ต้นทุน / รายจ่าย
            </Link>{" "}
            ตามวันจ่ายจริง (spentAt) ในปฏิทินไทย
          </>
        }
      >
        {rows.length > 0 ? (
          <>
            <AppSparkChartPanel className="w-full min-w-0">
              <AppRevenueCostColumnChart
                className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                compact
                title=""
                subtitle=""
                emptyText="ไม่มีข้อมูลในปีนี้"
                buckets={financeBuckets}
                formatTitle={(b) =>
                  `รายได้ ${formatDormAmountStable(b.revenue)} · รายจ่าย ${formatDormAmountStable(b.cost)}`
                }
              />
            </AppSparkChartPanel>
            <ul className="mt-4 grid list-none gap-2 md:hidden">
              {financeBuckets.map((b) => (
                <li
                  key={b.key}
                  className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-sm shadow-sm"
                >
                  <p className="font-semibold text-slate-900">{b.label}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    รายได้{" "}
                    <span className="font-semibold tabular-nums text-emerald-800">
                      {formatDormAmountStable(b.revenue)}
                    </span>
                    {" · "}รายจ่าย{" "}
                    <span className="font-semibold tabular-nums text-rose-800">
                      {formatDormAmountStable(b.cost)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800">
                    ดุล {formatDormAmountStable(b.revenue - b.cost)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200/90 md:block">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">เดือน (ปฏิทินไทย)</th>
                    <th className="px-3 py-2 text-right">รายได้ (รับแล้ว)</th>
                    <th className="px-3 py-2 text-right">รายจ่าย / ต้นทุน</th>
                    <th className="px-3 py-2 text-right">คงเหลือ (ดุล)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financeBuckets.map((b) => (
                    <tr key={b.key} className="bg-white/90">
                      <td className="px-3 py-2 font-medium text-slate-900">{b.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-800">
                        {formatDormAmountStable(b.revenue)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-800">
                        {formatDormAmountStable(b.cost)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right tabular-nums font-semibold",
                          b.revenue - b.cost >= 0 ? "text-slate-900" : "text-rose-700",
                        )}
                      >
                        {formatDormAmountStable(b.revenue - b.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">ไม่มีข้อมูล</p>
        )}
      </VillagePanelCard>

      <VillagePanelCard
        title="สรุปรายเดือน"
        description={
          <>
            ปี <span className="font-bold tabular-nums text-slate-800">{year}</span> ·{" "}
            <span className="tabular-nums">{rows.length}</span> เดือน
          </>
        }
      >
        <div className="hidden lg:block">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold tracking-wide text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2.5">เดือน</th>
                  <th className="whitespace-nowrap px-3 py-2.5">แถวบิล</th>
                  <th className="whitespace-nowrap px-3 py-2.5">เรียกเก็บ</th>
                  <th className="whitespace-nowrap px-3 py-2.5">รับแล้ว</th>
                  <th className="whitespace-nowrap px-3 py-2.5">รายจ่าย / ต้นทุน</th>
                  <th className="whitespace-nowrap px-3 py-2.5">ดุล</th>
                  <th className="whitespace-nowrap px-3 py-2.5">% เก็บได้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => {
                  const p = monthPct(m);
                  const net = m.total_paid - m.total_cost;
                  return (
                    <tr key={m.year_month} className="bg-white/80 text-[13px] hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-slate-800">
                        {m.year_month}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{m.house_rows}</td>
                      <td className="px-3 py-2 tabular-nums">{m.total_due.toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-800/90">
                        {m.total_paid.toLocaleString("th-TH")}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-rose-800/90">
                        {m.total_cost.toLocaleString("th-TH")}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 font-semibold tabular-nums",
                          net >= 0 ? "text-slate-900" : "text-rose-700",
                        )}
                      >
                        {net.toLocaleString("th-TH")}
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums">{p != null ? `${p}%` : "—"}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 text-[13px] font-bold">
                  <td className="px-3 py-2.5 text-slate-900">รวมทั้งปี</td>
                  <td className="px-3 py-2.5 tabular-nums">{totals.rows}</td>
                  <td className="px-3 py-2.5 tabular-nums">{totals.due.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2.5 tabular-nums text-emerald-900">{totals.paid.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2.5 tabular-nums text-rose-900">{totals.cost.toLocaleString("th-TH")}</td>
                  <td
                    className={cn(
                      "px-3 py-2.5 tabular-nums",
                      totalNet >= 0 ? "text-slate-900" : "text-rose-800",
                    )}
                  >
                    {totalNet.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{totalPct != null ? `${totalPct}%` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="hidden md:block lg:hidden">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold tracking-wide text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2.5">เดือน</th>
                  <th className="whitespace-nowrap px-3 py-2.5">แถวบิล</th>
                  <th className="whitespace-nowrap px-3 py-2.5">เรียกเก็บ</th>
                  <th className="whitespace-nowrap px-3 py-2.5">รับแล้ว</th>
                  <th className="whitespace-nowrap px-3 py-2.5">% เก็บได้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => {
                  const p = monthPct(m);
                  return (
                    <tr key={m.year_month} className="bg-white/80 text-[13px] hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-slate-800">
                        {m.year_month}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{m.house_rows}</td>
                      <td className="px-3 py-2 tabular-nums">{m.total_due.toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-800/90">
                        {m.total_paid.toLocaleString("th-TH")}
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums">{p != null ? `${p}%` : "—"}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 text-[13px] font-bold">
                  <td className="px-3 py-2.5 text-slate-900">รวมทั้งปี</td>
                  <td className="px-3 py-2.5 tabular-nums">{totals.rows}</td>
                  <td className="px-3 py-2.5 tabular-nums">{totals.due.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2.5 tabular-nums text-emerald-900">{totals.paid.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2.5 tabular-nums">{totalPct != null ? `${totalPct}%` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            รายจ่ายและดุล — ดูได้จากกราฟด้านบนหรือขยายหน้าจอให้กว้างขึ้น
          </p>
        </div>

        <ul className="grid list-none gap-2 md:hidden">
          {rows.map((m) => {
            const p = monthPct(m);
            const net = m.total_paid - m.total_cost;
            return (
              <li
                key={m.year_month}
                className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/95 p-2.5 shadow-sm ring-1 ring-slate-100/80"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400/85 via-violet-300/80 to-emerald-400/80"
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sparkMonthLabel(m.year_month)}</p>
                    <p className="font-mono text-[10px] font-semibold text-slate-500">{m.year_month}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
                    {m.house_rows} แถว
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400">เรียกเก็บ</span>
                    <p className="font-bold tabular-nums text-slate-900">{m.total_due.toLocaleString("th-TH")}</p>
                  </div>
                  <div>
                    <span className="text-emerald-700/80">รับแล้ว</span>
                    <p className="font-bold tabular-nums text-emerald-900">{m.total_paid.toLocaleString("th-TH")}</p>
                  </div>
                  <div>
                    <span className="text-rose-700/80">รายจ่าย</span>
                    <p className="font-bold tabular-nums text-rose-900">{m.total_cost.toLocaleString("th-TH")}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ดุล</span>
                    <p
                      className={cn(
                        "font-bold tabular-nums",
                        net >= 0 ? "text-slate-900" : "text-rose-700",
                      )}
                    >
                      {net.toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-slate-100/90 pt-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">% เก็บได้</span>
                    <span className="text-sm font-bold tabular-nums text-[#4338ca]">{p != null ? `${p}%` : "—"}</span>
                  </div>
                </div>
              </li>
            );
          })}
          <li className="rounded-2xl border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/90 to-white p-3 shadow-sm">
            <p className="text-xs font-bold text-indigo-950">รวมทั้งปี {year}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">แถวบิล</span>
                <p className="text-base font-bold tabular-nums">{totals.rows}</p>
              </div>
              <div>
                <span className="text-slate-500">% เก็บได้</span>
                <p className="text-base font-bold tabular-nums text-indigo-800">{totalPct != null ? `${totalPct}%` : "—"}</p>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-2 border-t border-indigo-100 pt-2">
                <div>
                  <span className="text-slate-500">เรียกเก็บ</span>
                  <p className="font-bold tabular-nums">{totals.due.toLocaleString("th-TH")}</p>
                </div>
                <div>
                  <span className="text-emerald-800/80">รับแล้ว</span>
                  <p className="font-bold tabular-nums text-emerald-900">{totals.paid.toLocaleString("th-TH")}</p>
                </div>
                <div>
                  <span className="text-rose-800/80">รายจ่าย</span>
                  <p className="font-bold tabular-nums text-rose-900">{totals.cost.toLocaleString("th-TH")}</p>
                </div>
                <div>
                  <span className="text-slate-600">ดุล</span>
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      totalNet >= 0 ? "text-slate-900" : "text-rose-700",
                    )}
                  >
                    {totalNet.toLocaleString("th-TH")}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </VillagePanelCard>
    </VillagePageStack>
  );
}
