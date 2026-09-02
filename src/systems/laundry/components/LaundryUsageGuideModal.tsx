"use client";

import { AppUsageGuideModal } from "@/components/app-templates";

export function LaundryUsageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppUsageGuideModal
      open={open}
      onClose={onClose}
      title="คู่มือการใช้งาน — ระบบรับฝากซักผ้า"
      subtitle="วิธีใช้งานหลักสำหรับหน้าร้านและพนักงานรับงาน"
      sections={[
        {
          title: "ลำดับเริ่มต้นแนะนำ",
          content: (
            <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
              <li>เพิ่มแพ็กเกจและกำหนดราคาตามขนาดตะกร้า</li>
              <li>บันทึกรายการรับผ้าใหม่จากปุ่มบันทึกรายการ</li>
              <li>ติดตามคิวงานและเปลี่ยนสถานะด้วยแถบไอคอน</li>
              <li>สรุปรายรับ/รายจ่ายในเมนูการเงินทุกวัน</li>
            </ol>
          ),
        },
        {
          title: "เมนู: แดชบอร์ด",
          content: (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
              <li>ดูภาพรวมสถิติวันนี้และงานที่กำลังดำเนินการ</li>
              <li>ใช้ปุ่มรีเฟรชเมื่อมีหลายเครื่องใช้งานพร้อมกัน</li>
              <li>กดบันทึกรายการเพื่อเปิดฟอร์มรับงานใหม่แบบรวดเร็ว</li>
            </ul>
          ),
        },
        {
          title: "เมนู: การเงิน",
          content: (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
              <li>ดูกราฟรายรับเทียบรายจ่ายตามช่วงเวลา</li>
              <li>ตรวจประวัติออเดอร์และแก้สถานะย้อนหลังได้</li>
              <li>บันทึกรายจ่าย/แนบสลิปเพื่อคำนวณกำไรสุทธิ</li>
            </ul>
          ),
        },
        {
          title: "เมนู: แพ็กเกจ",
          content: (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
              <li>เพิ่ม/แก้ไขรูปแพ็กเกจ ราคา และเวลาประมาณ</li>
              <li>จัดขนาดตะกร้าหลายระดับในแพ็กเกจเดียว</li>
              <li>ปิดใช้งานแพ็กเกจชั่วคราวได้โดยไม่ต้องลบข้อมูล</li>
            </ul>
          ),
        },
        {
          title: "ตั้งค่า: ลิงก์ QR",
          content: (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
              <li>เปิดเมนูตั้งค่าร้าน → แท็บลิงก์ QR</li>
              <li>เปิดการ์ด QR ลูกค้า/พนักงานผ่าน popup ตามบทบาท</li>
              <li>ดาวน์โหลดโปสเตอร์หรือคัดลอกลิงก์ไปใช้งานหน้าร้าน</li>
              <li>ลิงก์พนักงานใช้สำหรับเข้าหน้ารับงานโดยตรง</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
