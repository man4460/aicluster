"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AppMobileDockShell,
  AppUsageGuideModal,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  LMS_HEADER_COLLAPSE_EVENT,
  LMS_MODULE_DISPLAY_NAME,
  LMS_NAV_ITEMS,
  lmsModuleNavIcon,
  isLmsModuleNavItemActive,
  readLmsHeaderCollapsed,
  writeLmsHeaderCollapsed,
} from "@/systems/lms/lms-module-nav";

const lmsModuleShellClass = cn(
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  "print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

function LmsModuleChromeInner({
  children,
  schoolName,
}: {
  children: ReactNode;
  schoolName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readLmsHeaderCollapsed());
    sync();
    window.addEventListener(LMS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LMS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeLmsHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(
          lmsModuleShellClass,
          "flex flex-col px-4 py-4 sm:px-6 sm:py-5",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {LMS_MODULE_DISPLAY_NAME}
              </h1>
              {schoolName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{schoolName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-slate-50 active:scale-95 sm:w-auto sm:gap-2 sm:px-3"
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
              className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-[#4d47b6] shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูLMS คอร์สออนไลน์" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LMS_NAV_ITEMS.map((item) => {
              const active = isLmsModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {lmsModuleNavIcon(item.key)}
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — LMS คอร์สออนไลน์"
        subtitle="แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า · เว็บสาธารณะ"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ (โรงเรียน/สถาบันใหม่)",
            content: (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อสถาบัน · โลโก้ · พร้อมเพย์/บัญชี · ตั้งค่าเว็ปลิงค์ลูกค้า (แบนเนอร์ · slug)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ → คอร์ส</strong> — สร้างคอร์ส · บทเรียน · ข้อสอบ · ราคา · เปิด/ปิดขาย
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ → นักเรียน</strong> — เพิ่มนักเรียน · มอบสิทธิ์คอร์ส · ติดตามความคืบหน้า
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">แชร์พอร์ทัล</strong> — คัดลอกลิงก์ <strong className="font-semibold text-[#2e2a58]">/lms/[slug]</strong> ให้นักเรียนซื้อ/เรียนออนไลน์
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ทดลองขาย</strong> — สร้างคำขอซื้อจากเว็บ · อนุมัติที่แดชบอร์ด · ตรวจการเงิน
                </li>
              </ol>
            ),
          },
          {
            title: "เมนูหลักโมดูล (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — ภาพรวม · คำขอซื้อ (แท็บย่อย)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — สรุปรายรับ–รายจ่าย · กรอง · กราฟ · ประวัติ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> — คอร์ส · นักเรียน (แท็บย่อย)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ตั้งค่าพื้นฐาน · ตั้งค่าเกี่ยวกับการเงิน · ตั้งค่าเว็ปลิงค์ลูกค้า
                </li>
                <li>
                  มือถือใช้ <strong className="font-semibold text-[#2e2a58]">dock ล่าง</strong> 4 ปุ่ม · เดสก์ท็อปใช้แท็บในการ์ดหัวโมดูล
                </li>
                <li>
                  ปุ่ม <strong className="font-semibold text-[#2e2a58]">ซ่อนส่วนหัว</strong> ยุบการ์ดชื่อโมดูล — เมนูยังใช้ dock/แถบม่วงได้
                </li>
              </ul>
            ),
          },
          {
            title: "แดชบอร์ด — ภาพรวม · คำขอซื้อ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — สถิติคอร์ส · นักเรียน · รายได้ · คำขอรอดำเนินการ (กริด 2 คอลัมน์บนมือถือ)
                </li>
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">คำขอซื้อ</strong> — รายการสมัคร/ซื้อคอร์สจากเว็บ · อนุมัติ/ปฏิเสธ · ดูสลิปชำระ (ถ้ามี)
                </li>
                <li>
                  ปุ่ม <strong className="font-semibold text-[#2e2a58]">แสดงกรอง / ซ่อนกรอง</strong> บนรายการคำขอ — ชิปสถานะ · ค้นหา · ล้างเมื่อค้าง
                </li>
                <li>อนุมัติแล้ว — นักเรียนได้สิทธิ์เข้าคอร์สบนพอร์ทัลอัตโนมัติ</li>
              </ul>
            ),
          },
          {
            title: "การเงิน — กรอง · กราฟ · รายการ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  ปุ่ม <strong className="font-semibold text-[#2e2a58]">แสดงกรอง / ซ่อนกรอง</strong> ทุกขนาดจอ — มือถือเป็นไอคอน funnel
                </li>
                <li>
                  ช่วงเวลา — วันนี้ / 7 วัน / เดือน / ปี / กำหนดเอง · กราฟ <strong className="font-semibold text-[#2e2a58]">compact</strong> ชุดเดียวทั้งหน้า
                </li>
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">รายรับ · รายจ่าย · ประวัติ</strong> — รายรับจากขายคอร์ส · รายจ่ายแนบสลิปได้
                </li>
                <li>สลิป — คลิกรูปย่อขยายเต็มจอ (lightbox) · แก้/ลบด้วย popup ยืนยันกลางจอ</li>
              </ul>
            ),
          },
          {
            title: "การจัดการ — คอร์ส · นักเรียน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">คอร์ส</strong> — เพิ่ม/แก้ไขคอร์ส · รูปปก · ราคา · คำอธิบาย · เปิด/ปิดขาย
                </li>
                <li>
                  กดเข้าคอร์ส — จัดการ <strong className="font-semibold text-[#2e2a58]">บทเรียน</strong> (วิดีโอ/เอกสาร) และ <strong className="font-semibold text-[#2e2a58]">ข้อสอบ</strong> แยกหน้าเต็ม
                </li>
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">นักเรียน</strong> — รายชื่อ · ค้นหา · มอบ/ถอนสิทธิ์คอร์ส · ดูความคืบหน้า
                </li>
                <li>ปุ่มแก้ไข/ลบในแถวเป็นไอคอน — มี aria-label ชัดเจน</li>
              </ul>
            ),
          },
          {
            title: "ตั้งค่า (3 แท็บ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อสถาบัน · โลโก้ · ที่อยู่ · ติดต่อ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชีโอน · ขนาดกระดาษสลิป · หมายเหตุใบเสร็จ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็ปลิงค์ลูกค้า</strong> — slug พอร์ทัล · แบนเนอร์ · ข้อความต้อนรับ · ลิงก์แชร์ <strong className="font-semibold text-[#2e2a58]">/lms/[slug]</strong>
                </li>
                <li>มือถือ — dropdown เลือกแท็บ · เดสก์ท็อป — แถบ pill คู่ปุ่มบันทึก</li>
              </ul>
            ),
          },
          {
            title: "พอร์ทัลนักเรียน · ซื้อคอร์ส · เรียน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  นักเรียนเปิด <strong className="font-semibold text-[#2e2a58]">/lms/[slug]</strong> — ดูแคตตาล็อกคอร์ส · รายละเอียด · ราคา
                </li>
                <li>
                  ซื้อคอร์ส — เลือกพร้อมเพย์/โอน · QR ฝังยอด · แนบสลิป · รออนุมัติจากแดชบอร์ด (แท็บคำขอซื้อ)
                </li>
                <li>
                  หลังอนุมัติ — เข้าเรียนบทเรียน/ทำข้อสอบบนพอร์ทัล · ความคืบหน้าบันทึกอัตโนมัติ
                </li>
                <li>ลิงก์พอร์ทัลตั้งจากแท็บตั้งค่าเว็ปลิงค์ลูกค้า — คัดลอกแชร์ใน LINE/Facebook ได้</li>
              </ul>
            ),
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างLMS คอร์สออนไลน์">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {LMS_NAV_ITEMS.map((item) => {
            const active = isLmsModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {lmsModuleNavIcon(item.key)}
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                    {item.shortLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>
    </div>
  );
}

export function LmsModuleChrome({
  children,
  schoolName,
}: {
  children: ReactNode;
  schoolName?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>
      }
    >
      <LmsModuleChromeInner schoolName={schoolName}>{children}</LmsModuleChromeInner>
    </Suspense>
  );
}
