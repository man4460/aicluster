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
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
        <li>
          เปิด <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — ดูบัญชีทั้งหมด · ค้นหา · กรองหมวด
        </li>
        <li>
          กด <strong className="font-semibold text-[#2e2a58]">+ เพิ่มบัญชี</strong> — เลือกบริการยอดนิยมหรือกำหนดเอง · ใส่ชื่อผู้ใช้/รหัส/URL
        </li>
        <li>
          ปักหมุด (<strong className="font-semibold text-[#2e2a58]">ดาว</strong>) บัญชีที่ใช้บ่อยให้อยู่บนสุด
        </li>
        <li>
          ใช้ปุ่ม <strong className="font-semibold text-[#2e2a58]">คัดลอก</strong> บนการ์ด — ไม่ต้องเปิดดูรหัสทุกครั้ง
        </li>
      </ol>
    ),
  },
  {
    title: "เมนูหลัก (2 รายการ)",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — รายการบัญชีทั้งหมด · ค้นหา · กรอง · เพิ่ม/แก้ไข/ลบ
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ตั้งค่าความปลอดภัยและพฤติกรรมคัดลอก (ถ้ามีในโมดูล)
        </li>
        <li>
          มือถือใช้ <strong className="font-semibold text-[#2e2a58]">dock ล่าง</strong> 2 ปุ่ม · กดซ่อนหัวเพื่อย้ายเมนูขึ้นแถบม่วง
        </li>
      </ul>
    ),
  },
  {
    title: "เก็บอย่างปลอดภัย",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          รหัสผ่านถูก <strong className="font-semibold text-[#2e2a58]">เข้ารหัส AES-256-GCM</strong> ก่อนเก็บในฐานข้อมูล
        </li>
        <li>
          เห็นรหัสจริงต่อเมื่อกด <strong className="font-semibold text-[#2e2a58]">แสดงรหัส</strong> เท่านั้น — ระบบบันทึกเวลาใช้งานล่าสุด
        </li>
        <li>อย่าแชร์หน้าจอขณะเปิดรหัส · ปิดแท็บเมื่อไม่ใช้งาน</li>
        <li>ข้อมูลผูกกับบัญชี MAWELL ของคุณ — ไม่แชร์ข้ามผู้ใช้</li>
      </ul>
    ),
  },
  {
    title: "เพิ่ม · แก้ไข · จัดหมวด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          เพิ่มบัญชี — ชื่อเรียก · ชื่อผู้ใช้/อีเมล · รหัส · URL · หมายเหตุ · เลือกหมวด
        </li>
        <li>
          เลือก <strong className="font-semibold text-[#2e2a58]">บริการยอดนิยม</strong> (Facebook, Gmail ฯลฯ) — ระบบใส่ไอคอนและสีให้อัตโนมัติ
        </li>
        <li>
          กด <strong className="font-semibold text-[#2e2a58]">ดาว</strong> บนการ์ด — ปักหมุดบัญชีที่ใช้บ่อยให้เรียงบนสุด
        </li>
        <li>
          แก้ไข/ลบ — ไอคอนบนการ์ด · ลบผ่าน popup ยืนยันกลางจอ
        </li>
        <li>กรองตามหมวดหรือค้นหาชื่อ — ใช้ช่องค้นหาด้านบนรายการ</li>
      </ul>
    ),
  },
  {
    title: "คัดลอกเร็ว",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          กดปุ่ม <strong className="font-semibold text-[#2e2a58]">ก๊อบปี้</strong> ที่การ์ด — คัดลอกชื่อผู้ใช้หรือรหัสไปคลิปบอร์ดทันที
        </li>
        <li>
          หลังคัดลอกรหัส — คลิปบอร์ดอาจ <strong className="font-semibold text-[#2e2a58]">ล้างอัตโนมัติหลัง 30 วินาที</strong> (อุปกรณ์ที่รองรับ)
        </li>
        <li>แตะการ์ดเพื่อเปิดรายละเอียดเต็ม · คัดลอกทีละฟิลด์จากโมดัลได้</li>
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
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-3 sm:gap-4">
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
