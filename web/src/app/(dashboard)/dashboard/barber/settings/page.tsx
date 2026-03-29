import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";

export default function BarberShopSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าร้าน"
        description="ข้อมูลร้านแบบส่วนกลางถูกย้ายไปหน้าโปรไฟล์แล้ว ใช้ร่วมทุกระบบ"
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p>ตั้งค่าชื่อร้าน โลโก้ ที่อยู่ เบอร์ติดต่อ เลขภาษี และโลเคชั่น ได้ที่โปรไฟล์ส่วนกลาง</p>
        <Link
          href="/dashboard/profile"
          className="mt-4 inline-flex rounded-xl bg-[#0000BF] px-4 py-2.5 font-semibold text-white hover:bg-[#0000a6]"
        >
          ไปหน้าโปรไฟล์ส่วนกลาง
        </Link>
      </div>
    </div>
  );
}
