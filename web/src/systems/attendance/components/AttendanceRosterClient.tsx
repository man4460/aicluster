"use client";

import { useCallback, useEffect, useState } from "react";

type ShiftSlot = { index: number; label: string };
type Entry = {
  id: number;
  displayName: string;
  phone: string;
  isActive: boolean;
  rosterShiftIndex: number;
};

export function AttendanceRosterClient() {
  const [shiftSlots, setShiftSlots] = useState<ShiftSlot[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newShiftIndex, setNewShiftIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/owner/roster", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      shiftSlots?: ShiftSlot[];
      entries?: Entry[];
      error?: string;
    };
    if (res.ok) {
      setListErr(null);
      const slots = j.shiftSlots ?? [];
      setShiftSlots(slots);
      setEntries(j.entries ?? []);
      setNewShiftIndex((prev) => (slots.length > 0 && prev >= slots.length ? 0 : prev));
    } else {
      setShiftSlots([]);
      setEntries([]);
      setListErr(j.error ?? "โหลดรายชื่อไม่สำเร็จ");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (shiftSlots.length === 0) {
      setErr("ตั้งค่ากะที่เมนูตั้งค่าเช็คชื่อก่อน");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/owner/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: name.trim(),
          phone,
          rosterShiftIndex: clampNewShift(newShiftIndex, shiftSlots.length),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setName("");
      setPhone("");
      setNewShiftIndex(0);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setEntryShift(id: number, rosterShiftIndex: number) {
    if (shiftSlots.length === 0) return;
    await fetch(`/api/attendance/owner/roster/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rosterShiftIndex: clampNewShift(rosterShiftIndex, shiftSlots.length) }),
    });
    await load();
  }

  async function toggleActive(id: number, isActive: boolean) {
    await fetch(`/api/attendance/owner/roster/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!confirm("ลบรายชื่อนี้?")) return;
    await fetch(`/api/attendance/owner/roster/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  return (
    <div className="space-y-6">
      {listErr ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{listErr}</p>
      ) : null}
      {!listErr && shiftSlots.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่มีกะในระบบ — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คชื่อ
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งช่วงเวลากะ
        </p>
      ) : null}

      <form
        onSubmit={add}
        className="app-surface flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:flex-wrap lg:items-end"
      >
        <label className="min-w-[140px] text-xs font-semibold text-slate-700">
          ชื่อ-นามสกุล
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            className="app-input mt-1 block w-full rounded-xl px-3 py-2 text-sm"
            placeholder="เช่น สมชาย ใจดี"
            required
          />
        </label>
        <label className="min-w-[140px] text-xs font-semibold text-slate-700">
          เบอร์โทร
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            inputMode="numeric"
            className="app-input mt-1 block w-full rounded-xl px-3 py-2 text-sm font-mono"
            placeholder="0812345678"
            required
          />
        </label>
        <label className="min-w-[200px] text-xs font-semibold text-slate-700">
          กะที่ปฏิบัติงาน
          <select
            className="app-input mt-1 block w-full rounded-xl px-3 py-2 text-sm"
            value={newShiftIndex}
            onChange={(e) => setNewShiftIndex(Number(e.target.value))}
            disabled={shiftSlots.length === 0}
          >
            {shiftSlots.map((s) => (
              <option key={s.index} value={s.index}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy || shiftSlots.length === 0}
          className="app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          เพิ่มรายชื่อ
        </button>
        {err ? <p className="w-full text-sm text-red-600">{err}</p> : null}
      </form>

      <div className="app-surface rounded-2xl">
        {loading ? (
          <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            ยังไม่มีรายชื่อ — เพิ่มเบอร์พนักงานและกะที่ปฏิบัติงานเพื่อใช้กับ QR / ลิงก์สาธารณะ
          </p>
        ) : (
          <>
            <ul className="space-y-3 p-3 md:hidden">
              {entries.map((r) => (
                <li key={r.id} className="app-surface-strong rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{r.displayName}</p>
                      <p className="mt-1 font-mono text-sm text-slate-600">{r.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleActive(r.id, r.isActive)}
                      className={
                        r.isActive
                          ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900"
                          : "shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {r.isActive ? "ใช้งาน" : "ปิดชั่วคราว"}
                    </button>
                  </div>
                  <label className="mt-3 block text-[11px] font-semibold text-slate-600">
                    กะ
                    <select
                      className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm"
                      value={clampNewShift(r.rosterShiftIndex, shiftSlots.length)}
                      onChange={(e) => void setEntryShift(r.id, Number(e.target.value))}
                    >
                      {shiftSlots.map((s) => (
                        <option key={s.index} value={s.index}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => void remove(r.id)}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      ลบรายชื่อ
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">ชื่อ</th>
                    <th className="px-3 py-2">เบอร์</th>
                    <th className="px-3 py-2">กะ</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="px-3 py-2">{r.displayName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.phone}</td>
                      <td className="px-3 py-2">
                        <select
                          className="app-input max-w-[240px] rounded-lg px-2 py-1 text-xs"
                          value={clampNewShift(r.rosterShiftIndex, shiftSlots.length)}
                          onChange={(e) => void setEntryShift(r.id, Number(e.target.value))}
                        >
                          {shiftSlots.map((s) => (
                            <option key={s.index} value={s.index}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void toggleActive(r.id, r.isActive)}
                          className={
                            r.isActive
                              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900"
                              : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600"
                          }
                        >
                          {r.isActive ? "ใช้งาน" : "ปิดชั่วคราว"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => void remove(r.id)}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function clampNewShift(idx: number, slotCount: number): number {
  if (slotCount <= 0) return 0;
  return Math.max(0, Math.min(idx, slotCount - 1));
}
