"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppRevenueCostColumnChart, AppSparkChartPanel, type AppRevenueCostBucket } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeStable, formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import { DormEmptyDashed, DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";

type Row = {
  id: number;
  amountToPay: number;
  paymentStatus: string;
  paidAt: string | null;
  receiptNumber: string | null;
  note: string | null;
  proofSlipUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: { id: number; name: string; phone: string };
  bill: {
    id: number;
    billingMonth: number;
    billingYear: number;
    room: { id: number; roomNumber: string };
  };
};

function statusTh(s: string) {
  if (s === "PENDING") return "ค้างชำระ";
  if (s === "PAID") return "ชำระแล้ว";
  if (s === "OVERDUE") return "เกินกำหนด";
  return s;
}

function PaymentHistoryRowActions({
  r,
  onEdit,
  onRemove,
}: {
  r: Row;
  onEdit: (row: Row) => void;
  onRemove: (row: Row) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {r.paymentStatus === "PAID" && r.receiptNumber ? (
        <Link
          href={`/dashboard/dormitory/receipt/${r.id}`}
          className="min-h-[40px] rounded-lg bg-[#ecebff] px-2.5 py-1.5 text-[11px] font-bold text-[#4338ca] ring-1 ring-[#4d47b6]/20 hover:bg-[#e0dcff] sm:min-h-0"
        >
          ใบเสร็จ
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => onEdit(r)}
        className="min-h-[40px] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#4338ca] hover:bg-slate-100 sm:min-h-0"
      >
        แก้ไข
      </button>
      <button
        type="button"
        onClick={() => onRemove(r)}
        className="min-h-[40px] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 sm:min-h-0"
      >
        ลบ
      </button>
    </div>
  );
}

const inputClz =
  "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#4d47b6]/40 focus:ring-2 focus:ring-[#4d47b6]/15 sm:min-h-0";

/** วันที่ปฏิทินในเขตเวลาไทย (YYYY-MM-DD) สำหรับเทียบกับ input type=date */
function bangkokCalendarDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** วันที่ 1 ถึงวันสุดท้ายของเดือนปัจจุบัน (เขตเวลาไทย) */
function bangkokCurrentMonthRange(): { from: string; to: string } {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [ys, ms] = ymd.split("-");
  const yi = parseInt(ys, 10);
  const mi = parseInt(ms, 10);
  const from = `${yi}-${String(mi).padStart(2, "0")}-01`;
  const lastDay = new Date(yi, mi, 0).getDate();
  const to = `${yi}-${String(mi).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function DormPaymentHistoryClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    amountToPay: "",
    note: "",
    paymentStatus: "PENDING" as "PENDING" | "PAID" | "OVERDUE",
    paidAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [financeBuckets, setFinanceBuckets] = useState<AppRevenueCostBucket[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeErr, setFinanceErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/dorm/payments/history", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { items?: Row[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setRows([]);
      return;
    }
    setRows(data.items ?? []);
  }, []);

  useEffect(() => {
    const r = bangkokCurrentMonthRange();
    setDateFrom(r.from);
    setDateTo(r.to);
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFinanceLoading(true);
      setFinanceErr(null);
      try {
        const q =
          dateFrom && dateTo ?
            `?from=${encodeURIComponent(dateFrom)}&to=${encodeURIComponent(dateTo)}`
          : "";
        const res = await fetch(`/api/dorm/finance/monthly-revenue-cost${q}`, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { buckets?: AppRevenueCostBucket[]; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setFinanceBuckets([]);
          setFinanceErr(data.error ?? "โหลดสรุปรายได้/รายจ่ายไม่สำเร็จ");
          return;
        }
        setFinanceBuckets(Array.isArray(data.buckets) ? data.buckets : []);
      } catch {
        if (!cancelled) {
          setFinanceBuckets([]);
          setFinanceErr("โหลดสรุปไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setFinanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = rows;

    if (dateFrom || dateTo) {
      list = list.filter((r) => {
        const day = bangkokCalendarDay(r.updatedAt);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      });
    }

    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (r) =>
        r.bill.room.roomNumber.toLowerCase().includes(t) ||
        r.tenant.name.toLowerCase().includes(t) ||
        r.tenant.phone.replace(/\D/g, "").includes(t.replace(/\D/g, "")) ||
        String(r.bill.billingMonth).includes(t) ||
        String(r.bill.billingYear).includes(t),
    );
  }, [rows, q, dateFrom, dateTo]);

  function openEdit(r: Row) {
    setEditing(r);
    setForm({
      amountToPay: String(r.amountToPay),
      note: r.note ?? "",
      paymentStatus: r.paymentStatus as "PENDING" | "PAID" | "OVERDUE",
      paidAt: r.paidAt ? r.paidAt.slice(0, 10) : "",
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const n = Number(form.amountToPay);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("จำนวนเงินไม่ถูกต้อง");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        amountToPay: n,
        note: form.note.trim() || null,
        paymentStatus: form.paymentStatus,
      };
      if (form.paymentStatus === "PAID" && form.paidAt) {
        body.paidAt = `${form.paidAt}T12:00:00+07:00`;
      }
      const res = await fetch(`/api/dorm/payments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(r: Row) {
    if (!confirm(`ลบรายการประวัติ #${r.id} (ห้อง ${r.bill.room.roomNumber}) ?`)) return;
    setErr(null);
    const res = await fetch(`/api/dorm/payments/${r.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
  }

  return (
    <DormPageStack>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      <DormPanelCard
        title="รายได้หอพัก เทียบรายจ่าย/ต้นทุน (รายเดือน)"
        description={
          <>
            รายได้นับจากรายการที่สถานะ «ชำระแล้ว» ตามวันที่ชำระ (paidAt) · รายจ่ายจากเมนู{" "}
            <Link href="/dashboard/dormitory/costs" className="font-semibold text-[#4338ca] underline-offset-2 hover:underline">
              ต้นทุน / รายจ่าย
            </Link>{" "}
            · ช่วงเวลาสอดคล้องกับการกรองวันที่ด้านล่าง (ถ้าไม่เลือกวันที่ แสดง 12 เดือนล่าสุด)
          </>
        }
      >
        {financeErr ? <p className="mb-3 text-sm text-amber-800">{financeErr}</p> : null}
        {financeLoading ? (
          <p className="text-center text-sm text-[#66638c]">กำลังโหลดกราฟสรุป…</p>
        ) : (
          <>
            <AppSparkChartPanel>
              <AppRevenueCostColumnChart
                className="min-w-0"
                compact
                title=""
                subtitle=""
                emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                buckets={financeBuckets}
                formatTitle={(b) =>
                  `รายได้ ${formatDormAmountStable(b.revenue)} · รายจ่าย ${formatDormAmountStable(b.cost)}`
                }
              />
            </AppSparkChartPanel>
            {financeBuckets.length > 0 ? (
              <>
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
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold text-slate-600">
                    <tr>
                      <th className="px-3 py-2">เดือน (ปฏิทินไทย)</th>
                      <th className="px-3 py-2 text-right">รายได้</th>
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
            ) : null}
          </>
        )}
      </DormPanelCard>

      <DormPanelCard
        title="ค้นหาและกรอง"
        description="กรองตามวันที่อัปเดตล่าสุด (เวลาไทย) — ค้นหาห้อง ชื่อ เบอร์ หรืองวด"
      >
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">ค้นหา</span>
          <input
            className={inputClz}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="เช่น 101 หรือ 08…"
          />
        </label>
        <div
          className={cn(
            "mt-3 grid grid-cols-1 gap-3 sm:items-end",
            dateFrom || dateTo ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2",
          )}
        >
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">อัปเดตตั้งแต่</span>
            <input type="date" className={inputClz} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">ถึง</span>
            <input type="date" className={inputClz} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          {dateFrom || dateTo ? (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className={cn(dormBtnSecondary, "w-full shrink-0 sm:w-auto")}
            >
              ล้างวันที่
            </button>
          ) : null}
        </div>
      </DormPanelCard>

      <DormPanelCard
        title="รายการ"
        description={
          loading ? (
            "กำลังโหลด…"
          ) : (
            <>
              <span className="tabular-nums font-semibold text-slate-700">{filtered.length}</span> รายการ
            </>
          )
        }
      >
        {loading ? (
          <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : filtered.length === 0 ? (
          <DormEmptyDashed>
            {rows.length === 0 ? "ยังไม่มีรายการประวัติการชำระ" : "ไม่พบรายการตามการค้นหาหรือช่วงวันที่"}
          </DormEmptyDashed>
        ) : (
          <>
            <ul className="grid list-none gap-2 md:hidden">
              {filtered.map((r) => (
                <li
                  key={r.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/95 p-3 shadow-sm ring-1 ring-slate-100/80"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400/85 via-violet-300/75 to-emerald-400/80"
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold tabular-nums text-slate-900">ห้อง {r.bill.room.roomNumber}</p>
                      <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">
                        งวด {r.bill.billingMonth}/{r.bill.billingYear}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {statusTh(r.paymentStatus)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-[13px]">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">ผู้พัก</p>
                      <p className="font-semibold text-slate-900">{r.tenant.name}</p>
                      <p className="text-[11px] text-slate-500">{r.tenant.phone}</p>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 border-t border-slate-100/90 pt-2">
                      <span className="text-[10px] text-slate-500">จำนวน</span>
                      <span className="text-base font-bold tabular-nums text-slate-900">
                        {formatDormAmountStable(r.amountToPay)} บาท
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">อัปเดต {formatBangkokDateTimeStable(r.updatedAt)}</p>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <PaymentHistoryRowActions r={r} onEdit={openEdit} onRemove={(row) => void removeRow(row)} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 md:block [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2.5">ห้อง</th>
                    <th className="whitespace-nowrap px-3 py-2.5">งวด</th>
                    <th className="whitespace-nowrap px-3 py-2.5">ผู้พัก</th>
                    <th className="whitespace-nowrap px-3 py-2.5">จำนวน</th>
                    <th className="whitespace-nowrap px-3 py-2.5">สถานะ</th>
                    <th className="whitespace-nowrap px-3 py-2.5">อัปเดต</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="bg-white/80 hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-semibold text-slate-900">{r.bill.room.roomNumber}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.bill.billingMonth}/{r.bill.billingYear}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.tenant.name}</div>
                        <div className="text-xs text-slate-500">{r.tenant.phone}</div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{formatDormAmountStable(r.amountToPay)}</td>
                      <td className="px-3 py-2 text-xs font-semibold">{statusTh(r.paymentStatus)}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{formatBangkokDateTimeStable(r.updatedAt)}</td>
                      <td className="px-3 py-2">
                        <PaymentHistoryRowActions r={r} onEdit={openEdit} onRemove={(row) => void removeRow(row)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DormPanelCard>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">แก้ไขรายการประวัติ</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-500 hover:bg-slate-100 rounded-lg px-2 py-1">
                ปิด
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              ห้อง {editing.bill.room.roomNumber} · งวด {editing.bill.billingMonth}/{editing.bill.billingYear} · #{editing.id}
            </p>
            <form onSubmit={saveEdit} className="space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                จำนวนเงิน (บาท)
                <input className={inputClz} value={form.amountToPay} onChange={(e) => setForm((s) => ({ ...s, amountToPay: e.target.value }))} inputMode="decimal" required />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                สถานะ
                <select
                  className={inputClz}
                  value={form.paymentStatus}
                  onChange={(e) => setForm((s) => ({ ...s, paymentStatus: e.target.value as typeof s.paymentStatus }))}
                >
                  <option value="PENDING">ค้างชำระ</option>
                  <option value="PAID">ชำระแล้ว</option>
                  <option value="OVERDUE">เกินกำหนด</option>
                </select>
              </label>
              {form.paymentStatus === "PAID" ? (
                <label className="block text-xs font-medium text-slate-600">
                  วันที่ชำระ
                  <input type="date" className={inputClz} value={form.paidAt} onChange={(e) => setForm((s) => ({ ...s, paidAt: e.target.value }))} />
                </label>
              ) : null}
              <label className="block text-xs font-medium text-slate-600">
                หมายเหตุ
                <textarea className={inputClz} rows={2} value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  ยกเลิก
                </button>
                <button disabled={saving} type="submit" className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DormPageStack>
  );
}
