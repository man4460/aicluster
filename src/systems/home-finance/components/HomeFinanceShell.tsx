"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";

/** มือถือ: กริด 2 คอลัมน์ แตะง่าย (min 44px) · จอใหญ่: แถบแนวนอน wrap */
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

const navLinks: { href: string; section: "dashboard" | "history" | "categories" | "utilities" | "vehicles" | "reminders"; label: string }[] = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "แดชบอร์ด" },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ" },
  { href: "/dashboard/home-finance/categories", section: "categories", label: "หมวด" },
  { href: "/dashboard/home-finance/utilities", section: "utilities", label: "ค่าไฟ/น้ำ" },
  { href: "/dashboard/home-finance/vehicles", section: "vehicles", label: "ยานพาหนะ" },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "แจ้งเตือน" },
];

export function HomeFinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">ระบบรายรับรายจ่าย</h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
              บันทึกรับ–จ่าย สรุปและกราฟ เชื่อมบิลไฟ/น้ำและรถ — ใช้บัญชีเจ้าของ
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
        title="คู่มือการใช้งาน — ระบบรายรับรายจ่าย"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูในระบบการเงินครัวเรือน"
        sections={[
          {
            title: "เริ่มต้นใช้งาน",
            content: (
              <>
                <p>
                  แนะนำตั้ง <strong className="font-semibold text-[#2e2a58]">หมวด</strong> ก่อน แล้วค่อยบันทึกข้อมูลรายวันที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> และตรวจย้อนหลังที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">ประวัติ</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งหมวดรายรับ-รายจ่ายหลักให้ครบ</li>
                  <li>เพิ่มค่าไฟ/น้ำและยานพาหนะ (ถ้ามี)</li>
                  <li>บันทึกรายการจริงต่อเนื่องทุกวัน</li>
                  <li>ตรวจกราฟรายเดือนและตั้งแจ้งเตือน</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มรายการรายรับ/รายจ่ายใหม่ได้ทันทีจากหน้าเดียว</li>
                <li>ดูภาพรวมยอดเข้า ยอดออก และคงเหลือสุทธิ</li>
                <li>เหมาะใช้เปิดเช็กสถานะการเงินรายวันอย่างรวดเร็ว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ประวัติ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ค้นหาและกรองรายการย้อนหลังตามวันที่ หมวด หรือคำค้น</li>
                <li>แก้ไขข้อมูลที่บันทึกผิด เช่น จำนวนเงิน หมายเหตุ หรือรูปสลิป</li>
                <li>ใช้เพื่อตรวจสอบรายการสำคัญก่อนสรุปรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: หมวด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มหมวดรายรับ/รายจ่ายให้สอดคล้องการใช้งานจริง</li>
                <li>ตั้งชื่อให้ชัด เช่น ค่าอาหาร ค่าน้ำมัน ค่าเช่า รายได้เสริม</li>
                <li>หมวดที่ดีช่วยให้กราฟและสรุปอ่านง่ายขึ้นมาก</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ค่าไฟ/น้ำ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกบิลค่าน้ำ ค่าไฟ พร้อมรอบเดือน</li>
                <li>เปรียบเทียบค่าใช้จ่ายรายเดือนเพื่อดูแนวโน้มเพิ่ม/ลด</li>
                <li>แยกหมวดชัดเจนทำให้วางแผนลดค่าใช้จ่ายได้ง่าย</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ยานพาหนะ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกรายจ่ายรถ เช่น น้ำมัน ซ่อมบำรุง ประกัน ภาษี</li>
                <li>ติดตามต้นทุนต่อคันได้อย่างเป็นระบบ</li>
                <li>ใช้ประกอบการตัดสินใจเรื่องค่าใช้จ่ายระยะยาว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: แจ้งเตือน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ตั้งเตือนบิลที่ต้องจ่ายซ้ำ เช่น ค่าน้ำ ค่าไฟ ค่าเน็ต</li>
                <li>ลดโอกาสลืมจ่ายและค่าปรับล่าช้า</li>
                <li>ควรตั้งก่อนวันครบกำหนดจริง 1-3 วัน</li>
              </ul>
            ),
          },
        ]}
      />

      <nav
        aria-label="เมนูระบบรายรับรายจ่าย"
        className="app-surface rounded-2xl p-3 sm:p-4 print:hidden"
      >
        <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {navLinks.map(({ href, section: key, label }) => (
            <li key={href} className="min-w-0 sm:w-auto">
              <NavItem href={href} active={section === key}>
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
