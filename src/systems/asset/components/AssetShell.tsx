"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { AssetMobileBottomProvider } from "@/systems/asset/components/AssetMobileBottomChrome";
import {
  ASSET_HEADER_COLLAPSE_EVENT,
  ASSET_MODULE_DISPLAY_NAME,
  ASSET_NAV_ITEMS,
  isAssetNavItemActive,
  readAssetHeaderCollapsed,
  writeAssetHeaderCollapsed,
  type AssetNavKey,
} from "@/systems/asset/asset-module-nav";
import {
  assetAccentBarClass,
  assetGlassShellClass,
  assetMainPaddingBottomClass,
  assetModuleIconBadgeClass,
  assetNavActiveClass,
  assetNavIdleClass,
} from "@/systems/asset/lib/ui-tokens";
import { assetFilterChipClass, assetSegmentShellClass } from "@/systems/asset/asset-ui-tokens";

type AssetNavKeyIcon = AssetNavKey;

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: AssetNavKeyIcon, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "assets":
      return <IconBox className={className} />;
    case "operations":
      return <IconArrows className={className} />;
    case "master":
      return <IconStack className={className} />;
    case "reports":
      return <IconReport className={className} />;
  }
}

const operationsSubLinks = [
  { href: "/dashboard/asset/transactions", label: "เคลื่อนไหว" },
  { href: "/dashboard/asset/maintenance", label: "ซ่อมบำรุง" },
  { href: "/dashboard/asset/disposals", label: "จำหน่ายออก" },
  { href: "/dashboard/asset/audits", label: "ตรวจนับ" },
] as const;

const masterSubLinks = [
  { href: "/dashboard/asset/master", label: "หมวดหมู่" },
  { href: "/dashboard/asset/master/departments", label: "แผนก" },
  { href: "/dashboard/asset/master/locations", label: "สถานที่" },
  { href: "/dashboard/asset/master/suppliers", label: "ผู้ขาย" },
  { href: "/dashboard/asset/settings", label: "ตั้งค่า" },
] as const;

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
        active ? assetNavActiveClass : assetNavIdleClass,
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
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {collapsed ? (
        <path d="M6 9l6-6 6 6" />
      ) : (
        <path d="M6 15l6 6 6-6" />
      )}
    </svg>
  );
}

const guideSections = [
  {
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <>
        <p>
          ตั้งข้อมูลหลัก (หมวด/แผนก/สถานที่/ผู้ขาย) → ลงทะเบียนทรัพย์สิน → ทำใบมอบ/ยืม/ย้าย → บันทึกซ่อมบำรุง → ตรวจนับครั้งแรก
        </p>
        <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
          <li>ตั้งค่าและเพิ่มข้อมูลหลักขั้นพื้นฐาน</li>
          <li>ลงทะเบียนทรัพย์สินพร้อมรหัส QR</li>
          <li>ทำใบมอบ/ยืม/ย้ายเมื่อมีการเปลี่ยนสถานะ</li>
          <li>เปิดใบซ่อมเมื่อแจ้งซ่อม</li>
          <li>ตรวจนับเป็นรอบ ๆ เพื่อให้ข้อมูลตรงจริง</li>
        </ol>
      </>
    ),
  },
  {
    title: "เมนู: แดชบอร์ด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ภาพรวมจำนวนและมูลค่าทรัพย์สิน + แยกตามสถานะ/หมวด</li>
        <li>แจ้งเตือนประกันใกล้หมด ซ่อมยังไม่เสร็จ ตรวจนับไม่ตรง</li>
        <li>กราฟมูลค่าตามแผนก/หมวด เปรียบเทียบรายเดือน</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ทรัพย์สิน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>เพิ่ม–แก้–ลบ ทรัพย์สิน พร้อมรหัส QR และรูป</li>
        <li>กรองตามหมวด/แผนก/สถานที่/สถานะ/สภาพ</li>
        <li>ดูประวัติเคลื่อนไหว ซ่อมบำรุง ตรวจนับ ของทรัพย์สินรายตัว</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ดำเนินการ",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>เคลื่อนไหว — มอบหมาย/ยืม/คืน/ย้ายระหว่างสถานที่หรือผู้ดูแล</li>
        <li>ซ่อมบำรุง — แจ้งซ่อม บันทึกผล ค่าใช้จ่าย ผู้ให้บริการ</li>
        <li>จำหน่ายออก — ขาย/บริจาค/ตัดจำหน่าย ทรัพย์สินที่หมดอายุการใช้งาน</li>
        <li>ตรวจนับ — เช็คตำแหน่งและสภาพจริง พบไม่ตรงให้บันทึกตามจริง</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ข้อมูลหลัก/ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>หมวด/แผนก/สถานที่/ผู้ขาย — ใช้ผูกกับทรัพย์สิน</li>
        <li>ตั้งค่า — ชื่อองค์กร ที่อยู่ Prefix รหัส และสกุลเงิน</li>
      </ul>
    ),
  },
  {
    title: "เมนู: รายงาน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>มูลค่าทรัพย์สินตามแผนก/หมวด</li>
        <li>การเสื่อมราคาและประมาณการมูลค่าคงเหลือ</li>
        <li>ส่งออก CSV เพื่อเปิดใน Excel/Sheet</li>
      </ul>
    ),
  },
];

export function AssetShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readAssetHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readAssetHeaderCollapsed());
    sync();
    window.addEventListener(ASSET_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ASSET_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeAssetHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const inOperationsGroup = isAssetNavItemActive(pathname, "operations");
  const inMasterGroup = isAssetNavItemActive(pathname, "master");

  return (
    <AssetMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-3 sm:gap-4">
        <header
          className={cn(
            assetGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={assetAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div className={assetModuleIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 8 12 3 3 8l9 5 9-5Z" />
                  <path d="M3 8v8l9 5 9-5V8" />
                  <path d="M12 13v8" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {ASSET_MODULE_DISPLAY_NAME}
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
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
            aria-label="เมนู บริหารทรัพย์สิน"
          >
            <ul className="grid grid-cols-5 gap-2">
              {ASSET_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isAssetNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {inOperationsGroup ? (
          <nav aria-label="เมนูย่อยดำเนินการ" className={assetSegmentShellClass}>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {operationsSubLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn("flex w-full items-center justify-center", assetFilterChipClass(active))}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {inMasterGroup ? (
          <nav aria-label="เมนูย่อยข้อมูลหลัก" className={assetSegmentShellClass}>
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {masterSubLinks.map((item) => {
                const active =
                  item.href === "/dashboard/asset/master"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn("flex w-full items-center justify-center", assetFilterChipClass(active))}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือ — บริหารทรัพย์สิน"
          subtitle="ทะเบียนทรัพย์สิน · มอบ–ยืม–ย้าย · ซ่อมบำรุง · จำหน่ายออก · ตรวจนับ พร้อมรายงาน"
          sections={guideSections}
        />

        <div className={cn(assetMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </AssetMobileBottomProvider>
  );
}
