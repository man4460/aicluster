"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import {
  BUILDING_POS_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  MODULE_GROUP_TIER_NAME,
} from "@/lib/modules/config";
import { dashboardModuleCardDescription } from "@/lib/modules/dashboard-card-descriptions";
import { getModuleDailyUsageBadge } from "@/lib/modules/module-usage-badge";
import { MODULE_RESUBSCRIBE_COOLDOWN_MS } from "@/lib/modules/module-subscription-cooldown";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import { appDashboardBrandGradientBarClass, appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { isSystemMapCatalogSlug } from "@/lib/modules/system-map-catalog";
import {
  DashboardModuleHeroCard,
  dashboardModulePrimaryCtaClass,
  dashboardModuleSubscribeButtonClass,
} from "@/components/dashboard/DashboardModuleHeroCard";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { cn } from "@/lib/cn";

type ModuleCardDTO = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  groupId: number;
  cardImageUrl?: string | null;
};

type Props = {
  modules: ModuleCardDTO[];
  /** แสดงหมวด «ปัจจุบัน» (featured) — บัญชีแอดมินที่ล็อกอิน */
  isAdminCatalog?: boolean;
  showCatalogHeader?: boolean;
  backHref?: string;
  access: UserAccessFields;
  initialSubscribedIds: string[];
  /** โมดูลที่เคยเปิดทดลองแบบเก่า (ยังเหลือสิทธิ์จนกว่าจะหมดอายุ) — ไม่มีปุ่มเริ่มทดลองใหม่แล้ว */
  initialTrialIds?: string[];
  initialCooldownUnlocks?: Record<string, string>;
  /** Date.now() ตอน render บนเซิร์ฟเวอร์ — ใช้แทน Date.now() รอบแรกบนไคลเอนต์เพื่อกัน hydration mismatch ตอนเช็ค cooldown */
  hydrationReferenceMs: number;
};

function GroupIcon({ groupId, className }: { groupId: number; className?: string }) {
  if (groupId === 1) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M8 4h4v4H8zM4 8h4v4H4zM8 12h4v4H8zM12 8h4v4h-4z" />
      </svg>
    );
  }
  if (groupId === 2) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    );
  }
  if (groupId === 3) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19V9M10 19V5M16 19v-8M22 19V7" />
      </svg>
    );
  }
  if (groupId === 4) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 20l5-8 4 4 7-12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z" />
    </svg>
  );
}

function groupTone(groupId: number): { header: string; chip: string; icon: ReactNode } {
  if (groupId === 1) {
    return {
      header: "border-[#0000BF]/20 bg-[#0000BF]/[0.03] text-[#0000BF]",
      chip: "bg-[#0000BF]/10 text-[#0000BF] border-[#0000BF]/20",
      icon: <GroupIcon groupId={groupId} className="h-4 w-4" />,
    };
  }
  if (groupId === 2) {
    return {
      header: "border-slate-300 bg-slate-50 text-slate-700",
      chip: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <GroupIcon groupId={groupId} className="h-4 w-4" />,
    };
  }
  if (groupId === 3) {
    return {
      header: "border-amber-300 bg-amber-50 text-amber-800",
      chip: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <GroupIcon groupId={groupId} className="h-4 w-4" />,
    };
  }
  if (groupId === 4) {
    return {
      header: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800",
      chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
      icon: <GroupIcon groupId={groupId} className="h-4 w-4" />,
    };
  }
  return {
    header: "border-rose-300 bg-rose-50 text-rose-800",
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    icon: <GroupIcon groupId={groupId} className="h-4 w-4" />,
  };
}

/** การ์ดแนะนำส่วน «ปัจจุบัน» บนหน้าระบบทั้งหมด — แสดงเฉพาะแอดมิน */
const FEATURED_CATALOG_SLUGS = [
  BUILDING_POS_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
] as const;

/** คำอธิบายบรรทัดเดียวใต้ชื่อโมดูล — ตัดคำนำหน้ากลุ่มที่ซ้ำกับหัวข้อส่วน */
function catalogModuleDescription(m: { slug: string; description: string | null }): string {
  const fromDb = m.description?.trim();
  const raw = fromDb || dashboardModuleCardDescription(m.slug);
  const line = raw
    .split("\n")[0]
    ?.trim()
    .replace(/^กลุ่ม\s*\d+\s*\([^)]*\)\s*[—–\-:]?\s*/u, "")
    .trim();
  if (line) return line;
  const fallback = dashboardModuleCardDescription(m.slug).split("\n")[0]?.trim();
  return fallback || "—";
}

