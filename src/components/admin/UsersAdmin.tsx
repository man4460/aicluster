"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createEmail, setCreateEmail] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"USER" | "ADMIN">("USER");
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"USER" | "ADMIN">("USER");
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (!res.ok) {
      setLoadError("โหลดข้อมูลไม่สำเร็จ");
      setUsers([]);
      return;
    }
    const data = (await res.json()) as { users: UserRow[] };
    setUsers(data.users);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: createEmail,
        username: createUsername,
        password: createPassword,
        role: createRole,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setCreateMsg(data.error ?? "สร้างไม่สำเร็จ");
      return;
    }
    setCreateEmail("");
    setCreateUsername("");
    setCreatePassword("");
    setCreateRole("USER");
    setCreateMsg("เพิ่มผู้ใช้แล้ว");
    await load();
  }

  function openEdit(u: UserRow) {
    setEditError(null);
    setEditing(u);
    setEditEmail(u.email);
    setEditUsername(u.username);
    setEditPassword("");
    setEditRole(u.role as "USER" | "ADMIN");
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (!editing) return;
    const body: Record<string, unknown> = {
      email: editEmail,
      username: editUsername,
      role: editRole,
    };
    if (editPassword.trim()) body.password = editPassword;

    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setEditError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setEditing(null);
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm("ลบผู้ใช้นี้?")) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    await load();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">เพิ่มผู้ใช้</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="อีเมล">
            <input
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="ชื่อผู้ใช้">
            <input
              required
              minLength={2}
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="รหัสผ่าน">
            <input
              type="password"
              required
              minLength={8}
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="บทบาท">
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as "USER" | "ADMIN")}
              className={inputClass}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
            >
              สร้าง
            </button>
            {createMsg ? (
              <span className="ml-3 text-sm text-emerald-700">{createMsg}</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">รายชื่อผู้ใช้</h2>
          <button
            type="button"
            onClick={() => load()}
            className="text-sm font-medium text-[#0000BF] hover:underline"
          >
            รีเฟรช
          </button>
        </div>
        {loadError ? <p className="mt-2 text-sm text-red-600">{loadError}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2 pr-3 font-medium">ชื่อผู้ใช้</th>
                <th className="py-2 pr-3 font-medium">อีเมล</th>
                <th className="py-2 pr-3 font-medium">บทบาท</th>
                <th className="py-2 pr-3 font-medium">สร้างเมื่อ</th>
                <th className="py-2 font-medium">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-900">{u.username}</td>
                    <td className="py-2 pr-3 text-slate-700">{u.email}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          u.role === "ADMIN"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-slate-100 text-slate-700",
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {new Date(u.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(u.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
            <h2 id="edit-title" className="text-lg font-semibold text-slate-900">
              แก้ไขผู้ใช้
            </h2>
            <p className="mt-1 text-sm text-slate-500">{editing.username}</p>
            <form onSubmit={onSaveEdit} className="mt-4 space-y-3">
              {editError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>
              ) : null}
              <Field label="อีเมล">
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="ชื่อผู้ใช้">
                <input
                  required
                  minLength={2}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)">
                <input
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="บทบาท">
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "USER" | "ADMIN")}
                  className={inputClass}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </Field>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#0000BF] py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20";
