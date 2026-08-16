"use client";

import { AppUsageGuideModal } from "@/components/app-templates";
import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_MATCH_MAX_DISTANCE,
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
      title="วิธีสแกนใบหน้าเช็คอิน"
      subtitle="กดปุ่มเดียว มองตรงกล้อง ระบบบันทึกเวลาเข้างานให้เอง"
      sections={[
        {
          title: "ขั้นตอน",
          content: (
            <ol className={orderedClass}>
              <li>กดปุ่ม «สแกนใบหน้าเช็คอิน» — กล้องเปิดขึ้นทันที</li>
              <li>ยืนห่างจากจอประมาณหนึ่งช่วงแขน ให้ใบหน้าเต็มกรอบ</li>
              <li>มองตรงกล้อง อยู่นิ่งสัก 2 วินาที ระบบถ่ายหลายภาพเอง ไม่ต้องกดถ่าย</li>
              <li>รอข้อความขึ้นชื่อว่าเช็คอินสำเร็จ แล้วให้คนถัดไปเข้ามาสแกน</li>
            </ol>
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
          title: "ถ้าระบบไม่รับ",
          content: (
            <ul className={listClass}>
              <li>ข้อความจะบอกสาเหตุ เช่น ภาพเบลอ แสงน้อย หรือใบหน้าเล็กเกินไป — แก้ตามนั้นแล้วกดสแกนอีกครั้ง</li>
              <li>ถ้าบอกว่าไม่ตรงกับรายชื่อ ให้แจ้งหัวหน้าลงทะเบียนใบหน้าเพิ่มมุมให้</li>
              <li>ถ้าบอกว่าอยู่นอกรัศมีจุดเช็ค ให้อนุญาตการเข้าถึงตำแหน่งบนเครื่องนี้</li>
              <li>เช็คอินด้วยเบอร์โทรที่ลิงก์เช็คอินทั่วไปใช้แทนกันได้เสมอ</li>
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
                <strong className={strongClass}>{FACE_MATCH_MAX_DISTANCE}</strong> และต้องห่างจากคนอันดับถัดไปพอสมควร
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
