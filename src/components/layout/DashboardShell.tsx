"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const active = isNavActive(href, pathname);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gradient-to-r from-[#8b9cff]/14 to-[#f9a8d4]/12 text-[#4d47b6] ring-1 ring-white/70"
          : "text-[#67638f] hover:bg-white/65 hover:text-[#2e2a58]",
      )}
    >
      {dashboardNavIconForHref(href)}
      <span className="min-w-0 leading-snug">{label}</span>
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
  const active = isNavActive(href, pathname);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gradient-to-r from-[#8b9cff]/14 to-[#f9a8d4]/12 text-[#4d47b6] ring-1 ring-white/70"
          : "text-[#67638f] hover:bg-white/65 hover:text-[#2e2a58]",
      )}
    >
      {dashboardNavIconForHref(href)}
      <span className="min-w-0 leading-snug">{label}</span>
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
  const cardClass = isBasic
    ? "mawell-card-surface border-white/60 shadow-md"
    : "mawell-card-surface border-white/60 shadow-md";
  const headerHoverClass = isBasic ? "hover:bg-white/35" : "hover:bg-white/35";
  const titleClass = isBasic ? "text-[#312e81]" : "text-[#1e3a5f]";
  const badgeClass = isBasic
    ? "border border-[#d4dcff] bg-gradient-to-r from-[#eef1ff] to-[#f0e8ff] text-[#4d47b6]"
    : "border border-[#f5d0e6] bg-gradient-to-r from-[#fff5fb] to-[#eef2ff] text-[#7c3a5c]";
  const badgeLabel = isBasic ? "BASIC" : "SERVICES";

  return (
    <div className={cn("rounded-2xl p-2.5", cardClass)}>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500/35",
          headerHoverClass,
        )}
        aria-expanded={open}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <span className={cn("line-clamp-2 text-sm font-semibold leading-snug", titleClass)}>
            {group.label}
          </span>
          <div className="mt-1">
            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", badgeClass)}>
              {badgeLabel}
            </span>
          </div>
        </div>
        <span className="sr-only">{open ? "ย่อกลุ่ม" : "ขยายกลุ่ม"}</span>
        <ChevronNavExpand expanded={open} />
      </button>
      {open ? (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {group.items.map((item) => {
            if (!isSubscribedModuleLink(item)) {
              return variant === "sidebar" ? (
                <SidebarNavLink
                  key={item.href}
                  href={item.href}
                  pathname={pathname}
                  label={item.label}
                />
              ) : (
                <DrawerNavLink
                  key={item.href}
                  href={item.href}
                  pathname={pathname}
                  label={item.label}
                  onNavigate={onDrawerNavigate ?? (() => {})}
                />
              );
            }
            return variant === "sidebar" ? (
              <SidebarNavLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                label={item.label}
              />
            ) : (
              <DrawerNavLink
                key={item.href}
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
  children,
}: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const navGroups = buildDashboardNavGroups(role, serviceModules);

  const [groupOpen, setGroupOpen] = useState<Record<DashboardNavGroupId, boolean>>({
    basic: true,
    services: true,
  });

  const toggleGroup = useCallback((id: DashboardNavGroupId) => {
    setGroupOpen((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const packageLabel = headerPackageLabel(subscriptionType, subscriptionTier);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

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
        <div className="mawell-glass-panel flex h-14 w-full min-w-0 items-center gap-2 rounded-2xl px-3 shadow-lg sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-[#3730a3] shadow-sm hover:bg-white/90 md:hidden"
            aria-expanded={drawerOpen}
            aria-controls={menuId}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span className="sr-only">เปิดเมนู</span>
            <MenuIcon open={drawerOpen} />
          </button>

          <Link
            href="/dashboard"
            className="shrink-0"
            onClick={() => setDrawerOpen(false)}
          >
            <MawellLogo size="sm" />
          </Link>

          {/* กลาง: บรรทัดเดียว + truncate บนมือถือ — ไม่ดันกลุ่มปุ่มขวา */}
          <div className="min-w-0 flex-1 overflow-hidden px-0.5 sm:px-1">
            <p
              className="truncate text-left text-[11px] leading-snug text-[#58547f] sm:text-sm sm:leading-normal md:text-right"
              title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
            >
              <span className="tabular-nums font-medium">{tokens}</span> โทเคน
              <span className="text-slate-300/90" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="font-medium text-[#2e2a58]">{packageLabel}</span>
              <span className="text-slate-300/90" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="text-[#67638f]">{displayName}</span>
            </p>
          </div>

          {/* ขวา: ไม่ wrap — โปรไฟล์ + logout เรียงแนวนอนเสมอ */}
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 border-l border-white/50 pl-2 sm:gap-2 sm:pl-3">
            <div className="hidden shrink-0 md:block">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-white/60 object-cover shadow-sm"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/50 text-xs font-semibold text-[#4c4a6e] shadow-sm">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="relative shrink-0 md:hidden" ref={accountWrapRef}>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/75 p-1 shadow-sm hover:bg-white/95"
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/55 text-xs font-semibold text-[#4c4a6e]">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
              {accountOpen ? (
                <div
                  className="mawell-card-surface absolute right-0 z-40 mt-1 w-48 rounded-2xl py-1 shadow-lg"
                  role="menu"
                >
                  <Link
                    href="/dashboard/profile"
                    className="block rounded-xl px-3 py-2 text-sm text-[#3730a3] hover:bg-white/60"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    โปรไฟล์
                  </Link>
                </div>
              ) : null}
            </div>

            <LogoutIconButton className="h-9 w-9 sm:h-10 sm:w-10" />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 pt-2 sm:gap-4 sm:px-4 sm:pb-4">
        {/* Sidebar — แก้ว โค้งมน */}
        <aside
          className="mawell-glass-panel hidden w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-2xl md:flex"
          aria-label="เมนูหลัก"
        >
          <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2.5 pt-3" aria-label="เมนูหลัก">
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
          <div className="border-t border-white/40 bg-white/20 p-3">
            <p className="truncate text-xs text-slate-600" title={username}>
              {username}
            </p>
            <LogoutButton className="mt-2 w-full justify-center text-sm" />
          </div>
        </aside>

        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          {/* Drawer มือถือ — เริ่มใต้แถบ header */}
          {drawerOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 bg-slate-900/25 backdrop-blur-[2px] md:hidden"
                aria-label="ปิดเมนู"
                onClick={closeDrawer}
              />
              <div
                id={menuId}
                className="mawell-glass-panel fixed bottom-3 left-3 top-[4.25rem] z-50 flex w-[min(100vw-2.5rem,17.5rem)] flex-col overflow-hidden rounded-2xl shadow-2xl md:hidden"
              >
                <div className="flex h-14 items-center justify-between border-b border-white/40 px-3">
                  <MawellLogo size="md" />
                  <button
                    type="button"
                    className="rounded-xl p-2 text-[#4c4a6e] hover:bg-white/45"
                    onClick={closeDrawer}
                    aria-label="ปิดเมนู"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2" aria-label="เมนู">
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
                <div className="border-t border-white/40 bg-white/15 p-3">
                  <p className="mb-2 truncate text-xs text-slate-600">{username}</p>
                  <LogoutButton className="w-full justify-center" />
                </div>
              </div>
            </>
          ) : null}

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden rounded-2xl">{children}</main>
        </div>
      </div>
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#3e3a73]" aria-hidden>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#67638f]" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

