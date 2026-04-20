"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        navItemBase,
        "w-full sm:w-auto",
        active ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
      )}
    >
      {children}
    </Link>
  );
}

const navLinks = [
  { href: "/dashboard/attendance", label: "แดชบอร์ด" },
  { href: "/dashboard/attendance/settings", label: "ตั้งค่า" },
  { href: "/dashboard/attendance/logs", label: "รายงาน" },
  { href: "/dashboard/attendance/roster", label: "รายชื่อพนักงาน" },
  { href: "/dashboard/attendance/qr", label: "QR จุดเช็คอิน" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/attendance") {
    return pathname === "/dashboard/attendance";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AttendanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">เช็คอินอัจฉริยะ</h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
              เช็คอิน–เช็คเอาท์ กะงาน รายงาน และ QR จุดเช็คอิน — ใช้บัญชีเจ้าของ
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="app-btn-soft min-h-[44px] shrink-0 rounded-xl border border-[#dcd8f0] px-4 py-2.5 text-sm font-semibold text-[#4d47b6] hover:bg-[#f4f3ff]"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
          >
            คู่มือการใช้งาน
          </button>
        </div>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — เช็คอินอัจฉริยะ"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูสำหรับผู้ดูแลและพนักงาน"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ให้ตั้งค่าที่เมนู <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> และ{" "}
                  <strong className="font-semibold text-[#2e2a58]">รายชื่อพนักงาน</strong> ก่อน แล้วเผยแพร่{" "}
                  <strong className="font-semibold text-[#2e2a58]">QR จุดเช็คอิน</strong> ให้ทีมใช้งาน
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>กำหนดกะและนโยบายสาย/ขาด</li>
                  <li>เพิ่มพนักงานให้ครบทุกคน</li>
                  <li>เปิดใช้ QR และทดสอบเช็คอินจริง</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูภาพรวมพนักงานที่เช็คอินแล้ว เช็คเอาท์แล้ว และที่ยังไม่เข้า</li>
                <li>ติดตามสถานะหน้างานแบบเรียลไทม์ในวันปัจจุบัน</li>
                <li>เหมาะสำหรับหัวหน้างานใช้ตรวจความพร้อมทีมก่อนเริ่มกะ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ตั้งค่า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>กำหนดกะเวลางาน เวลาเข้างาน-เลิกงาน และเงื่อนไขการนับสาย</li>
                <li>ตั้งค่ากฎการใช้งานระบบให้ตรงกับนโยบายองค์กร</li>
                <li>ควรตรวจค่าทั้งหมดก่อนเริ่มใช้งานจริงทุกสาขา</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูประวัติการเข้างานย้อนหลังตามช่วงวันที่ต้องการ</li>
                <li>กรองตามพนักงานเพื่อส่งต่อคำนวณเงินเดือน</li>
                <li>ใช้ตรวจเหตุผิดปกติ เช่น ลืมเช็คเอาท์หรือเวลาไม่ครบ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายชื่อพนักงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่ม/แก้ไขข้อมูลพนักงานที่สามารถเช็คอินได้</li>
                <li>ปิดการใช้งานพนักงานที่ลาออกเพื่อลดความผิดพลาด</li>
                <li>ตรวจชื่อและรหัสพนักงานให้ตรงกับข้อมูลฝ่ายบุคคล</li>
              </ul>
            ),
          },
          {
            title: "เมนู: QR จุดเช็คอิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้าง QR สำหรับให้พนักงานสแกนเข้า/ออกงาน</li>
                <li>วาง QR ไว้ตำแหน่งที่เข้าถึงง่ายและมีสัญญาณอินเทอร์เน็ต</li>
                <li>ทดสอบสแกนจากมือถือหลายเครื่องก่อนเริ่มใช้งานจริง</li>
              </ul>
            ),
          },
        ]}
      />

      <nav aria-label="เมนูเช็คอินอัจฉริยะ" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
        <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {navLinks.map(({ href, label }) => (
            <li key={href} className="min-w-0 sm:w-auto">
              <NavItem href={href} active={navActive(pathname, href)}>
                {label}
              </NavItem>
            </li>
          ))}
        </ul>
      </nav>

      {children}
    </div>
  );
}