function ModuleThumb({
  url,
  fallback,
}: {
  url: string | null | undefined;
  fallback: ReactNode;
}) {
  const safe = url && isSafeModuleCardDisplayUrl(url) ? url : null;
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 shadow-sm">
      {safe ? <Image src={safe} alt="" fill sizes="44px" className="object-cover" unoptimized /> : null}
      {!safe ? <div className="flex h-full w-full items-center justify-center text-[#4d47b6]">{fallback}</div> : null}
    </div>
  );
}

export function ModuleSubscriptionBrowser({
  modules,
  isAdminCatalog = false,
  showCatalogHeader = false,
  backHref = "/dashboard",
  access,
  initialSubscribedIds,
  initialTrialIds = [],
  initialCooldownUnlocks = {},
  hydrationReferenceMs,
}: Props) {
  const router = useRouter();
  const [cooldownClockMounted, setCooldownClockMounted] = useState(false);
  useEffect(() => setCooldownClockMounted(true), []);
  const cooldownNowMs = cooldownClockMounted ? Date.now() : hydrationReferenceMs;

  const [q, setQ] = useState("");
  /** แถบแคตตาล็อก — ค่าเริ่มต้น Basic (กลุ่ม 1) */
  const [catalogTab, setCatalogTab] = useState<"free" | number>(1);
  const [savedSubscribedIds, setSavedSubscribedIds] = useState<Set<string>>(() => new Set(initialSubscribedIds));
  /** สิทธิ์เข้าโมดูลชั่วคราวจากระบบทดลองแบบเก่า (ไม่มีปุ่มเริ่มใหม่) */
  const [legacyTrialAccessIds, setLegacyTrialAccessIds] = useState<Set<string>>(() => {
    const sub = new Set(initialSubscribedIds);
    return new Set(initialTrialIds.filter((id) => !sub.has(id)));
  });
  const [cooldownUnlocks, setCooldownUnlocks] = useState<Record<string, string>>(() => ({ ...initialCooldownUnlocks }));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [pendingUnsubscribe, setPendingUnsubscribe] = useState<{ id: string; title: string } | null>(null);

  const subSyncKey = useMemo(() => [...initialSubscribedIds].sort().join(","), [initialSubscribedIds]);
  const trialSyncKey = useMemo(() => [...initialTrialIds].sort().join(","), [initialTrialIds]);

  useEffect(() => {
    setCooldownUnlocks({ ...initialCooldownUnlocks });
  }, [initialCooldownUnlocks]);

  useEffect(() => {
    setSavedSubscribedIds(new Set(initialSubscribedIds));
    const sub = new Set(initialSubscribedIds);
    setLegacyTrialAccessIds(new Set(initialTrialIds.filter((id) => !sub.has(id))));
  }, [subSyncKey, trialSyncKey, initialSubscribedIds, initialTrialIds]);

  const reachedDailyLimit = false;
  const upgradeMessage = "ระบบนี้ยังไม่อยู่ในแผนของคุณ — กรุณาอัปเกรดแพ็กเกจเพื่อใช้งาน";

  const modulesForUi = useMemo(
    () => modules.filter((m) => !isSystemMapCatalogSlug(m.slug)),
    [modules],
  );

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return modulesForUi;
    return modulesForUi.filter(
      (m) => m.title.toLowerCase().includes(t) || (m.description ?? "").toLowerCase().includes(t),
    );
  }, [modulesForUi, q]);

  const isFreeModule = useCallback(
    (m: ModuleCardDTO) => getModuleDailyUsageBadge(m.slug, m.groupId)?.tone === "free",
    [],
  );

  const freeModules = useMemo(() => rows.filter((m) => isFreeModule(m)), [isFreeModule, rows]);

  const groupIds = useMemo(
    () =>
      Array.from(new Set(rows.filter((m) => !isFreeModule(m)).map((m) => m.groupId))).sort((a, b) => a - b),
    [isFreeModule, rows],
  );

  const featuredModules = useMemo(() => {
    if (!isAdminCatalog) return [];
    if (rows.length === 0) return [];
    const bySlug = new Map(rows.map((m) => [m.slug, m]));
    const picked: ModuleCardDTO[] = [];
    for (const slug of FEATURED_CATALOG_SLUGS) {
      const m = bySlug.get(slug);
      if (m) picked.push(m);
    }
    return picked;
  }, [isAdminCatalog, rows]);

  const featuredSlugSet = useMemo(
    () => new Set(featuredModules.map((m) => m.slug)),
    [featuredModules],
  );

  useEffect(() => {
    if (catalogTab === "free") return;
    if (typeof catalogTab === "number" && groupIds.includes(catalogTab)) return;
    if (groupIds.includes(1)) setCatalogTab(1);
    else if (groupIds.length > 0) setCatalogTab(groupIds[0]!);
    else setCatalogTab("free");
  }, [catalogTab, groupIds]);

  const tabModules = useMemo(() => {
    if (catalogTab === "free") return freeModules;
    let list = rows.filter((m) => m.groupId === catalogTab && !isFreeModule(m));
    if (isAdminCatalog && featuredSlugSet.size > 0) {
      list = list.filter((m) => !featuredSlugSet.has(m.slug));
    }
    return list;
  }, [catalogTab, featuredSlugSet, freeModules, isAdminCatalog, isFreeModule, rows]);

  function activeCooldownUnlockIso(moduleId: string): string | null {
    const iso = cooldownUnlocks[moduleId];
    if (!iso) return null;
    if (new Date(iso).getTime() <= cooldownNowMs) return null;
    return iso;
  }

  async function performUnsubscribe(moduleId: string) {
    setErr(null);
    setInfoBanner(null);
    setPendingUnsubscribe(null);
    setBusyId(moduleId);
    try {
      const res = await fetch(`/api/modules/subscriptions/${moduleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "ยกเลิก Subscribe ไม่สำเร็จ");
        return;
      }
      setSavedSubscribedIds((prev) => {
        const n = new Set(prev);
        n.delete(moduleId);
        return n;
      });
      setLegacyTrialAccessIds((prev) => {
        const n = new Set(prev);
        n.delete(moduleId);
        return n;
      });
      const unlockIso = new Date(Date.now() + MODULE_RESUBSCRIBE_COOLDOWN_MS).toISOString();
      setCooldownUnlocks((prev) => ({ ...prev, [moduleId]: unlockIso }));
      setInfoBanner(
        `ยกเลิก Subscribe แล้ว — ปุ่ม Subscribe จะถูกล็อคจนถึง ${formatBangkokDateTimeLong(unlockIso)} (ครบ 1 เดือนนับจากนี้)`,
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function subscribeOnly(moduleId: string) {
    setErr(null);
    setInfoBanner(null);
    setBusyId(moduleId);
    try {
      const res = await fetch("/api/modules/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moduleId }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; unlockAt?: string };
      if (!res.ok) {
        if (j.unlockAt) {
          setCooldownUnlocks((prev) => ({ ...prev, [moduleId]: j.unlockAt! }));
        }
        setErr(j.error ?? "Subscribe ไม่สำเร็จ");
        return;
      }
      setSavedSubscribedIds((prev) => new Set(prev).add(moduleId));
      setLegacyTrialAccessIds((prev) => {
        const n = new Set(prev);
        n.delete(moduleId);
        return n;
      });
      setCooldownUnlocks((prev) => {
        const n = { ...prev };
        delete n[moduleId];
        return n;
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 sm:space-y-6">
      <section className="app-surface min-w-0 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-3.5 sm:p-5">
        <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
        {showCatalogHeader ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Catalog</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">ระบบทั้งหมด</h1>
            </div>
            <Link
              href={backHref}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-4 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99]"
              aria-label="กลับ"
            >
              <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              กลับ
            </Link>
          </div>
        ) : null}

        <div className="mt-4 flex min-w-0 flex-col gap-3">
          <label className="flex h-10 w-full min-w-0 cursor-text items-center gap-2.5 rounded-xl bg-[#f3f2fa]/90 px-3 transition focus-within:bg-[#eeedf8] focus-within:ring-2 focus-within:ring-[#5b61ff]/20">
            <svg
              className="h-4 w-4 shrink-0 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              suppressHydrationWarning
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาระบบ..."
              aria-label="ค้นหาระบบ"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold text-[#2e2a58] outline-none placeholder:text-slate-400 focus:ring-0"
            />
          </label>

          <div
            className="flex gap-1 overflow-x-auto rounded-2xl border border-indigo-100/90 bg-white/90 p-1 shadow-sm ring-1 ring-indigo-100/60 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="หมวดแคตตาล็อกโมดูล"
          >
            <button
              type="button"
              role="tab"
              aria-selected={catalogTab === "free"}
              suppressHydrationWarning
              onClick={() => setCatalogTab("free")}
              className={cn(
                "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:text-sm",
                catalogTab === "free"
                  ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md shadow-indigo-400/25")
                  : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
              )}
            >
              โมดูลฟรี
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                  catalogTab === "free" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {freeModules.length}
              </span>
            </button>
            {groupIds.map((gid) => {
              const active = catalogTab === gid;
              const count = rows.filter((m) => m.groupId === gid && !isFreeModule(m)).length;
              const label = MODULE_GROUP_TIER_NAME[gid] ?? `กลุ่ม ${gid}`;
              return (
                <button
                  key={`tab-g-${gid}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  suppressHydrationWarning
                  onClick={() => setCatalogTab(gid)}
                  className={cn(
                    "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:text-sm",
                    active
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md shadow-indigo-400/25")
                      : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {infoBanner ? (
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-xs font-bold text-sky-800">
            {infoBanner}
          </div>
        ) : null}

        {err ? (
          <div className="mt-2 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2 text-xs font-bold text-red-800">
            {err}
          </div>
        ) : null}
      </section>

      {isAdminCatalog && q.trim().length === 0 && featuredModules.length > 0 ? (
        <section className="app-surface min-w-0 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">ปัจจุบัน</p>
            <span className="rounded-lg border border-white/70 bg-white/80 px-2 py-0.5 text-[10px] font-black text-[#2e2a58]">
              {featuredModules.length}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {featuredModules.map((m) => {
              const subscribed = savedSubscribedIds.has(m.id);
              const legacyTrialAccess = !subscribed && legacyTrialAccessIds.has(m.id);
              const hasAccess = subscribed || legacyTrialAccess;
              const unlocked = canAccessAppModule(access, { slug: m.slug, groupId: m.groupId });
              const cooldownIso = activeCooldownUnlockIso(m.id);
              const lockedByCooldown = !subscribed && cooldownIso !== null;
              const lockedByDailyLimit = !subscribed && !lockedByCooldown && reachedDailyLimit;
              const showCooldownLock = lockedByCooldown;
              const showDailyLock = lockedByDailyLimit;

              return (
                <DashboardModuleHeroCard
                  key={`featured-${m.id}`}
                  tall={false}
                  imageUrl={m.cardImageUrl}
                  groupId={m.groupId}
                  title={m.title}
                  description={catalogModuleDescription(m)}
                  usageBadge={getModuleDailyUsageBadge(m.slug, m.groupId)}
                  footer={
                    <div className="space-y-2">
                      {hasAccess ? (
                        <Link
                          href={dashboardModuleHref(m.slug)}
                          className={cn(dashboardModulePrimaryCtaClass, "!min-h-[40px] !rounded-xl !text-sm")}
                        >
                          เข้าใช้งาน
                        </Link>
                      ) : showCooldownLock || showDailyLock ? (
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() =>
                            setErr(
                              showCooldownLock
                                ? `ระบบถูกล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)}`
                                : upgradeMessage,
                            )
                          }
                          className="app-tap-feedback w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                        >
                          Locked
                        </button>
                      ) : (
                        <button
                          type="button"
                          suppressHydrationWarning
                          disabled={busyId === m.id || !unlocked}
                          onClick={() => void subscribeOnly(m.id)}
                          className={cn(dashboardModuleSubscribeButtonClass, "app-tap-feedback !min-h-[40px] !rounded-xl !py-2")}
                        >
                          {busyId === m.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="app-inline-spinner !h-3 !w-3" aria-hidden />
                              <span>กำลังสมัคร...</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="text-sm">+</span>
                              <span>Subscribe</span>
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="app-surface min-w-0 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[10px] font-black tracking-[0.12em] text-[#66638c]">
            {catalogTab === "free" ? (
              <span className="uppercase tracking-[0.2em]">โมดูลฟรี</span>
            ) : (
              <>
                <span className="uppercase tracking-[0.2em]">
                  {MODULE_GROUP_TIER_NAME[catalogTab] ?? `กลุ่ม ${catalogTab}`}
                </span>
                <span className="ml-1.5 font-black normal-case tracking-normal text-[#5f5a8a]">
                  {catalogTab === 1 ? "1 บาท/วัน" : "รวมแพ็กเกจ"}
                </span>
              </>
            )}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black",
              catalogTab === "free"
                ? "border-emerald-200/60 bg-emerald-50/80 text-emerald-800"
                : groupTone(typeof catalogTab === "number" ? catalogTab : 1).chip,
            )}
          >
            {tabModules.length}
          </span>
        </div>

        {tabModules.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#d8d6ec] bg-[#faf9ff]/70 px-3 py-8 text-center text-xs font-semibold text-[#66638c]">
            {q.trim() ? "ไม่พบระบบตามคำค้น" : "ยังไม่มีโมดูลในหมวดนี้"}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {tabModules.map((m) => {
              const subscribed = savedSubscribedIds.has(m.id);
              const legacyTrialAccess = !subscribed && legacyTrialAccessIds.has(m.id);
              const hasAccess = subscribed || legacyTrialAccess || isFreeModule(m);
              const unlocked = canAccessAppModule(access, { slug: m.slug, groupId: m.groupId });
              const cooldownIso = activeCooldownUnlockIso(m.id);
              const lockedByCooldown = !subscribed && cooldownIso !== null;
              const lockedByDailyLimit = !subscribed && !lockedByCooldown && reachedDailyLimit;
              const rowClass =
                "group flex w-full min-w-0 max-w-full items-center gap-3 rounded-xl border border-white/70 bg-white/85 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white active:scale-[0.99]";
              const subtitle = catalogModuleDescription(m);

              const body = (
                <>
                  <ModuleThumb
                    url={m.cardImageUrl}
                    fallback={<GroupIcon groupId={m.groupId} className="h-5 w-5" />}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#1e1b4b]">{m.title}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
                  </div>
                  <span className="text-slate-300 transition group-hover:text-[#5b61ff]" aria-hidden>
                    →
                  </span>
                </>
              );

              if (hasAccess) {
                return (
                  <Link key={m.id} href={dashboardModuleHref(m.slug)} className={rowClass}>
                    {body}
                  </Link>
                );
              }

              if (lockedByCooldown || lockedByDailyLimit) {
                return (
                  <button
                    key={m.id}
                    type="button"
                    suppressHydrationWarning
                    className={rowClass}
                    onClick={() =>
                      setErr(
                        lockedByCooldown
                          ? `ระบบถูกล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)}`
                          : upgradeMessage,
                      )
                    }
                  >
                    {body}
                  </button>
                );
              }

              return (
                <button
                  key={m.id}
                  type="button"
                  suppressHydrationWarning
                  disabled={busyId === m.id || !unlocked}
                  className={cn(rowClass, "disabled:opacity-50")}
                  onClick={() => void subscribeOnly(m.id)}
                >
                  {body}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {pendingUnsubscribe ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsub-confirm-title"
        >
          <div className="app-surface-strong w-full max-w-md rounded-2xl p-5 shadow-xl">
            <h2 id="unsub-confirm-title" className="text-base font-bold text-slate-900">
              ยืนยันยกเลิก Subscribe
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              คุณกำลังจะยกเลิก Subscribe ระบบ <span className="font-semibold text-slate-800">{pendingUnsubscribe.title}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-amber-900">
              หลังยกเลิกแล้ว คุณจะสามารถกลับมา Subscribe ระบบนี้ได้อีกครั้งเมื่อครบ{" "}
              <span className="font-semibold">1 เดือน (30 วัน)</span> นับจากวันที่ยกเลิก
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                suppressHydrationWarning
                className="app-btn-soft app-tap-feedback rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => setPendingUnsubscribe(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                suppressHydrationWarning
                disabled={busyId === pendingUnsubscribe.id}
                className="app-tap-feedback rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => void performUnsubscribe(pendingUnsubscribe.id)}
              >
                ยืนยันยกเลิก Subscribe
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
