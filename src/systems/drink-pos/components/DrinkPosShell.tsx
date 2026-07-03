"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  drinkPosGlassShellClass,
  drinkPosMainPaddingBottomClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { DrinkPosMobileBottomProvider } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import {
  ModuleShopSettingsDesktopNavLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";

const base = "/dashboard/drink-pos";
const settingsHref = `${base}/settings`;

function IconTabProducts({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 8h15l-1.5 9H7.5L6 8zM6 8L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21a1 1 0 002 0M16 21a1 1 0 002 0" strokeLinecap="round" />
    </svg>
  );
}

function IconTabSales({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTabMembers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M16 7l1.5 1.5M18 4v3M21 5.5h-3" strokeLinecap="round" />
    </svg>
  );
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
        active
          ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-[#5b61ff]" : "text-slate-400")} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function DrinkPosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const onModule = pathname.startsWith(base);
  const pathNorm = pathname.replace(/\/+$/, "");
  const isFinance = pathNorm.endsWith(`${base}/finance`) || pathNorm.endsWith(`${base}/sales`);
  const isMembers = pathNorm.endsWith(`${base}/members`);
  const isSettings = pathNorm.endsWith(settingsHref);
  const isProducts = onModule && !isFinance && !isMembers && !isSettings;
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <DrinkPosMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header className={`${drinkPosGlassShellClass} shrink-0 flex flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden`}>
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-5 w-5" aria-hidden>
                  <path d="M8 3h8l1 4H7l1-4zM6 7h12v2a5 5 0 01-5 5 5 5 0 01-5-5V7z" strokeLinejoin="round" />
                  <path d="M9 14v4M12 14v4M15 14v4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">POS ร้านเครื่องดื่ม</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
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
          </div>

          <nav
            className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูล POS ร้านเครื่องดื่ม"
          >
            <ul className="grid grid-cols-4 gap-1">
              <li className="min-w-0">
                <TabLink href={base} label="สินค้า" active={isProducts} icon={<IconTabProducts className="h-4 w-4" />} />
              </li>
              <li className="min-w-0">
                <TabLink
                  href={`${base}/members`}
                  label="สมาชิก"
                  active={isMembers}
                  icon={<IconTabMembers className="h-4 w-4" />}
                />
              </li>
              <li className="min-w-0">
                <TabLink href={`${base}/finance`} label="การเงิน" active={isFinance} icon={<IconTabSales className="h-4 w-4" />} />
              </li>
              {moduleShopSettingsDesktopNavItem(
                <ModuleShopSettingsDesktopNavLink href={settingsHref} active={isSettings} />,
              )}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือการใช้งาน — POS ร้านเครื่องดื่ม"
          subtitle="หน้าสินค้า ยอดขาย และปุ่มเมนู"
          sections={[
            {
              title: "เมนูหลัก (คอมพิวเตอร์)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">สินค้า</strong> / <strong className="font-semibold text-[#2e2a58]">ยอดขาย</strong>{" "}
                    อยู่ในแถบเดียวกัน แบ่งซ้าย–ขวาเต็มความกว้าง (แบบคาร์แคร์) — ไม่ต้องมีคำอธิบายยาวใต้ชื่อโมดูล
                  </li>
                  <li>มือถือใช้เมนูล่างแทน — ดูกฎ dock ของโมดูลนี้ใน repo</li>
                </ul>
              ),
            },
            {
              title: "หน้าสินค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>การ์ดสรุปด้านบน: หมวด / สินค้าเปิดขาย / แนะนำ / ยอดขายวันนี้ (กทม.)</li>
                  <li>กรองหมวด: แถบชิปเลื่อนแนวนอน — แตะหมวดเพื่อกรองการ์ดสินค้า</li>
                  <li>
                    แตะการ์ดสินค้า: ครั้งเดียวเพิ่มในบิล 1 ชิ้น — แตะซ้ำเร็วบนการ์ดเดิมเพิ่ม 2 ชิ้น (ช่วงเวลาสั้น ๆ ตามโค้ด{" "}
                    <code className="rounded bg-[#ecebff] px-1 text-xs">GENERAL_STORE_CARD_DOUBLE_TAP_MS</code>)
                  </li>
                  <li>แก้ไข / ลบสินค้า: ไอคอนด้านล่างการ์ด (ไม่ใช้ข้อความยาวบนการ์ด)</li>
                  <li>รายการรอก่อนบันทึกบิล: มือถืออยู่เหนือ dock — เดสก์ท็อปเป็นการ์ดลอยมุมขวาล่าง</li>
                  <li>
                    ปุ่ม <strong className="font-semibold text-[#2e2a58]">แนะภาพตามสินค้า</strong> / <strong className="font-semibold text-[#2e2a58]">แนะภาพตามหมวด</strong>: เติม URL รูปตัวอย่างจากชื่อสินค้า+หมวดหรือชื่อหมวด — ควรอัปโหลดรูปจริงของร้านก่อนขาย
                  </li>
                </ul>
              ),
            },
            {
              title: "หน้ายอดขาย",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>กราฟ 7 วัน + ยอดรวมด้านขวา — กรองบิลแล้วกราฟสะท้อนตามข้อมูลที่กรอง</li>
                  <li>ปุ่มรีเฟรชอยู่ข้างปุ่มบันทึกขายในการ์ดบิล — มือถือเป็นไอคอนล้วน</li>
                  <li>ฟิลเตอร์มือถือ: ไอคอนกรอง — เดสก์ท็อปแสดงฟอร์มเต็ม</li>
                </ul>
              ),
            },
            {
              title: "ข้อความใน UI",
              content: (
                <p>
                  ไม่ใส่คำอธิบายการตลาดหรือคู่มือยาวใน shell / หัวการ์ด / โมดัล — ใช้โมดัลคู่มือนี้และ{" "}
                  <code className="rounded bg-[#ecebff] px-1 text-xs">aria-label</code> แทน
                </p>
              ),
            },
          ]}
        />

        <div
          className={cn(
            drinkPosMainPaddingBottomClass,
            appModuleShellMainScrollClass,
          )}
        >
          {children}
        </div>
      </div>
    </DrinkPosMobileBottomProvider>
  );
}
