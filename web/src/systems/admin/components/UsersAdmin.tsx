"use client";

import { useCallback, useEffect, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  AppCard,
  AppCardFooter,
  AppCardHeader,
  DataRow,
} from "@/components/ui/app-card";
import { cn } from "@/lib/cn";

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  tokens: number;
  subscriptionTier: string;
  subscriptionType: string;
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
  const [editTokens, setEditTokens] = useState(0);
  const [editSubscriptionType, setEditSubscriptionType] = useState<"BUFFET" | "DAILY">("DAILY");
  const [editSubscriptionTier, setEditSubscriptionTier] = useState<string>("NONE");
  const [editError, setEditError] = useState<string | null>(null);

  const [topUpUser, setTopUpUser] = useState<UserRow | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

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
    setEditTokens(u.tokens);
    setEditSubscriptionType(
      (u.subscriptionType ?? "DAILY") === "BUFFET" ? "BUFFET" : "DAILY",
    );
    setEditSubscriptionTier(u.subscriptionTier);
  }

  function openTopUp(u: UserRow) {
    setTopUpError(null);
    setTopUpUser(u);
    setTopUpAmount("10");
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (!editing) return;
    const body: Record<string, unknown> = {
      email: editEmail,
      username: editUsername,
      role: editRole,
      subscriptionType: editSubscriptionType,
      subscriptionTier: editSubscriptionTier,
    };
    if (editPassword.trim()) body.password = editPassword;
    if (editTokens !== editing.tokens) body.tokens = editTokens;

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

  async function onSubmitTopUp(e: React.FormEvent) {
    e.preventDefault();
    setTopUpError(null);
    if (!topUpUser) return;
    const n = Number.parseInt(topUpAmount, 10);
    if (!Number.isFinite(n) || n === 0) {
      setTopUpError("กรุณากรอกจำนวนโทเคน (ไม่ใช่ศูนย์)");
      return;
    }
    setTopUpLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${topUpUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokensAdd: n }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setTopUpError(data.error ?? "เติมโทเคนไม่สำเร็จ");
        return;
      }
      setTopUpUser(null);
      await load();
    } finally {
      setTopUpLoading(false);
    }
  }

  async function quickTopUp(u: UserRow, amount: number) {
    setTopUpError(null);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokensAdd: amount }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? "เติมโทเคนไม่สำเร็จ");
      return;
    }
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
    if (topUpUser?.id === id) setTopUpUser(null);
    await load();
  }

  return (
    <div className="space-y-8">
      <AppCard>
        <AppCardHeader title="เพิ่มผู้ใช้" />
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
            <PasswordInput
              required
              minLength={8}
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              inputClassName={passwordInputClass}
              autoComplete="new-password"
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
      </AppCard>

      <AppCard>
        <AppCardHeader
          title="รายชื่อผู้ใช้"
          description="บนมือถือแสดงเป็นการ์ด — บนเดสก์ท็อปแสดงเป็นตาราง"
          action={
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0000BF] shadow-sm hover:bg-slate-50"
            >
              รีเฟรช
            </button>
          }
        />
        {loadError ? <p className="mt-2 text-sm text-red-600">{loadError}</p> : null}

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2.5 pr-3 font-medium">ชื่อผู้ใช้</th>
                <th className="py-2.5 pr-3 font-medium">อีเมล</th>
                <th className="py-2.5 pr-3 font-medium">โทเคน</th>
                <th className="py-2.5 pr-3 font-medium">แพ็กเกจ</th>
                <th className="py-2.5 pr-3 font-medium">บทบาท</th>
                <th className="py-2.5 pr-3 font-medium">สร้างเมื่อ</th>
                <th className="py-2.5 font-medium">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 transition hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{u.username}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{u.email}</td>
                    <td className="py-2.5 pr-3 font-medium tabular-nums text-amber-800">{u.tokens}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{u.subscriptionType ?? "DAILY"}</div>
                      <div className="text-slate-500">{u.subscriptionTier}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {new Date(u.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="py-2.5">
                      <UserRowActions
                        onEdit={() => openEdit(u)}
                        onTopUp={() => openTopUp(u)}
                        onQuick={(n) => quickTopUp(u, n)}
                        onDelete={() => onDelete(u.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-4 space-y-3 md:hidden">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">กำลังโหลด...</p>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">ไม่มีข้อมูล</p>
          ) : (
            users.map((u) => (
              <AppCard key={u.id} padding="compact" className="border-slate-200/90 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{u.username}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2">
                  <DataRow label="โทเคน">
                    <span className="font-semibold tabular-nums text-amber-800">{u.tokens}</span>
                  </DataRow>
                  <DataRow label="สมัคร">
                    <span className="text-xs text-slate-700">
                      {u.subscriptionType ?? "DAILY"} · {u.subscriptionTier}
                    </span>
                  </DataRow>
                  <DataRow label="สร้างเมื่อ">
                    <span className="text-xs text-slate-600">
                      {new Date(u.createdAt).toLocaleString("th-TH")}
                    </span>
                  </DataRow>
                </div>
                <AppCardFooter className="mt-3 border-t border-slate-100 pt-3">
                  <UserRowActions
                    stacked
                    onEdit={() => openEdit(u)}
                    onTopUp={() => openTopUp(u)}
                    onQuick={(n) => quickTopUp(u, n)}
                    onDelete={() => onDelete(u.id)}
                  />
                </AppCardFooter>
              </AppCard>
            ))
          )}
        </div>
      </AppCard>

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <AppCard className="max-h-[90vh] w-full max-w-md overflow-y-auto shadow-xl">
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
              <Field label="โทเคน (ยอดรวม)">
                <input
                  type="number"
                  min={0}
                  max={999_999_999}
                  required
                  value={editTokens}
                  onChange={(e) => setEditTokens(Number.parseInt(e.target.value, 10) || 0)}
                  className={inputClass}
                />
              </Field>
              <Field label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)">
                <PasswordInput
                  minLength={8}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  inputClassName={passwordInputClass}
                  autoComplete="new-password"
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
              <Field label="ประเภท (เหมา / รายวัน)">
                <select
                  value={editSubscriptionType}
                  onChange={(e) =>
                    setEditSubscriptionType(e.target.value as "BUFFET" | "DAILY")
                  }
                  className={inputClass}
                >
                  <option value="DAILY">DAILY — สายรายวัน</option>
                  <option value="BUFFET">BUFFET — แพ็กเหมา</option>
                </select>
              </Field>
              <Field label="แพ็กเกจ tier">
                <select
                  value={editSubscriptionTier}
                  onChange={(e) => setEditSubscriptionTier(e.target.value)}
                  className={inputClass}
                >
                  <option value="NONE">NONE</option>
                  <option value="TIER_199">TIER_199</option>
                  <option value="TIER_299">TIER_299</option>
                  <option value="TIER_399">TIER_399</option>
                  <option value="TIER_499">TIER_499</option>
                  <option value="TIER_599">TIER_599</option>
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
          </AppCard>
        </div>
      ) : null}

      {topUpUser ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topup-title"
        >
          <AppCard className="w-full max-w-sm shadow-xl">
            <h2 id="topup-title" className="text-lg font-semibold text-slate-900">
              เติมโทเคน
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {topUpUser.username}{" "}
              <span className="tabular-nums text-amber-800">({topUpUser.tokens})</span>
            </p>
            <form onSubmit={onSubmitTopUp} className="mt-4 space-y-3">
              {topUpError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{topUpError}</p>
              ) : null}
              <Field label="จำนวนโทเคน (+ เติม / − หัก)">
                <input
                  type="number"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className={inputClass}
                  placeholder="เช่น 10 หรือ -5"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {[10, 50, 100, 500].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTopUpAmount(String(n))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="flex-1 rounded-lg bg-[#0000BF] py-2 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60"
                >
                  {topUpLoading ? "กำลังบันทึก..." : "ยืนยันเติม"}
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpUser(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </AppCard>
        </div>
      ) : null}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        role === "ADMIN" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700",
      )}
    >
      {role}
    </span>
  );
}

function UserRowActions({
  onEdit,
  onTopUp,
  onQuick,
  onDelete,
  stacked,
}: {
  onEdit: () => void;
  onTopUp: () => void;
  onQuick: (n: number) => void;
  onDelete: () => void;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        stacked && "flex-col gap-2",
      )}
    >
      <div className={cn("flex flex-wrap gap-1.5", stacked && "w-full")}>
        {[10, 50, 100].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onQuick(n)}
            className="rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
          >
            +{n}
          </button>
        ))}
      </div>
      <div className={cn("flex flex-wrap gap-1.5", stacked && "w-full")}>
        <button
          type="button"
          onClick={onTopUp}
          className="rounded-md border border-[#0000BF]/30 bg-[#0000BF]/5 px-2 py-1 text-xs font-medium text-[#0000BF] hover:bg-[#0000BF]/10"
        >
          เติม…
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-50"
        >
          แก้ไข
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          ลบ
        </button>
      </div>
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

const passwordInputClass =
  "w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20";
