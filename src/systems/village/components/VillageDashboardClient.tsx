"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { VillagePageStack, VillagePanelCard, VillageStatTile } from "@/systems/village/components/VillagePageChrome";
import { createVillageSessionApiRepository, type VillageOverview } from "@/systems/village/village-service";
import { cn } from "@/lib/cn";

type SparkPoint = VillageOverview["twelve_month_sparkline"][number];

const TH_MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

function sparkMonthLabel(ym: string) {
  const m = Number(ym.slice(5, 7));
  if (m >= 1 && m <= 12) return TH_MONTH_SHORT[m - 1];
  return ym.slice(5);
}

/** โดนัต % เก็บได้เดือนนี้ */
function CollectionDonut({ percent }: { percent: number }) {
  const gradId = useId().replace(/:/g, "");
  const r = 38;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const dash = (p / 100) * c;
  const gap = c - dash;
  return (
    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center sm:h-36 sm:w-36">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(241 245 249)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{Math.round(p)}%</span>
        <span className="text-[10px] font-medium text-slate-500">เก็บได้</span>
      </div>
    </div>
  );
}

/** แท่งซ้อน: เทา = เรียกเก็บ, เขียว = รับแล้ว (ด้านล่าง) — เต็มความกว้างการ์ด, มือถือเลื่อนแนวนอนได้ */
function TwelveMonthBars({ data }: { data: SparkPoint[] }) {
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
          aria-label="กราฟค่าส่วนกลางรายเดือนทั้งปี แท่งเทาเรียกเก็บ แท่งเขียวรับแล้ว"
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
          <text
            x={padL - 6}
            y={padT + 5}
            fill="rgb(148 163 184)"
            fontSize={10}
            textAnchor="end"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            สูงสุด
          </text>
          <text
            x={padL - 6}
            y={padT + chartH + 4}
            fill="rgb(148 163 184)"
            fontSize={10}
            textAnchor="end"
          >
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
                <rect
                  x={x}
                  y={baseY - dueH}
                  width={barW}
                  height={dueH}
                  rx={4}
                  className="fill-slate-200/95"
                />
                <rect
                  x={x}
                  y={baseY - paidH}
                  width={barW}
                  height={paidH}
                  rx={4}
                  className="fill-emerald-500"
                />
                <text
                  x={cx}
                  y={vbH - 8}
                  fill="rgb(100 116 139)"
                  fontSize={10}
                  textAnchor="middle"
                >
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
    <VillagePageStack>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {data ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Link href="/dashboard/village/residents" className="block transition hover:opacity-95">
              <VillageStatTile title="บ้านที่ใช้งาน" value={`${data.active_houses} หลัง`} tone="blue" />
            </Link>
            <Link href="/dashboard/village/residents" className="block transition hover:opacity-95">
              <VillageStatTile title="ผู้พักในระบบ" value={`${data.resident_count} คน`} tone="slate" />
            </Link>
            <Link href="/dashboard/village/slips" className="block transition hover:opacity-95">
              <VillageStatTile
                title="สลิปรอตรวจ"
                value={String(data.pending_slips)}
                tone={data.pending_slips > 0 ? "amber" : "green"}
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <VillagePanelCard
              title={`ค่าส่วนกลาง ${data.current_year_month}`}
              description="ยอดเรียกเก็บ รับจริง และสัดส่วนเก็บได้ในเดือนนี้"
              action={
                <Link
                  href="/dashboard/village/fees"
                  className="text-xs font-semibold text-[#0000BF] hover:underline"
                >
                  จัดการบิล →
                </Link>
              }
            >
              <div className="flex w-full flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex justify-center sm:justify-start">
                  <CollectionDonut percent={data.month_collection_percent} />
                </div>
                <div className="grid w-full min-w-0 flex-1 grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-slate-500">เรียกเก็บ</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                      {data.month_total_due.toLocaleString("th-TH")} บาท
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-emerald-800/80">รับแล้ว</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-emerald-900">
                      {data.month_total_paid.toLocaleString("th-TH")} บาท
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                    <p className="text-[11px] font-medium text-slate-500">แถวบิล</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-slate-900">{data.month_fee_rows}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                    <p className="text-[11px] font-medium text-slate-500">ชำระครบ / ค้างบางส่วน</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                      {data.month_paid_houses} หลัง · {data.month_pending_or_partial_rows} แถว
                    </p>
                  </div>
                </div>
              </div>
            </VillagePanelCard>

            <VillagePanelCard
              title={`สะสมปี ${data.bangkok_year}`}
              description="ยอดตั้งแต่ต้นปีถึงปัจจุบัน"
              action={
                <Link
                  href="/dashboard/village/annual"
                  className="text-xs font-semibold text-[#0000BF] hover:underline"
                >
                  ดูรายละเอียด →
                </Link>
              }
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                    <span>เก็บได้ตามยอดเรียก</span>
                    <span className="font-semibold tabular-nums text-slate-900">{data.ytd_collection_percent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-[#0000BF]/80 to-[#4f6fff]",
                        "transition-[width] duration-500",
                      )}
                      style={{ width: `${Math.min(100, data.ytd_collection_percent)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500">เรียกเก็บรวม</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                      {data.ytd_total_due.toLocaleString("th-TH")} บาท
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">รับแล้ว</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">
                      {data.ytd_total_paid.toLocaleString("th-TH")} บาท
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  ชื่อโครงการ:{" "}
                  <span className="font-medium text-slate-700">
                    {data.village_name || "ยังไม่ตั้งชื่อ"}
                  </span>
                  · ครบกำหนดวันที่ {data.due_day_of_month} ของเดือน · ค่ามาตรฐาน{" "}
                  {data.default_monthly_fee.toLocaleString("th-TH")} บาท
                </p>
              </div>
            </VillagePanelCard>
          </div>

          <VillagePanelCard
            title={`กราฟรายเดือนทั้งปี ${data.bangkok_year}`}
            description="ม.ค. ถึง ธ.ค. ของปีนี้ — แต่ละแท่งสูงตามยอดเรียกเก็บของเดือนนั้น · ส่วนสีเขียวคือยอดที่รับแล้ว (เดือนที่ยังไม่มีบิลจะเป็นแท่งต่ำหรือว่าง)"
            action={
              <Link href="/dashboard/village/annual" className="text-xs font-semibold text-[#0000BF] hover:underline">
                หน้าสรุปรายปี →
              </Link>
            }
          >
            <TwelveMonthBars data={data.twelve_month_sparkline} />
          </VillagePanelCard>
        </>
      ) : !err ? (
        <VillagePanelCard>
          <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        </VillagePanelCard>
      ) : null}
    </VillagePageStack>
  );
}
