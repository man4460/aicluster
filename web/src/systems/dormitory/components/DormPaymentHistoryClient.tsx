"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
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
        <Link href={`/dashboard/dormitory/receipt/${r.id}`} className="text-xs font-semibold text-[#0000BF] hover:underline">
          ใบเสร็จ
        </Link>
      ) : null}
      <button type="button" onClick={() => onEdit(r)} className="text-xs font-semibold text-[#0000BF] hover:underline">
        แก้ไข
      </button>
      <button type="button" onClick={() => onRemove(r)} className="text-xs font-semibold text-red-700 hover:underline">
        ลบ
      </button>
    </div>
  );
}

const inputClz =
  "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000BF]/40";

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
  const monthDefault = useMemo(() => bangkokCurrentMonthRange(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(monthDefault.from);
  const [dateTo, setDateTo] = useState(monthDefault.to);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    amountToPay: "",
    note: "",
    paymentStatus: "PENDING" as "PENDING" | "PAID" | "OVERDUE",
    paidAt: "",
  });
  const [saving, setSaving] = useState(false);

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
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">ค้นหา (ห้อง / ชื่อ / เบอร์ / งวด)</label>
          <input className={`${inputClz} mt-1`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น 101 หรือ 08…" />
        </div>
        <div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-[140px] flex-1">
              <span className="block text-xs font-medium text-slate-600">วันที่อัปเดต — ตั้งแต่</span>
              <input
                type="date"
                className={`${inputClz} mt-1`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="block min-w-[140px] flex-1">
              <span className="block text-xs font-medium text-slate-600">ถึง</span>
              <input type="date" className={`${inputClz} mt-1`} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="min-h-[44px] shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ล้างช่วงวันที่
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">กรองตามคอลัมน์ &quot;อัปเดตล่าสุด&quot; (เขตเวลาไทย)</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลด…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          {rows.length === 0 ? "ยังไม่มีรายการประวัติการชำระ" : "ไม่พบรายการตามการค้นหาหรือช่วงวันที่"}
        </p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-lg font-bold tabular-nums text-slate-900">ห้อง {r.bill.room.roomNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      งวด {r.bill.billingMonth}/{r.bill.billingYear}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {statusTh(r.paymentStatus)}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">ผู้พัก</p>
                    <p className="font-medium text-slate-900">{r.tenant.name}</p>
                    <p className="text-xs text-slate-500">{r.tenant.phone}</p>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span className="text-xs text-slate-500">จำนวน</span>
                    <span className="text-base font-semibold tabular-nums text-slate-900">{r.amountToPay.toLocaleString("th-TH")} บาท</span>
                  </div>
                  <p className="text-xs text-slate-500">อัปเดตล่าสุด {formatUpdated(r.updatedAt)}</p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <PaymentHistoryRowActions r={r} onEdit={openEdit} onRemove={(row) => void removeRow(row)} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2">ห้อง</th>
                  <th className="px-3 py-2">งวด</th>
                  <th className="px-3 py-2">ผู้พัก</th>
                  <th className="px-3 py-2">จำนวน</th>
                  <th className="px-3 py-2">สถานะ</th>
                  <th className="px-3 py-2">อัปเดตล่าสุด</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{r.bill.room.roomNumber}</td>
                    <td className="px-3 py-2">
                      {r.bill.billingMonth}/{r.bill.billingYear}
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.tenant.name}</div>
                      <div className="text-xs text-slate-500">{r.tenant.phone}</div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.amountToPay.toLocaleString("th-TH")}</td>
                    <td className="px-3 py-2">{statusTh(r.paymentStatus)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{formatUpdated(r.updatedAt)}</td>
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
    </div>
  );
}
