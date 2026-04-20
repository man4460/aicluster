"use client";

import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
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
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">จัดการหอพัก</h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
              ผังห้อง · มิเตอร์ · แบ่งบิล · ประวัติชำระ · ต้นทุน/รายจ่าย · ตั้งค่า
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
