"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
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
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
              หลัง Unsubscribe ระบบล็อคการ Subscribe โมดูลเดิมประมาณ 1 เดือน — แอดมินสามารถปลดล็อคให้ผู้ใช้กด Subscribe ได้ทันที
            </p>
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
          description="กรองตาม email ชื่อผู้ใช้ หรือชื่อระบบ — ปลดล็อคทีละรายการ"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ปิดตัวกรอง" : "เปิดตัวกรอง"}
                title="ตัวกรอง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 md:hidden sm:min-w-0 sm:gap-2 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6]",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">ตัวกรอง</span>
                {filtersActive ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white" aria-hidden />
                ) : null}
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

        <div
          className={cn(
            "mt-4 flex flex-col gap-2 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/45 to-indigo-50/15 p-4 ring-1 ring-inset ring-white/40 backdrop-blur-md sm:rounded-[2rem]",
            filterOpen ? "flex" : "hidden md:flex",
          )}
        >
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

        {!loadingAll ? (
          <>
            <div className="mt-4 hidden overflow-hidden rounded-[1.25rem] border border-[#e8e6fc] md:block md:rounded-[2rem]">
              {filteredAll.length === 0 ? (
                <div className="p-4">
                  <AppEmptyState tone="violet">
                    {allEntries.length === 0 ? "ไม่มีรายการล็อคในขณะนี้" : "ไม่พบรายการที่ตรงกับการกรอง"}
                  </AppEmptyState>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e6fc] bg-[#faf9ff]/90 text-[11px] font-black uppercase tracking-wide text-[#66638c]">
                        <th className="px-4 py-3 font-black">Email</th>
                        <th className="px-4 py-3 font-black">ผู้ใช้</th>
                        <th className="px-4 py-3 font-black">ระบบ</th>
                        <th className="px-4 py-3 font-black">ยกเลิกเมื่อ</th>
                        <th className="px-4 py-3 font-black">ปลดล็อคได้เมื่อ</th>
                        <th className="px-4 py-3 text-right font-black">การทำงาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAll.map((e) => {
                        const key = `${e.userId}:${e.moduleId}`;
                        return (
                          <tr key={key} className="border-b border-[#f0eefc]/90 transition-colors last:border-0 hover:bg-white/60">
                            <td className="px-4 py-3 text-[#1e1b4b]">{e.email}</td>
                            <td className="px-4 py-3 text-[#5f5a8a]">{e.username}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-[#2e2a58]">{e.moduleTitle}</span>
                              <span className="mt-0.5 block font-mono text-[10px] text-[#66638c]">{e.slug}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#66638c]">
                              {formatTh(e.unsubscribedAtIso)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#66638c]">
                              {formatTh(e.unlockAtIso)}
                            </td>
                            <td className="px-4 py-3 text-right">
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {filteredAll.length === 0 ? (
                <AppEmptyState tone="violet">
                  {allEntries.length === 0 ? "ไม่มีรายการล็อคในขณะนี้" : "ไม่พบรายการที่ตรงกับการกรอง"}
                </AppEmptyState>
              ) : (
                filteredAll.map((e) => {
                  const key = `${e.userId}:${e.moduleId}`;
                  return (
                    <article
                      key={key}
                      className={cn(
                        "overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/55 via-white/30 to-indigo-50/20 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#1e1b4b]">{e.moduleTitle}</p>
                          <p className="mt-0.5 font-mono text-xs text-[#66638c]">{e.slug}</p>
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
                      </div>
                      <div className="mt-3 space-y-2 rounded-[1rem] border border-white/50 bg-white/40 px-3 py-3 text-sm backdrop-blur-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">ผู้ใช้</span>
                          <span className="truncate text-right font-semibold text-[#2e2a58]">{e.username}</span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-white/50 pt-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">Email</span>
                          <span className="truncate text-right text-xs text-[#5f5a8a]">{e.email}</span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-white/50 pt-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">ยกเลิกเมื่อ</span>
                          <span className="text-right text-[11px] tabular-nums text-[#66638c]">{formatTh(e.unsubscribedAtIso)}</span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-white/50 pt-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">ปลดได้เมื่อ</span>
                          <span className="text-right text-[11px] tabular-nums text-[#4d47b6]">{formatTh(e.unlockAtIso)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-[#ecebff]/70" />
            ))}
          </div>
        )}
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ค้นหาตามผู้ใช้"
          description="ใส่ email แล้วกดค้นหา — แสดงเฉพาะล็อคของผู้ใช้นั้น"
        />
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
