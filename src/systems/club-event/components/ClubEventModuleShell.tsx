"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, Settings2, Users, Wallet } from "lucide-react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  CLUB_EVENT_HEADER_COLLAPSE_EVENT,
  CLUB_EVENT_MODULE_DISPLAY_NAME,
  CLUB_EVENT_NAV_ITEMS,
  isClubEventModuleNavItemActive,
  readClubEventHeaderCollapsed,
  writeClubEventHeaderCollapsed,
  type ClubEventModuleNavKey,
} from "@/systems/club-event/club-event-module-nav";
import {
  clubEventGlassShellClass,
  clubEventMainPaddingBottomClass,
  clubEventMobileDockClass,
  clubEventNavActiveClass,
  clubEventNavIdleClass,
} from "@/systems/club-event/lib/ui-tokens";

function navIcon(key: ClubEventModuleNavKey) {
  const cls = "h-5 w-5";
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className={cls} aria-hidden />;
    case "finance":
      return <Wallet className={cls} aria-hidden />;
    case "manage":
      return <Users className={cls} aria-hidden />;
    case "settings":
      return <Settings2 className={cls} aria-hidden />;
  }
}

export function ClubEventModuleShell({
  children,
  clubName,
  trialExpiresLabel,
}: {
  children: ReactNode;
  clubName?: string;
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    setHeaderCollapsed(readClubEventHeaderCollapsed());
    const onCollapse = (e: Event) => {
      const detail = (e as CustomEvent<{ collapsed: boolean }>).detail;
      if (detail && typeof detail.collapsed === "boolean") setHeaderCollapsed(detail.collapsed);
    };
    window.addEventListener(CLUB_EVENT_HEADER_COLLAPSE_EVENT, onCollapse);
    return () => window.removeEventListener(CLUB_EVENT_HEADER_COLLAPSE_EVENT, onCollapse);
  }, []);

  const toggleCollapse = useCallback(() => {
    const next = !headerCollapsed;
    writeClubEventHeaderCollapsed(next);
    setHeaderCollapsed(next);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", clubEventMainPaddingBottomClass)}>
      {!headerCollapsed ? (
        <div className={cn("mb-3 p-4 sm:p-6", clubEventGlassShellClass)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                {clubName ?? CLUB_EVENT_MODULE_DISPLAY_NAME}
              </h1>
              {trialExpiresLabel ? (
                <p className="mt-1 text-xs font-semibold text-amber-700">{trialExpiresLabel}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/80 text-[#4d47b6]"
                aria-label="คู่มือใช้งาน"
                onClick={() => setGuideOpen(true)}
              >
                ?
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/80 text-[#4d47b6]"
                aria-label={headerCollapsed ? "ขยายหัวโมดูล" : "ย่อหัวโมดูล"}
                onClick={toggleCollapse}
              >
                <ChevronDown className={cn("h-4 w-4 transition", headerCollapsed && "rotate-180")} />
              </button>
            </div>
          </div>

          <nav className="mt-4 hidden flex-wrap gap-2 sm:flex" aria-label="เมนูหลักชมรม">
            {CLUB_EVENT_NAV_ITEMS.map((item) => {
              const active = isClubEventModuleNavItemActive(pathname, item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-black",
                    active ? clubEventNavActiveClass : clubEventNavIdleClass,
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {navIcon(item.key)}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">{children}</div>

      <nav className={clubEventMobileDockClass} aria-label="เมนูหลักชมรม (มือถือ)">
        <div className="grid grid-cols-4 gap-1">
          {CLUB_EVENT_NAV_ITEMS.map((item) => {
            const active = isClubEventModuleNavItemActive(pathname, item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-[1.25rem] py-2 text-[10px] font-black",
                  active ? clubEventNavActiveClass : "text-[#5f5a8a]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {navIcon(item.key)}
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="บริหารชมรม"
        sections={[
          {
            title: "แดชบอร์ด",
            content: "จัดการกำหนดการกิจกรรม รูปภาพ วิดีโอ และโครงสร้างกรรมการ",
          },
          {
            title: "พอร์ทัลสาธารณะ",
            content: "แชร์ลิงก์ /club/[slug] ให้สมาชิกดูกำหนดการและแกลเลอรีโดยไม่ต้องล็อกอิน",
          },
        ]}
      />
    </div>
  );
}
