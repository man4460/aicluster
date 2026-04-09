"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageCard, villageField, villageTableWrap, villageToolbar } from "@/systems/village/village-ui";

type MonthRow = { year_month: string; house_rows: number; total_due: number; total_paid: number };

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

  const maxBar = Math.max(1, ...rows.map((m) => Math.max(m.total_due, m.total_paid)));

  return (
    <div className="space-y-8">
      <PageHeader title="สรุป 12 เดือน" description="ยอดรวมต่อเดือน กราฟ และดาวน์โหลด CSV — ปีตามปฏิทิน (กรุงเทพ)" />
      <div className={villageToolbar}>
        <label className="text-sm font-medium text-slate-700">
          ปี (ค.ศ.)
          <input
            type="number"
            min={2000}
            max={2100}
            className={`mt-1.5 w-28 text-center font-semibold tabular-nums ${villageField}`}
            value={year}
            onChange={(e) => setYear(Number.parseInt(e.target.value, 10) || year)}
          />
        </label>
        <a href={api.exportUrl("annual_summary", year)} className={villageBtnPrimary}>
          ดาวน์โหลด CSV
        </a>
        <Link href="/dashboard/village/reports" className={villageBtnSecondary}>
          ส่งออกอื่น ๆ
        </Link>
      </div>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      <div className={`${villageCard} p-5`}>
        <h3 className="text-base font-semibold tracking-tight text-slate-900">กราฟรายเดือน</h3>
        <p className="mt-1 text-xs text-slate-500">แท่งเทา = เรียกเก็บ · เขียว = รับแล้ว (สเกลตามเดือนสูงสุดในปี)</p>
        <div className="mt-4 flex h-36 items-end gap-1 border-b border-slate-100 pb-8">
          {rows.map((m) => {
            const hDue = Math.round((m.total_due / maxBar) * 100);
            const hPaid = Math.round((m.total_paid / maxBar) * 100);
            return (
              <div key={m.year_month} className="flex min-w-0 flex-1 flex-col items-center justify-end" title={`${m.year_month}: ${m.total_paid.toLocaleString("th-TH")} / ${m.total_due.toLocaleString("th-TH")}`}>
                <div className="flex h-28 w-full max-w-[18px] items-end justify-center gap-px">
                  <div className="w-1/2 rounded-t bg-slate-200" style={{ height: `${hDue}%`, minHeight: m.total_due > 0 ? 2 : 0 }} />
                  <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${hPaid}%`, minHeight: m.total_paid > 0 ? 2 : 0 }} />
                </div>
                <span className="mt-1 text-[9px] text-slate-400">{m.year_month.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={villageTableWrap}>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/90 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2">เดือน</th>
              <th className="px-3 py-2">จำนวนแถวบิล</th>
              <th className="px-3 py-2">รวมเรียกเก็บ</th>
              <th className="px-3 py-2">รวมรับแล้ว</th>
              <th className="px-3 py-2">% เก็บได้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const pct = m.total_due > 0 ? Math.round(Math.min(100, (m.total_paid / m.total_due) * 100)) : "—";
              return (
                <tr key={m.year_month} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono">{m.year_month}</td>
                  <td className="px-3 py-2">{m.house_rows}</td>
                  <td className="px-3 py-2">{m.total_due.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2">{m.total_paid.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-2">{typeof pct === "number" ? `${pct}%` : pct}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-medium">
              <td className="px-3 py-2">รวมทั้งปี</td>
              <td className="px-3 py-2">{totals.rows}</td>
              <td className="px-3 py-2">{totals.due.toLocaleString("th-TH")}</td>
              <td className="px-3 py-2">{totals.paid.toLocaleString("th-TH")}</td>
              <td className="px-3 py-2">
                {totals.due > 0 ? `${Math.round(Math.min(100, (totals.paid / totals.due) * 100))}%` : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
