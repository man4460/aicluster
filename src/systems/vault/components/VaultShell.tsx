"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { VaultMobileBottomProvider } from "@/systems/vault/components/VaultMobileBottomChrome";
import {
  VAULT_HEADER_COLLAPSE_EVENT,
  VAULT_MODULE_DISPLAY_NAME,
  VAULT_NAV_ITEMS,
  isVaultNavItemActive,
  readVaultHeaderCollapsed,
  writeVaultHeaderCollapsed,
  type VaultNavKey,
} from "@/systems/vault/vault-module-nav";
import {
  vaultAccentBarClass,
  vaultGlassShellClass,
  vaultMainPaddingBottomClass,
  vaultNavActiveClass,
  vaultNavIdleClass,
} from "@/systems/vault/lib/ui-tokens";
import { VaultHeaderBarNav } from "@/systems/vault/components/VaultHeaderBarNav";

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 2 4 5v7c0 4.97 3.5 9.32 8 10 4.5-.68 8-5.03 8-10V5z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function navIcon(key: VaultNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? vaultNavActiveClass : vaultNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M6 9l6-6 6 6M6 15l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 15l6 6 6-6M6 9l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)" />
      )}
    </svg>
  );
}

const guideSections = [
  {
    title: "เก็บอย่างปลอดภัย",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>รหัสผ่านถูกเข้ารหัสด้วย AES-256-GCM ก่อนเก็บฐานข้อมูล</li>
        <li>เห็นรหัสจริงต่อเมื่อกด «แสดงรหัส» เท่านั้น — ระบบจะบันทึกเวลาใช้งานล่าสุด</li>
      </ul>
    ),
  },
  {
    title: "เพิ่มและจัดหมวด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>เพิ่มบัญชีพร้อมเลือก «บริการยอดนิยม» เพื่อให้ระบบใส่ไอคอนและสีให้อัตโนมัติ</li>
        <li>กดดาวเพื่อปักหมุดบัญชีที่ใช้บ่อย</li>
      </ul>
    ),
  },
  {
    title: "คัดลอกเร็ว",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>กดปุ่มก๊อบปี้ที่ตัวการ์ดเพื่อคัดลอกชื่อผู้ใช้หรือรหัสไปยังคลิปบอร์ดได้ทันที</li>
        <li>คลิปบอร์ดจะล้างอัตโนมัติหลังคัดลอกรหัส 30 วินาที (เฉพาะอุปกรณ์รองรับ)</li>
      </ul>
    ),
  },
];

export function VaultShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readVaultHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readVaultHeaderCollapsed());
    sync();
    window.addEventListener(VAULT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VAULT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeVaultHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <VaultMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        {headerCollapsed ? (
          <div className="sticky top-0 z-40 print:hidden">
            <div className={cn("mx-auto flex max-w-full items-center gap-2 rounded-2xl px-2 py-2 sm:rounded-3xl sm:px-3 sm:py-2.5", appDashboardBrandGradientFillClass)}>
              <VaultHeaderBarNav onExpand={toggleHeaderCollapse} />
            </div>
          </div>
        ) : null}
        <header
          className={cn(
            vaultGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={vaultAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconShield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {VAULT_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
                aria-label="คู่มือการใช้งาน"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือการใช้งาน</span>
              </button>
              <button
                type="button"
                onClick={toggleHeaderCollapse}
                className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph collapsed={headerCollapsed} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลคลังรหัสผ่าน"
          >
            <ul className="grid grid-cols-2 gap-2">
              {VAULT_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isVaultNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือ — คลังรหัสผ่าน"
          subtitle="เก็บ · เข้ารหัส · ค้นหา · คัดลอก"
          sections={guideSections}
        />

        <div className={cn(vaultMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </VaultMobileBottomProvider>
  );
}
