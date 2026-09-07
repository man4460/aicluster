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
  CLUB_EVENT_HEADER_COLLAPSE_EVENT,
  CLUB_EVENT_MODULE_DISPLAY_NAME,
  CLUB_EVENT_NAV_ITEMS,
  clubEventModuleNavIcon,
  isClubEventModuleNavItemActive,
  readClubEventHeaderCollapsed,
  writeClubEventHeaderCollapsed,
} from "@/systems/club-event/club-event-module-nav";

const clubEventModuleShellClass = cn(
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

function ClubEventModuleChromeInner({
  children,
  clubName,
}: {
  children: ReactNode;
  clubName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readClubEventHeaderCollapsed());
    sync();
    window.addEventListener(CLUB_EVENT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CLUB_EVENT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeClubEventHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(
          clubEventModuleShellClass,
          "flex flex-col px-4 py-4 sm:px-6 sm:py-5",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M8 7V3M16 7V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {CLUB_EVENT_MODULE_DISPLAY_NAME}
              </h1>
              {clubName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{clubName}</p>
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

        <nav aria-label="เมนูบริหารชมรม" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CLUB_EVENT_NAV_ITEMS.map((item) => {
              const active = isClubEventModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {clubEventModuleNavIcon(item.key)}
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
        title="คู่มือการใช้งาน — บริหารชมรม"
        subtitle="แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า · เว็บสาธารณะ"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>ตั้งค่าชมรมและเว็บสาธารณะให้ครบก่อนประกาศกิจกรรม แล้วทดสอบลิงก์สมาชิก 1 รอบ</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>
                    เปิด <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อชมรม · โลโก้ · ช่องทางติดต่อ ·
                    พร้อมเพย์/บัญชี
                  </li>
                  <li>
                    ตั้งค่า <strong className="font-semibold text-[#2e2a58]">เว็ปลิงค์ลูกค้า</strong> — แบนเนอร์ · slug ·
                    คัดลอกลิงก์ <code className="rounded bg-[#ecebff] px-1 text-xs">/club/[slug]</code>
                  </li>
                  <li>
                    เพิ่ม <strong className="font-semibold text-[#2e2a58]">สมาชิก</strong> และ{" "}
                    <strong className="font-semibold text-[#2e2a58]">โครงสร้างกรรมการ</strong> ในแดชบอร์ด
                  </li>
                  <li>
                    สร้าง <strong className="font-semibold text-[#2e2a58]">กิจกรรม</strong> — วันเวลา · สถานที่ · แกลเลอรี/วิดีโอ ·
                    ลิงก์ลงทะเบียน (ถ้ามี)
                  </li>
                  <li>บันทึกรายรับ–รายจ่ายในการเงิน · แนบสลิปเมื่อโอน</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนูหลัก (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — กำหนดการ · กิจกรรมย้อนหลัง · โครงสร้างกรรมการ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — รายรับ · รายจ่าย · กราฟ · สลิป
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> — สมาชิก · ทรัพย์สินชมรม
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — พื้นฐาน · การเงิน · ค่าบำรุง · เว็ปลิงค์ลูกค้า
                </li>
                <li>เดสก์ท็อป: แท็บในส่วนหัว · กดซ่อนหัวแล้วแท็บย้ายไปแถบม่วงด้านบน</li>
              </ul>
            ),
          },
          {
            title: "แดชบอร์ด",
            content: (
              <>
                <p className="font-semibold text-[#2e2a58]">แท็บย่อย</p>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">กำหนดการ</strong> — กิจกรรมที่จะมาถึง · กด + เพิ่มกิจกรรม ·
                    แตะการ์ดเข้ารายละเอียด/แก้ไข
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ย้อนหลัง</strong> — กิจกรรมที่จบแล้ว · ดูแกลเลอรี · คำตอบจากลิงก์สอบถาม
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">โครงสร้าง</strong> — ตำแหน่งกรรมการ · ชื่อ · ติดต่อ · เรียงลำดับแสดงผล
                  </li>
                </ul>
                <p className="mt-3 font-semibold text-[#2e2a58]">รายละเอียดกิจกรรม</p>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เพิ่มวิดีโอ YouTube เป็นกริดการ์ด · คลิกเล่นในป๊อปอัป · แกลเลอรีรูป 3/8 คอลัมน์</li>
                  <li>ปุ่ม <strong className="font-semibold text-[#2e2a58]">รับชมสไลด์</strong> เมื่อมีรูป — เล่นอัตโนมัติ · เต็มจอได้</li>
                  <li>สร้างลิงก์ลงทะเบียน/สอบถาม · ดูคำตอบที่เมนู submissions · จุดลงทะเบียนวันงาน (desk)</li>
                </ul>
              </>
            ),
          },
          {
            title: "การเงิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สรุปรายรับ (เขียว) · รายจ่าย (ชมพู) · คงเหลือ — กรองช่วง วันนี้/เดือนนี้/ปีนี้/กำหนดเอง</li>
                <li>กด <strong className="font-semibold text-[#2e2a58]">แสดงกรอง</strong> และ <strong className="font-semibold text-[#2e2a58]">แสดงกราฟ</strong> ตามต้องการ</li>
                <li>บันทึกรายรับ/รายจ่าย — แนบสลิปโอน · ดูรูปเต็มจอจากรายการ · แก้ไข/ลบแถวได้</li>
                <li>ใช้กราฟเปรียบเทียบรายรับ–รายจ่ายรายวันก่อนสรุปงบประชุมหรือส่งรายงานกรรมการ</li>
              </ul>
            ),
          },
          {
            title: "การจัดการ",
            content: (
              <>
                <p className="font-semibold text-[#2e2a58]">สมาชิก</p>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เพิ่มสมาชิก — ชื่อ · เบอร์ · อีเมล · ตำแหน่ง · สถานะใช้งาน</li>
                  <li>ค้นหาและกรองสถานะ · แก้ไข/ลบจากไอคอนแถว · ใช้ข้อมูลติดต่อกิจกรรมและค่าบำรุง</li>
                </ul>
                <p className="mt-3 font-semibold text-[#2e2a58]">ทรัพย์สิน</p>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>บันทึกอุปกรณ์/ทรัพย์สินชมรม — ชื่อ · สถานที่ · สภาพ · หมายเหตุ</li>
                  <li>กรองและค้นหา · อัปเดตเมื่อยืม–คืนหรือซ่อมบำรุง</li>
                </ul>
              </>
            ),
          },
          {
            title: "ตั้งค่า",
            content: (
              <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อชมรม · โลโก้ · ที่อยู่ · เบอร์ · LINE
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชี ·
                  ขนาดสลิป/เอกสาร
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ค่าบำรุงประจำปี</strong> — กำหนดยอด · รอบปี · ใช้เก็บ/ติดตามสมาชิก
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็ปลิงค์ลูกค้า</strong> — slug · แบนเนอร์ · แกลเลอรี ·
                  ลิงก์โซเชียล · คัดลอก URL สาธารณะ
                </li>
              </ol>
            ),
          },
          {
            title: "พอร์ทัลสาธารณะ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  แชร์ลิงก์ <code className="rounded bg-[#ecebff] px-1 text-xs">/club/[slug]</code> จากแท็บตั้งค่าเว็ปลิงค์ลูกค้า
                </li>
                <li>สมาชิกและผู้สนใจดูกำหนดการ · รายละเอียดกิจกรรม · แกลเลอรี/วิดีโอ — ไม่ต้องล็อกอิน MAWELL</li>
                <li>ทดสอบบนมือถือก่อนแชร์ในกลุ่ม LINE — ตรวจว่ารูปและวันที่แสดงถูกต้อง (เวลาไทย)</li>
              </ul>
            ),
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างบริหารชมรม">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {CLUB_EVENT_NAV_ITEMS.map((item) => {
            const active = isClubEventModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {clubEventModuleNavIcon(item.key)}
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

export function ClubEventModuleChrome({
  children,
  clubName,
}: {
  children: ReactNode;
  clubName?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>
      }
    >
      <ClubEventModuleChromeInner clubName={clubName}>{children}</ClubEventModuleChromeInner>
    </Suspense>
  );
}
