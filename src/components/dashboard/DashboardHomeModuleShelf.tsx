"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import type { ModuleUsageBadge } from "@/lib/modules/module-usage-badge";
import { cn } from "@/lib/cn";

type HomeModule = {
  id: number;
  slug: string;
  title: string;
  groupId: number;
  imageUrl: string | null;
  href: string;
  usageBadge: ModuleUsageBadge | null;
  systemMap?: boolean;
};

const PINNED_KEY = "mawell.dashboard.home.pinned.v1";
const RECENT_KEY = "mawell.dashboard.home.recent.v1";
const DEFAULT_PINNED_COUNT = 4;
const RECENT_LIMIT = 12;

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
        199 / เดือน
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
  onTogglePinned,
  onVisit,
}: {
  module: HomeModule;
  pinned: boolean;
  onTogglePinned: (slug: string) => void;
  onVisit: (slug: string) => void;
}) {
  const safeImage = module.imageUrl && isSafeModuleCardDisplayUrl(module.imageUrl) ? module.imageUrl : null;
  return (
    <Link
      href={module.href}
      onClick={() => onVisit(module.slug)}
      className={cn(
        "group relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-white/75 p-4 shadow-[0_20px_48px_-30px_rgba(30,27,75,0.35)] ring-1 ring-inset ring-white/60 backdrop-blur-xl transition duration-300",
        "hover:-translate-y-0.5 hover:border-[#5b61ff]/30 hover:shadow-[0_28px_58px_-28px_rgba(91,97,255,0.34)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 shadow-sm">
            {safeImage ? (
              <Image src={safeImage} alt="" fill sizes="48px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#4d47b6]">
                <span className="text-sm font-black">{module.systemMap ? "🗺️" : "⚡"}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b]">{module.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {module.usageBadge ? <UsagePill badge={module.usageBadge} /> : null}
              {pinned ? (
                <span className="rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-2 py-0.5 text-[10px] font-black text-[#2e2a58]">
                  ปักหมุด
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onTogglePinned(module.slug);
          }}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[#2e2a58] shadow-sm transition",
            "hover:bg-white active:scale-[0.98]",
            pinned ? cn(appDashboardBrandGradientFillClass, "border-0 text-white") : "",
          )}
          aria-label={pinned ? "เอาออกจากปักหมุด" : "ปักหมุด"}
        >
          <span className="text-base leading-none">{pinned ? "★" : "☆"}</span>
        </button>
      </div>
    </Link>
  );
}

function buildDefaultPinned(all: HomeModule[]) {
  return all.slice(0, DEFAULT_PINNED_COUNT).map((m) => m.slug);
}

function buildDefaultRecent(all: HomeModule[], pinnedSlugs: string[], count: number) {
  const pinnedSet = new Set(pinnedSlugs);
  return all
    .filter((m) => !pinnedSet.has(m.slug))
    .slice(0, count)
    .map((m) => m.slug);
}

export function DashboardHomeModuleShelf({ modules }: { modules: HomeModule[] }) {
  const bySlug = useMemo(() => new Map(modules.map((m) => [m.slug, m])), [modules]);
  const allSlugs = useMemo(() => modules.map((m) => m.slug), [modules]);
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(() => buildDefaultPinned(modules));
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() =>
    buildDefaultRecent(modules, buildDefaultPinned(modules), DEFAULT_PINNED_COUNT),
  );

  useEffect(() => {
    const pinnedSaved = parseSlugList(safeReadJson(PINNED_KEY));
    const pinned = pinnedSaved.length ? pinnedSaved.filter((slug) => bySlug.has(slug)) : buildDefaultPinned(modules);
    setPinnedSlugs(pinned);
    const recentSaved = parseSlugList(safeReadJson(RECENT_KEY));
    const targetCount = pinned.length > 0 ? pinned.length : DEFAULT_PINNED_COUNT;
    const recent = recentSaved.length
      ? recentSaved
          .filter((slug) => bySlug.has(slug) && !pinned.includes(slug))
          .slice(0, Math.max(RECENT_LIMIT, targetCount))
      : buildDefaultRecent(modules, pinned, targetCount);
    setRecentSlugs(recent);
    safeWriteJson(PINNED_KEY, pinned);
    safeWriteJson(RECENT_KEY, recent);
  }, [bySlug, modules]);

  const togglePinned = useCallback(
    (slug: string) => {
      setPinnedSlugs((current) => {
        const next = current.includes(slug) ? current.filter((x) => x !== slug) : [slug, ...current].slice(0, 12);
        safeWriteJson(PINNED_KEY, next);
        setRecentSlugs((prev) => {
          const pinnedSet = new Set(next);
          const targetCount = next.length > 0 ? next.length : DEFAULT_PINNED_COUNT;
          const filled: string[] = [];
          const seen = new Set<string>();

          for (const key of prev) {
            if (filled.length >= targetCount) break;
            if (!bySlug.has(key) || pinnedSet.has(key) || seen.has(key)) continue;
            filled.push(key);
            seen.add(key);
          }

          if (filled.length < targetCount) {
            for (const key of allSlugs) {
              if (filled.length >= targetCount) break;
              if (pinnedSet.has(key) || seen.has(key)) continue;
              if (!bySlug.has(key)) continue;
              filled.push(key);
              seen.add(key);
            }
          }

          const nextRecent = filled.length > 0 ? filled : buildDefaultRecent(modules, next, targetCount);
          safeWriteJson(RECENT_KEY, nextRecent);
          return nextRecent;
        });
        return next;
      });
    },
    [allSlugs, bySlug, modules],
  );

  const onVisit = useCallback(
    (slug: string) => {
      setRecentSlugs((current) => {
        const pinnedSet = new Set(pinnedSlugs);
        if (pinnedSet.has(slug)) return current;
        const next = [slug, ...current.filter((x) => x !== slug)].slice(0, RECENT_LIMIT);
        safeWriteJson(RECENT_KEY, next);
        return next;
      });
    },
    [pinnedSlugs],
  );

  const pinnedModules = useMemo(
    () => pinnedSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as HomeModule[],
    [bySlug, pinnedSlugs],
  );
  const shelfCount = Math.max(DEFAULT_PINNED_COUNT, pinnedModules.length);
  const recentModules = useMemo(() => {
    const pinnedSet = new Set(pinnedSlugs);
    const fromStorage = recentSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as HomeModule[];
    const filled = [...fromStorage];
    if (filled.length >= shelfCount) return filled.slice(0, shelfCount);
    for (const slug of allSlugs) {
      if (filled.length >= shelfCount) break;
      if (pinnedSet.has(slug)) continue;
      if (filled.some((m) => m.slug === slug)) continue;
      const item = bySlug.get(slug);
      if (item) filled.push(item);
    }
    return filled.slice(0, shelfCount);
  }, [allSlugs, bySlug, pinnedSlugs, recentSlugs, shelfCount]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 pl-0.5 sm:pl-0">
        <h2 className="text-xl font-bold text-[#2e2a58]">โปรแกรม</h2>
        <Link href="/dashboard/modules" className="text-sm font-semibold text-[#5b61ff] hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 pl-0.5 sm:pl-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#66638c]">ปักหมุด</p>
            <span className="rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-2 py-0.5 text-[10px] font-black text-[#2e2a58]">
              {pinnedModules.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinnedModules.map((m) => (
              <CompactModuleCard
                key={`pinned-${m.slug}`}
                module={m}
                pinned
                onTogglePinned={togglePinned}
                onVisit={onVisit}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 pl-0.5 sm:pl-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#66638c]">ล่าสุด</p>
            <span className="rounded-lg border border-white/70 bg-white/80 px-2 py-0.5 text-[10px] font-black text-[#2e2a58]">
              {recentModules.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentModules.map((m) => (
              <CompactModuleCard
                key={`recent-${m.slug}`}
                module={m}
                pinned={pinnedSlugs.includes(m.slug)}
                onTogglePinned={togglePinned}
                onVisit={onVisit}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
