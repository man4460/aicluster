"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import {
  barberCardSurfaceRadiusClass,
  barberModalBackdropMutedClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanel2xlFlexColClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
} from "@/systems/barber/components/barber-ui-tokens";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-4 border-b border-[#ecebff] pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-base font-bold text-[#2e2a58]">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-[#5f5a8a]">{children}</div>
    </section>
  );
}

export function BarberUsageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <BarberModalPortal>
      <div className={barberModalBackdropMutedClass} role="presentation" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="barber-usage-guide-title"
          className={barberModalPanel2xlFlexColClass}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={barberModalHeaderClass}>
            <div className="min-w-0">
              <h2 id="barber-usage-guide-title" className={barberModalTitleClass}>
                คู่มือการใช้งาน — ร้านตัดผม
              </h2>
              <p className={barberModalSubtitleClass}>
                สรุปทุกเมนูหลัก เรียงตามลำดับการตั้งค่าและใช้งานจริง
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={barberModalCloseBtnClass}
              aria-label="ปิดคู่มือ"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-5">
            <Section title="แนะนำลำดับเริ่มต้น">
              <p>
                แนะนำตั้งโปรไฟล์ร้าน แพ็กเกจ และช่างก่อน แล้วใช้{" "}
                <strong className="font-semibold text-[#2e2a58]">เช็กอิน</strong> หรือ{" "}
                <strong className="font-semibold text-[#2e2a58]">QR ลูกค้า</strong> รับลูกค้า ดูสรุปที่{" "}
                <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> และ{" "}
                <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> (แท็บยอดขาย / ต้นทุนและรายจ่าย) รวมถึงลิงก์ใต้กราฟในแท็บยอดขาย
              </p>
              <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>โปรไฟล์ — รูป ชื่อร้าน ที่อยู่ เบอร์ เลขภาษี (แท็บตั้งค่าบริษัท/ร้าน)</li>
                <li>แพ็กเกจ — สร้างแพ็กที่ขายจริง (ราคา จำนวนครั้ง)</li>
                <li>ช่าง — เพิ่มช่าง (ใช้ผูกกับประวัติการบริการได้)</li>
                <li>แดชบอร์ด (แท็บคิว / เช็กอิน / ช่าง) และเมนู QR — ตาม workflow ร้าน</li>
              </ol>
            </Section>

            <Section title="แดชบอร์ด">
              <p>
                หน้าแรกของโมดูล — โครงคล้ายคาร์แคร์: ด้านบนมีแท็บ{" "}
                <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> ·{" "}
                <strong className="font-semibold text-[#2e2a58]">จัดการคิว</strong> ·{" "}
                <strong className="font-semibold text-[#2e2a58]">เช็กอิน</strong> ·{" "}
                <strong className="font-semibold text-[#2e2a58]">ช่าง</strong> — สลับได้โดยไม่ต้องออกจากหน้าหลัก
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — สถิติวันนี้และการ์ด{" "}
                  <strong className="font-semibold text-[#2e2a58]">คิววันนี้</strong> (ปุ่มลัดไปแท็บเช็กอิน / จัดการคิว)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">สถิติวันนี้</strong> — รายรับรวมนับเฉพาะ{" "}
                  <strong className="font-semibold text-[#2e2a58]">เงินสด walk-in</strong> กับ{" "}
                  <strong className="font-semibold text-[#2e2a58]">ยอดขายแพ็กใหม่</strong> (ราคาแพ็กเต็มในวันที่เปิดสมาชิกแพ็ก)
                  การมาใช้บริการแบบหักแพ็กหมายถึงหักจำนวนครั้งเท่านั้น ไม่นับเป็นรายรับเพิ่ม (รับรู้ตอนขายแพ็กแล้ว)
                  ใต้ตัวเลขรวมมีบรรทัดแยกเงินสดกับขายแพ็กใหม่ นอกจากนี้มีจำนวนลูกค้าไม่ซ้ำ ครั้งหักแพ็ก ครั้งเงินสด เข้าใช้รวม และจำนวนแพ็ก ACTIVE ที่เหลือครั้งมากกว่า 0
                </li>
              </ul>
            </Section>

            <Section title="การเงิน">
              <p>
                เปิดจากเมนู <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — มีแท็บ{" "}
                <strong className="font-semibold text-[#2e2a58]">ยอดขาย</strong> และ{" "}
                <strong className="font-semibold text-[#2e2a58]">ต้นทุน / รายจ่าย</strong> (รูปแบบเดียวกับเมนูการเงินในระบบคาร์แคร์)
                URL ตรง:{" "}
                <code className="rounded bg-[#f0eeff] px-1 py-0.5 text-xs">/dashboard/barber/finance</code>
                {" · "}
                แท็บต้นทุน:{" "}
                <code className="rounded bg-[#f0eeff] px-1 py-0.5 text-xs">?tab=costs</code>
              </p>
              <p className="font-semibold text-[#2e2a58]">แท็บยอดขาย</p>
              <p>
                ใช้ดูประวัติการบริการย้อนหลัง พร้อมกราฟสรุปตามช่วงที่เลือก (ปี เดือน วัน — ปฏิทินเวลาไทย) กราฟออกแบบให้แท่งชิดและเลื่อนแนวนอนได้ เพื่อดูหลายวันในจอเดียว
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">กราฟรายได้เทียบต้นทุน / รายจ่าย</strong> — แท่งคู่ต่อช่วง (รายได้กับรายจ่ายในมาตราส่วนเดียวกัน)
                  ใต้กราฟมีตัวเลขรวมรายได้ รวมรายจ่าย/ต้นทุน และสุทธิในช่วงที่กรอง
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">รายได้ในกราฟและยอดรวมด้านบน</strong> รวมเฉพาะ{" "}
                  <strong className="font-semibold text-[#2e2a58]">เงินสด walk-in</strong> กับ{" "}
                  <strong className="font-semibold text-[#2e2a58]">ราคาแพ็กเต็ม</strong> ของการเปิดสมาชิกแพ็กใหม่ในช่วงนั้น (ตามวันที่สร้างแพ็ก)
                  ไม่รวมมูลค่าต่อครั้งจากการหักแพ็ก — การหักครั้งใช้บริการไม่สร้างรายรับเพิ่ม
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">กราฟจำนวนครั้งใช้บริการ</strong> — แท่งคู่ต่อช่วงเดียวกัน:{" "}
                  <strong className="font-semibold text-[#2e2a58]">หักแพ็กเกจ</strong> (ส้ม) กับ{" "}
                  <strong className="font-semibold text-[#2e2a58]">เงินสด</strong> (เขียว) ดูเปรียบเทียบจำนวนครั้งในแต่ละวัน/เดือน
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">กราฟยอดขายแพ็กเกจ (เปิดแพ็กใหม่)</strong> — ยอดเงินตามวันที่มีการสร้างสมาชิกแพ็ก วางข้างกราฟจำนวนครั้งเพื่อดูภาพรวม
                </li>
                <li>กรองช่วงเวลาได้ละเอียด มีปุ่มลัด &quot;วันนี้&quot; &quot;เดือนนี้&quot; &quot;ปีนี้&quot;</li>
                <li>
                  ค้นหาข้อความในรายการ (เช่น เบอร์ ชื่อ หมายเหตุ) ผ่านช่องค้นหา — ใช้กับรายการและตัวเลขสรุปที่เกี่ยวกับลูกค้าในล็อกบริการ
                  ส่วนกราฟด้านบนไม่กรองตามช่องค้นหา
                </li>
                <li>
                  แต่ละการ์ดแสดงประเภท <strong className="font-semibold text-[#2e2a58]">เงินสด</strong> หรือ{" "}
                  <strong className="font-semibold text-[#2e2a58]">หักแพ็กเกจ</strong> เวลา ช่าง (ถ้ามี) ยอดเงิน (เงินสด)
                </li>
                <li>
                  รายการเงินสดที่มีสลิป — แสดงรูปย่อ คลิกเพื่อเปิดดูเต็มจอ (ปิดด้วยปุ่ม คลิกพื้นหลัง หรือ Esc)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">แก้ไข</strong> — ปรับเวลาทำรายการ เบอร์ ชื่อ หมายเหตุ
                  รายการเงินสดเพิ่มเติม: ยอดเงิน แนบ/เปลี่ยน/ลบรูปสลิป รายการหักแพ็กเกจไม่มีสลิปและยอดเงินสด
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ลบ</strong> — ลบรายการออกจากประวัติ (ใช้ด้วยความระมัดระวัง)
                </li>
              </ul>
              <p className="mt-4 font-semibold text-[#2e2a58]">แท็บต้นทุน / รายจ่าย</p>
              <p>
                เปิดจากแท็บในเมนู <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> หรือจากลิงก์ใต้กราฟในแท็บยอดขาย
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">จัดการหมวด</strong> / <strong className="font-semibold text-[#2e2a58]">บันทึกรายจ่าย</strong>{" "}
                  ที่แถบด้านบนของแท็บต้นทุน — ป๊อบอัปแยกกัน แนบสลิปได้
                </li>
                <li>ยอดรายจ่ายรวมในกราฟแท็บยอดขายตามช่วงที่กรอง</li>
                <li>ลบหมวดจะลบรายการในหมวดนั้นด้วย</li>
              </ul>
            </Section>

            <Section title="แท็บในแดชบอร์ด: จัดการคิว">
              <p>เปิดจากแท็บ <strong className="font-semibold text-[#2e2a58]">จัดการคิว</strong> ในหน้าแดชบอร์ด — จองและติดตามคิวตามวันที่เลือก</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เลือกวันที่ด้านบน ระบบโหลดรายการคิวของวันนั้น</li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">เพิ่มคิว</strong> — กรอกเบอร์ (อย่างน้อย 9 หลัก) กดค้นหาเพื่อผูกลูกค้าเดิม
                  หรือกรอกชื่อสำหรับลูกค้าใหม่ เลือกวันเวลานัด (เวลาไทย)
                </li>
                <li>คิวที่ยัง SCHEDULED มีปุ่ม <strong className="font-semibold text-[#2e2a58]">มาแล้ว</strong> / ไม่มา / ยกเลิกคิว</li>
                <li>สถานะช่วยให้ทีมหน้าร้านรู้ว่าใครมาแล้วหรือยกเลิก</li>
              </ul>
            </Section>

            <Section title="แท็บในแดชบอร์ด: เช็กอิน">
              <p>
                เปิดจากแท็บ <strong className="font-semibold text-[#2e2a58]">เช็กอิน</strong> — ศูนย์กลางรับลูกค้าหน้าร้าน: ค้นหาเบอร์ หักแพ็กเกจ บันทึกเงินสด ขายแพ็กใหม่
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ช่างที่บันทึก</strong> — เลือกช่างจากรายการ (ตั้งได้ที่แท็บช่างในแดชบอร์ด)
                  ถ้าไม่เลือก ระบบจะไม่ผูกชื่อช่างในประวัติ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ค้นหาลูกค้า</strong> — กรอกเบอร์แล้วค้นหา
                  ถ้ามีแพ็กที่ใช้ได้ จะแสดงรายการให้เลือก (radio) แล้วกด <strong className="font-semibold text-[#2e2a58]">หัก 1 ครั้ง</strong>
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">บันทึกด่วน — เงินสด</strong> — กรอกเบอร์ ชื่อ (ถ้ามี) หมายเหตุ ยอดเงิน (ถ้ามี)
                  แนบรูปสลิปจากแกลเลอรีหรือถ่ายจากกล้อง บันทึกเป็นรายการ walk-in เงินสด
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">บันทึกด่วน — ขายแพ็ก</strong> — เลือกแพ็กเกจ กรอกเบอร์และชื่อลูกค้า
                  เปิดสมาชิกแพ็กใหม่ (ต้องมีแพ็กเกจในระบบก่อน — สร้างที่เมนูแพ็กเกจ)
                </li>
              </ul>
            </Section>

            <Section title="แท็บในแดชบอร์ด: ช่าง">
              <p>
                เปิดจากแท็บ <strong className="font-semibold text-[#2e2a58]">ช่าง</strong> — จัดการรายชื่อช่างในร้าน
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มช่าง: ชื่อ เบอร์ (ถ้ามี) รูปประจำตัว (ถ้ามี)</li>
                <li>แก้ไข ปิดการใช้งานชั่วคราว หรือลบตามนโยบายร้าน</li>
                <li>รูปช่างสามารถดูขยายเต็มจอได้จากรายการ</li>
                <li>ช่างที่เลือกในเช็กอินจะถูกบันทึกในประวัติยอดขาย</li>
              </ul>
            </Section>

            <Section title="เมนูแพ็กเกจ (แพ็กเกจ + สมาชิก)">
              <p>
                เมนู <strong className="font-semibold text-[#2e2a58]">แพ็กเกจ</strong> รวมสองแท็บในแผงเดียว (แบบคาร์แคร์): <strong className="font-semibold text-[#2e2a58]">แพ็กเกจ</strong>{" "}
                กับ <strong className="font-semibold text-[#2e2a58]">สมาชิกแพ็กเกจ</strong>
              </p>
              <p className="font-semibold text-[#2e2a58]">แท็บแพ็กเกจ</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>กำหนดแพ็กที่ร้านขาย เช่น ตัดผม 10 ครั้ง ราคาเท่าใด</li>
                <li>เพิ่มแพ็กใหม่: ชื่อ ราคา (บาท) จำนวนครั้งทั้งหมด</li>
                <li>แก้ไขหรือลบแพ็กจากรายการ (ลบกระทบเฉพาะการตั้งค่าแพ็ก — สมาชิกที่ซื้อแล้วยังอยู่ในแท็บสมาชิก)</li>
                <li>
                  แพ็กที่นี่ใช้ตอนขายแพ็กที่เช็กอิน — ราคาเต็มจะไปนับในรายรับตอนมีการเปิดสมาชิกแพ็ก (กราฟ/สรุป) ส่วนการหักครั้งใช้บริการใช้เฉพาะจำนวนครั้งจากแพ็ก ไม่สร้างรายรับซ้ำ
                </li>
              </ul>
              <p className="mt-3 font-semibold text-[#2e2a58]">แท็บสมาชิกแพ็กเกจ</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูรายการที่ลูกค้าซื้อแพ็กแล้ว สถานะคงเหลือ และแก้ไขเมื่อจำเป็น</li>
                <li>กรองตามเบอร์หรือชื่อลูกค้า</li>
                <li>แต่ละแถวแสดงแพ็ก ราคา ครั้งที่เหลือ สถานะ (ใช้งาน / หมดแล้ว / ยกเลิก) ช่างที่ขาย (ถ้ามี)</li>
                <li>
                  แก้ไข: ปรับจำนวนครั้งคงเหลือ สถานะ และชื่อลูกค้า — ใช้เมื่อเกิดข้อผิดพลาดการนับหรือต้องแก้ข้อมูลติดต่อ
                </li>
              </ul>
            </Section>

            <Section title="เมนู QR (ลูกค้า + พนักงาน)">
              <p>
                หน้าเดียวรวม <strong className="font-semibold text-[#2e2a58]">QR ลูกค้า</strong> และ{" "}
                <strong className="font-semibold text-[#2e2a58]">QR พนักงาน</strong> — โครงคล้ายคาร์แคร์
              </p>
              <p className="font-semibold text-[#2e2a58]">QR ลูกค้า</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้าง QR ไปยังพอร์ทัลลูกค้าของร้าน ให้ลูกค้าสแกนแล้วกรอกเบอร์เพื่อหักแพ็กเอง</li>
                <li>ดูตัวอย่างโปสเตอร์บนหน้าจอ มี QR และข้อความชวนใช้</li>
                <li>
                  โลโก้บนโปสเตอร์ใช้ <strong className="font-semibold text-[#2e2a58]">รูปโปรไฟล์</strong> ที่ตั้งใน{" "}
                  <Link
                    href="/dashboard/profile"
                    className="font-semibold text-[#4d47b6] underline decoration-[#4d47b6]/40 underline-offset-2 hover:decoration-[#4d47b6]"
                    onClick={onClose}
                  >
                    โปรไฟล์
                  </Link>{" "}
                  — แนะนำอัปโหลดก่อนพิมพ์
                </li>
                <li>ดาวน์โหลด PNG หรือ PDF (รูปแบบ A4/A5 ตามที่หน้าจอให้เลือก) เพื่อนำไปพิมพ์หน้าร้าน</li>
              </ul>
              <p className="mt-3 font-semibold text-[#2e2a58]">QR พนักงาน</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ลิงก์และโปสเตอร์ไปหน้าพนักงาน (คิว / เช็กอิน) — พนักงานต้องล็อกอินร้านก่อนใช้งาน</li>
                <li>คัดลอกลิงก์และดาวน์โหลด PDF (A4 / A5) หรือ PNG ได้จากแผงเดียวกับลูกค้า</li>
              </ul>
              <p className="mt-3">
                <strong className="font-semibold text-[#2e2a58]">โหมดทดลอง</strong> — การดาวน์โหลดไฟล์โปสเตอร์อาจถูกปิดตามแบนเนอร์ด้านบนของโมดูล
              </p>
            </Section>

            <Section title="โปรไฟล์ร้าน (ร่วมกับทุกระบบ)">
              <p>
                ชื่อร้าน รูปโปรไฟล์ (ใช้เป็นโลโก้บนโปสเตอร์ QR) ที่อยู่ เบอร์ติดต่อ และเลขกำกับภาษี — ตั้งที่{" "}
                <Link
                  href="/dashboard/profile"
                  className="font-semibold text-[#4d47b6] underline decoration-[#4d47b6]/40 underline-offset-2 hover:decoration-[#4d47b6]"
                  onClick={onClose}
                >
                  โปรไฟล์
                </Link>{" "}
                แท็บ &quot;ตั้งค่าบริษัท/ร้าน&quot; อัปโหลดรูปผ่านปุ่ม &quot;เปลี่ยนรูป&quot; แล้วกดบันทึกโปรไฟล์
              </p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>โมดูลร้านตัดผมอ่านข้อมูลเดียวกับโปรไฟล์นี้ (ไม่มีหน้าตั้งค่าแยกในเมนูร้านตัดผม)</li>
                <li>แท็บ &quot;ข้อมูลบัญชี&quot; ดูอีเมล ชื่อผู้ใช้ และโทเคน</li>
              </ul>
            </Section>

            <Section title="โหมดทดลอง">
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เมื่อเห็นแบนเนอร์โหมดทดลอง ข้อมูลในโมดูลนี้แยกจากข้อมูลหลังสมัครใช้งานจริง</li>
                <li>ดาวน์โหลดโปสเตอร์ QR อาจถูกปิดตามข้อความในแบนเนอร์</li>
              </ul>
            </Section>
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`app-btn-primary min-h-[48px] w-full ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-white sm:w-auto`}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
    </BarberModalPortal>
  );
}
