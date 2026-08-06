"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { downloadAdminExcel } from "@/lib/admin/export-excel";
import { cn } from "@/lib/cn";

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

const unlockIconBtnClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 active:opacity-90 disabled:opacity-50",
);

const inputClass =
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [rows, setRows] = useState<CooldownRow[]>([]);
  const [allEntries, setAllEntries] = useState<AllEntry[]>([]);

  const filtersActive = filterText.trim().length > 0;

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

  function onExportExcel() {
    downloadAdminExcel({
      filename: "admin-module-cooldowns",
      sheetName: "ปลดล็อค",
      headers: ["Email", "ผู้ใช้", "ระบบ", "slug", "ยกเลิกเมื่อ", "ปลดล็อคได้เมื่อ"],
      rows: filteredAll.map((e) => [
        e.email,
        e.username,
        e.moduleTitle,
        e.slug,
        formatTh(e.unsubscribedAtIso),
        formatTh(e.unlockAtIso),
      ]),
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-6",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
            aria-hidden
          >
            <IconLockClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
              <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                ปลดล็อค Subscribe
              </span>
            </h1>
          </div>
        </div>
      </section>

      {err ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
          {err}
        </p>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="รายการล็อคทั้งหมด"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6]",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:ml-1 sm:inline">{filterOpen ? "ซ่อนกรอง" : "กรอง"}</span>
                {filtersActive ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white" aria-hidden />
                ) : null}
              </button>
              <button
                type="button"
                onClick={onExportExcel}
                disabled={loadingAll || filteredAll.length === 0}
                aria-label="Export Excel"
                title="Export Excel"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-50",
                )}
              >
                <IconExcel className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                disabled={loadingAll}
                onClick={() => void loadAll()}
                aria-busy={loadingAll}
                aria-label="รีเฟรชรายการล็อค"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-4",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] shadow-sm hover:bg-white disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0", loadingAll && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        {filterOpen ? (
          <div className="mt-4 flex flex-col gap-2 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/45 to-indigo-50/15 p-4 ring-1 ring-inset ring-white/40 backdrop-blur-md sm:rounded-[2rem]">
            <label className="text-xs font-bold text-[#5f5a8a]" htmlFor="cooldown-filter-input">
              กรองรายการ (email / ชื่อผู้ใช้ / ระบบ)
            </label>
            <input
              id="cooldown-filter-input"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="พิมพ์เพื่อกรอง…"
              className={inputClass}
              autoComplete="off"
            />
            <p className="text-xs text-[#66638c]">
              {loadingAll ? "กำลังโหลด…" : `ทั้งหมด ${allEntries.length} รายการ · แสดง ${filteredAll.length} รายการ`}
            </p>
          </div>
        ) : null}

        <div className="mt-4">
          {loadingAll ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-[#ecebff]/70" />
              ))}
            </ul>
          ) : filteredAll.length === 0 ? (
            <AppEmptyState tone="violet">
              {allEntries.length === 0 ? "ไม่มีรายการล็อคในขณะนี้" : "ไม่พบรายการที่ตรงกับการกรอง"}
            </AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {filteredAll.map((e) => {
                const key = `${e.userId}:${e.moduleId}`;
                const letter = (e.moduleTitle.trim().charAt(0) || "?").toUpperCase();
                return (
                  <li key={key}>
                    <article className="group flex min-w-0 max-w-full items-center gap-3 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 text-sm font-black text-[#4d47b6] shadow-sm">
                        {letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#1e1b4b]">{e.moduleTitle}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {e.username} · {e.email}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] tabular-nums text-[#66638c]">
                          ยกเลิก {formatTh(e.unsubscribedAtIso)} · ปลดได้ {formatTh(e.unlockAtIso)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={unlocking === key}
                        onClick={() => void unlockByUserId(e.userId, e.moduleId)}
                        className={unlockIconBtnClass}
                        aria-label={`ปลดล็อค ${e.moduleTitle} ของ ${e.username}`}
                        title="ปลดล็อค"
                      >
                        {unlocking === key ? (
                          <IconSpinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconKeyUnlock className="h-4 w-4" />
                        )}
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader tone="violet" title="ค้นหาตามผู้ใช้" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-bold text-[#5f5a8a]" htmlFor="cooldown-email-search">
              Email
            </label>
            <input
              id="cooldown-email-search"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingSearch}
              onClick={() => void searchByEmail()}
              className={cn(appDashboardBrandCtaPillButtonClass, "min-h-[48px] px-6")}
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
              className={cn(appTemplateOutlineButtonClass, "min-h-[48px] px-5")}
            >
              ล้างการค้นหา
            </button>
          </div>
        </div>

        {user ? (
          <div className="mt-5 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/50 to-indigo-50/20 p-4 ring-1 ring-inset ring-white/45 backdrop-blur-md sm:rounded-[2rem] sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-black text-[#1e1b4b]">{user.username}</p>
              <p className="text-sm text-[#66638c]">{user.email}</p>
            </div>
            {rows.length === 0 ? (
              <p className="mt-3 text-sm text-[#66638c]">ไม่มีรายการล็อค Subscribe หลัง Unsubscribe</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {rows.map((r) => {
                  const k = `${user.id}:${r.moduleId}`;
                  return (
                    <li
                      key={r.moduleId}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/55 bg-white/50 px-3 py-3 backdrop-blur-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#2e2a58]">{r.title}</p>
                        <p className="mt-0.5 text-xs text-[#66638c]">ปลดได้เมื่อ {formatTh(r.unlockAtIso)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={unlocking === k}
                        onClick={() => unlockFromUserSearch(r.moduleId)}
                        className={unlockIconBtnClass}
                        aria-label={`ปลดล็อค ${r.title}`}
                        title="ปลดล็อค Subscribe"
                      >
                        {unlocking === k ? (
                          <IconSpinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconKeyUnlock className="h-4 w-4" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </AppDashboardSection>
    </div>
  );
}

function IconLockClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round" />
      <path d="M12 15v2" strokeLinecap="round" />
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

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExcel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M8.5 17l3-4-3-4M12.5 9H15M12.5 17H15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconKeyUnlock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2 11.4 11.6M15.5 7.5l3 3L21 7l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
