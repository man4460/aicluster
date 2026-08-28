"use client";

import { AppUsageGuideModal } from "@/components/app-templates";
import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_MATCH_MAX_DISTANCE,
  FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE,
} from "@/lib/attendance/face-descriptor";
import { FACE_CAPTURE_FRAMES } from "@/systems/attendance/lib/face-api-client";

const listClass = "list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]";
const orderedClass = "list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]";
const strongClass = "font-semibold text-[#2e2a58]";

/** คู่มือย่อสำหรับหน้าจอจุดเช็คอิน (คีออสก์สแกนใบหน้า) — ผู้ใช้คือพนักงานหน้างาน */
export function AttendanceFaceKioskGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AppUsageGuideModal
      open={open}
      onClose={onClose}
      title="วิธีสแกนใบหน้าเช็คอิน / เช็คเอาต"
      subtitle="กดปุ่มเดียว มองตรงกล้อง — ระบบบันทึกเข้างานหรือออกงานให้เอง"
      sections={[
        {
          title: "ขั้นตอน",
          content: (
            <ol className={orderedClass}>
              <li>กดปุ่ม «สแกนใบหน้าเช็คเข้า» (เขียว) ตอนมาเข้างาน หรือ «สแกนใบหน้าเช็คออก» (แดง) ตอนเลิกงาน</li>
              <li>ยืนห่างจากจอประมาณหนึ่งช่วงแขน ให้ใบหน้าเต็มกรอบ</li>
              <li>มองตรงกล้อง กดปุ่มเข้า (เขียว) หรือออก (แดง) — ระบบนับถอยหลัง 3–2–1 แล้วถ่ายอัตโนมัติ</li>
              <li>
                <strong className={strongClass}>ตอนมาเข้างาน</strong> — กล่องแจ้งผลสีเขียว ขึ้น «ตรงกับ: ชื่อ» และ «เช็คเข้าแล้ว»
              </li>
              <li>
                <strong className={strongClass}>ตอนเลิกงาน</strong> — กดปุ่มสแกนเช็คออก (แดง) กล่องแจ้งผลสีแดง ขึ้น «ตรงกับ: ชื่อ» และ «เช็คออกแล้ว»
              </li>
              <li>รอให้คนถัดไปเข้ามาสแกน — ไม่ต้องเปลี่ยนหน้าหรือเมนู</li>
            </ol>
          ),
        },
        {
          title: "สีบนหน้าจอ (เข้า / ออก)",
          content: (
            <ul className={listClass}>
              <li>
                <strong className={strongClass}>เช็คเข้า</strong> — ปุ่ม กรอบกล้อง และกล่องแจ้งผลเป็นโทน{" "}
                <strong className={strongClass}>เขียว</strong>
              </li>
              <li>
                <strong className={strongClass}>เช็คออก</strong> — ปุ่ม กรอบกล้อง และกล่องแจ้งผลเป็นโทน{" "}
                <strong className={strongClass}>แดง</strong>
              </li>
              <li>หน้าจอจัดกลางจอเต็ม iPad — ไม่ต้องเลื่อนขึ้นลง</li>
            </ul>
          ),
        },
        {
          title: "ให้สแกนผ่านง่ายขึ้น",
          content: (
            <ul className={listClass}>
              <li>คนเดียวหน้ากล้องขณะสแกน — ถ้ามีคนยืนซ้อนด้านหลัง ระบบจะไม่บันทึก</li>
              <li>ตั้งหัวตรง ไม่หันข้างหรือเอียงมาก</li>
              <li>เปิดหน้าผาก ถอดหมวก/แมสก์ และดันแว่นกันแดดขึ้น</li>
              <li>เลี่ยงยืนหันหลังให้หน้าต่างหรือไฟจ้า เพราะหน้าจะมืด</li>
            </ul>
          ),
        },
        {
          title: "กล้องตัดพื้นหลังออก (พื้นหลังดำ)",
          content: (
            <ul className={listClass}>
              <li>
                แอป MAWELL <strong className={strongClass}>ไม่ได้</strong> ตัดพื้นหลังด้วย AI — ถ้าเห็นคนตัดออกพื้นหลังดำ
                มักมาจาก <strong className={strongClass}>Windows Studio Effects</strong> หรือโปรแกรมกล้องของเครื่อง
              </li>
              <li>
                <strong className={strongClass}>Windows 11:</strong> ตั้งค่า → Bluetooth และอุปกรณ์ → กล้อง → เลือกกล้อง →
                ปิด «Studio effects» / เอฟเฟกต์พื้นหลัง
              </li>
              <li>
                <strong className={strongClass}>Lenovo:</strong> เปิด Lenovo Vantage → กล้อง → ปิด Background blur / Portrait
                light
              </li>
              <li>ลองปิด OBS Virtual Camera, NVIDIA Broadcast หรือกล้องเสมือนอื่น แล้วเลือกกล้องจริงของเครื่อง</li>
              <li>ระบบจะพยายามปิดเอฟเฟกต์พื้นหลังให้อัตโนมัติเมื่อเปิดกล้อง — ถ้ายังเป็นอยู่ ต้องปิดที่การตั้งค่า Windows</li>
            </ul>
          ),
        },
        {
          title: "ถ้าระบบไม่รับ",
          content: (
            <ul className={listClass}>
              <li>ข้อความจะบอกสาเหตุ เช่น ภาพเบลอ แสงน้อย หรือใบหน้าเล็กเกินไป — แก้ตามนั้นแล้วกดสแกนอีกครั้ง</li>
              <li>ถ้าไม่ตรงกับรายชื่อ — กล่องแจ้งเตือนจะบอก «กรุณาถ่ายใหม่» ให้แจ้งหัวหน้าลงทะเบียนใบหน้าเพิ่มมุม</li>
              <li>ถ้าบอกว่าอยู่นอกรัศมีจุดเช็ค ให้อนุญาตการเข้าถึงตำแหน่งบนเครื่องนี้</li>
              <li>ถ้าบอกว่า «ยังไม่ได้เช็คเข้า» ตอนออกงาน — ให้สแกนเข้างานก่อน หรือใช้ลิงก์เช็คอินทั่วไป</li>
            </ul>
          ),
        },
        {
          title: "ข้อมูลของคุณ",
          content: (
            <ul className={listClass}>
              <li>การเทียบใบหน้าทำในเครื่องนี้ ไม่ส่งภาพไปบริการภายนอก</li>
              <li>ระบบเก็บรูปตอนเช็คอินไว้เป็นหลักฐานการเข้างานตามปกติ</li>
              <li>ตำแหน่งใช้ตรวจว่าอยู่ในพื้นที่จุดเช็คเท่านั้น</li>
            </ul>
          ),
        },
        {
          title: "ทำงานอย่างไร (เชิงเทคนิคย่อ)",
          content: (
            <ul className={listClass}>
              <li>
                กล้องถ่าย <strong className={strongClass}>{FACE_CAPTURE_FRAMES} เฟรม</strong> ต่อการกดหนึ่งครั้ง แล้วคัดเฉพาะเฟรมที่คมชัด
                แสงพอ และหน้าตรง
              </li>
              <li>
                แต่ละเฟรมถูกแปลงเป็นตัวเลขลักษณะใบหน้า{" "}
                <strong className={strongClass}>{FACE_DESCRIPTOR_LENGTH} ค่า</strong> — ไม่ใช่การเก็บรูปเพื่อเทียบ
              </li>
              <li>
                เทียบกับใบหน้าที่ลงทะเบียนไว้ ต้องใกล้กว่าเกณฑ์{" "}
                <strong className={strongClass}>{FACE_MATCH_MAX_DISTANCE}</strong> (หรือ{" "}
                <strong className={strongClass}>{FACE_MATCH_SINGLE_CANDIDATE_MAX_DISTANCE}</strong> เมื่อมีแค่คนเดียวในรายชื่อ)
                และต้องห่างจากคนอันดับถัดไปพอสมควร
              </li>
              <li>หลายเฟรมต้องโหวตตรงกันเกินครึ่ง ถ้าคลุมเครือระบบจะไม่บันทึกและให้สแกนใหม่</li>
              <li>รายละเอียดครบทุกจุดตรวจดูได้ที่คู่มือในแดชบอร์ดของเจ้าของระบบ</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
