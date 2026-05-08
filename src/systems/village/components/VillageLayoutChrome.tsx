"use client";

import { useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { AppUsageGuideModal } from "@/components/app-templates";
import { VillageModuleHeader } from "./VillageModuleHeader";
import { VillageMobileDock } from "./VillageMobileDock";

/** สองการ์ดแยกกันแบบคาร์แวช: การ์ดชื่อระบบ · การ์ดเมนู (มีช่องว่างระหว่างการ์ด) */
export function VillageLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="-mt-2 max-w-full space-y-4 pb-28 sm:mt-0 sm:space-y-6 md:pb-0">
      <header
        className={
          "-mx-3 overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:mx-0 sm:px-8 sm:py-6 print:hidden"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">จัดการหมู่บ้าน</h1>
            <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
              ค่าส่วนกลาง · ลูกบ้าน · สลิป · ต้นทุน/รายจ่าย · รายปี · ส่งออก
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="flex h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="คู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
              <path d="M12 17v.01M10 9.5a2 2 0 1 1 3.2 1.6c-.8.55-1.2 1-1.2 1.9" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>
        <div className="hidden md:block">
          <VillageModuleHeader variant="embedded" />
        </div>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — ระบบจัดการหมู่บ้าน"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูสำหรับงานนิติบุคคลและบัญชี"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ตั้งค่าที่ <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> ก่อน แล้วเพิ่มข้อมูล{" "}
                  <strong className="font-semibold text-[#2e2a58]">ลูกบ้าน</strong> และสร้าง{" "}
                  <strong className="font-semibold text-[#2e2a58]">ค่าส่วนกลาง</strong> เพื่อเริ่มรอบเก็บเงินจริง
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งค่าโครงการและรอบบิล</li>
                  <li>ลงทะเบียนบ้าน/ลูกบ้าน</li>
                  <li>ออกบิลและติดตามสลิป</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูภาพรวมลูกบ้านที่ชำระแล้ว ค้างชำระ และยอดรวมประจำงวด</li>
                <li>ใช้เป็นจุดเริ่มตรวจสถานะการเงินของหมู่บ้านทุกวัน</li>
                <li>ติดตามงานเร่งด่วนก่อนปิดรอบบัญชีรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ลูกบ้าน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่ม/แก้ไขข้อมูลบ้าน เจ้าของบ้าน และช่องทางติดต่อ</li>
                <li>ใช้ข้อมูลนี้เป็นฐานสำหรับออกบิลค่าส่วนกลาง</li>
                <li>ตรวจความถูกต้องเลขบ้าน/เบอร์โทรก่อนใช้งานจริง</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ค่าส่วนกลาง",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้างใบเรียกเก็บตามรอบเดือน/ปี และยอดต่อยูนิต</li>
                <li>กำหนดวันครบกำหนดและเงื่อนไขปรับ (ถ้ามี)</li>
                <li>บันทึกการชำระเพื่อลดยอดค้างแบบเรียลไทม์</li>
              </ul>
            ),
          },
          {
            title: "เมนู: สลิป",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ตรวจสลิปที่ลูกบ้านส่งเข้าระบบก่อนอนุมัติรับชำระ</li>
                <li>เปิดดูรูปสลิปเต็มจอและยืนยันความถูกต้องของยอดเงิน</li>
                <li>ช่วยลดข้อผิดพลาดกรณีโอนผิดบ้านหรือผิดยอด</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ต้นทุน / รายจ่าย",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกรายจ่ายส่วนกลาง เช่น รปภ. ซ่อมบำรุง ทำความสะอาด</li>
                <li>ดูผลต่างรายรับค่าส่วนกลางเทียบค่าใช้จ่ายจริง</li>
                <li>แนบหลักฐานจ่ายเงินเพื่อใช้งานตรวจสอบภายใน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายปี",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สรุปภาพรวมทั้งปีตามเดือนเพื่อวิเคราะห์แนวโน้มการเงิน</li>
                <li>ดูช่วงที่รายจ่ายสูงผิดปกติเพื่อวางแผนปีถัดไป</li>
                <li>ใช้ประกอบการประชุมกรรมการและจัดทำงบประจำปี</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ส่งออก",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ส่งออกข้อมูลที่จำเป็นให้ฝ่ายบัญชีหรือผู้ตรวจสอบ</li>
                <li>เลือกช่วงวันที่ก่อนส่งออกเพื่อลดข้อมูลเกินจำเป็น</li>
                <li>ควรตรวจตัวอย่างไฟล์ก่อนส่งให้บุคคลภายนอก</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ตั้งค่า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>กำหนดข้อมูลหมู่บ้าน นโยบายรอบบิล และค่าตั้งต้นระบบ</li>
                <li>ตั้งค่าที่เปลี่ยนไม่บ่อย แต่มีผลต่อทุกเมนู</li>
                <li>หลังปรับตั้งค่าใหญ่ ควรทดสอบออกบิล 1 รอบเพื่อยืนยันผล</li>
              </ul>
            ),
          },
        ]}
      />

      {trialExpiresLabel ? (
        <TrialSandboxStrip>ทดลอง · ข้อมูลแยกจากจริง · หมด {trialExpiresLabel}</TrialSandboxStrip>
      ) : null}

      <div className="-mx-3 sm:mx-0">{children}</div>
      <VillageMobileDock />
    </div>
  );
}
