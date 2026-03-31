"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";

function bangkokYear(): number {
  return Number.parseInt(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric" }), 10);
}

const cardClass =
  "flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-[#0000BF]/25";

export function VillageReportsClient() {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [year, setYear] = useState(bangkokYear);

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงาน & Excel"
        description="ดาวน์โหลด CSV เปิดด้วย Excel — ค่าส่วนกลาง สลิป ลูกบ้าน และสรุป 12 เดือน"
      />
      <label className="block text-sm">
        <span className="text-slate-600">ปีสำหรับ export ที่อ้างอิงปีปฏิทิน (ค่าส่วนกลาง / สลิป / สรุปปี)</span>
        <input
          type="number"
          className="mt-1 rounded-lg border border-slate-200 px-3 py-2"
          value={year}
          onChange={(e) => setYear(Number.parseInt(e.target.value, 10) || year)}
        />
      </label>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li className={cardClass}>
          <h3 className="font-semibold text-slate-900">ค่าส่วนกลางรายบ้าน</h3>
          <p className="mt-1 flex-1 text-xs text-slate-500">ทุกแถวบิลในแต่ละเดือนของปีที่เลือก</p>
          <a className="mt-3 inline-flex rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white" href={api.exportUrl("fees", year)}>
            ดาวน์โหลด CSV ({year})
          </a>
        </li>
        <li className={cardClass}>
          <h3 className="font-semibold text-slate-900">ประวัติสลิป</h3>
          <p className="mt-1 flex-1 text-xs text-slate-500">สลิปที่ส่งในปีที่เลือก สูงสุด 5,000 แถวต่อไฟล์</p>
          <a className="mt-3 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium" href={api.exportUrl("slips", year)}>
            ดาวน์โหลด CSV ({year})
          </a>
        </li>
        <li className={cardClass}>
          <h3 className="font-semibold text-slate-900">รายชื่อลูกบ้าน</h3>
          <p className="mt-1 flex-1 text-xs text-slate-500">บ้านและผู้พักอาศัยที่ใช้งาน — ไม่ผูกกับปี</p>
          <a className="mt-3 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium" href={api.exportUrl("residents")}>
            ดาวน์โหลด CSV
          </a>
        </li>
        <li className={cardClass}>
          <h3 className="font-semibold text-slate-900">สรุป 12 เดือน</h3>
          <p className="mt-1 flex-1 text-xs text-slate-500">ยอดรวมต่อเดือน จำนวนแถวบิล และ % เก็บได้</p>
          <a className="mt-3 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium" href={api.exportUrl("annual_summary", year)}>
            ดาวน์โหลด CSV ({year})
          </a>
        </li>
      </ul>
      <p className="text-xs text-slate-500">
        ล็อกอินแล้วเท่านั้นถึงจะดาวน์โหลดได้ — ถ้าเปิดลิงก์ในแท็บใหม่แล้วไฟล์ว่าง ให้ใช้เบราว์เซอร์เดียวกับที่ล็อกอิน หรือคลิกขวาแล้วบันทึกลิงก์
      </p>
    </div>
  );
}
