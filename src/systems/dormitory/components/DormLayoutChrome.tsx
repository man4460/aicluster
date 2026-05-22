"use client";

import { useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DormModuleHeader } from "./DormModuleHeader";
import { DormMobileDock } from "./DormMobileDock";
import { dormIconBadgeClass, dormModuleHeaderShellClass } from "@/systems/dormitory/dorm-ui-tokens";

/** โครงเดียวกับ VillageLayoutChrome — หัวข้อระบบ · การ์ดเมนู · แบนเนอร์ทดลอง */
export function DormLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** ข้อความวันหมดอายุที่ format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(dormModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className={dormIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">จัดการหอพัก</h1>
                <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
                  ผังห้อง · มิเตอร์ · แบ่งบิล · ประวัติชำระ · ต้นทุน/รายจ่าย · ตั้งค่า
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="flex h-10 min-h-[40px] items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 text-sm font-semibold text-[#4d47b6] shadow-sm backdrop-blur-md transition hover:bg-white/75 sm:px-4"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="คู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
              <path d="M6.5 17V5A2.5 2.5 0 0 1 9 2.5h11V21H9A2.5 2.5 0 0 1 6.5 18.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>
        <div className="mt-4 hidden border-t border-white/50 pt-4 md:block">
          <DormModuleHeader />
        </div>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — ระบบจัดการหอพัก"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูสำหรับงานบริหารห้องเช่า"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ตั้ง <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> ก่อน แล้วกรอกข้อมูลที่เมนู{" "}
                  <strong className="font-semibold text-[#2e2a58]">ห้อง</strong> จากนั้นติดตามรอบบิลและรับชำระที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">ประวัติ</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>กำหนดอัตราค่าเช่าและค่าสาธารณูปโภค</li>
                  <li>เพิ่มห้อง/ผู้เช่าและสถานะห้อง</li>
                  <li>บันทึกรับชำระพร้อมหลักฐาน</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูภาพรวมรายรับ ค่าเช่าค้าง และจำนวนห้องว่าง</li>
                <li>ใช้ตรวจความพร้อมก่อนเริ่มรอบเก็บค่าเช่าประจำเดือน</li>
                <li>ติดตามตัวเลขสำคัญของหอพักจากหน้าเดียว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ห้อง",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มห้อง กำหนดค่าเช่า และสถานะการเข้าพัก</li>
                <li>บันทึกข้อมูลผู้เช่า เลขมิเตอร์ และรายละเอียดสัญญา</li>
                <li>อัปเดตข้อมูลทันทีเมื่อมีการย้ายเข้า/ย้ายออก</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ประวัติ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูประวัติการออกบิลและการรับชำระย้อนหลัง</li>
                <li>ตรวจรายการค้างและติดตามผู้เช่าที่ชำระล่าช้า</li>
                <li>แก้ไขข้อมูลผิดพลาดของบิลหรือรายการชำระได้จากหน้านี้</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ต้นทุน / รายจ่าย",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกค่าใช้จ่ายหอพัก เช่น ซ่อมแซม ค่าส่วนกลาง ค่าดูแล</li>
                <li>วิเคราะห์กำไรสุทธิจากรายรับค่าเช่าหักรายจ่ายจริง</li>
                <li>แนบหลักฐานเพื่อให้ตรวจสอบย้อนหลังได้ชัดเจน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ตั้งค่า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>กำหนดค่าเริ่มต้นระบบ เช่น ค่าเช่ามาตรฐาน ค่าไฟ/น้ำ และรูปแบบบิล</li>
                <li>ตั้งค่าครั้งเดียวแต่มีผลต่อทุกห้องและทุกรอบบิล</li>
                <li>หลังแก้ค่าอัตรา แนะนำทดสอบคำนวณบิลตัวอย่างก่อนใช้งานจริง</li>
              </ul>
            ),
          },
        ]}
      />

      {trialExpiresLabel ? (
        <TrialSandboxStrip>ทดลอง · ข้อมูลแยกจากจริง · หมด {trialExpiresLabel}</TrialSandboxStrip>
      ) : null}

      {children}
      <DormMobileDock />
    </div>
  );
}
