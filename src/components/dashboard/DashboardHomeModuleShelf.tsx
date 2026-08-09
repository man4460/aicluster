"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import type { ModuleUsageBadge } from "@/lib/modules/module-usage-badge";
import { cn } from "@/lib/cn";

type HomeModule = {
  id: string;
  slug: string;
  title: string;
  groupId: number;
  imageUrl: string | null;
  href: string;
  usageBadge: ModuleUsageBadge | null;
};

const PINNED_KEY = "mawell.dashboard.home.pinned.v1";
const RECENT_KEY = "mawell.dashboard.home.recent.v1";
const DEFAULT_PINNED_COUNT = 4;
const RECENT_LIMIT = 10;
const PINNED_LIMIT = 24;

type ShelfTab = "recent" | "pinned";

function safeReadJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function safeWriteJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function parseSlugList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function UsagePill({ badge }: { badge: ModuleUsageBadge }) {
  if (badge.tone === "free") {
    return (
      <span className="rounded-lg border border-emerald-300/55 bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
        ฟรี
      </span>
    );
  }
  if (badge.tone === "monthly") {
    return (
      <span className="rounded-lg border border-amber-200/70 bg-amber-300/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#1a0d3a] shadow-sm">
        {badge.label}
      </span>
    );
  }
  return (
    <span className="rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-2 py-0.5 text-[10px] font-black tracking-wide text-[#2e2a58] shadow-sm">
      {badge.label}
    </span>
  );
}

