"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarberModuleHeader } from "./BarberModuleHeader";
import { BarberUsageGuideModal } from "./BarberUsageGuideModal";

/** ชื่อระบบโมดูล — แสดงเป็นหัวข้อหลักด้านบน */
const BARBER_MODULE_TITLE = "ร้านตัดผม";
/** คำอธิบายสั้นใต้ชื่อระบบ */
const BARBER_MODULE_TAGLINE = "คิวนัด แพ็กเกจ ยอดขาย เช็กอิน และ QR ลูกค้า";

export function BarberLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  /** หน้าจาก QR พนักงาน — โฟกัสคิว/เช็กอิน ไม่แสดงเมนูร้าน */
  const hideBarberChrome = pathname === "/dashboard/barber/staff";

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {!hideBarberChrome ? (
        <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="min-w-0">
              <h1
                className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl"
                id="barber-module-title"
                aria-describedby="barber-module-tagline"
              >
                {BARBER_MODULE_TITLE}
              </h1>
              <p id="barber-module-tagline" className="mt-1 max-w-xl text-sm leading-snug text-[#66638c]">
                {BARBER_MODULE_TAGLINE}
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
      ) : null}

      {!hideBarberChrome ? (
        <BarberUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />
      ) : null}

      {!hideBarberChrome ? <BarberModuleHeader pathname={pathname} /> : null}

      {trialExpiresLabel ? (
        <div className="app-banner rounded-xl px-4 py-3 text-sm print:hidden">
          <span className="font-semibold">โหมดทดลอง</span> — ข้อมูลในชุดนี้แยกจากข้อมูลจริงหลัง Subscribe
          วันหมดอายุ: {trialExpiresLabel}
          {" · "}
          ดาวน์โหลด PDF/PNG โปสเตอร์ QR ถูกปิดในโหมดทดลอง
        </div>
      ) : null}

      <div className="app-surface min-w-0 rounded-2xl p-4 shadow-sm sm:p-5 md:p-6 print:border-0 print:shadow-none">
        {children}
      </div>
    </div>
  );
}
