"use client";

import { DormModuleHeader } from "./DormModuleHeader";

/** โครงเดียวกับ VillageLayoutChrome — หัวข้อระบบ · การ์ดเมนู · แบนเนอร์ทดลอง */
export function DormLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** ข้อความวันหมดอายุที่ format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">จัดการหอพัก</h1>
          <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
            ผังห้อง · มิเตอร์ · แบ่งบิล · ประวัติชำระ · ต้นทุน/รายจ่าย · ตั้งค่า
          </p>
        </div>
      </header>

      <DormModuleHeader />

      {trialExpiresLabel ? (
        <div className="app-banner rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold">โหมดทดลอง</span> — ข้อมูลในชุดนี้แยกจากข้อมูลจริงหลัง Subscribe วันหมดอายุ:{" "}
          {trialExpiresLabel}
        </div>
      ) : null}

      {children}
    </div>
  );
}
