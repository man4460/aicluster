"use client";

import Link from "next/link";

export function DormSettingsClient() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
      <p className="font-medium text-slate-900">การตั้งค่าบิล/ใบเสร็จ/ใบแจ้งให้ชำระ ถูกย้ายไปโปรไฟล์ส่วนกลางแล้ว</p>
      <p className="mt-2">
        กรุณาตั้งค่าเบอร์พร้อมเพย์, ช่องทางชำระ, ขนาดกระดาษเริ่มต้น และข้อมูลบริษัท/ร้าน ที่หน้าโปรไฟล์
      </p>
      <Link
        href="/dashboard/profile"
        className="mt-4 inline-flex rounded-xl bg-[#0000BF] px-4 py-2.5 font-semibold text-white hover:bg-[#0000a6]"
      >
        ไปหน้าโปรไฟล์ส่วนกลาง
      </Link>
    </div>
  );
}
