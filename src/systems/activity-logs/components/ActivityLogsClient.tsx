"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actionLabelTh,
  activityLogModelLabelTh,
  humanizeActivityLogRow,
} from "@/systems/activity-logs/lib/humanize-activity-log";

export type ActivityLogsCalendarDefaults = {
  initialFrom: string;
  initialTo: string;
};

type ActivityLogRow = {
  id: string | number;
  actorUserId: string | null;
  action: string;
  modelName: string;
  payload: unknown;
  createdAt: string;
};

const inputClz =
  "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000BF]/40";

export function ActivityLogsClient({ initialFrom, initialTo }: ActivityLogsCalendarDefaults) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [modelName, setModelName] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const actionOptions = useMemo(
    () =>
      [
        { value: "", label: "ทุกประเภทการกระทำ" },
        { value: "CREATE", label: "เพิ่มข้อมูล (CREATE)" },
        { value: "UPDATE", label: "แก้ไขข้อมูล (UPDATE)" },
        { value: "UPSERT", label: "เพิ่มหรือแก้ไข (UPSERT)" },
        { value: "DELETE", label: "ลบข้อมูล (DELETE)" },
        { value: "CREATE_MANY", label: "เพิ่มหลายรายการ" },
        { value: "UPDATE_MANY", label: "แก้ไขหลายรายการ" },
        { value: "DELETE_MANY", label: "ลบหลายรายการ" },
      ] as const,
    [],
  );

  useEffect(() => {
    let done = false;
    async function load() {
      setLoading(true);
      setError(null);
      const sp = new URLSearchParams({ from, to, page: String(page), pageSize: "30" });
      if (modelName.trim()) sp.set("modelName", modelName.trim());
      if (action) sp.set("action", action);
      const res = await fetch(`/api/activity-logs?${sp.toString()}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: ActivityLogRow[];
        totalPages?: number;
      };
      if (done) return;
      if (!res.ok) {
        setError(j.error ?? "โหลดข้อมูลไม่สำเร็จ");
        setRows([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      setRows(j.items ?? []);
      setTotalPages(Math.max(1, j.totalPages ?? 1));
      setLoading(false);
    }
    void load();
    return () => {
      done = true;
    };
  }, [from, to, modelName, action, page, reloadTick]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input type="date" className={inputClz} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input type="date" className={inputClz} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        <input
          className={inputClz}
          value={modelName}
          onChange={(e) => {
            setModelName(e.target.value);
            setPage(1);
          }}
          placeholder="ชื่อตาราง (อังกฤษ) เช่น HomeFinanceEntry"
        />
        <select className={inputClz} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          {actionOptions.map((a) => (
            <option key={a.value || "ALL"} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <div className="flex items-center text-xs text-slate-500">ระบบจะลบ log อัตโนมัติเมื่อเกิน 3 เดือน</div>
        <button
          type="button"
          onClick={() => setReloadTick((x) => x + 1)}
          className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white"
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p> : null}
        {!loading && error ? <p className="p-6 text-center text-sm text-red-700">{error}</p> : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก</p>
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">เวลา</th>
                <th className="px-3 py-2">การกระทำ</th>
                <th className="px-3 py-2">ส่วนของระบบ</th>
                <th className="min-w-[280px] px-3 py-2">สรุปที่เกิดขึ้น</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                    {new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                  </td>
                  <td className="px-3 py-2 font-semibold text-[#0000BF]">{actionLabelTh(r.action)}</td>
                  <td className="px-3 py-2 text-slate-800">
                    <span className="font-medium">{activityLogModelLabelTh(r.modelName)}</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-slate-400">{r.modelName}</span>
                  </td>
                  <td className="px-3 py-2 text-sm leading-snug text-slate-800">
                    {humanizeActivityLogRow(r.action, r.modelName, r.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          ก่อนหน้า
        </button>
        <span className="text-sm text-slate-600">หน้า {page} / {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
