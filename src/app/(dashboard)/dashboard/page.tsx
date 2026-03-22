import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "แดชบอร์ด | MAWELL Buffet",
};

export default async function DashboardHomePage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">สวัสดี, {session?.username}</h1>
        <p className="mt-1 text-slate-600">
          พื้นที่แสดงเนื้อหาหลัก — สามารถเพิ่มวิดเจ็ตหรือลิงก์เมนูย่อยตามความต้องการ
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">สถานะบัญชี</h2>
          <p className="mt-2 text-sm text-slate-600">
            บทบาท: <span className="font-medium text-slate-800">{session?.role}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">เทมเพลต</h2>
          <p className="mt-2 text-sm text-slate-600">
            ส่วนหัวและเมนูอยู่ในเลย์เอาต์ร่วม — เนื้อหาหน้านี้เปลี่ยนตาม route ได้
          </p>
        </div>
      </div>
    </div>
  );
}
