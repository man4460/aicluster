"use client";

import Link from "next/link";
import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

export function DormSettingsClient() {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p className="font-semibold leading-snug text-slate-900">
        การตั้งค่าบิล ใบเสร็จ และใบแจ้งชำระอยู่ที่โปรไฟล์ส่วนกลาง
      </p>
      <p className="text-[13px] leading-relaxed text-[#66638c]">
        ตั้งค่าเบอร์พร้อมเพย์ ช่องทางชำระ ขนาดกระดาษ และข้อมูลร้าน/บริษัท ได้ที่หน้าโปรไฟล์
      </p>
      <Link href="/dashboard/profile" className={cn(dormBtnPrimary, "mt-2 inline-flex w-full justify-center sm:w-auto")}>
        ไปโปรไฟล์ส่วนกลาง
      </Link>
    </div>
  );
}
