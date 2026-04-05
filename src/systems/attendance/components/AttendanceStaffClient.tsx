"use client";

import { useCallback, useEffect, useState } from "react";
import { attendanceSectionTitleClass } from "@/systems/attendance/attendance-ui";

type StaffRow = {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  createdAt: string;
};

export function AttendanceStaffClient() {
  const [list, setList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/owner/staff", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { staff?: StaffRow[] };
    setList(j.staff ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          username,
          password,
          fullName: fullName.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "สร้างไม่สำเร็จ");
        return;
      }
      setMsg("สร้างบัญชีพนักงานแล้ว — ให้ล็อกอินที่หน้าเข้าสู่ระบบด้วยอีเมล/รหัสที่ตั้ง");
      setPassword("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("ถอดพนักงานออกจากองค์กร?")) return;
    const res = await fetch(`/api/attendance/owner/staff/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="app-surface max-w-xl space-y-3 rounded-2xl p-5"
      >
        <h2 className={attendanceSectionTitleClass}>เพิ่มพนักงาน</h2>
        {err ? <p className="text-sm text-red-700">{err}</p> : null}
        {msg ? <p className="text-sm text-emerald-800">{msg}</p> : null}
        <input
          required
          type="email"
          placeholder="อีเมล"
          className="app-input w-full rounded-xl px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          placeholder="ชื่อผู้ใช้"
          className="app-input w-full rounded-xl px-3 py-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="รหัสผ่าน (≥8)"
          className="app-input w-full rounded-xl px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          placeholder="ชื่อแสดง (ไม่บังคับ)"
          className="app-input w-full rounded-xl px-3 py-2 text-sm"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="app-btn-primary rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {saving ? "กำลังสร้าง…" : "สร้างบัญชี"}
        </button>
      </form>

      <div className="app-surface rounded-2xl p-5">
        <h2 className={attendanceSectionTitleClass}>รายชื่อพนักงาน</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-sm text-[#66638c]">ยังไม่มี</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#e8e6fc]/90">
            {list.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-[#2e2a58]">{s.username}</p>
                  <p className="text-xs text-[#66638c]">{s.email}</p>
                  {s.fullName ? <p className="text-xs text-[#9b98c4]">{s.fullName}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void revoke(s.id)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-50"
                >
                  ถอดออก
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
