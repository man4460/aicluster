"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule, canStartTrialForModule, type UserAccessFields } from "@/lib/modules/access";
import { MODULE_RESUBSCRIBE_COOLDOWN_MS } from "@/lib/modules/module-subscription-cooldown";
import { isSystemMapCatalogSlug } from "@/lib/modules/system-map-catalog";
import {
  DashboardModuleHeroCard,
  dashboardModulePrimaryButtonCore,
  dashboardModulePrimaryCtaClass,
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
  access: UserAccessFields;
  initialSubscribedIds: string[];
  initialTrialIds?: string[];
  initialCooldownUnlocks?: Record<string, string>;
  /** Date.now() ตอน render บนเซิร์ฟเวอร์ — ใช้แทน Date.now() รอบแรกบนไคลเอนต์เพื่อกัน hydration mismatch ตอนเช็ค cooldown */
  hydrationReferenceMs: number;
};

function groupTone(groupId: number): { header: string; chip: string; icon: string } {
  if (groupId === 1) {
    return {
      header: "border-[#0000BF]/20 bg-[#0000BF]/[0.03] text-[#0000BF]",
      chip: "bg-[#0000BF]/10 text-[#0000BF] border-[#0000BF]/20",
      icon: "🧩",
    };
  }
  if (groupId === 2) {
    return {
      header: "border-slate-300 bg-slate-50 text-slate-700",
      chip: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "⚙️",
    };
  }
  if (groupId === 3) {
    return {
      header: "border-amber-300 bg-amber-50 text-amber-800",
      chip: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "📊",
    };
  }
  if (groupId === 4) {
    return {
      header: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800",
      chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
      icon: "🛠️",
    };
  }
  return {
    header: "border-rose-300 bg-rose-50 text-rose-800",
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    icon: "✨",
  };
}

