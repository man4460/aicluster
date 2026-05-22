"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { AssetMobileDock } from "@/systems/asset/components/AssetMobileDock";
import {
  assetFilterChipClass,
  assetIconBadgeClass,
  assetModuleHeaderShellClass,
  assetNavItemActiveClass,
  assetNavItemBase,
  assetNavItemIdleClass,
  assetSegmentShellClass,
} from "@/systems/asset/asset-ui-tokens";

type AssetNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const navLinks: readonly AssetNavItem[] = [
  { href: "/dashboard/asset", label: "แดชบอร์ด", icon: IconDashboard },
  { href: "/dashboard/asset/assets", label: "ทรัพย์สิน", icon: IconBox },
  {
    href: "/dashboard/asset/transactions",
    label: "ดำเนินการ",
    icon: IconArrows,
    includes: [
      "/dashboard/asset/maintenance",
      "/dashboard/asset/disposals",
      "/dashboard/asset/audits",
    ] as const,
  },
  {
    href: "/dashboard/asset/master",
    label: "ข้อมูลหลัก",
    icon: IconStack,
    includes: ["/dashboard/asset/settings"] as const,
  },
  { href: "/dashboard/asset/reports", label: "รายงาน", icon: IconReport },
] as const;

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

function navActive(pathname: string, href: string, includes?: readonly string[]): boolean {
  if (href === "/dashboard/asset") {
    return pathname === "/dashboard/asset";
  }
  if (includes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AssetShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  const inOperationsGroup = navActive(pathname, "/dashboard/asset/transactions", [
    "/dashboard/asset/maintenance",
    "/dashboard/asset/disposals",
    "/dashboard/asset/audits",
  ]);
  const inMasterGroup = navActive(pathname, "/dashboard/asset/master", [
    "/dashboard/asset/settings",
  ]);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(assetModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className={assetIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
                  <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
                  <path d="M12 13v8" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  บริหารทรัพย์สิน
                </h1>
                <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
                  ทะเบียนทรัพย์สิน · มอบ–ยืม–ย้าย · ซ่อมบำรุง · จำหน่ายออก · ตรวจนับ พร้อมรายงาน
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="flex h-10 min-h-[40px] items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 text-sm font-semibold text-[#5b61ff] shadow-sm backdrop-blur-md transition hover:bg-white/75 sm:px-4"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="เปิดคู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" />
            </svg>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        <nav
          aria-label="เมนู บริหารทรัพย์สิน"
          className="mt-4 hidden border-t border-white/50 pt-4 md:block"
        >
          <ul className="grid grid-cols-5 gap-2">
            {navLinks.map(({ href, label, icon, includes }) => (
              <li key={href} className="min-w-0">
                <NavItem href={href} icon={icon} active={navActive(pathname, href, includes)}>
                  {label}
                </NavItem>
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
        title="คู่มือการใช้งาน — บริหารทรัพย์สิน"
        subtitle="ตั้งระบบ ลงทะเบียนทรัพย์สิน และเริ่มเดินงานครั้งแรกใน 5 ขั้น"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ตั้งข้อมูลหลัก (หมวด/แผนก/สถานที่/ผู้ขาย) → ลงทะเบียนทรัพย์สิน → ทำใบมอบ/ยืม/ย้าย → บันทึกซ่อมบำรุง → ตรวจนับครั้งแรก
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#5b61ff]">
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
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>ภาพรวมจำนวนและมูลค่าทรัพย์สิน + แยกตามสถานะ/หมวด</li>
                <li>แจ้งเตือนประกันใกล้หมด ซ่อมยังไม่เสร็จ ตรวจนับไม่ตรง</li>
                <li>กราฟมูลค่าตามแผนก/หมวด เปรียบเทียบรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ทรัพย์สิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>เพิ่ม–แก้–ลบ ทรัพย์สิน พร้อมรหัส QR และรูป</li>
                <li>กรองตามหมวด/แผนก/สถานที่/สถานะ/สภาพ</li>
                <li>ดูประวัติเคลื่อนไหว ซ่อมบำรุง ตรวจนับ ของทรัพย์สินรายตัว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ดำเนินการ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
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
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>หมวด/แผนก/สถานที่/ผู้ขาย — ใช้ผูกกับทรัพย์สิน</li>
                <li>ตั้งค่า — ชื่อองค์กร ที่อยู่ Prefix รหัส และสกุลเงิน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>มูลค่าทรัพย์สินตามแผนก/หมวด</li>
                <li>การเสื่อมราคาและประมาณการมูลค่าคงเหลือ</li>
                <li>ส่งออก CSV เพื่อเปิดใน Excel/Sheet</li>
              </ul>
            ),
          },
        ]}
      />

      <div>{children}</div>
      <AssetMobileDock />
    </div>
  );
}

function NavItem({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(assetNavItemBase, "w-full sm:w-auto", active ? assetNavItemActiveClass : assetNavItemIdleClass)}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
      {children}
    </Link>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
