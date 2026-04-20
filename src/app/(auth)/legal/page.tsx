import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_GUTTER_X, PAGE_GUTTER_Y } from "@/components/ui/page-container";

export const metadata: Metadata = {
  title: "PDPA, ข้อกำหนดการใช้งาน และนโยบายความเป็นส่วนตัว | MAWELL Buffet",
};

export default function LegalPage() {
  return (
    <main className={`mx-auto w-full max-w-5xl space-y-6 ${PAGE_GUTTER_X} ${PAGE_GUTTER_Y}`}>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
          กฎตาม พ.ร.บ. PDPA, ข้อกำหนดการใช้งาน และนโยบายความเป็นส่วนตัว
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          เอกสารฉบับนี้ใช้สำหรับผู้ใช้งานระบบ MAWELL Buffet เพื่ออธิบายสิทธิ หน้าที่ และแนวทางการคุ้มครองข้อมูลส่วนบุคคล
          โดยมีผลบังคับใช้ตั้งแต่วันที่ผู้ใช้เริ่มสมัครใช้งานหรือเข้าใช้งานระบบ
        </p>
        <nav className="flex flex-wrap gap-2 pt-1 text-sm sm:gap-3">
          <a href="#pdpa" className="rounded-full border border-slate-200 px-3 py-1 text-[#0000BF] hover:bg-slate-50">
            PDPA
          </a>
          <a href="#terms" className="rounded-full border border-slate-200 px-3 py-1 text-[#0000BF] hover:bg-slate-50">
            ข้อกำหนดการใช้งาน
          </a>
          <a
            href="#privacy"
            className="rounded-full border border-slate-200 px-3 py-1 text-[#0000BF] hover:bg-slate-50"
          >
            นโยบายความเป็นส่วนตัว
          </a>
        </nav>
      </header>

      <section id="pdpa" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          1) กฎตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </h2>
        <p className="text-sm leading-6 text-slate-700">
          MAWELL Buffet ให้ความสำคัญกับข้อมูลส่วนบุคคลของผู้ใช้ และดำเนินการตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
          พ.ศ. 2562 โดยเก็บ ใช้ และเปิดเผยข้อมูลเท่าที่จำเป็นตามวัตถุประสงค์ของการให้บริการ
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
          <li>ข้อมูลที่อาจเก็บ เช่น อีเมล ชื่อผู้ใช้ รูปโปรไฟล์ ประวัติการเข้าสู่ระบบ และข้อมูลการใช้งานในระบบ</li>
          <li>ข้อมูลถูกใช้เพื่อยืนยันตัวตน ป้องกันการทุจริต ให้บริการระบบ และพัฒนาคุณภาพบริการ</li>
          <li>ผู้ใช้มีสิทธิขอเข้าถึง แก้ไข ลบ จำกัดการใช้ หรือคัดค้านการประมวลผลข้อมูลตามสิทธิที่กฎหมายกำหนด</li>
          <li>ระบบใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการเข้าถึง ใช้ หรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต</li>
        </ul>
      </section>

      <section id="terms" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">2) ข้อกำหนดการใช้งาน</h2>
        <p className="text-sm leading-6 text-slate-700">
          การสมัครหรือใช้งานระบบถือว่าผู้ใช้ยอมรับข้อกำหนดทั้งหมดนี้ หากไม่ยอมรับ ผู้ใช้ควรหยุดใช้งานระบบทันที
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
          <li>ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน รวมถึงรักษาความลับของบัญชีและรหัสผ่านของตนเอง</li>
          <li>ห้ามใช้งานระบบในลักษณะที่ผิดกฎหมาย ละเมิดสิทธิผู้อื่น หรือกระทบความมั่นคงปลอดภัยของระบบ</li>
          <li>ผู้ให้บริการอาจระงับหรือยุติการใช้งานชั่วคราว/ถาวร หากตรวจพบการใช้งานผิดข้อกำหนดหรือมีความเสี่ยง</li>
          <li>ผู้ให้บริการสามารถปรับปรุงฟีเจอร์หรือแก้ไขข้อกำหนดได้ โดยจะแจ้งให้ทราบผ่านช่องทางที่เหมาะสม</li>
        </ul>
      </section>

      <section id="privacy" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">3) นโยบายความเป็นส่วนตัว</h2>
        <p className="text-sm leading-6 text-slate-700">
          นโยบายนี้อธิบายรายละเอียดการจัดการข้อมูลส่วนบุคคลของผู้ใช้ รวมถึงการเก็บรักษา การเปิดเผย และช่องทางการติดต่อ
          เพื่อใช้สิทธิของเจ้าของข้อมูล
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
          <li>ระยะเวลาเก็บข้อมูลจะขึ้นกับความจำเป็นทางธุรกิจ กฎหมาย และวัตถุประสงค์ที่แจ้งไว้</li>
          <li>ระบบอาจเปิดเผยข้อมูลให้ผู้ประมวลผลข้อมูลหรือผู้ให้บริการที่เกี่ยวข้องเท่าที่จำเป็นภายใต้สัญญาที่เหมาะสม</li>
          <li>ผู้ใช้สามารถร้องเรียนหรือสอบถามการใช้ข้อมูลส่วนบุคคลได้ผ่านช่องทางติดต่อของผู้ให้บริการ</li>
          <li>หากมีการเปลี่ยนแปลงนโยบาย จะมีการอัปเดตเนื้อหาในหน้านี้พร้อมวันที่มีผลบังคับใช้</li>
        </ul>
      </section>

      <footer className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:p-5">
        <p>
          หากต้องการติดต่อเกี่ยวกับข้อมูลส่วนบุคคล กรุณาติดต่อผู้ดูแลระบบผ่านช่องทางที่กำหนดในแอป หรืออีเมลองค์กรของท่าน
        </p>
        <p className="text-xs text-slate-500">อัปเดตล่าสุด: 20 เมษายน 2026</p>
        <Link href="/register" className="inline-block font-semibold text-[#0000BF] hover:underline">
          กลับไปหน้าสมัครสมาชิก
        </Link>
      </footer>
    </main>
  );
}
