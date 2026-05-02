"use client";

import { LogoutIconButton } from "@/components/layout/LogoutButton";

/** หัวข้อแบบพอร์ทัลลูกค้า (สมาชิกร้านตัดผม) — ไอคอนกลาง + ชื่อเรื่องเข้ม + คำบรรยายเทา + ปุ่มออกระบบมุมขวา */
export function BarberStaffKioskHeader({ className }: { className?: string }) {
  return (
    <header className={className}>
      <div className="mb-4 flex justify-end">
        <LogoutIconButton className="h-10 w-10 rounded-xl border border-white/70 bg-white/75 text-[#58547f] shadow-sm backdrop-blur-sm transition hover:bg-white" />
      </div>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-[#5b61ff]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">พนักงานร้านตัดผม</h1>
        <p className="mt-1 text-sm text-[#6b6894]">จัดคิว เช็กอิน บันทึกการใช้บริการหน้าร้าน</p>
      </div>
    </header>
  );
}
