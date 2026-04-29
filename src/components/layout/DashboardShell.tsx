"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DemoSessionBanner } from "@/components/dashboard/DemoSessionBanner";
import { LogoutButton, LogoutIconButton } from "@/components/layout/LogoutButton";
import { dashboardNavIconForHref } from "@/components/layout/dashboard-nav-icons";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { cn } from "@/lib/cn";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import {
  buildDashboardNavGroups,
  isSubscribedModuleLink,
  type DashboardNavGroup,
  type DashboardNavGroupId,
} from "@/lib/dashboard-nav";
import {
  CHAT_AI_DASHBOARD_HREF,
  isChatAiDashboardPath,
  resolveDashboardNavLinkHref,
} from "@/lib/dashboard/chat-ai-href";
import {
  buffetTierMaxGroup,
  MODULE_GROUP_TIER_NAME,
  UI_VISIBLE_MAX_MODULE_GROUP,
} from "@/lib/modules/config";

function headerPackageLabel(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
): string {
  if (subscriptionType === "BUFFET" && subscriptionTier !== "NONE") {
    const g = buffetTierMaxGroup(subscriptionTier);
    const name = MODULE_GROUP_TIER_NAME[g] ?? subscriptionTier;
    if (g > UI_VISIBLE_MAX_MODULE_GROUP) {
      return `${name} · เปิดกลุ่ม 1`;
    }
    return name;
  }
  return "สายรายวัน";
}

function isNavActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === CHAT_AI_DASHBOARD_HREF) {
    return isChatAiDashboardPath(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldUseSystemFocusLayout(pathname: string): boolean {
  const basicRoutes = [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/plans",
    "/dashboard/chat",
    CHAT_AI_DASHBOARD_HREF,
    "/dashboard/modules",
    "/dashboard/admin",
  ];
  return !basicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function SidebarNavLink({
  href,
  pathname,
  label,
}: {
  href: string;
  pathname: string;
  label: string;
}) {
  const resolvedHref = resolveDashboardNavLinkHref(href);
  const active = isNavActive(resolvedHref, pathname);
  return (
    <Link
      href={resolvedHref}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-300",
        active
          ? "bg-white/15 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] ring-1 ring-white/30"
          : "text-white/65 hover:bg-white/10 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      )}
      <div className={cn("transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", active ? "text-white scale-110" : "text-white/50")}>
        {dashboardNavIconForHref(resolvedHref)}
      </div>
      <span className="min-w-0 leading-tight">{label}</span>
    </Link>
  );
}

function DrawerNavLink({
  href,
  pathname,
  onNavigate,
  label,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  label: string;
}) {
  const resolvedHref = resolveDashboardNavLinkHref(href);
  const active = isNavActive(resolvedHref, pathname);
  return (
    <Link
      href={resolvedHref}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-300",
        active
          ? "bg-white/15 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] ring-1 ring-white/30"
          : "text-white/65 hover:bg-white/10 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      )}
      <div className={cn("transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", active ? "text-white scale-110" : "text-white/50")}>
        {dashboardNavIconForHref(resolvedHref)}
      </div>
      <span className="min-w-0 leading-tight">{label}</span>
    </Link>
  );
}

function ChevronNavExpand({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "shrink-0 text-slate-400 transition-transform duration-200",
        expanded && "rotate-90",
      )}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavCollapsibleGroup({
  group,
  open,
  onToggle,
  pathname,
  variant,
  onDrawerNavigate,
}: {
  group: DashboardNavGroup;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  variant: "sidebar" | "drawer";
  onDrawerNavigate?: () => void;
}) {
  const isBasic = group.id === "basic";
  const cardClass = "border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.2)]";
  const headerHoverClass = "hover:bg-white/15";
  const titleClass = "text-white";
  const badgeClass = "border border-white/30 bg-white/20 text-[10px] text-white/90 font-bold tracking-tight";

  return (
    <div className={cn("rounded-2xl p-1.5 transition-all duration-300", cardClass)}>
      <button
        type="button"
        suppressHydrationWarning
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-left outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/40",
          headerHoverClass,
        )}
        aria-expanded={open}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={cn("line-clamp-1 text-[13.5px] font-bold leading-none tracking-tight", titleClass)}>
              {group.label}
            </span>
            <span className={cn("inline-flex rounded-lg border px-2 py-0.5", badgeClass)}>
              {group.items.length}
            </span>
          </div>
        </div>
        <ChevronNavExpand expanded={open} />
      </button>
      {open ? (
        <div className="mt-1.5 flex flex-col gap-1.5 px-0.5">
          {group.items.map((item, idx) => {
            const key = "href" in item ? item.href : `mod-${idx}`;
            return variant === "sidebar" ? (
              <SidebarNavLink
                key={key}
                href={item.href}
                pathname={pathname}
                label={item.label}
              />
            ) : (
              <DrawerNavLink
                key={key}
                href={item.href}
                pathname={pathname}
                label={item.label}
                onNavigate={onDrawerNavigate ?? (() => {})}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  username: string;
  /** ชื่อที่แสดงใน header (ชื่อจริงหรือ username) */
  displayName: string;
  role: "USER" | "ADMIN";
  tokens: number;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  /** โมดูลที่ user มีสิทธิ์ — แสดงในกลุ่มระบบใช้บริการ */
  serviceModules: { slug: string; title: string; groupId: number }[];
  avatarUrl: string | null;
  /** ล็อกอินเป็นบัญชีทดลองสาธารณะ — แสดงแบนเนอร์ออกจากโหมดทดลอง */
  demoSession?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  username,
  displayName,
  role,
  tokens,
  subscriptionTier,
  subscriptionType,
  serviceModules,
  avatarUrl,
  demoSession = false,
  children,
}: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const navGroups = buildDashboardNavGroups(role, serviceModules);
  const systemFocusLayout = shouldUseSystemFocusLayout(pathname);
  const mobileNavCandidates = navGroups
    .flatMap((group) => group.items)
    .map((item) => {
      const resolvedHref = resolveDashboardNavLinkHref(item.href);
      return { href: resolvedHref, label: item.label };
    })
    .filter((item, index, arr) => arr.findIndex((x) => x.href === item.href) === index);
  const mobilePriorityHrefs = [
    "/dashboard",
    "/dashboard/chat",
    CHAT_AI_DASHBOARD_HREF,
    "/dashboard/profile",
  ].map((href) => resolveDashboardNavLinkHref(href));
  const mobileNavItems = [
    ...mobilePriorityHrefs
      .map((href) => mobileNavCandidates.find((item) => item.href === href))
      .filter((x): x is { href: string; label: string } => Boolean(x)),
    ...mobileNavCandidates.filter((item) => !mobilePriorityHrefs.includes(item.href)),
  ].slice(0, 4);
  const activeMobileNavItem = mobileNavCandidates.find((item) => isNavActive(item.href, pathname));
  if (
    activeMobileNavItem &&
    !mobileNavItems.some((item) => item.href === activeMobileNavItem.href) &&
    mobileNavItems.length > 0
  ) {
    mobileNavItems[mobileNavItems.length - 1] = activeMobileNavItem;
  }

  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({
    basic: true,
    finance: true,
    services: true,
    property: true,
    admin: true,
  });

  const toggleGroup = useCallback((id: DashboardNavGroupId) => {
    setGroupOpen((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const packageLabel = headerPackageLabel(subscriptionType, subscriptionTier);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!accountOpen) return;
    function onDoc(e: MouseEvent) {
      if (!accountWrapRef.current?.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  return (
    <div className="flex min-h-screen flex-col text-[#2e2a58]">
      {/* แถบบน — แก้ว โค้งมน ไล่โทนเดียวกับการ์ด */}
      <header className="sticky top-0 z-30 w-full px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex h-14 w-full min-w-0 items-center gap-2 rounded-2xl border border-white/30 bg-gradient-to-r from-[#4f2f9a]/90 via-[#5b3ac2]/85 to-[#ec4899]/85 px-3 text-white shadow-[0_20px_40px_-15px_rgba(61,29,125,0.7)] backdrop-blur-xl sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            suppressHydrationWarning
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm transition-all hover:bg-white/30 active:scale-95 md:hidden",
              systemFocusLayout && "hidden",
            )}
            aria-expanded={drawerOpen}
            aria-controls={menuId}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span className="sr-only">เปิดเมนู</span>
            <MenuIcon open={drawerOpen} />
          </button>

          <Link
            href="/dashboard"
            className="shrink-0 transition-transform hover:scale-105 active:scale-95"
            onClick={() => setDrawerOpen(false)}
          >
            <MawellLogo size="sm" />
          </Link>

          {/* กลาง: บรรทัดเดียว + truncate บนมือถือ — ไม่ดันกลุ่มปุ่มขวา */}
          <div className="min-w-0 flex-1 overflow-hidden px-0.5 sm:px-1">
            <p
              className="truncate text-left text-[11px] leading-snug text-white/95 sm:text-[13.5px] sm:leading-normal md:text-right"
              title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
            >
              <span className="tabular-nums font-black">{tokens.toLocaleString()}</span> <span className="font-medium text-white/70">โทเคน</span>
              <span className="text-white/30 mx-1.5" aria-hidden>|</span>
              <span className="font-bold text-white">{packageLabel}</span>
              <span className="text-white/30 mx-1.5" aria-hidden>|</span>
              <span className="font-medium text-white/90">{displayName}</span>
            </p>
          </div>

          {/* ขวา: ไม่ wrap — โปรไฟล์ + logout เรียงแนวนอนเสมอ */}
          <div className="flex shrink-0 flex-nowrap items-center gap-2 border-l border-white/20 pl-2 sm:gap-3 sm:pl-4">
            <div className="hidden shrink-0 md:block">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-white/60 object-cover shadow-md"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xs font-black text-white shadow-md">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="relative shrink-0 md:hidden" ref={accountWrapRef}>
              <button
                type="button"
                suppressHydrationWarning
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 p-1 text-white shadow-sm transition-all hover:bg-white/30"
                aria-expanded={accountOpen}
                aria-label="เมนูบัญชี"
                onClick={() => setAccountOpen((o) => !o)}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full border border-white/60 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/30 text-[10px] font-black text-white">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-white/20 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl"
                  role="menu"
                >
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1e1b4b] transition-colors hover:bg-[#5b61ff]/10 hover:text-[#5b61ff]"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span className="text-lg">👤</span>
                    โปรไฟล์ของคุณ
                  </Link>
                </div>
              ) : null}
            </div>

            <LogoutIconButton className="h-9 w-9 sm:h-10 sm:w-10 transition-all hover:rotate-12" />
          </div>
        </div>
      </header>

      {demoSession ? <DemoSessionBanner /> : null}

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-20 pt-2 sm:gap-4 sm:px-4 sm:pb-4">
        {/* Sidebar — แก้ว โค้งมน */}
        <aside
          className={cn(
            "hidden w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#4f2f9a] via-[#5b3ac2] to-[#ec4899] text-white shadow-[0_18px_42px_-24px_rgba(40,16,97,0.75)] md:flex",
            systemFocusLayout && "md:hidden",
          )}
          aria-label="เมนูหลัก"
        >
          <nav className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-2.5 pt-3" aria-label="เมนูหลัก">
            {navGroups.map((group) => (
              <NavCollapsibleGroup
                key={group.id}
                group={group}
                open={groupOpen[group.id] ?? true}
                onToggle={() => toggleGroup(group.id)}
                pathname={pathname}
                variant="sidebar"
              />
            ))}
          </nav>
          <div className="border-t border-white/20 bg-black/10 p-3">
            <p className="truncate text-xs text-white/80" title={username}>
              {username}
            </p>
            <LogoutButton className="mt-2 w-full justify-center text-sm" />
          </div>
        </aside>

        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          {/* Drawer มือถือ — เริ่มใต้แถบ header */}
          {drawerOpen && !systemFocusLayout ? (
            <>
              <button
                type="button"
                suppressHydrationWarning
                className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 bg-slate-900/25 backdrop-blur-[2px] md:hidden"
                aria-label="ปิดเมนู"
                onClick={closeDrawer}
              />
              <div
                id={menuId}
                className="fixed bottom-3 left-3 top-[4.25rem] z-50 flex w-[min(100vw-2.5rem,17.5rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#4f2f9a] via-[#5b3ac2] to-[#ec4899] text-white shadow-2xl md:hidden"
              >
                <div className="flex h-12 items-center justify-between border-b border-white/25 px-3">
                  <MawellLogo size="md" />
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="rounded-xl p-2 text-white hover:bg-white/20"
                    onClick={closeDrawer}
                    aria-label="ปิดเมนู"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2.5" aria-label="เมนู">
                  {navGroups.map((group) => (
                    <NavCollapsibleGroup
                      key={group.id}
                      group={group}
                      open={groupOpen[group.id] ?? true}
                      onToggle={() => toggleGroup(group.id)}
                      pathname={pathname}
                      variant="drawer"
                      onDrawerNavigate={closeDrawer}
                    />
                  ))}
                </nav>
                <div className="border-t border-white/25 bg-black/10 p-3">
                  <p className="mb-2 truncate text-xs text-white/80">{username}</p>
                  <LogoutButton className="w-full justify-center" />
                </div>
              </div>
            </>
          ) : null}

          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden rounded-2xl",
              systemFocusLayout && "md:rounded-none",
            )}
          >
            {children}
          </main>
        </div>
      </div>
      
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

