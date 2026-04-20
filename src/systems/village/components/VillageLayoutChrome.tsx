"use client";

import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { VillageModuleHeader } from "./VillageModuleHeader";

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
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">จัดการหมู่บ้าน</h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
              ค่าส่วนกลาง · ลูกบ้าน · สลิป · ต้นทุน/รายจ่าย · รายปี · ส่งออก
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

      <VillageModuleHeader />

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
