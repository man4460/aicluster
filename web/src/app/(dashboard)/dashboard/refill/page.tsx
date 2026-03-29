import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";

export const metadata: Metadata = {
  title: "โทเคนไม่เพียงพอ | MAWELL Buffet",
};

export default function RefillPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="โทเคนไม่เพียงพอ"
        description="สายรายวัน: ระบบหักโทเคนทุกวัน — หากไม่มีโทเคนจะใช้งานไม่ได้ กรุณาไปเติมโทเคนก่อน แพ็กเกจ / รายเดือน: ระบบหักโทเคนทุกเดือน — หากไม่มีโทเคนหรือไม่พอ กรุณาไปเติมโทเคนก่อน"
      />
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-sm">
      <p className="text-sm leading-relaxed text-amber-900/90">
        เลือกปุ่มด้านล่างเพื่อไปแพ็กเกจหรือแก้ไขโปรไฟล์
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard/plans"
          className="inline-flex justify-center rounded-lg bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
        >
          เลือกแพ็กเกจ / เติมโทเคน
        </Link>
        <Link
          href="/dashboard/profile"
          className="inline-flex justify-center rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
        >
          แก้ไขโปรไฟล์
        </Link>
      </div>
      </div>
    </div>
  );
}
