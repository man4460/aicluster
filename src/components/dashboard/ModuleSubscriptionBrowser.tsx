"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { MODULE_RESUBSCRIBE_COOLDOWN_MS } from "@/lib/modules/module-subscription-cooldown";
import { isSystemMapCatalogSlug } from "@/lib/modules/system-map-catalog";
import {
  DashboardModuleHeroCard,
  dashboardModulePrimaryCtaClass,
  dashboardModuleSubscribeButtonClass,
} from "@/components/dashboard/DashboardModuleHeroCard";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";

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
  /** แสดงการ์ดแผนผังระบบ — ต้องตรงกับบัญชีแอดมินที่ล็อกอิน (ส่งจากเซิร์ฟเวอร์) */
  showSystemMapCatalog?: boolean;
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

export function ModuleSubscriptionBrowser({
  modules,
  showSystemMapCatalog = false,
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

  const isDailyPlan = access.role !== "ADMIN" && access.subscriptionType !== "BUFFET";
  const reachedDailyLimit = isDailyPlan && savedSubscribedIds.size >= 1;
  const upgradeMessage = "สายรายวันเลือกได้เพียง 1 ระบบ กรุณาเปลี่ยนแพ็กเกจเพื่อเพิ่มระบบ";

  const modulesForUi = useMemo(
    () =>
      showSystemMapCatalog ? modules : modules.filter((m) => !isSystemMapCatalogSlug(m.slug)),
    [modules, showSystemMapCatalog],
  );

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return modulesForUi;
    return modulesForUi.filter(
      (m) => m.title.toLowerCase().includes(t) || (m.description ?? "").toLowerCase().includes(t),
    );
  }, [modulesForUi, q]);

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
    <div className="space-y-8">
      {/* Search and Info Header */}
      <div className="sticky top-0 z-10 -mx-1 px-1 pt-2 pb-4">
        <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl ring-1 ring-slate-200/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาระบบที่คุณสนใจ..."
                className="app-input w-full rounded-2xl border-slate-200/60 bg-white/50 pl-10 pr-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold text-[#66638c] uppercase tracking-wider">
                {isDailyPlan ? "Daily Plan: 1 Module Max" : "Buffet Plan: Unlimited Access"}
              </p>
            </div>
          </div>
          
          {infoBanner ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-[13px] text-sky-800 backdrop-blur-sm">
              <span className="mt-0.5 text-lg">ℹ️</span>
              <p className="leading-relaxed">{infoBanner}</p>
            </div>
          ) : null}
          
          {err ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-3 text-[13px] text-red-800 backdrop-blur-sm">
              <span className="mt-0.5 text-lg">⚠️</span>
              <p className="leading-relaxed">{err}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Grouped Modules */}
      <div className="space-y-12">
        {Array.from(new Set(rows.map((m) => m.groupId)))
          .sort((a, b) => a - b)
          .map((gid) => {
            const items = rows.filter((m) => m.groupId === gid);
            const tone = groupTone(gid);
            return (
              <section key={gid} className="relative space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/80 backdrop-blur-md", tone.chip)}>
                    {tone.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black tracking-tight text-[#1e1b4b]">
                      Group {gid}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                      {items.length} Modules Available
                    </p>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {items.map((m) => {
                    if (showSystemMapCatalog && isSystemMapCatalogSlug(m.slug)) {
                      return (
                        <DashboardModuleHeroCard
                          key={m.id}
                          variant="systemMap"
                          tall
                          imageUrl={m.cardImageUrl}
                          groupId={m.groupId}
                          title={m.title}
                          description={m.description ?? ""}
                          footer={
                            <div className="space-y-3">
                              <Link href="/dashboard/explore" className={dashboardModulePrimaryCtaClass}>
                                เปิดแผนผังระบบ
                              </Link>
                              <p className="text-center text-[10px] font-medium text-slate-500 italic">
                                * ไม่ต้อง Subscribe — ดูภาพรวมและทางลัดเข้าระบบ
                              </p>
                            </div>
                          }
                        />
                      );
                    }

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
                        key={m.id}
                        tall
                        imageUrl={m.cardImageUrl}
                        groupId={m.groupId}
                        title={m.title}
                        description={m.description ?? "—"}
                        footer={
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {subscribed ? (
                                <button
                                  type="button"
                                  disabled={busyId === m.id}
                                  onClick={() => setPendingUnsubscribe({ id: m.id, title: m.title })}
                                  className="app-tap-feedback flex-1 min-w-[6.5rem] rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                >
                                  {busyId === m.id ? (
                                    <span className="inline-flex items-center gap-2">
                                      <span className="app-inline-spinner !h-3 !w-3" aria-hidden />
                                      <span>ยกเลิก...</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 justify-center">
                                      <span className="text-sm">✕</span>
                                      <span>Unsubscribe</span>
                                    </span>
                                  )}
                                </button>
                              ) : showCooldownLock || showDailyLock ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setErr(showCooldownLock ? `ระบบถูกล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)}` : upgradeMessage)
                                  }
                                  className="app-tap-feedback flex-1 min-w-[6.5rem] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                                >
                                  <span className="inline-flex items-center gap-1.5 justify-center">
                                    <span className="text-sm">🔒</span>
                                    <span>Locked</span>
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busyId === m.id || !unlocked}
                                  onClick={() => void subscribeOnly(m.id)}
                                  className={cn(dashboardModuleSubscribeButtonClass, "app-tap-feedback !rounded-xl !py-2.5")}
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
                              
                              {hasAccess && (
                                <Link
                                  href={dashboardModuleHref(m.slug)}
                                  className="app-tap-feedback flex-1 min-w-[6.5rem] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-sm">↗</span>
                                    <span>เข้าใช้งาน</span>
                                  </span>
                                </Link>
                              )}
                            </div>
                            
                            {legacyTrialAccess && (
                              <div className="rounded-lg bg-amber-50/80 px-2.5 py-1.5 ring-1 ring-amber-100">
                                <p className="text-[10px] leading-tight font-medium text-amber-800">
                                  ⚠️ สิทธิ์เข้าชมชั่วคราวจากระบบเก่า — Subscribe เพื่อใช้งานเต็มรูปแบบ
                                </p>
                              </div>
                            )}

                            {!hasAccess && (
                              <p className="text-center text-[11px] font-medium text-slate-400">
                                {showCooldownLock
                                  ? `ล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)}`
                                  : showDailyLock
                                    ? "สมัครเพิ่มได้เมื่ออัปเกรดแพ็กเกจ"
                                    : "สมัครเพื่อเปิดใช้งานระบบนี้"}
                              </p>
                            )}
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>

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
                className="app-btn-soft app-tap-feedback rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => setPendingUnsubscribe(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
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
