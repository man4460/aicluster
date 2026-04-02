"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
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
import { buffetTierMaxGroup, MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";

function headerPackageLabel(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
): string {
  if (subscriptionType === "BUFFET" && subscriptionTier !== "NONE") {
    const g = buffetTierMaxGroup(subscriptionTier);
    return MODULE_GROUP_TIER_NAME[g] ?? subscriptionTier;
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
  serviceGroupId,
}: {
  href: string;
  pathname: string;
  label: string;
  serviceGroupId?: number;
}) {
  const active = isNavActive(href, pathname);
  const groupTone =
    serviceGroupId === 1
      ? "before:bg-[#7a7eff]"
      : serviceGroupId === 2
        ? "before:bg-slate-500"
        : serviceGroupId === 3
          ? "before:bg-amber-500"
          : serviceGroupId === 4
            ? "before:bg-fuchsia-500"
            : serviceGroupId === 5
              ? "before:bg-rose-500"
              : "before:bg-emerald-500";
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        serviceGroupId ? `before:h-2 before:w-2 before:rounded-full before:content-[''] ${groupTone}` : "",
        active
          ? "bg-[#6b6fff]/16 text-[#4d47b6]"
          : "text-[#67638f] hover:bg-[#f0efff] hover:text-[#2e2a58]",
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
  serviceGroupId,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  label: string;
  serviceGroupId?: number;
}) {
  const active = isNavActive(href, pathname);
  const groupTone =
    serviceGroupId === 1
      ? "before:bg-[#7a7eff]"
      : serviceGroupId === 2
        ? "before:bg-slate-500"
        : serviceGroupId === 3
          ? "before:bg-amber-500"
          : serviceGroupId === 4
            ? "before:bg-fuchsia-500"
            : serviceGroupId === 5
              ? "before:bg-rose-500"
              : "before:bg-emerald-500";
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        serviceGroupId ? `before:h-2 before:w-2 before:rounded-full before:content-[''] ${groupTone}` : "",
        active
          ? "bg-[#6b6fff]/16 text-[#4d47b6]"
          : "text-[#67638f] hover:bg-[#f0efff] hover:text-[#2e2a58]",
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
    ? "border-[#cbcfff] bg-[#f6f4ff]"
    : "border-[#d7e5ff] bg-[#f4f8ff]";
  const headerHoverClass = isBasic ? "hover:bg-[#eceaff]" : "hover:bg-[#eaf2ff]";
  const titleClass = isBasic ? "text-[#4b47a2]" : "text-[#39639f]";
  const badgeClass = isBasic
    ? "bg-[#e8e7ff] text-[#4d47b6] border-[#cfd2ff]"
    : "bg-[#e7f0ff] text-[#39639f] border-[#cadbff]";
  const badgeLabel = isBasic ? "BASIC" : "SERVICES";

  return (
    <div className={cn("rounded-xl border p-2 shadow-sm", cardClass)}>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#0000BF]/30",
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
                serviceGroupId={item.groupId}
              />
            ) : (
              <DrawerNavLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                label={item.label}
                onNavigate={onDrawerNavigate ?? (() => {})}
                serviceGroupId={item.groupId}
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
      {/* แถบบนเต็มความกว้างหน้าจอ — โลโก้ + ข้อมูลผู้ใช้ */}
      <header className="sticky top-0 z-30 w-full border-b border-[#dfe1ff] bg-[#ffffffd9] shadow-[0_8px_24px_-18px_rgba(69,53,179,0.55)] backdrop-blur-sm">
        <div className="flex h-14 w-full items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9dcff] bg-white text-[#4a4594] shadow-sm hover:bg-[#f4f3ff] md:hidden"
            aria-expanded={drawerOpen}
            aria-controls={menuId}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span className="sr-only">เปิดเมนู</span>
            <MenuIcon open={drawerOpen} />
          </button>

          <Link href="/dashboard" className="min-w-0 shrink" onClick={() => setDrawerOpen(false)}>
            <MawellLogo size="sm" />
          </Link>

          <div className="min-w-0 flex-1" aria-hidden />

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-x-3">
            <span className="text-sm text-[#58547f]">
              <span className="tabular-nums font-medium">{tokens}</span> โทเคน
            </span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              |
            </span>
            <span className="text-sm font-medium text-[#2e2a58]">{packageLabel}</span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              |
            </span>
            <span
              className="max-w-[120px] truncate text-sm text-[#67638f] sm:max-w-[160px]"
              title={displayName}
            >
              {displayName}
            </span>
            <span className="hidden text-slate-300 md:inline" aria-hidden>
              |
            </span>

            <div className="hidden shrink-0 md:block">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-[#d9dcff] object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9dcff] bg-[#f4f3ff] text-xs font-semibold text-[#67638f]">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="relative md:hidden" ref={accountWrapRef}>
              <button
                type="button"
                className="flex h-10 max-w-[44px] items-center justify-center rounded-xl border border-[#d9dcff] bg-white p-1 shadow-sm hover:bg-[#f4f3ff]"
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
                    className="h-7 w-7 shrink-0 rounded-full border border-[#d9dcff] object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4f3ff] text-xs font-semibold text-[#67638f]">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 z-40 mt-1 w-48 rounded-xl border border-[#d9dcff] bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <Link
                    href="/dashboard/profile"
                    className="block px-3 py-2 text-sm text-[#4e4a74] hover:bg-[#f4f3ff]"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    โปรไฟล์
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar — เดสก์ท็อป / แท็บเล็ต (ใต้ header เต็มความกว้าง) */}
        <aside
          className="hidden w-56 shrink-0 flex-col border-r border-[#dfe1ff] bg-[#ffffffbf] backdrop-blur-sm md:flex"
          aria-label="เมนูหลัก"
        >
          <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2 pt-3" aria-label="เมนูหลัก">
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
          <div className="border-t border-slate-100 p-3">
            <p className="truncate text-xs text-slate-500" title={username}>
              {username}
            </p>
            <LogoutButton className="mt-2 w-full justify-center text-sm" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Drawer มือถือ — เริ่มใต้แถบ header */}
          {drawerOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-x-0 bottom-0 top-14 z-40 bg-[#2a245633] backdrop-blur-[2px] md:hidden"
                aria-label="ปิดเมนู"
                onClick={closeDrawer}
              />
              <div
                id={menuId}
                className="fixed bottom-0 left-0 top-14 z-50 flex w-[min(100vw-3rem,17.5rem)] flex-col border-r border-t border-[#dfe1ff] bg-[#fffefee8] shadow-2xl backdrop-blur-sm md:hidden"
              >
                <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3">
                  <MawellLogo size="md" />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#67638f] hover:bg-[#f0efff]"
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
                <div className="border-t border-slate-100 p-3">
                  <p className="mb-2 truncate text-xs text-slate-500">{username}</p>
                  <LogoutButton className="w-full justify-center" />
                </div>
              </div>
            </>
          ) : null}

          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
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

