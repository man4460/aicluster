"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CooldownRow = {
  moduleId: string;
  title: string;
  slug: string;
  unlockAtIso: string;
};

type UserInfo = { id: string; email: string; username: string };

type AllEntry = {
  userId: string;
  email: string;
  username: string;
  moduleId: string;
  moduleTitle: string;
  slug: string;
  unlockAtIso: string;
  unsubscribedAtIso: string;
};

function formatTh(iso: string): string {
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function ModuleCooldownAdminClient() {
  const [email, setEmail] = useState("");
  const [filterText, setFilterText] = useState("");
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [rows, setRows] = useState<CooldownRow[]>([]);
  const [allEntries, setAllEntries] = useState<AllEntry[]>([]);

  const loadAll = useCallback(async () => {
    setErr(null);
    setLoadingAll(true);
    try {
      const res = await fetch("/api/admin/module-cooldowns", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        mode?: string;
        entries?: AllEntry[];
      };
      if (!res.ok) {
        setErr(j.error ?? "โหลดข้อมูลไม่สำเร็จ");
        setAllEntries([]);
        return;
      }
      if (j.mode === "all" && Array.isArray(j.entries)) {
        setAllEntries(j.entries);
      }
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredAll = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    if (!t) return allEntries;
    return allEntries.filter(
      (e) =>
        e.email.toLowerCase().includes(t) ||
        e.username.toLowerCase().includes(t) ||
        e.moduleTitle.toLowerCase().includes(t) ||
        e.slug.toLowerCase().includes(t),
    );
  }, [allEntries, filterText]);

  const searchByEmail = useCallback(async () => {
    setErr(null);
    const q = email.trim();
    if (!q) {
      setUser(null);
      setRows([]);
      void loadAll();
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/admin/module-cooldowns?email=${encodeURIComponent(q)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: UserInfo;
        cooldowns?: CooldownRow[];
        mode?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      setUser(j.user ?? null);
      setRows(j.cooldowns ?? []);
    } finally {
      setLoadingSearch(false);
    }
  }, [email, loadAll]);

  async function unlockByUserId(userId: string, moduleId: string) {
    setErr(null);
    const key = `${userId}:${moduleId}`;
    setUnlocking(key);
    try {
      const res = await fetch("/api/admin/module-cooldowns/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, moduleId }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "ปลดล็อคไม่สำเร็จ");
        return;
      }
      setAllEntries((prev) => prev.filter((e) => !(e.userId === userId && e.moduleId === moduleId)));
      setRows((prev) => prev.filter((r) => r.moduleId !== moduleId));
    } finally {
      setUnlocking(null);
    }
  }

  function unlockFromUserSearch(moduleId: string) {
    if (!user) return;
    void unlockByUserId(user.id, moduleId);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">
          แสดงรายการล็อค Subscribe หลัง Unsubscribe ทั้งหมดเมื่อโหลดหน้า — ค้นหาเฉพาะ email ได้ด้านล่าง
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loadingAll}
            onClick={() => void loadAll()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingAll ? "กำลังโหลด…" : "รีเฟรชรายการ"}
          </button>
          <span className="text-xs text-slate-500">
            {loadingAll ? "—" : `ทั้งหมด ${allEntries.length} รายการ`}
          </span>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">กรองรายการ (email / ชื่อผู้ใช้ / ระบบ)</p>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="พิมพ์เพื่อกรอง…"
            className="mt-2 w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
      </div>

      {!loadingAll ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">รายการล็อคทั้งหมด</h2>
          {filteredAll.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              {allEntries.length === 0 ? "ไม่มีรายการล็อคในขณะนี้" : "ไม่พบรายการที่ตรงกับการกรอง"}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">ผู้ใช้</th>
                    <th className="py-2 pr-3">ระบบ</th>
                    <th className="py-2 pr-3">ยกเลิกเมื่อ</th>
                    <th className="py-2 pr-3">ปลดล็อคได้เมื่อ</th>
                    <th className="py-2">การทำงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map((e) => {
                    const key = `${e.userId}:${e.moduleId}`;
                    return (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 text-slate-800">{e.email}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{e.username}</td>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">{e.moduleTitle}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">{formatTh(e.unsubscribedAtIso)}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">{formatTh(e.unlockAtIso)}</td>
                        <td className="py-2.5">
                          <button
                            type="button"
                            disabled={unlocking === key}
                            onClick={() => void unlockByUserId(e.userId, e.moduleId)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {unlocking === key ? "กำลังปลด…" : "ปลดล็อค"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">
          ค้นหาเฉพาะผู้ใช้ด้วย <span className="font-medium">email</span> (แสดงรายการล็อคของ user นั้น)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="min-w-[240px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={loadingSearch}
            onClick={() => void searchByEmail()}
            className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-50"
          >
            {loadingSearch ? "กำลังค้นหา…" : "ค้นหา"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("");
              setUser(null);
              setRows([]);
              void loadAll();
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ล้างการค้นหา
          </button>
        </div>
      </div>

      {user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-800">
            {user.username} <span className="text-slate-500">({user.email})</span>
          </p>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">ไม่มีรายการล็อค Subscribe หลัง Unsubscribe</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.moduleId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">ปลดล็อค Subscribe ได้เมื่อ: {formatTh(r.unlockAtIso)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={unlocking === `${user.id}:${r.moduleId}`}
                    onClick={() => unlockFromUserSearch(r.moduleId)}
                    className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {unlocking === `${user.id}:${r.moduleId}` ? "กำลังปลด…" : "ปลดล็อค Subscribe"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
