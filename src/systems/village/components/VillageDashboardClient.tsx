"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository, type VillageOverview } from "@/systems/village/village-service";

function Sparkline({ data }: { data: VillageOverview["twelve_month_sparkline"] }) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-1">
      <div className="flex h-28 min-w-[min(100%,520px)] items-end gap-1 px-1 pt-1 sm:min-w-0">
        {data.map((d) => {
          const pct = d.total_due > 0 ? Math.round(Math.min(100, (d.total_paid / d.total_due) * 100)) : 0;
          return (
            <div
              key={d.year_month}
              className="relative flex min-w-0 flex-1 flex-col items-center"
              title={`${d.year_month}: รับ ${d.total_paid.toLocaleString("th-TH")} / เรียก ${d.total_due.toLocaleString("th-TH")} (${pct}%)`}
            >
              <div className="relative mx-auto h-20 w-full max-w-[18px] rounded-t bg-slate-100 sm:max-w-[14px]">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t bg-emerald-500"
                  style={{ height: `${pct}%`, minHeight: pct > 0 ? 2 : 0 }}
                />
              </div>
              <span className="mt-1 truncate text-[9px] text-slate-400">{d.year_month.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cardLinkClass =
  "group block rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-sm transition hover:border-[#0000BF]/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 focus-visible:ring-offset-2 active:scale-[0.99] motion-reduce:active:scale-100";

function CardChevron() {
  return (
    <span
      className="shrink-0 text-lg font-light text-[#0000BF] opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100"
      aria-hidden
    >
      →
    </span>
  );
}

export function VillageDashboardClient() {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<VillageOverview | null>(null);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        const o = await api.getOverview();
        if (!ok) return;
        setData(o);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      }
    })();
    return () => {
      ok = false;
    };
  }, [api]);

  return (
    <div className="space-y-8">
      <PageHeader title="แดชบอร์ด" description="ภาพรวมและลิงก์ด่วน — เมนูด้านบนสลับหน้าโมดูล" />
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {data ? (
        <>
          <section aria-label="ตัวชี้วัดหลัก" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <Link href="/dashboard/village/settings" className={cardLinkClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">โครงการ</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">
                    {data.village_name || "ยังไม่ตั้งชื่อ — แตะเพื่อตั้งค่า"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    ครบกำหนดวันที่ {data.due_day_of_month} ของเดือน · ค่ามาตรฐาน {data.default_monthly_fee.toLocaleString("th-TH")}{" "}
                    บาท
                  </p>
                </div>
                <CardChevron />
              </div>
            </Link>

            <Link href="/dashboard/village/residents" className={cardLinkClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">บ้าน / ผู้พักอาศัย</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {data.active_houses} <span className="text-base font-normal text-slate-500">หลัง</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">ลูกบ้านในระบบ {data.resident_count} คน</p>
                </div>
                <CardChevron />
              </div>
            </Link>

            <Link href="/dashboard/village/slips" className={cardLinkClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">สลิปรอตรวจ</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{data.pending_slips}</p>
                  <p className="mt-1 text-sm text-slate-600">แตะเพื่อเปิดหน้าตรวจสลิป</p>
                </div>
                <CardChevron />
              </div>
            </Link>
          </section>

          <section aria-label="ค่าส่วนกลางเดือนนี้">
            <Link href="/dashboard/village/fees" className={cardLinkClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 className="text-sm font-semibold text-slate-900">ค่าส่วนกลาง {data.current_year_month}</h2>
                    <span className="text-xs text-slate-500">
                      เก็บได้ {data.month_collection_percent}% · ค้าง/บางส่วน {data.month_pending_or_partial_rows} แถว
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width]"
                      style={{ width: `${data.month_collection_percent}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-6">
                    <span className="text-slate-600">
                      แถวบิล <strong className="text-slate-900">{data.month_fee_rows}</strong>
                    </span>
                    <span className="text-slate-600">
                      เรียกเก็บ <strong className="text-slate-900">{data.month_total_due.toLocaleString("th-TH")}</strong> บาท
                    </span>
                    <span className="text-slate-600">
                      รับแล้ว <strong className="text-slate-900">{data.month_total_paid.toLocaleString("th-TH")}</strong> บาท
                    </span>
                    <span className="text-slate-600">
                      ชำระครบ <strong className="text-slate-900">{data.month_paid_houses}</strong> หลัง
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  <span className="text-sm font-medium text-[#0000BF]">จัดการบิล</span>
                  <CardChevron />
                </div>
              </div>
            </Link>
          </section>

          <section aria-label="ภาพรวมปี">
            <Link href="/dashboard/village/annual" className={cardLinkClass}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">สะสมปี {data.bangkok_year} และกราฟ 12 เดือน</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      เรียกเก็บรวม <strong>{data.ytd_total_due.toLocaleString("th-TH")}</strong> บาท · รับแล้ว{" "}
                      <strong>{data.ytd_total_paid.toLocaleString("th-TH")}</strong> บาท ({data.ytd_collection_percent}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#0000BF]">สรุปรายปี</span>
                    <CardChevron />
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0000BF]/70" style={{ width: `${data.ytd_collection_percent}%` }} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">แต่ละแท่ง = % เก็บได้ของเดือนนั้น (เลื่อนแนวนอนได้บนมือถือ)</p>
                  <div className="mt-3">
                    <Sparkline data={data.twelve_month_sparkline} />
                  </div>
                </div>
              </div>
            </Link>
          </section>

        </>
      ) : !err ? (
        <p className="text-sm text-slate-500">กำลังโหลด…</p>
      ) : null}
    </div>
  );
}
