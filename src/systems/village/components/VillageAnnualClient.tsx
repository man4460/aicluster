"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageField } from "@/systems/village/village-ui";
import { cn } from "@/lib/cn";

type MonthRow = { year_month: string; house_rows: number; total_due: number; total_paid: number };

const TH_MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

function sparkMonthLabel(ym: string) {
  const m = Number(ym.slice(5, 7));
  if (m >= 1 && m <= 12) return TH_MONTH_SHORT[m - 1];
  return ym.slice(5);
}

/** กราฟแท่งซ้อน — เทา = เรียกเก็บ, เขียว = รับแล้ว (สเกลตามเดือนที่เรียกสูงสุดในปี) */
function AnnualMonthBars({ data }: { data: { year_month: string; total_due: number; total_paid: number }[] }) {
  const n = data.length;
  const maxDue = Math.max(...data.map((d) => d.total_due), 1);
  const vbW = 520;
  const vbH = 220;
  const padL = 40;
  const padR = 14;
  const padT = 18;
  const padB = 44;
  const chartW = vbW - padL - padR;
  const chartH = vbH - padT - padB;
  const slot = n > 0 ? chartW / n : 1;
  const barW = Math.max(8, slot * 0.58);

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-[11px] leading-snug text-slate-500 sm:hidden">
        แตะค้างที่แท่งเพื่อดูยอด · เลื่อนซ้าย-ขวาได้ถ้าจอแคบ
      </p>
      <div
        className={cn(
          "w-[calc(100%+2rem)] max-w-none -mx-4 touch-pan-x sm:-mx-5 sm:w-[calc(100%+2.5rem)]",
          "overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          "[scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]",
        )}
      >
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block aspect-[520/220] w-full min-w-[340px] max-w-none sm:min-w-full"
          role="img"
          aria-label="กราฟสรุปรายเดือน แท่งเทาเรียกเก็บ แท่งเขียวรับแล้ว"
        >
          {[0, 0.5, 1].map((t) => {
            const y = padT + chartH * (1 - t);
            return (
              <line
                key={t}
                x1={padL}
                x2={vbW - padR}
                y1={y}
                y2={y}
                stroke="rgb(226 232 240)"
                strokeWidth="0.75"
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
            );
          })}
          <text x={padL - 6} y={padT + 5} fill="rgb(148 163 184)" fontSize={10} textAnchor="end">
            สูงสุด
          </text>
          <text x={padL - 6} y={padT + chartH + 4} fill="rgb(148 163 184)" fontSize={10} textAnchor="end">
            0
          </text>
          {data.map((d, i) => {
            const cx = padL + i * slot + slot / 2;
            const x = cx - barW / 2;
            const dueH = (d.total_due / maxDue) * chartH;
            const paidRatio = d.total_due > 0 ? Math.min(1, d.total_paid / d.total_due) : 0;
            const paidH = dueH * paidRatio;
            const baseY = padT + chartH;
            const pct = d.total_due > 0 ? Math.round(Math.min(100, (d.total_paid / d.total_due) * 100)) : 0;
            return (
              <g key={d.year_month}>
                <title>{`${d.year_month}: เรียก ${d.total_due.toLocaleString("th-TH")} บาท · รับ ${d.total_paid.toLocaleString("th-TH")} (${pct}%)`}</title>
                <rect x={x} y={baseY - dueH} width={barW} height={dueH} rx={4} className="fill-slate-200/95" />
                <rect x={x} y={baseY - paidH} width={barW} height={paidH} rx={4} className="fill-emerald-500" />
                <text x={cx} y={vbH - 8} fill="rgb(100 116 139)" fontSize={10} textAnchor="middle">
                  {sparkMonthLabel(d.year_month)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 sm:text-[13px]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-300" /> เรียกเก็บ
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-500" /> รับแล้ว
        </span>
      </div>
    </div>
  );
}

function monthPct(m: MonthRow) {
  if (m.total_due <= 0) return null;
  return Math.round(Math.min(100, (m.total_paid / m.total_due) * 100));
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
        const r = (await api.getSummary(year)) as { months: MonthRow[] };
        if (ok) setRows(r.months);
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
      }),
      { rows: 0, due: 0, paid: 0 },
    );
  }, [rows]);

  const chartPoints = useMemo(
    () => rows.map((m) => ({ year_month: m.year_month, total_due: m.total_due, total_paid: m.total_paid })),
    [rows],
  );

  const totalPct = totals.due > 0 ? Math.round(Math.min(100, (totals.paid / totals.due) * 100)) : null;

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
            <a href={api.exportUrl("annual_summary", year)} className={cn(villageBtnPrimary, "w-full justify-center sm:w-auto sm:min-w-[9rem]")}>
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
        title="กราฟรายเดือน"
        description="แท่งสูงตามยอดเรียกเก็บของเดือนนั้น · ส่วนเขียวคือยอดรับแล้ว (สเกลจากเดือนที่เรียกสูงสุดในปี)"
      >
        {chartPoints.length > 0 ? <AnnualMonthBars data={chartPoints} /> : (
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
        <div className="hidden md:block">
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
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-slate-800">{m.year_month}</td>
                      <td className="px-3 py-2 tabular-nums">{m.house_rows}</td>
                      <td className="px-3 py-2 tabular-nums">{m.total_due.toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-800/90">{m.total_paid.toLocaleString("th-TH")}</td>
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
        </div>

        <ul className="grid list-none gap-2 md:hidden">
          {rows.map((m) => {
            const p = monthPct(m);
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
              </div>
            </div>
          </li>
        </ul>
      </VillagePanelCard>
    </VillagePageStack>
  );
}