function CompactModuleCard({
  module,
  pinned,
  shelfTab,
  onTogglePinned,
  onVisit,
}: {
  module: HomeModule;
  pinned: boolean;
  shelfTab: ShelfTab;
  onTogglePinned: (slug: string) => void;
  onVisit: (slug: string) => void;
}) {
  const safeImage = module.imageUrl && isSafeModuleCardDisplayUrl(module.imageUrl) ? module.imageUrl : null;
  const cornerBadge = shelfTab === "recent" ? "ล่าสุด" : pinned ? "ปักหมุด" : null;
  return (
    <Link
      href={module.href}
      onClick={() => onVisit(module.slug)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_16px_36px_-24px_rgba(30,27,75,0.4)] ring-1 ring-inset ring-white/70 transition duration-300",
        "hover:-translate-y-0.5 hover:border-[#5b61ff]/30 hover:shadow-[0_22px_44px_-22px_rgba(91,97,255,0.35)]",
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-[#ecebff] to-indigo-100/50">
        {safeImage ? (
          <Image src={safeImage} alt="" fill sizes="(max-width: 640px) 33vw, 12vw" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#4d47b6]">
            <span className="text-lg font-black">⚡</span>
          </div>
        )}
        {cornerBadge ? (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-black shadow-sm sm:left-2 sm:top-2 sm:text-[10px]",
              shelfTab === "recent"
                ? "bg-[#5b61ff] text-white"
                : "bg-[#f3efe6] text-[#5c5346]",
            )}
          >
            {cornerBadge}
          </span>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onTogglePinned(module.slug);
          }}
          className={cn(
            "absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-sm text-[#2e2a58] shadow-sm transition sm:right-2 sm:top-2 sm:h-8 sm:w-8",
            "hover:bg-white active:scale-[0.98]",
            pinned ? cn(appDashboardBrandGradientFillClass, "border-0 text-white") : "",
          )}
          aria-label={pinned ? "เอาออกจากปักหมุด" : "ปักหมุด"}
        >
          <span className="leading-none">{pinned ? "★" : "☆"}</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-2 sm:px-2.5 sm:py-2.5">
        <p className="line-clamp-2 text-[11px] font-black leading-snug tracking-tight text-[#1e1b4b] sm:text-xs">
          {module.title}
        </p>
        {module.usageBadge ? (
          <div className="mt-auto">
            <UsagePill badge={module.usageBadge} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function buildDefaultPinned(all: HomeModule[]) {
  return all.slice(0, DEFAULT_PINNED_COUNT).map((m) => m.slug);
}

function buildDefaultRecent(all: HomeModule[], count: number) {
  return all.slice(0, count).map((m) => m.slug);
}

export function DashboardHomeModuleShelf({ modules }: { modules: HomeModule[] }) {
  const bySlug = useMemo(() => new Map(modules.map((m) => [m.slug, m])), [modules]);
  const [shelfTab, setShelfTab] = useState<ShelfTab>("recent");
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(() => buildDefaultPinned(modules));
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() =>
    buildDefaultRecent(modules, RECENT_LIMIT),
  );

  useEffect(() => {
    const pinnedSaved = parseSlugList(safeReadJson(PINNED_KEY));
    const pinned = pinnedSaved.length
      ? pinnedSaved.filter((slug) => bySlug.has(slug)).slice(0, PINNED_LIMIT)
      : buildDefaultPinned(modules);
    setPinnedSlugs(pinned);

    const recentSaved = parseSlugList(safeReadJson(RECENT_KEY));
    const recent = recentSaved.length
      ? recentSaved.filter((slug) => bySlug.has(slug)).slice(0, RECENT_LIMIT)
      : buildDefaultRecent(modules, RECENT_LIMIT);
    setRecentSlugs(recent);

    safeWriteJson(PINNED_KEY, pinned);
    safeWriteJson(RECENT_KEY, recent);
  }, [bySlug, modules]);

  const togglePinned = useCallback((slug: string) => {
    setPinnedSlugs((current) => {
      const next = current.includes(slug)
        ? current.filter((x) => x !== slug)
        : [slug, ...current.filter((x) => x !== slug)].slice(0, PINNED_LIMIT);
      safeWriteJson(PINNED_KEY, next);
      return next;
    });
  }, []);

  const onVisit = useCallback((slug: string) => {
    setRecentSlugs((current) => {
      const next = [slug, ...current.filter((x) => x !== slug)].slice(0, RECENT_LIMIT);
      safeWriteJson(RECENT_KEY, next);
      return next;
    });
  }, []);

  const pinnedModules = useMemo(
    () => pinnedSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as HomeModule[],
    [bySlug, pinnedSlugs],
  );

  const recentModules = useMemo(() => {
    const fromStorage = recentSlugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean) as HomeModule[];
    if (fromStorage.length > 0) return fromStorage.slice(0, RECENT_LIMIT);
    return modules.slice(0, RECENT_LIMIT);
  }, [bySlug, modules, recentSlugs]);

  const visibleModules = shelfTab === "pinned" ? pinnedModules : recentModules;
  const emptyLabel =
    shelfTab === "pinned"
      ? "ยังไม่มีโปรแกรมปักหมุด — กดดาวบนการ์ดเพื่อปักหมุด"
      : "ยังไม่มีรายการล่าสุด — เปิดโปรแกรมจากดูทั้งหมด";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pl-0.5 sm:pl-0">
        <h2 className="text-xl font-bold text-[#2e2a58]">โปรแกรม</h2>
        <Link href="/dashboard/modules" className="text-sm font-semibold text-[#5b61ff] hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      <div
        className="flex gap-1 rounded-2xl border border-indigo-100/90 bg-white/90 p-1 shadow-sm ring-1 ring-indigo-100/60"
        role="tablist"
        aria-label="เลือกมุมมองโปรแกรม"
      >
        {(
          [
            { id: "recent" as const, label: "ล่าสุด", count: recentModules.length },
            { id: "pinned" as const, label: "ปักหมุด", count: pinnedModules.length },
          ] as const
        ).map((tab) => {
          const active = shelfTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setShelfTab(tab.id)}
              className={cn(
                "relative flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition",
                active
                  ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md shadow-indigo-400/25")
                  : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {visibleModules.length === 0 ? (
        <p className="rounded-[1.35rem] border border-dashed border-[#d8d6ec] bg-white/60 px-4 py-8 text-center text-sm font-semibold text-[#66638c]">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {visibleModules.map((m) => (
            <CompactModuleCard
              key={`${shelfTab}-${m.slug}`}
              module={m}
              pinned={pinnedSlugs.includes(m.slug)}
              shelfTab={shelfTab}
              onTogglePinned={togglePinned}
              onVisit={onVisit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
