"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  tokens: number;
  subscriptionTier: string;
  subscriptionType: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function safeAvatarSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (t.startsWith("/uploads/")) return t;
  if (t.startsWith("https://") && t.length < 512) return t;
  return null;
}

const topUpIconBtnClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 text-emerald-700 hover:bg-emerald-100 active:opacity-90",
);

const quickChipClass =
  "rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 px-2.5 py-1.5 text-[11px] font-black tabular-nums text-amber-900 shadow-sm transition hover:border-amber-300 hover:shadow active:scale-95 touch-manipulation";

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm placeholder:text-slate-400 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/25";

const passwordInputClass =
  "w-full rounded-xl border border-white/50 bg-white/70 py-2.5 pl-3 pr-10 text-sm text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/25";

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listBanner, setListBanner] = useState<string | null>(null);

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
  const [editSaving, setEditSaving] = useState(false);

  const [topUpUser, setTopUpUser] = useState<UserRow | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

  /** ฟอร์มเพิ่ม / แผงกรอง — แสดงเมื่อกดปุ่มเท่านั้น */
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [filterSubType, setFilterSubType] = useState<"ALL" | "BUFFET" | "DAILY">("ALL");

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    return { total, admins };
  }, [users]);

  const filtersActive = useMemo(
    () => filterQuery.trim().length > 0 || filterRole !== "ALL" || filterSubType !== "ALL",
    [filterQuery, filterRole, filterSubType],
  );

  const filteredUsers = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (filterRole !== "ALL" && u.role !== filterRole) return false;
      const st = (u.subscriptionType ?? "DAILY") === "BUFFET" ? "BUFFET" : "DAILY";
      if (filterSubType !== "ALL" && st !== filterSubType) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.subscriptionTier ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, filterQuery, filterRole, filterSubType]);

  function clearFilters() {
    setFilterQuery("");
    setFilterRole("ALL");
    setFilterSubType("ALL");
  }

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setListBanner(null);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

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
    setCreateFormOpen(false);
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
    setEditSubscriptionType((u.subscriptionType ?? "DAILY") === "BUFFET" ? "BUFFET" : "DAILY");
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

    setEditSaving(true);
    try {
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
    } finally {
      setEditSaving(false);
    }
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
    setListBanner(null);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokensAdd: amount }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setListBanner(data.error ?? "เติมโทเคนไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm("ลบผู้ใช้นี้?")) return;
    setListBanner(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setListBanner(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    if (topUpUser?.id === id) setTopUpUser(null);
    await load();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-6",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
              aria-hidden
            >
              <IconUsersHero className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                  จัดการผู้ใช้
                </span>
              </h1>
            </div>
          </div>
        </div>

        {!loading && !loadError ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-white/40 pt-5">
            <li>
              <div
                className={cn(
                  "rounded-[1.25rem] border border-white/55 bg-white/50 p-4 shadow-sm backdrop-blur-md sm:rounded-[2rem] sm:p-5",
                  "ring-1 ring-inset ring-white/45",
                )}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ผู้ใช้ทั้งหมด</p>
                <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-3xl">
                  {stats.total}
                </p>
              </div>
            </li>
            <li>
              <div
                className={cn(
                  "rounded-[1.25rem] border border-white/55 bg-white/50 p-4 shadow-sm backdrop-blur-md sm:rounded-[2rem] sm:p-5",
                  "ring-1 ring-inset ring-white/45",
                )}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">แอดมิน</p>
                <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-violet-700 sm:text-3xl">
                  {stats.admins}
                </p>
              </div>
            </li>
          </ul>
        ) : null}
      </section>

      {listBanner ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
          {listBanner}
        </p>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="รายชื่อผู้ใช้"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ปิดตัวกรอง" : "เปิดตัวกรอง"}
                title={filterOpen ? "ปิดตัวกรอง" : "ตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] hover:bg-white",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0 sm:mr-0" />
                <span className="hidden sm:inline">ตัวกรอง</span>
                {filtersActive ? (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white sm:right-1.5 sm:top-1.5"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={refreshing || loading}
                aria-busy={refreshing}
                aria-label="รีเฟรชรายชื่อผู้ใช้"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-4",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] shadow-sm hover:bg-white disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-0", refreshing && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateFormOpen((o) => !o)}
                aria-expanded={createFormOpen}
                aria-label={createFormOpen ? "ปิดฟอร์มเพิ่มผู้ใช้" : "เพิ่มผู้ใช้"}
                title={createFormOpen ? "ปิดฟอร์ม" : "เพิ่มผู้ใช้"}
                className={cn(
                  appDashboardBrandCtaPillButtonClass,
                  "min-h-[40px] min-w-[40px] rounded-xl px-0 sm:min-w-0 sm:rounded-full sm:px-5",
                  createFormOpen && "ring-2 ring-white/80 ring-offset-2 ring-offset-violet-100",
                )}
              >
                <IconPlus className="h-5 w-5 shrink-0 sm:mr-0" />
                <span className="hidden sm:inline">{createFormOpen ? "ปิดฟอร์ม" : "เพิ่มผู้ใช้"}</span>
              </button>
            </div>
          }
        />

        {filterOpen ? (
          <div
            className="mt-4 grid gap-4 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/15 to-violet-50/20 p-4 ring-1 ring-inset ring-white/45 backdrop-blur-md sm:grid-cols-2 sm:rounded-[2rem] sm:p-5"
            id="admin-users-filter-panel"
          >
            <Field label="ค้นหา (ชื่อผู้ใช้ / อีเมล / tier)">
              <input
                type="search"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className={inputClass}
                placeholder="พิมพ์เพื่อกรอง…"
                autoComplete="off"
              />
            </Field>
            <Field label="บทบาท">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as "ALL" | "USER" | "ADMIN")}
                className={inputClass}
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>
            <Field label="ประเภทสมัคร">
              <select
                value={filterSubType}
                onChange={(e) => setFilterSubType(e.target.value as "ALL" | "BUFFET" | "DAILY")}
                className={inputClass}
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="DAILY">DAILY</option>
                <option value="BUFFET">BUFFET</option>
              </select>
            </Field>
            <div className="flex flex-col justify-end gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[#66638c]">
                แสดง <span className="font-black tabular-nums text-[#1e1b4b]">{filteredUsers.length}</span> จาก{" "}
                <span className="tabular-nums">{users.length}</span> รายการ
              </p>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!filtersActive}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "text-sm disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        ) : null}

        {createFormOpen ? (
          <form
            onSubmit={onCreate}
            className="mt-4 grid gap-4 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/45 via-white/25 to-indigo-50/15 p-4 ring-1 ring-inset ring-white/40 backdrop-blur-md sm:grid-cols-2 sm:rounded-[2rem] sm:p-5"
            id="admin-users-create-form"
          >
            <p className="text-sm font-bold text-[#1e1b4b] sm:col-span-2">เพิ่มผู้ใช้ใหม่</p>
            <Field label="อีเมล">
              <input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </Field>
            <Field label="ชื่อผู้ใช้">
              <input
                required
                minLength={2}
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                className={inputClass}
                autoComplete="off"
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
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" className={cn(appDashboardBrandCtaPillButtonClass, "w-full sm:w-auto")}>
                <IconPlus className="h-4 w-4 shrink-0" />
                สร้างบัญชี
              </button>
              {createMsg ? (
                <span className="text-center text-sm font-semibold text-emerald-700 sm:text-left">{createMsg}</span>
              ) : null}
            </div>
          </form>
        ) : null}

        {loadError ? <p className="mt-4 text-sm font-medium text-rose-600">{loadError}</p> : null}

        <div className="mt-4">
          {loading ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-[#ecebff]/70" />
              ))}
            </ul>
          ) : users.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีผู้ใช้ในระบบ</AppEmptyState>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-4 py-8 text-center">
              <p className="text-sm font-medium text-[#66638c]">ไม่พบผู้ใช้ตามตัวกรอง</p>
              <button
                type="button"
                onClick={clearFilters}
                className={cn(appTemplateOutlineButtonClass, "mt-4 inline-flex min-h-[40px] items-center px-4")}
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {filteredUsers.map((u) => {
                const avatar = safeAvatarSrc(u.avatarUrl);
                const subType = u.subscriptionType ?? "DAILY";
                return (
                  <li key={u.id}>
                    <article className="group flex min-w-0 max-w-full flex-col gap-2 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white">
                      <div className="flex min-w-0 items-start gap-3">
                        <UserAvatarThumb src={avatar} username={u.username} />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
                            <p className="break-words text-sm font-black leading-snug text-[#1e1b4b]">{u.username}</p>
                            <RoleBadge role={u.role} />
                          </div>
                          <p className="mt-0.5 break-all text-xs font-semibold leading-snug text-slate-500">{u.email}</p>
                          <p className="mt-0.5 break-words text-[11px] font-bold leading-snug tabular-nums text-amber-800">
                            {u.tokens.toLocaleString()} โทเคน · {subType} · {u.subscriptionTier}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-[#f0eefc]/90 pt-2">
                        <div className="flex flex-wrap gap-1">
                          {[10, 50, 100].map((n) => (
                            <button key={n} type="button" onClick={() => void quickTopUp(u, n)} className={quickChipClass}>
                              +{n}
                            </button>
                          ))}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <UserRowIconActions
                            username={u.username}
                            onTopUp={() => openTopUp(u)}
                            onEdit={() => openEdit(u)}
                            onDelete={() => void onDelete(u.id)}
                          />
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AppDashboardSection>

      <FormModal
        open={editing != null}
        onClose={() => {
          if (!editSaving) setEditing(null);
        }}
        title="แก้ไขผู้ใช้"
        description={editing ? `${editing.username} · ${editing.email}` : undefined}
        appearance="glass"
        glassTint="violet"
        size="md"
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={editSaving}
              onClick={() => setEditing(null)}
              className="flex-1 rounded-2xl border border-white/50 bg-white/50 px-6 py-3 text-sm font-bold text-[#5f5a8a] backdrop-blur-md transition hover:bg-white/80 disabled:opacity-50 sm:flex-none sm:px-8"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="admin-user-edit-form"
              disabled={editSaving}
              className={cn(appDashboardBrandCtaPillButtonClass, "w-full sm:w-auto")}
            >
              {editSaving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        }
      >
        <form id="admin-user-edit-form" onSubmit={onSaveEdit} className="space-y-3">
          {editError ? (
            <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-3 py-2 text-sm text-rose-800">{editError}</p>
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
              onChange={(e) => setEditSubscriptionType(e.target.value as "BUFFET" | "DAILY")}
              className={inputClass}
            >
              <option value="DAILY">DAILY — สายรายวัน</option>
              <option value="BUFFET">BUFFET — เลิกใช้ (จะแปลงเป็น 199 ต่อโมดูล)</option>
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
        </form>
      </FormModal>

      <FormModal
        open={topUpUser != null}
        onClose={() => {
          if (!topUpLoading) setTopUpUser(null);
        }}
        title="เติมโทเคน"
        description={
          topUpUser ? `${topUpUser.username} — คงเหลือ ${topUpUser.tokens}` : undefined
        }
        appearance="glass"
        glassTint="violet"
        size="sm"
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={topUpLoading}
              onClick={() => setTopUpUser(null)}
              className="flex-1 rounded-2xl border border-white/50 bg-white/50 px-6 py-3 text-sm font-bold text-[#5f5a8a] backdrop-blur-md transition hover:bg-white/80 disabled:opacity-50 sm:flex-none sm:px-8"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="admin-user-topup-form"
              disabled={topUpLoading}
              className={cn(appDashboardBrandCtaPillButtonClass, "w-full sm:w-auto")}
            >
              {topUpLoading ? "กำลังบันทึก…" : "ยืนยันเติม"}
            </button>
          </div>
        }
      >
        <form id="admin-user-topup-form" onSubmit={onSubmitTopUp} className="space-y-3">
          {topUpError ? (
            <p className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-3 py-2 text-sm text-rose-800">{topUpError}</p>
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
                className={quickChipClass}
              >
                +{n}
              </button>
            ))}
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function UserAvatarThumb({ src, username }: { src: string | null; username: string }) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 shadow-sm">
      {src ? (
        <Image src={src} alt="" fill sizes="44px" className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#4d47b6]" aria-hidden>
          {initial}
        </div>
      )}
    </div>
  );
}

function UserRowIconActions({
  username,
  onTopUp,
  onEdit,
  onDelete,
}: {
  username: string;
  onTopUp: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={topUpIconBtnClass}
        aria-label={`เติมโทเคน ${username}`}
        title="เติมโทเคน"
        onClick={onTopUp}
      >
        <IconCoins className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={assetRowEditIconButtonClass}
        aria-label={`แก้ไข ${username}`}
        title="แก้ไข"
        onClick={onEdit}
      >
        <IconRowEdit className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={assetRowRemoveIconButtonClass}
        aria-label={`ลบ ${username}`}
        title="ลบ"
        onClick={onDelete}
      >
        <IconRowRemove className="h-4 w-4" />
      </button>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        role === "ADMIN" ? "bg-violet-500/15 text-violet-800 ring-1 ring-violet-300/50" : "bg-slate-500/10 text-slate-700 ring-1 ring-slate-200/80",
      )}
    >
      {role}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-[#5f5a8a]">{label}</label>
      {children}
    </div>
  );
}

function IconUsersHero({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconCoins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" strokeLinecap="round" />
      <path d="M14 14h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