export function ModuleSubscriptionBrowser({
  modules,
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
  const [trialIds, setTrialIds] = useState<Set<string>>(() => new Set(initialTrialIds));
  const [cooldownUnlocks, setCooldownUnlocks] = useState<Record<string, string>>(() => ({ ...initialCooldownUnlocks }));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [pendingUnsubscribe, setPendingUnsubscribe] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    setCooldownUnlocks({ ...initialCooldownUnlocks });
  }, [initialCooldownUnlocks]);

  const isDailyPlan = access.role !== "ADMIN" && access.subscriptionType !== "BUFFET";
  const reachedDailyLimit = isDailyPlan && savedSubscribedIds.size >= 1;
  const upgradeMessage = "สายรายวันเลือกได้เพียง 1 ระบบ กรุณาเปลี่ยนแพ็กเกจเพื่อเพิ่มระบบ";

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return modules;
    return modules.filter((m) => m.title.toLowerCase().includes(t) || (m.description ?? "").toLowerCase().includes(t));
  }, [modules, q]);

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
      setTrialIds((prev) => {
        const n = new Set(prev);
        n.delete(moduleId);
        return n;
      });
      const unlockIso = new Date(Date.now() + MODULE_RESUBSCRIBE_COOLDOWN_MS).toISOString();
      setCooldownUnlocks((prev) => ({ ...prev, [moduleId]: unlockIso }));
      setInfoBanner(
        `ยกเลิก Subscribe แล้ว — ปุ่ม Subscribe จะถูกล็อคจนถึง ${formatBangkokDateTimeLong(unlockIso)} (ครบ 1 เดือนนับจากนี้) ยังกด “ทดลองใช้งาน” ได้หากแพ็กเกจอนุญาต`,
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
      setTrialIds((prev) => {
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

  async function startTrialMode(moduleId: string) {
    setErr(null);
    setInfoBanner(null);
    setBusyId(moduleId);
    try {
      const res = await fetch("/api/modules/trial", {
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
        setErr(j.error ?? "เปิดโหมดทดลองไม่สำเร็จ");
        return;
      }
      setTrialIds((prev) => new Set(prev).add(moduleId));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function stopTrialMode(moduleId: string) {
    setErr(null);
    setBusyId(moduleId);
    try {
      const res = await fetch(`/api/modules/trial/${moduleId}`, { method: "DELETE", credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "หยุดโหมดทดลองไม่สำเร็จ");
        return;
      }
      setTrialIds((prev) => {
        const n = new Set(prev);
        n.delete(moduleId);
        return n;
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="app-surface rounded-2xl bg-gradient-to-r from-[#0000BF]/[0.05] via-white to-sky-100/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาระบบ..."
            className="app-input w-full rounded-xl px-3 py-2 text-sm outline-none sm:max-w-xs"
          />
          <p className="text-xs text-slate-600">
            สายรายวัน Subscribe ได้ 1 ระบบ — ระบบอื่นยังกด “ทดลองใช้งาน” เพื่อลองก่อนตัดสินใจอัปเกรดแพ็กเกจได้
          </p>
        </div>
        {infoBanner ? (
          <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">{infoBanner}</p>
        ) : null}
        {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
      </div>

      {Array.from(new Set(rows.map((m) => m.groupId)))
        .sort((a, b) => a - b)
        .map((gid) => {
          const items = rows.filter((m) => m.groupId === gid);
          const tone = groupTone(gid);
          return (
            <section key={gid} className="space-y-3">
              <div
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold ${tone.header}`}
              >
                <span>กลุ่ม {gid}</span>
                <span aria-hidden className="text-base leading-none">
                  {tone.icon}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => {
                  if (isSystemMapCatalogSlug(m.slug)) {
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
                          <>
                            <Link href="/dashboard/explore" className={dashboardModulePrimaryCtaClass}>
                              เปิดแผนผังระบบ
                            </Link>
                            <p className="text-center text-[11px] text-slate-500">
                              ไม่ต้อง Subscribe — ดูภาพรวมและทางลัดเข้าระบบ
                            </p>
                          </>
                        }
                      />
                    );
                  }

                  const subscribed = savedSubscribedIds.has(m.id);
                  const trialing = !subscribed && trialIds.has(m.id);
                  const unlocked = canAccessAppModule(access, { slug: m.slug, groupId: m.groupId });
                  const trialAllowed = canStartTrialForModule(access, { slug: m.slug, groupId: m.groupId });
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
                        <>
                          <div className="flex flex-wrap gap-2">
                            {subscribed ? (
                              <button
                                type="button"
                                disabled={busyId === m.id}
                                onClick={() => setPendingUnsubscribe({ id: m.id, title: m.title })}
                                className="flex-1 min-w-[6.5rem] rounded-xl border border-red-400/45 bg-red-950/45 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-950/60 disabled:opacity-50"
                              >
                                Unsubscribe
                              </button>
                            ) : showCooldownLock ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setErr(
                                    `ระบบนี้ถูกล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)} กรุณารอครบ 1 เดือนหลังยกเลิก Subscribe ก่อน Subscribe ใหม่`,
                                  )
                                }
                                className="flex-1 min-w-[6.5rem] rounded-xl border border-amber-400/45 bg-amber-950/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-950/50"
                              >
                                🔒 ล็อค
                              </button>
                            ) : showDailyLock ? (
                              <button
                                type="button"
                                onClick={() => setErr(upgradeMessage)}
                                className="flex-1 min-w-[6.5rem] rounded-xl border border-amber-400/45 bg-amber-950/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-950/50"
                              >
                                🔒 ล็อค
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === m.id || !unlocked}
                                onClick={() => void subscribeOnly(m.id)}
                                className="flex-1 min-w-[6.5rem] rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1e1b4b] shadow-md hover:bg-white/90 disabled:opacity-50"
                              >
                                Subscribe
                              </button>
                            )}
                            {!subscribed ? (
                              trialing ? (
                                <button
                                  type="button"
                                  disabled={busyId === m.id}
                                  onClick={() => void stopTrialMode(m.id)}
                                  className="rounded-xl border border-amber-400/45 bg-amber-950/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-950/50 disabled:opacity-50"
                                >
                                  หยุดทดลอง
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busyId === m.id || !trialAllowed}
                                  onClick={() => void startTrialMode(m.id)}
                                  className="rounded-xl border border-sky-400/45 bg-sky-950/35 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-950/50 disabled:opacity-50"
                                >
                                  ทดลองใช้งาน
                                </button>
                              )
                            ) : null}
                            {subscribed || trialing ? (
                              <Link
                                href={dashboardModuleHref(m.slug)}
                                className="inline-flex flex-1 min-w-[6.5rem] items-center justify-center rounded-xl border border-white/40 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25"
                              >
                                เข้าใช้งาน
                              </Link>
                            ) : null}
                          </div>
                          {trialing ? (
                            <p className="text-[11px] text-amber-800/90">
                              โหมดทดลองใช้งาน: สิทธิ์ชั่วคราวในเมม — กด “เข้าใช้งาน” เพื่อเข้าระบบ
                            </p>
                          ) : null}
                          {!subscribed && !trialing ? (
                            <p className="text-[11px] text-slate-500">
                              {showCooldownLock
                                ? `Subscribe ถูกล็อคจนถึง ${formatBangkokDateTimeLong(cooldownIso!)} — ยังกด “ทดลองใช้งาน” ได้`
                                : showDailyLock
                                  ? "Subscribe ได้อีกเมื่ออัปเกรดแพ็กเกจ — ยังทดลองระบบนี้ได้ด้านข้าง"
                                  : "ต้อง Subscribe ก่อน หรือกดทดลองใช้งานเพื่อเปิดระบบชั่วคราว"}
                            </p>
                          ) : null}
                        </>
                      }
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

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
            <p className="mt-2 text-sm text-slate-600">
              ระหว่างนี้ปุ่ม Subscribe จะถูกล็อคจนกว่าจะครบกำหนด — ยังทดลองใช้งานได้ (หากแพ็กเกจอนุญาต)
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="app-btn-soft rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => setPendingUnsubscribe(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={busyId === pendingUnsubscribe.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
