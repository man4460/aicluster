"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  createdAt: string;
  status: string;
  remainingSessions: number;
  package: { id: number; name: string; price: string; totalSessions: number };
  customer: { id: number; phone: string; name: string | null };
  soldByStylist: { id: number; name: string } | null;
};

function statusLabel(s: string) {
  if (s === "ACTIVE") return "ใช้งาน";
  if (s === "EXHAUSTED") return "หมดแล้ว";
  if (s === "CANCELLED") return "ยกเลิก";
  return s;
}

export function BarberPurchasesClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  const [filterName, setFilterName] = useState("");

  const filteredRows = useMemo(() => {
    const phoneQ = filterPhone.replace(/\D/g, "");
    const nameQ = filterName.trim().toLowerCase();
    return rows.filter((r) => {
      if (phoneQ.length > 0) {
        const p = r.customer.phone.replace(/\D/g, "");
        if (!p.includes(phoneQ)) return false;
      }
      if (nameQ.length > 0) {
        const n = (r.customer.name ?? "").toLowerCase();
        if (!n.includes(nameQ)) return false;
      }
      return true;
    });
  }, [rows, filterPhone, filterName]);

  const hasActiveFilters =
    filterPhone.replace(/\D/g, "").length > 0 || filterName.trim().length > 0;

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/subscriptions?limit=150");
    const data = (await res.json().catch(() => ({}))) as { subscriptions?: Row[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setRows([]);
      return;
    }
    setRows(data.subscriptions ?? []);
  }, []);

  async function editRow(r: Row) {
    const nextRemain = prompt("จำนวนครั้งคงเหลือ", String(r.remainingSessions));
    if (nextRemain == null) return;
    const remain = Number(nextRemain);
    if (!Number.isInteger(remain) || remain < 0) {
      setErr("จำนวนครั้งคงเหลือต้องเป็นเลขจำนวนเต็ม >= 0");
      return;
    }
    const nextStatus = prompt("สถานะ (ACTIVE/EXHAUSTED/CANCELLED)", r.status)?.trim().toUpperCase();
    if (!nextStatus || !["ACTIVE", "EXHAUSTED", "CANCELLED"].includes(nextStatus)) {
      setErr("สถานะไม่ถูกต้อง");
      return;
    }
    const nextName = prompt("ชื่อลูกค้า (ไม่บังคับ)", r.customer.name ?? "") ?? "";
    const res = await fetch(`/api/barber/subscriptions/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remainingSessions: remain,
        status: nextStatus,
        customerName: nextName.trim() || null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "แก้ไขไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function removeRow(r: Row) {
    if (!confirm(`ลบผู้ซื้อแพ็กเกจ #${r.id} (${r.customer.phone}) ?`)) return;
    const res = await fetch(`/api/barber/subscriptions/${r.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          ยังไม่มีการซื้อแพ็กเกจ
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">กรองรายการ</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="purchase-filter-phone" className="sr-only">
                  กรองตามเบอร์โทร
                </label>
                <input
                  id="purchase-filter-phone"
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-[#0000BF] focus:outline-none focus:ring-2 focus:ring-[#0000BF]/20"
                  inputMode="numeric"
                  placeholder="กรองตามเบอร์ (เฉพาะตัวเลข)"
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
              </div>
              <div>
                <label htmlFor="purchase-filter-name" className="sr-only">
                  กรองตามชื่อ
                </label>
                <input
                  id="purchase-filter-name"
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-[#0000BF] focus:outline-none focus:ring-2 focus:ring-[#0000BF]/20"
                  placeholder="กรองตามชื่อลูกค้า"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {hasActiveFilters ? (
                <>
                  แสดง <span className="font-semibold tabular-nums text-slate-700">{filteredRows.length}</span> จาก{" "}
                  <span className="tabular-nums">{rows.length}</span> รายการ
                </>
              ) : (
                <>ทั้งหมด {rows.length} รายการ</>
              )}
            </p>
          </div>

          {filteredRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-8 text-center text-sm text-amber-900">
              ไม่พบรายการที่ตรงกับการกรอง — ลองเปลี่ยนคำค้นหาเบอร์หรือชื่อ
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredRows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{r.customer.phone}</p>
                      {r.customer.name ? (
                        <p className="text-sm text-slate-600">{r.customer.name}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#0000BF]">{r.package.name}</p>
                  <p className="text-xs text-slate-500">
                    {Number(r.package.price).toLocaleString("th-TH")} บาท · {r.package.totalSessions}{" "}
                    ครั้ง · เหลือ{" "}
                    <span className="font-semibold tabular-nums text-slate-800">{r.remainingSessions}</span> ครั้ง
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ซื้อเมื่อ{" "}
                    {new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} · สมาชิก #
                    {r.id}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    ช่างที่บันทึกการขาย:{" "}
                    <span className="font-medium text-slate-900">
                      {r.soldByStylist?.name ?? "— ไม่ระบุ —"}
                    </span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void editRow(r)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800">แก้ไข</button>
                    <button type="button" onClick={() => void removeRow(r)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700">ลบ</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
