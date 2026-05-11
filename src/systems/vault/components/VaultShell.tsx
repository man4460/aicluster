"use client";

import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { parkingValetHeaderShellClass } from "@/systems/parking/parking-valet-ui";

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 2 4 5v7c0 4.97 3.5 9.32 8 10 4.5-.68 8-5.03 8-10V5z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 5 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

const guideSections = [
  {
    title: "เก็บอย่างปลอดภัย",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>รหัสผ่านถูกเข้ารหัสด้วย AES-256-GCM ก่อนเก็บฐานข้อมูล</li>
        <li>เห็นรหัสจริงต่อเมื่อกด «แสดงรหัส» เท่านั้น — ระบบจะบันทึกเวลาใช้งานล่าสุด</li>
      </ul>
    ),
  },
  {
    title: "เพิ่มและจัดหมวด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>เพิ่มบัญชีพร้อมเลือก «บริการยอดนิยม» เพื่อให้ระบบใส่ไอคอนและสีให้อัตโนมัติ</li>
        <li>กดดาวเพื่อปักหมุดบัญชีที่ใช้บ่อย</li>
      </ul>
    ),
  },
  {
    title: "คัดลอกเร็ว",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-indigo-600">
        <li>กดปุ่มก๊อบปี้ที่ตัวการ์ดเพื่อคัดลอกชื่อผู้ใช้หรือรหัสไปยังคลิปบอร์ดได้ทันที</li>
        <li>คลิปบอร์ดจะล้างอัตโนมัติหลังคัดลอกรหัส 30 วินาที (เฉพาะอุปกรณ์รองรับ)</li>
      </ul>
    ),
  },
];

export function VaultShell({
  siteName,
  children,
}: {
  siteName: string;
  children: React.ReactNode;
}) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
        <div className={parkingValetHeaderShellClass}>
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/80">
                    <IconShield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Vault
                    </p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                      คลังรหัสผ่าน
                    </h1>
                    <p className="mt-0.5 truncate text-xs font-bold text-slate-500">{siteName}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setGuideOpen(true)}
                className="flex h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
                aria-label="เปิดคู่มือการใช้งาน"
              >
                <IconHelp className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">คู่มือ</span>
              </button>
            </div>
          </header>
        </div>

        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือ — คลังรหัสผ่าน"
        subtitle="เก็บ · เข้ารหัส · ค้นหา · คัดลอก"
        sections={guideSections}
      />
    </div>
  );
}
