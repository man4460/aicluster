"use client";

import { bangkokDateKey } from "@/lib/time/bangkok";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: number;
  guestPhone: string | null;
  guestName: string | null;
  publicVisitorKind: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateCheckIn: boolean;
  earlyCheckOut: boolean;
  checkInFacePhotoUrl: string | null;
};

function visitorGroupLabel(r: Row): string {
  if (r.actorUsername) return "พนักงาน (แอป)";
  if (r.publicVisitorKind === "ROSTER_STAFF") return "พนักงาน (QR)";
  if (r.publicVisitorKind === "EXTERNAL_GUEST") return "บุคคลภายนอก";
  if (r.guestPhone) return "แขก (ไม่ระบุประเภท)";
  return "—";
}

const statusTh: Record<string, string> = {
  AWAITING_CHECKOUT: "รอเช็คออก",
  ON_TIME: "ตรงเวลา",
  LATE: "มาสาย",
  EARLY_LEAVE: "ออกก่อนเวลา",
  LATE_AND_EARLY: "มาสาย+ออกก่อน",
};

export function AttendanceLogsClient() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  });
  const [to, setTo] = useState(() => bangkokDateKey());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("from", from);
    sp.set("to", to);
    if (q.trim()) sp.set("q", q.trim());
    if (kind) sp.set("kind", kind);
    const res = await fetch(`/api/attendance/logs?${sp}`, { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { logs?: Row[]; error?: string };
    if (res.ok) {
      setLoadErr(null);
      setRows(j.logs ?? []);
    } else {
      setRows([]);
      setLoadErr(j.error ?? "โหลดบันทึกไม่สำเร็จ");
    }
    setLoading(false);
  }, [from, to, q, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  function exportUrl() {
    const sp = new URLSearchParams();
    sp.set("from", from);
    sp.set("to", to);
    if (q.trim()) sp.set("q", q.trim());
    if (kind) sp.set("kind", kind);
    return `/api/attendance/logs/export?${sp}`;
  }

  function formatLogTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  }

  return (
    <div className="space-y-4">
      {loadErr ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{loadErr}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-slate-700">
          จาก
          <input
            type="date"
            className="mt-1 block rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          ถึง
          <input
            type="date"
            className="mt-1 block rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="min-w-[160px] text-xs font-semibold text-slate-700">
          ค้นหา
          <input
            className="mt-1 block w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="เบอร์ / ชื่อ / ยูสเซอร์"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          กลุ่ม
          <select
            className="mt-1 block rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="platform">พนักงาน (แอป)</option>
            <option value="roster_staff">พนักงาน (QR)</option>
            <option value="external">บุคคลภายนอก</option>
            <option value="public_legacy">แขกเดิม (ไม่ระบุประเภท)</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
        >
          ค้นหา
        </button>
        <a
          href={exportUrl()}
          className="rounded-xl border border-[#0000BF] px-4 py-2 text-sm font-semibold text-[#0000BF]"
        >
          Export CSV
        </a>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">ไม่มีข้อมูล</p>
        ) : (
          <>
            <ul className="space-y-3 p-3 md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-600">{visitorGroupLabel(r)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {statusTh[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">ผู้เช็ค</p>
                      <p className="font-mono text-xs text-slate-900">{r.guestPhone ?? r.actorUsername ?? "—"}</p>
                      <p className="text-xs text-slate-600">{r.guestName ?? r.actorFullName ?? ""}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">เข้า </span>
                        {formatLogTime(r.checkInTime)}
                      </div>
                      <div>
                        <span className="text-slate-500">ออก </span>
                        {formatLogTime(r.checkOutTime)}
                      </div>
                    </div>
                    {(r.lateCheckIn || r.earlyCheckOut) && (
                      <p className="text-xs text-amber-800">
                        {r.lateCheckIn ? "สาย" : ""}
                        {r.lateCheckIn && r.earlyCheckOut ? " · " : ""}
                        {r.earlyCheckOut ? "ออกก่อน" : ""}
                      </p>
                    )}
                    {r.checkInFacePhotoUrl ? (
                      <p className="text-xs">
                        <Link
                          href={r.checkInFacePhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#0000BF] hover:underline"
                        >
                          ดูรูปตอนเช็คเข้า
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">กลุ่ม</th>
                    <th className="px-3 py-2">ผู้เช็ค</th>
                    <th className="px-3 py-2">เข้า</th>
                    <th className="px-3 py-2">ออก</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2">รูปเข้า</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-xs font-medium text-slate-700">{visitorGroupLabel(r)}</td>
                      <td className="px-3 py-2">
                        <div className="font-mono text-xs">{r.guestPhone ?? r.actorUsername ?? "—"}</div>
                        <div className="text-xs text-slate-600">{r.guestName ?? r.actorFullName ?? ""}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">{formatLogTime(r.checkInTime)}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{formatLogTime(r.checkOutTime)}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                          {statusTh[r.status] ?? r.status}
                        </span>
                        {r.lateCheckIn ? <span className="ml-1 text-amber-800">สาย</span> : null}
                        {r.earlyCheckOut ? <span className="ml-1 text-amber-800">ออกก่อน</span> : null}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.checkInFacePhotoUrl ? (
                          <Link
                            href={r.checkInFacePhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#0000BF] hover:underline"
                          >
                            เปิด
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <p className="text-[11px] text-slate-500">อัปเดตอัตโนมัติทุก 15 วินาที</p>
    </div>
  );
}
